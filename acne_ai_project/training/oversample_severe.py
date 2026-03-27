"""
Oversample the Severe class to fix class imbalance.
Severe: 1,814 → ~3,400 images via augmented copies.
"""
import os
import shutil
from PIL import Image, ImageEnhance, ImageFilter
import random

def oversample_severe():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    severe_dir = os.path.join(base, 'data', 'severity', 'train', 'Severe')
    
    if not os.path.exists(severe_dir):
        print(f"❌ Directory not found: {severe_dir}")
        return
    
    originals = [f for f in os.listdir(severe_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))]
    current = len(originals)
    target = 3400  # Match Mild/Moderate count
    needed = target - current
    
    print(f"Severe class: {current} images → target {target} (need {needed} augmented copies)")
    
    if needed <= 0:
        print("✅ Already balanced!")
        return
    
    augmentations = [
        ('flip', lambda img: img.transpose(Image.FLIP_LEFT_RIGHT)),
        ('bright_up', lambda img: ImageEnhance.Brightness(img).enhance(random.uniform(1.1, 1.4))),
        ('bright_down', lambda img: ImageEnhance.Brightness(img).enhance(random.uniform(0.6, 0.9))),
        ('contrast', lambda img: ImageEnhance.Contrast(img).enhance(random.uniform(0.7, 1.3))),
        ('sharp', lambda img: ImageEnhance.Sharpness(img).enhance(random.uniform(1.5, 2.5))),
        ('blur', lambda img: img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))),
        ('color', lambda img: ImageEnhance.Color(img).enhance(random.uniform(0.8, 1.2))),
        ('rotate', lambda img: img.rotate(random.uniform(-20, 20), fillcolor=(0,0,0))),
    ]
    
    created = 0
    while created < needed:
        for orig_name in originals:
            if created >= needed:
                break
            
            orig_path = os.path.join(severe_dir, orig_name)
            try:
                img = Image.open(orig_path).convert('RGB')
                
                # Apply 1-3 random augmentations
                num_augs = random.randint(1, 3)
                chosen = random.sample(augmentations, num_augs)
                for name, aug_fn in chosen:
                    img = aug_fn(img)
                
                # Save with unique name
                base_name, ext = os.path.splitext(orig_name)
                new_name = f"{base_name}_aug{created}{ext}"
                img.save(os.path.join(severe_dir, new_name), quality=95)
                created += 1
                
                if created % 100 == 0:
                    print(f"  Created {created}/{needed} augmented images...")
            except Exception as e:
                print(f"  Warning: Failed on {orig_name}: {e}")
                continue
    
    final_count = len([f for f in os.listdir(severe_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))])
    print(f"\n✅ Severe class: {current} → {final_count} images")
    print(f"   Created {created} augmented copies")

if __name__ == '__main__':
    oversample_severe()
