# -*- coding: utf-8 -*-
from PIL import Image
import os

src = r"C:\Users\gktvi\Desktop\大蓝海icon.png"
out_dir = r"C:\Users\gktvi\WorkBuddy\2026-07-24-00-36-22\dalanhai\assets"
out = os.path.join(out_dir, "icon.png")

os.makedirs(out_dir, exist_ok=True)

im = Image.open(src)
print("source:", im.size, im.mode)

# App Store icon must have no alpha channel: composite over white if needed
if im.mode in ("RGBA", "LA", "P"):
    im = im.convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    im = bg
else:
    im = im.convert("RGB")

# Center-crop to square, then resize to 1024x1024
w, h = im.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
im = im.crop((left, top, left + side, top + side))
im = im.resize((1024, 1024), Image.LANCZOS)

im.save(out, "PNG")
print("saved:", out, Image.open(out).size, Image.open(out).mode)
