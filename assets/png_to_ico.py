from PIL import Image
import os

png_path = os.path.join(os.path.dirname(__file__), "icon.png")
ico_path = os.path.join(os.path.dirname(__file__), "icon.ico")

img = Image.open(png_path)
img.save(
    ico_path,
    format="ICO",
    sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
)

print(f"Created: {ico_path}")
