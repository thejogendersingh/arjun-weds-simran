import urllib.request
import os
import shutil

base_url = 'https://www.lovesolutions.in'

targets = [
    ('/all-invite/shared/scene-invite/motion/mehendi-hands.webp', 'shared/scene-invite/motion/mehendi-hands.webp'),
    ('/all-invite/phulkari-courtyard/resources/assets/dove-flight-up.webp', 'assets/dove-flight-up.webp'),
    ('/all-invite/shared/scene-invite/motion/dove-flight-up.webp', 'shared/scene-invite/motion/dove-flight-up.webp'),
]

for remote, local in targets:
    url = base_url + remote
    os.makedirs(os.path.dirname(local), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req).read()
        with open(local, 'wb') as f:
            f.write(data)
        print(f"Downloaded {local}: {len(data)} bytes")
    except Exception as e:
        print(f"Failed {url}: {e}")

# Copy all motion images to all-invite/shared/scene-invite/motion/ as well
shutil.copytree('shared/scene-invite/motion', 'all-invite/shared/scene-invite/motion', dirs_exist_ok=True)

# Also ensure dove-flight-up is in all asset directories
if os.path.exists('assets/dove-flight-up.webp'):
    shutil.copyfile('assets/dove-flight-up.webp', 'all-invite/phulkari-courtyard/resources/assets/dove-flight-up.webp')
    shutil.copyfile('assets/dove-flight-up.webp', 'shared/scene-invite/dove-flight-up.webp')

print("All synced!")
