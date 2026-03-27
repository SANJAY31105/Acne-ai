
import os
import sys
import math

# Set Keras Backend to PyTorch BEFORE importing keras
os.environ["KERAS_BACKEND"] = "torch"

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import keras
from keras.applications import EfficientNetB4
from keras import Model
from keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from keras.callbacks import ModelCheckpoint, EarlyStopping, CSVLogger, Callback
from sklearn.utils import class_weight
import numpy as np
import yaml
# Using tf.data.Dataset for high performance data loading

# ─── Check GPU availability ───
import torch
print(f"\n{'='*60}")
print(f"  PyTorch version: {torch.__version__}")
print(f"  CUDA available:  {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"  GPU device:      {torch.cuda.get_device_name(0)}")
    print(f"  VRAM:            {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
print(f"{'='*60}\n")

# ─── Enable Mixed Precision (FP16) for 2x GPU throughput ───
keras.mixed_precision.set_global_policy('mixed_float16')
print("Mixed Precision: mixed_float16 enabled (2x GPU throughput)")


def load_config():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def build_severity_model(input_shape=(380, 380, 3), num_classes=3):
    """EfficientNetB4 backbone with deeper classification head for skin analysis."""
    from keras import layers
    inputs = keras.Input(shape=input_shape)
    
    # 1. Augmentation (runs on device during training, passes through during inference)
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.25),
        layers.RandomZoom(0.25),
        layers.RandomContrast(0.3),
        layers.RandomBrightness(0.2),
        layers.RandomTranslation(0.1, 0.1),
    ], name='data_augmentation')
    
    x = data_augmentation(inputs)
    
    # 2. Backbone — EfficientNetB4 (19M params, native 380x380)
    base_model = EfficientNetB4(weights='imagenet', include_top=False, input_shape=input_shape)
    # Freeze base model initially
    base_model.trainable = False
    
    x = base_model(x, training=False)
    
    # 3. Head — deeper with more capacity for fine-grained skin classification
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)
    x = Dense(768, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(384, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=inputs, outputs=predictions)
    return model


class CosineAnnealingWarmup(Callback):
    """
    Cosine Annealing LR with linear warmup.
    - Warmup: Linearly ramp from init_lr to max_lr over warmup_epochs.
    - Cosine: Decay from max_lr to min_lr following a cosine curve.
    """
    def __init__(self, max_lr, min_lr=1e-7, warmup_epochs=5, total_epochs=60):
        super().__init__()
        self.max_lr = max_lr
        self.min_lr = min_lr
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs
        self.init_lr = min_lr  # Start warmup from min_lr

    def on_epoch_begin(self, epoch, logs=None):
        if epoch < self.warmup_epochs:
            # Linear warmup
            lr = self.init_lr + (self.max_lr - self.init_lr) * (epoch / self.warmup_epochs)
        else:
            # Cosine annealing
            progress = (epoch - self.warmup_epochs) / (self.total_epochs - self.warmup_epochs)
            lr = self.min_lr + 0.5 * (self.max_lr - self.min_lr) * (1 + math.cos(math.pi * progress))
        
        self.model.optimizer.learning_rate = lr
        if epoch % 5 == 0:
            print(f"  [LR Schedule] Epoch {epoch+1}: lr = {lr:.2e}")


def train_severity():
    config = load_config()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    severity_dir = os.path.join(base_dir, "data", "severity")
    models_dir = config['paths']['models']
    logs_dir = config['paths']['logs']
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(logs_dir, exist_ok=True)

    batch_size = 32  # B4 uses more VRAM at 380x380, keep at 32 for safety
    img_size = tuple(config['data']['image_size'])
    
    import tensorflow as tf
    AUTOTUNE = tf.data.AUTOTUNE

    print("\nLoading datasets with tf.data for max speed...")
    train_ds = keras.utils.image_dataset_from_directory(
        os.path.join(severity_dir, 'train'),
        label_mode='categorical',
        image_size=img_size,
        batch_size=batch_size,
    )

    val_ds = keras.utils.image_dataset_from_directory(
        os.path.join(severity_dir, 'val'),
        label_mode='categorical',
        image_size=img_size,
        batch_size=batch_size,
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes: {dict(enumerate(class_names))}")

    # Compute class weights fast
    labels = []
    for cls_idx, cls_name in enumerate(class_names):
        cls_dir = os.path.join(severity_dir, 'train', cls_name)
        if os.path.exists(cls_dir):
            count = len([f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))])
            labels.extend([cls_idx] * count)
            
    class_weights_arr = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(labels),
        y=labels
    )
    class_weights_dict = dict(enumerate(class_weights_arr))
    print(f"Class Weights: {class_weights_dict}")

    # Augmentations are now baked directly into the model for max PyTorch backend compatibility
    # .prefetch() feeds GPU with zero wait. Skipping .cache() — 380x380 images don't fit in 15GB RAM
    train_generator = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_generator = val_ds.prefetch(buffer_size=AUTOTUNE)

    # Build Model (EfficientNetB3)
    model = build_severity_model(input_shape=img_size + (3,), num_classes=num_classes)
    print(f"Model params: {model.count_params():,}")

    # Backup old model
    old_model_path = os.path.join(models_dir, 'best_severity_v3.keras')
    backup_path = os.path.join(models_dir, 'best_severity_backup.keras')
    if os.path.exists(old_model_path):
        import shutil
        shutil.copy2(old_model_path, backup_path)
        print(f"Old model backed up to: {backup_path}")

    # Callbacks
    save_path = os.path.join(models_dir, 'best_severity_v3.keras')
    
    phase1_epochs = config['model']['epochs_frozen']
    phase2_epochs = config['model']['epochs_finetune']
    
    # Steps are automatically handled by tf.data
    
    # ── PHASE 1: Feature Extraction (Frozen Base) ──
    print(f"\n{'='*60}")
    print(f"  PHASE 1: Feature Extraction ({phase1_epochs} epochs)")
    print(f"  Backbone: EfficientNetB4 (FROZEN), Image: {img_size}")
    print(f"  Batch: {batch_size}, Fast tf.data pipeline")
    print(f"{'='*60}")
    
    phase1_callbacks = [
        ModelCheckpoint(save_path, save_best_only=True, monitor='val_accuracy', verbose=1),
        EarlyStopping(patience=8, restore_best_weights=True, monitor='val_loss', verbose=1),
        CSVLogger(os.path.join(logs_dir, 'severity_training_v3_phase1.csv')),
        CosineAnnealingWarmup(max_lr=0.001, min_lr=1e-6, warmup_epochs=3, total_epochs=phase1_epochs),
    ]

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-6),  # Will be overridden by warmup
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=['accuracy', keras.metrics.Precision(name='precision'), keras.metrics.Recall(name='recall')]
    )
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=phase1_epochs,
        class_weight=class_weights_dict,
        callbacks=phase1_callbacks,
    )

    # ── PHASE 2: Fine-Tuning (Unfreeze top 50%) ──
    print(f"\n{'='*60}")
    print(f"  PHASE 2: Fine-Tuning ({phase2_epochs} epochs)")
    print(f"  Unfreezing top 50% of layers")
    print(f"{'='*60}")
    
    model.trainable = True
    num_layers = len(model.layers)
    freeze_until = int(num_layers * 0.3)  # Unfreeze top 70% for deeper skin feature learning
    
    for layer in model.layers[:freeze_until]:
        if not isinstance(layer, BatchNormalization):
            layer.trainable = False

    trainable_count = sum(1 for l in model.layers if l.trainable)
    print(f"  Trainable layers: {trainable_count}/{num_layers}")

    phase2_callbacks = [
        ModelCheckpoint(save_path, save_best_only=True, monitor='val_accuracy', verbose=1),
        EarlyStopping(patience=20, restore_best_weights=True, monitor='val_loss', verbose=1),
        CSVLogger(os.path.join(logs_dir, 'severity_training_v3_phase2.csv')),
        CosineAnnealingWarmup(max_lr=3e-5, min_lr=1e-7, warmup_epochs=5, total_epochs=phase2_epochs),
    ]

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-7),  # Will be overridden by warmup
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=['accuracy', keras.metrics.Precision(name='precision'), keras.metrics.Recall(name='recall')]
    )
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=phase2_epochs,
        class_weight=class_weights_dict,
        callbacks=phase2_callbacks,
    )

    print(f"\n{'='*60}")
    print(f"  Training Complete! Model saved to: {save_path}")
    print(f"{'='*60}")
    
    # Print final evaluation
    print("\n=== Final Evaluation ===")
    results = model.evaluate(val_generator)
    print(f"  Val Loss:      {results[0]:.4f}")
    print(f"  Val Accuracy:  {results[1]*100:.1f}%")
    print(f"  Val Precision: {results[2]*100:.1f}%")
    print(f"  Val Recall:    {results[3]*100:.1f}%")

    # Confusion matrix
    try:
        from sklearn.metrics import confusion_matrix, classification_report
        # For tf.data.Dataset, we need to collect true labels manually
        true_classes = []
        pred_classes = []
        for images, labels_batch in val_generator:
            preds = model.predict(images, verbose=0)
            pred_classes.extend(np.argmax(preds, axis=1))
            true_classes.extend(np.argmax(labels_batch.numpy(), axis=1))
        class_labels = class_names
        
        print("\n=== Confusion Matrix ===")
        cm = confusion_matrix(true_classes, pred_classes)
        print(cm)
        print("\n=== Classification Report ===")
        print(classification_report(true_classes, pred_classes, target_names=class_labels))
    except Exception as e:
        print(f"Could not generate confusion matrix: {e}")

if __name__ == "__main__":
    train_severity()
