import json
import os
import re
import urllib.parse
import urllib.request
import shutil

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DATA_JSON = os.path.join(BASE_DIR, "frontend", "src", "assets", "data", "deltarune_characters.json")
ROOT_DATA_JSON = os.path.join(BASE_DIR, "data", "deltarune_characters.json")
TARGET_IMG_DIR = os.path.join(BASE_DIR, "frontend", "src", "assets", "images", "characters")
OLD_IMG_DIR = os.path.join(BASE_DIR, "frontend", "src", "assets", "images")

os.makedirs(TARGET_IMG_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

def slugify(name):
    slug = re.sub(r"[^a-z0-9]", "_", name.lower())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug

def determine_extension(url, fallback_name=""):
    url_lower = url.lower()
    parsed_path = urllib.parse.urlparse(url).path.lower()
    
    # Check direct extension in path
    ext = os.path.splitext(parsed_path)[1]
    if ext in [".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"]:
        return ext
        
    # Check query param f=filename.ext
    match = re.search(r"f=([^&]+)", url_lower)
    if match:
        f_ext = os.path.splitext(match.group(1))[1]
        if f_ext in [".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"]:
            return f_ext
            
    if "png" in url_lower or fallback_name.endswith(".png"):
        return ".png"
    if "jpg" in url_lower or "jpeg" in url_lower or fallback_name.endswith(".jpg"):
        return ".jpg"
        
    return ".gif"

import sys

def main():
    if not os.path.exists(FRONTEND_DATA_JSON):
        print(f"Error: {FRONTEND_DATA_JSON} not found.")
        return

    with open(FRONTEND_DATA_JSON, "r", encoding="utf-8") as f:
        characters = json.load(f)

    target_char = sys.argv[1].strip() if len(sys.argv) > 1 else None
    if target_char:
        target_slug = slugify(target_char)
        characters_to_process = [c for c in characters if slugify(c.get("name", "")) == target_slug or target_char.lower() in c.get("name", "").lower()]
        if not characters_to_process:
            print(f"No character matching '{target_char}' found.")
            return
        print(f"Filtering for target character: {[c.get('name') for c in characters_to_process]}")
    else:
        characters_to_process = characters

    successful_downloads = []
    failed_downloads = []
    local_copies = []

    print(f"Processing {len(characters_to_process)} character(s)...")

    for char in characters_to_process:
        name = char.get("name", "unknown")
        slug = slugify(name)
        img_url = char.get("image", "")
        wiki_url = char.get("url", "")

        # Target image URL to fetch
        source_url = img_url if (img_url and img_url.startswith("http")) else wiki_url
        ext = determine_extension(source_url, fallback_name=img_url).lower()
        filename = f"{slug}{ext}".lower()
        target_path = os.path.join(TARGET_IMG_DIR, filename)
        relative_json_path = f"../assets/images/characters/{filename}".lower()

        if img_url.startswith("http"):
            try:
                req = urllib.request.Request(img_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp, open(target_path, "wb") as out_file:
                    out_file.write(resp.read())
                char["image"] = relative_json_path
                successful_downloads.append((name, filename, img_url))
            except Exception as e:
                failed_downloads.append((name, img_url, str(e)))
                # Update image path anyway so user can manually place the image file
                char["image"] = relative_json_path
        else:
            # Handle pre-existing local image paths (e.g. "../assets/asriel.png", "./berdly.gif", etc.)
            old_filename = os.path.basename(img_url) if img_url else f"{slug}{ext}"
            found_local = False
            
            # Check in frontend/src/assets/images/
            possible_old_paths = [
                os.path.join(OLD_IMG_DIR, old_filename),
                os.path.join(OLD_IMG_DIR, f"{slug}{ext}"),
                os.path.join(OLD_IMG_DIR, f"{slug}.gif"),
                os.path.join(OLD_IMG_DIR, f"{slug}.png"),
            ]
            
            for p in possible_old_paths:
                if os.path.exists(p):
                    ext = os.path.splitext(p)[1]
                    filename = f"{slug}{ext}"
                    target_path = os.path.join(TARGET_IMG_DIR, filename)
                    relative_json_path = f"../assets/images/characters/{filename}"
                    shutil.copy2(p, target_path)
                    char["image"] = relative_json_path
                    local_copies.append((name, filename))
                    found_local = True
                    break
                    
            if not found_local:
                char["image"] = relative_json_path
                failed_downloads.append((name, img_url or "local file missing", "Local file not found"))

    # Write updated JSON back to frontend
    with open(FRONTEND_DATA_JSON, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=4)

    # Write updated JSON to root data directory if exists
    if os.path.exists(ROOT_DATA_JSON):
        with open(ROOT_DATA_JSON, "w", encoding="utf-8") as f:
            json.dump(characters, f, ensure_ascii=False, indent=4)

    print("\n--- DOWNLOAD SUMMARY ---")
    print(f"Successfully downloaded: {len(successful_downloads)}")
    print(f"Copied from existing local assets: {len(local_copies)}")
    print(f"Failed / Needs manual download: {len(failed_downloads)}")
    
    if failed_downloads:
        print("\n--- FAILED DOWNLOADS (Action Required) ---")
        for name, url, err in failed_downloads:
            print(f"Character: {name} | Expected File: {slugify(name)}.* | URL: {url} | Error: {err}")

if __name__ == "__main__":
    main()
