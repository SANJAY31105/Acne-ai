
import os
import sys

# Set Keras Backend to PyTorch BEFORE importing keras
os.environ["KERAS_BACKEND"] = "torch"

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import keras
from keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard, CSVLogger
from keras.layers import BatchNormalization
from sklearn.utils import class_weight
import numpy as np
import yaml
from models.classification_model import build_classification_model
from data.augment_data import get_train_augmentation_generator, get_basic_generator

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "config.yaml")
        
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def train_classifier():
    config = load_config()
    
    # Paths
    processed_dir = config['paths']['processed_data']
    models_dir = config['paths']['models']
    logs_dir = config['paths']['logs']
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(logs_dir, exist_ok=True)

    # Hyperparameters
    batch_size = config['data']['batch_size']
    img_size = tuple(config['data']['image_size'])
    epochs_frozen = config['model']['epochs_frozen']
    epochs_finetune = config['model']['epochs_finetune']
    
    # Generators
    train_datagen = get_train_augmentation_generator()
    val_datagen = get_basic_generator()

    train_generator = train_datagen.flow_from_directory(
        os.path.join(processed_dir, 'train'),
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        os.path.join(processed_dir, 'val'),
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    # Class Weights
    labels = train_generator.classes
    class_weights = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(labels),
        y=labels
    )
    class_weights = dict(enumerate(class_weights))
    print(f"Computed Class Weights: {class_weights}")

    # Build Model
    model = build_classification_model(input_shape=img_size + (3,), num_classes=config['data']['num_classes'])
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(os.path.join(models_dir, 'best_classifier.keras'), save_best_only=True, monitor='val_accuracy'),
        EarlyStopping(patience=10, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.2, patience=5, min_lr=1e-7, monitor='val_loss'),
        TensorBoard(log_dir=logs_dir),
        CSVLogger(os.path.join(logs_dir, 'training_log.csv'))
    ]

    # --- PHASE 1: Feature Extraction (Frozen Base) ---
    print("\nStarting Phase 1: Feature Extraction (Frozen Base)")
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=config['model']['learning_rate_frozen']),
                  loss='categorical_crossentropy',
                  metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()])
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs_frozen,
        class_weight=class_weights,
        callbacks=callbacks
    )

    # --- PHASE 2: Fine Tuning ---
    print("\nStarting Phase 2: Fine Tuning")
    
    # Unfreeze the last 30% of layers of the base model
    base_model = model.layers[0] # EfficientNetB3 is the first layer in our Functional model ? 
    # Actually, in our build function:
    # model = Model(inputs=base_model.input, outputs=predictions)
    # The layers of the model INCLUDE the base model's layers flattened out unless we wrapped it.
    # Because we did: base_model = EfficientNetB3(...); x = base_model.output
    # The 'model' has all the layers.
    
    # Let's unfreeze top layers. EfficientNetB3 has about 380+ layers.
    # Simple strategy: allow all layers to be trainable, or look for specific blocks.
    # The prompt asked for "last 30%".
    
    model.trainable = True # Unfreeze everything first
    
    # Count layers
    num_layers = len(model.layers)
    freeze_until = int(num_layers * 0.7)
    
    for layer in model.layers[:freeze_until]:
        if not isinstance(layer, BatchNormalization): # Keep BatchNorm frozen usually, or unfreeze carefully.
             layer.trainable = False
             
    # Recompile with lower learning rate
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=config['model']['learning_rate_finetune']),
                  loss='categorical_crossentropy',
                  metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()])
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs_finetune,
        class_weight=class_weights,
        callbacks=callbacks
    )

    print("Training Complete. Model saved to models/saved/best_classifier.keras")

if __name__ == "__main__":
    train_classifier()
