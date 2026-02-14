
import os
import sys

# Set Keras Backend to PyTorch BEFORE importing keras
os.environ["KERAS_BACKEND"] = "torch"

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import keras
from keras.applications import MobileNetV2
from keras import Model
from keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
from sklearn.utils import class_weight
import numpy as np
import yaml
from data.augment_data import get_train_augmentation_generator, get_basic_generator

def load_config():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def build_severity_model(input_shape=(224, 224, 3), num_classes=3):
    """Small, fast model for severity classification with improved head."""
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=input_shape)
    
    # Freeze base model initially
    base_model.trainable = False
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(512, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    return model

def train_severity():
    config = load_config()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    severity_dir = os.path.join(base_dir, "data", "severity")
    models_dir = config['paths']['models']
    logs_dir = config['paths']['logs']
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(logs_dir, exist_ok=True)

    batch_size = config['data']['batch_size']
    img_size = tuple(config['data']['image_size'])
    
    # Generators
    train_datagen = get_train_augmentation_generator()
    val_datagen = get_basic_generator()

    train_generator = train_datagen.flow_from_directory(
        os.path.join(severity_dir, 'train'),
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        os.path.join(severity_dir, 'val'),
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    print(f"\nClasses: {train_generator.class_indices}")
    num_classes = len(train_generator.class_indices)

    # Class Weights
    labels = train_generator.classes
    class_weights_arr = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(labels),
        y=labels
    )
    class_weights_dict = dict(enumerate(class_weights_arr))
    print(f"Class Weights: {class_weights_dict}")

    # Build Model (with deeper classification head)
    model = build_severity_model(input_shape=img_size + (3,), num_classes=num_classes)
    print(f"Model params: {model.count_params():,}")

    # Backup old model
    old_model_path = os.path.join(models_dir, 'best_severity.keras')
    backup_path = os.path.join(models_dir, 'best_severity_backup.keras')
    if os.path.exists(old_model_path):
        import shutil
        shutil.copy2(old_model_path, backup_path)
        print(f"Old model backed up to: {backup_path}")

    # Callbacks
    save_path = os.path.join(models_dir, 'best_severity.keras')
    callbacks = [
        ModelCheckpoint(save_path, save_best_only=True, monitor='val_accuracy', verbose=1),
        EarlyStopping(patience=10, restore_best_weights=True, monitor='val_loss', verbose=1),
        ReduceLROnPlateau(factor=0.2, patience=5, min_lr=1e-7, monitor='val_loss', verbose=1),
        CSVLogger(os.path.join(logs_dir, 'severity_training_v2.csv'))
    ]

    # --- PHASE 1: Feature Extraction (Frozen Base) ---
    print("\n=== Phase 1: Feature Extraction (Frozen Base, 20 epochs) ===")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=20,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    # --- PHASE 2: Fine-Tuning (Unfreeze top 40%) ---
    print("\n=== Phase 2: Fine-Tuning (Top 40% Unfrozen, 40 epochs) ===")
    model.trainable = True
    num_layers = len(model.layers)
    freeze_until = int(num_layers * 0.6)  # Unfreeze 40% (was 30%)
    
    for layer in model.layers[:freeze_until]:
        if not isinstance(layer, BatchNormalization):
            layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.00005),  # Lower LR for fine-tuning
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=40,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    print(f"\nTraining Complete! Model saved to: {save_path}")
    
    # Print final evaluation
    print("\n=== Final Evaluation ===")
    results = model.evaluate(val_generator)
    print(f"  Val Loss: {results[0]:.4f}")
    print(f"  Val Accuracy: {results[1]*100:.1f}%")
    print(f"  Val Precision: {results[2]*100:.1f}%")
    print(f"  Val Recall: {results[3]*100:.1f}%")

    # Confusion matrix
    try:
        from sklearn.metrics import confusion_matrix, classification_report
        val_generator.reset()
        predictions = model.predict(val_generator)
        pred_classes = np.argmax(predictions, axis=1)
        true_classes = val_generator.classes[:len(pred_classes)]
        class_labels = list(train_generator.class_indices.keys())
        
        print("\n=== Confusion Matrix ===")
        cm = confusion_matrix(true_classes, pred_classes)
        print(cm)
        print("\n=== Classification Report ===")
        print(classification_report(true_classes, pred_classes, target_names=class_labels))
    except Exception as e:
        print(f"Could not generate confusion matrix: {e}")

if __name__ == "__main__":
    train_severity()
