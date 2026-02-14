
import os
import sys

# Set Keras Backend to PyTorch BEFORE importing keras
os.environ["KERAS_BACKEND"] = "torch"

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import keras
from keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
from keras.layers import BatchNormalization
from sklearn.utils import class_weight
import numpy as np
import yaml
from data.augment_data import get_train_augmentation_generator, get_basic_generator

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "config.yaml")
        
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def finetune():
    config = load_config()
    
    # Paths
    processed_dir = config['paths']['processed_data']
    models_dir = config['paths']['models']
    logs_dir = config['paths']['logs']
    
    model_path = os.path.join(models_dir, 'best_classifier.keras')
    
    if not os.path.exists(model_path):
        print("ERROR: No Phase 1 model found. Run train_classifier.py first.")
        return
    
    print(f"Loading Phase 1 model from: {model_path}")
    model = keras.saving.load_model(model_path)
    print("Model loaded successfully.")
    
    # Hyperparameters
    batch_size = config['data']['batch_size']
    img_size = tuple(config['data']['image_size'])
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
    class_weights_arr = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(labels),
        y=labels
    )
    class_weights_dict = dict(enumerate(class_weights_arr))
    print(f"Computed Class Weights: {class_weights_dict}")

    # Callbacks
    callbacks = [
        ModelCheckpoint(os.path.join(models_dir, 'best_classifier.keras'), save_best_only=True, monitor='val_accuracy'),
        EarlyStopping(patience=10, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.2, patience=5, min_lr=1e-7, monitor='val_loss'),
        CSVLogger(os.path.join(logs_dir, 'finetune_log.csv'))
    ]

    # Unfreeze top 30% of layers
    model.trainable = True
    num_layers = len(model.layers)
    freeze_until = int(num_layers * 0.7)
    
    for layer in model.layers[:freeze_until]:
        if not isinstance(layer, BatchNormalization):
             layer.trainable = False
    
    trainable_count = sum(1 for l in model.layers if l.trainable)
    print(f"Unfroze {trainable_count}/{num_layers} layers for fine-tuning.")
             
    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config['model']['learning_rate_finetune']),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    print(f"\nStarting Fine-Tuning for {epochs_finetune} epochs...")
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs_finetune,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    print("Fine-tuning Complete. Model saved to models/saved/best_classifier.keras")

if __name__ == "__main__":
    finetune()
