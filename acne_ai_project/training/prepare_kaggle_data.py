import os
import shutil

def prepare_data():
    # Source: The downloaded Kaggle dataset path
    source_root = "data/raw/AcneDataset" # Relative to project root (newapp)
    
    # Destination: The structure our training script expects
    # training/train_classifier.py expects 'data/processed/train' and 'data/processed/val'
    # BUT, the config says: processed_data: "data/processed"
    # And the script does: os.path.join(processed_dir, 'train')
    dest_root = "acne_ai_project/data/processed"
    
    # Class mappings: SourceName -> TargetName
    # Target Names from config: "Clear Skin", "Blackheads", "Whiteheads", "Papules", "Pustules", "Nodules", "Cystic Acne"
    mapping = {
        "Blackheads": "Blackheads",
        "Whiteheads": "Whiteheads",
        "Papules": "Papules",
        "Pustules": "Pustules",
        "Cyst": "Cystic Acne",
        # "Nodules": Missing
        # "Clear Skin": Missing
    }
    
    modes = ["train", "valid", "test"] # Kaggle folders
    target_modes = ["train", "val", "test"] # Our folders ("valid" -> "val")
    
    for mode, target_mode in zip(modes, target_modes):
        source_mode_dir = os.path.join(source_root, mode)
        dest_mode_dir = os.path.join(dest_root, target_mode)
        
        if not os.path.exists(source_mode_dir):
            print(f"Skipping {source_mode_dir} (not found)")
            continue
            
        print(f"Processing {mode} -> {target_mode}...")
        
        for source_class, target_class in mapping.items():
            s_path = os.path.join(source_mode_dir, source_class)
            d_path = os.path.join(dest_mode_dir, target_class)
            
            if os.path.exists(s_path):
                os.makedirs(d_path, exist_ok=True)
                # Copy files
                files = os.listdir(s_path)
                print(f"  Copying {len(files)} files from {source_class} to {target_class}")
                for f in files:
                    shutil.copy2(os.path.join(s_path, f), os.path.join(d_path, f))
            else:
                print(f"  Source class {source_class} not found in {mode}")

    # Create empty folders for missing classes to prevent code errors, 
    # but warn user they are empty.
    all_classes = ["Clear Skin", "Blackheads", "Whiteheads", "Papules", "Pustules", "Nodules", "Cystic Acne"]
    for target_mode in target_modes:
        dest_mode_dir = os.path.join(dest_root, target_mode)
        for cls in all_classes:
            d_path = os.path.join(dest_mode_dir, cls)
            if not os.path.exists(d_path):
                os.makedirs(d_path, exist_ok=True)
                print(f"  Created empty folder for missing class: {cls}")

if __name__ == "__main__":
    prepare_data()
