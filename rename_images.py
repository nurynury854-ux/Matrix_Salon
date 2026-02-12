#!/usr/bin/env python3
import os
import json
import shutil
from pathlib import Path

# Define directories
PRODUCTS_DIR = Path("Products")
JSON_FILE = Path("data/products.json")

# Create mapping of old names to new names
name_mapping = {}
counter = {}

def get_extension(filename):
    """Get file extension."""
    return Path(filename).suffix

def slugify_filename(product_name, category, product_id):
    """Create a safe ASCII filename from product info."""
    # Use product ID and counter for uniqueness
    safe_name = f"product_{product_id}"
    return safe_name

def rename_product_images():
    """Rename all product images to ASCII filenames."""
    
    # Load products.json
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Found {len(data['products'])} products")
    
    renamed_count = 0
    
    for product in data['products']:
        old_image_path = product['image']
        product_id = product['id']
        
        if not old_image_path.startswith('Products/'):
            print(f"Skipping non-Products path: {old_image_path}")
            continue
        
        # Get file extension
        ext = get_extension(old_image_path)
        
        # Create new filename
        new_filename = f"product_{product_id}{ext}"
        new_image_path = f"Products/{new_filename}"
        
        # Full paths
        old_full_path = PRODUCTS_DIR / Path(old_image_path).name
        new_full_path = PRODUCTS_DIR / new_filename
        
        # Check if old file exists
        if old_full_path.exists():
            # Rename the file
            shutil.move(str(old_full_path), str(new_full_path))
            print(f"✓ Renamed: {Path(old_image_path).name} → {new_filename}")
            renamed_count += 1
        else:
            print(f"⚠ File not found: {old_full_path}")
        
        # Update JSON
        product['image'] = new_image_path
        name_mapping[old_image_path] = new_image_path
    
    # Write updated JSON
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Renamed {renamed_count} product images")
    print(f"✅ Updated products.json with new paths")
    
    return name_mapping

if __name__ == "__main__":
    rename_product_images()
