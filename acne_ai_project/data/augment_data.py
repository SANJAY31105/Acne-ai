
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import yaml

import os

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "config.yaml")

    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def get_train_augmentation_generator():
    """
    Returns an ImageDataGenerator with aggressive augmentations for better generalization.
    - Random horizontal flip (NO vertical flip)
    - Random rotation, zoom, brightness, contrast
    - Width/height shifts for positional variance
    - Shear for perspective changes
    - Channel shift for skin-tone diversity
    """
    config = load_config()
    aug = config['augmentation']
    
    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=aug['rotation_range'],
        width_shift_range=aug['width_shift_range'],
        height_shift_range=aug['height_shift_range'],
        brightness_range=aug['brightness_range'],
        zoom_range=aug['zoom_range'],
        horizontal_flip=aug['horizontal_flip'],
        vertical_flip=aug['vertical_flip'],
        shear_range=15,             # Perspective distortion
        channel_shift_range=30,     # Skin-tone variance  
        fill_mode='nearest'
    )
    return datagen

def get_basic_generator():
    """
    Returns a basic generator (rescaling only) for validation/testing.
    """
    return ImageDataGenerator(rescale=1./255)
