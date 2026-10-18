import re
import urllib.request
import os

with open('shared/scene-invite/motion.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = set(re.findall(r"add\(['\"]([^'\"]+)['\"]", text))
print("Found add() targets in motion.js:", matches)

base_url = 'https://www.lovesolutions.in/all-invite/shared/scene-invite/motion/'
os.makedirs('shared/scene-invite/motion', exist_ok=True)
os.makedirs('all-invite/shared/scene-invite/motion', exist_ok=True)

for name in matches:
    img_name = f"{name}.webp"
    url = base_url + img_name
    dst1 = os.path.join('shared/scene-invite/motion', img_name)
    dst2 = os.path.join('all-invite/shared/scene-invite/motion', img_name)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req).read()
        with open(dst1, 'wb') as f1:
            f1.write(data)
        with open(dst2, 'wb') as f2:
            f2.write(data)
        print(f"Downloaded {img_name}: {len(data)} bytes")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
