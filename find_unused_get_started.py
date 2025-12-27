#!/usr/bin/env python3
import os
from pathlib import Path
from collections import defaultdict

def find_unused_images():
    """Find all unused images in images/get-started/."""
    root = Path('.')

    # Get all images in images/get-started/
    image_dir = Path('images/get-started')
    all_images = []

    for ext in ['*.png', '*.jpg', '*.gif', '*.jpeg', '*.svg', '*.webp']:
        all_images.extend(image_dir.rglob(ext))

    # Track which images are referenced
    referenced_images = set()

    # Search all MDX files for references
    for file_path in root.rglob('*.mdx'):
        if 'node_modules' in str(file_path) or '.git' in str(file_path):
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue

        # Check each image
        for image in all_images:
            image_name = image.name
            if image_name in content:
                referenced_images.add(str(image.relative_to(root)))

    # Find unused images
    unused = []
    for image in all_images:
        image_path = str(image.relative_to(root))
        if image_path not in referenced_images:
            unused.append(image_path)

    return sorted(unused), len(all_images)

if __name__ == '__main__':
    unused, total = find_unused_images()

    print(f"Scanning images/get-started/ for unused images...\n")
    print("=" * 80)

    if unused:
        print(f"\n🗑️  Found {len(unused)} unused images (out of {total} total):\n")
        for img in unused:
            print(f"  {img}")
    else:
        print(f"\n✅ All {total} images are being used!")

    print("\n" + "=" * 80)
    print(f"\nSummary:")
    print(f"  Total images: {total}")
    print(f"  Used images: {total - len(unused)}")
    print(f"  Unused images: {len(unused)}")
