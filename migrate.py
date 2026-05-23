import os
import json
import re
import shutil

# 1. Move img directory to public/img if it hasn't been moved
if os.path.exists('img') and not os.path.exists('public/img'):
    shutil.move('img', 'public/img')
elif os.path.exists('img') and os.path.exists('public/img'):
    # if it partially moved? Let's just copy tree and delete
    shutil.copytree('img', 'public/img', dirs_exist_ok=True)
    shutil.rmtree('img')

# 2. Parse index.html to build gallery.json
html_path = 'public/index.html'
if not os.path.exists(html_path):
    print(f"{html_path} not found")
    exit(1)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

images = []

# Gold works
gold_matches = re.findall(r'<a href="(img/iloveimg-watermarked/g[^"]+)".*?><img', content)
for g in gold_matches:
    images.append({
        "id": g,
        "url": g,
        "category": "gold",
        "title": "",
        "description": "",
        "isFeatured": False
    })

# Silver works
silver_matches = re.findall(r'<a href="(img/iloveimg-watermarked/s[^"]+)".*?><img', content)
for s in silver_matches:
    images.append({
        "id": s,
        "url": s,
        "category": "silver",
        "title": "",
        "description": "",
        "isFeatured": False
    })

# Large works (non-featured)
large_matches = re.findall(r'<a href="(img/iloveimg-watermarked/m[^"]+)".*?data-lightbox="large"', content)
for m in large_matches:
    images.append({
        "id": m,
        "url": m,
        "category": "large",
        "title": "",
        "description": "",
        "isFeatured": False
    })

# Featured works
images.append({
    "id": "featured-1",
    "url": "img/iloveimg-watermarked/m1.png",
    "category": "large",
    "title": "The Golden Cobra",
    "description": "This Golden Cobra was created for Mayurapathi Kovil Wallawatta associated with Nithyakalyani Jewellery.",
    "isFeatured": True,
    "extraImages": ["img/iloveimg-watermarked/m2.png"]
})
images.append({
    "id": "featured-2",
    "url": "img/iloveimg-watermarked/m3.png",
    "category": "large",
    "title": "Royal Gold & Diamond Handbag",
    "description": "This Gold + diamond hand bag was created for one of king brunei's wives associated with Mouwad KSA.",
    "isFeatured": True
})

os.makedirs('data', exist_ok=True)
with open('data/gallery.json', 'w', encoding='utf-8') as f:
    json.dump({"images": images}, f, indent=2)

print("Migration successful")
