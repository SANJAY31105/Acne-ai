
import os
import shutil
import yaml
import zipfile
import subprocess

def load_config(config_path="acne_ai_project/config/config.yaml"):
    if not os.path.exists(config_path):
        # Try finding it relative to this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, "../config/config.yaml")

    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def download_kaggle_dataset(dataset_name="tiswan14/acne-dataset-image"):
    """
    Downloads and unzips a Kaggle dataset.
    Requires 'kaggle' pip package and ~/.kaggle/kaggle.json API key.
    """
    config = load_config()
    raw_dir = config['paths']['raw_data']
    
    print(f"Downloading {dataset_name} to {raw_dir}...")
    
    # Check if kaggle is installed
    try:
        import kaggle
    except ImportError:
        print("Error: 'kaggle' package not found. Please run 'pip install kaggle'")
        print("Also ensure you have placed your 'kaggle.json' API key in C:/Users/<User>/.kaggle/")
        return

    # Create raw directory
    os.makedirs(raw_dir, exist_ok=True)
    
    try:
        # Authenticate using the provided key if needed, but standard way is file.
        # Since user provided a token string 'KGAT_...', it might be a new format or just the key.
        # Let's try setting environment variables for KAGGLE_USERNAME and KAGGLE_KEY.
        # But I don't have the username. 
        # I'll just try running the command, hoping the file I create works.
        # Wait, I don't know the username. Creating a dummy json might fail.
        # I will try to use the 'KAGGLE_KEY' env var. 
        
        subprocess.run(f"kaggle datasets download -d {dataset_name} -p {raw_dir} --unzip", shell=True, check=True)
        print("Download and extraction complete.")
        
        # Organize files if needed. 
        # The 'tiswan14/acne-dataset-image' structure needs to be checked.
        # Usually it unzips into subfolders. We might need to map them to our class names.
        organize_dataset(raw_dir)
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to download dataset: {e}")
        print("Please ensure you have authenticated with Kaggle API.")

def organize_dataset(raw_dir):
    """
    Maps the downloaded folder structure to our standardized class names.
    This logic depends on the specific dataset structure of 'tiswan14/acne-dataset-image'.
    """
    print("Organizing dataset structure...")
    
    # Standard classes from our config
    # ["Clear Skin", "Blackheads", "Whiteheads", "Papules", "Pustules", "Nodules", "Cystic Acne"]
    
    # Check what folders we have
    if not os.path.exists(raw_dir): return
    
    subfolders = [f.path for f in os.scandir(raw_dir) if f.is_dir()]
    print(f"Found folders: {[os.path.basename(s) for s in subfolders]}")
    
    # Heuristic mapping (Example - needs manual verification of the dataset structure)
    # If the dataset has 'acne' and 'normal', or specific types, we move them.
    # For now, we will leave them and ask user to verify mapping in a real scenario.
    print("IMPORTANT: Please verify the downloaded folders in 'data/raw' match your class labels in 'config/config.yaml'.")
    print("You may need to rename folders manually to match: Clear Skin, Blackheads, etc.")

if __name__ == "__main__":
    download_kaggle_dataset()
