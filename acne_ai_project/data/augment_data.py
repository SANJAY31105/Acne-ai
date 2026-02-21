
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
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


class MixupGenerator:
    """
    Wraps a Keras ImageDataGenerator to apply Mixup augmentation.
    Mixup blends pairs of images and labels with a random weight,
    forcing the model to learn smoother decision boundaries.
    Compatible with keras model.fit() by implementing iterator protocol.
    """
    def __init__(self, generator, alpha=0.2):
        self.generator = generator
        self.alpha = alpha
        self._iterator = None

    def __len__(self):
        return len(self.generator)

    def __iter__(self):
        return self

    def __next__(self):
        x1, y1 = next(self.generator)
        x2, y2 = next(self.generator)
        # Sample lambda from Beta distribution
        lam = np.random.beta(self.alpha, self.alpha)
        x = lam * x1 + (1 - lam) * x2
        y = lam * y1 + (1 - lam) * y2
        return x, y

    @property
    def class_indices(self):
        return self.generator.class_indices

    @property
    def classes(self):
        return self.generator.classes

    @property
    def samples(self):
        return self.generator.samples

    @property 
    def n(self):
        return self.generator.n

    @property
    def batch_size(self):
        return self.generator.batch_size
