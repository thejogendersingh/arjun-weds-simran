import re

with open('shared/scene-invite/motion.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    for term in ['reception', 'jasmine', 'dove', 'ceremony', 'gurdwara', 'forest', 'motion/']:
        if term in line:
            print(f"L{i+1}: {line.strip()[:100]}")
