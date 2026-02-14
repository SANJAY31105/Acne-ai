
import keras
from keras.applications import EfficientNetB3
from keras import Model
from keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
import yaml

import os

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "config.yaml")

    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def build_classification_model(input_shape=(224, 224, 3), num_classes=7):
    """
    Builds the EfficientNetB3 model with custom top layers.
    """
    base_model = EfficientNetB3(weights='imagenet', include_top=False, input_shape=input_shape)

    # Freeze base model by default
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = BatchNormalization()(x)
    
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    x = BatchNormalization()(x)
    
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.2)(x)
    
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    return model

if __name__ == "__main__":
    model = build_classification_model()
    model.summary()
