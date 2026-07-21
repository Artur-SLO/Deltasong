import json
import re
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://deltarune.wiki"
CATEGORY_URL = f"{BASE_URL}/w/Category:Characters"

# Set to an integer to limit how many characters to parse.
# Set to None or 0 to parse ALL characters.
MAX_CHARACTERS = 0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}


def sanitize_text(text):
    """Clean reference numbers like [1], [2] and strip whitespace."""
    if not text:
        return "Unknown"
    cleaned = re.sub(r"\[\d+\]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if cleaned else "Unknown"


def extract_gender(text):
    """Normalize pronouns/gender string into standard Wordle options."""
    if not text or text == "Unknown":
        return "Unknown"

    text_lower = text.lower()
    if "she/her" in text_lower or "female" in text_lower:
        return "Female"
    if "he/him" in text_lower or "male" in text_lower:
        return "Male"
    if "they/them" in text_lower or "non-binary" in text_lower:
        return "Non-binary"

    return text.title()


def extract_chapter(soup, infobox):
    """Extract chapter number from infobox or body paragraphs."""
    # 1. Search in infobox data items
    if infobox:
        for item in infobox.select(".pi-data-item"):
            label = item.select_one(".pi-data-label")
            value = item.select_one(".pi-data-value")
            if label and value:
                lbl_text = label.text.strip().lower()
                val_text = value.text.strip()

                if "appearance" in lbl_text or "chapter" in lbl_text:
                    match = re.search(r"Chapter\s*(\d+)", val_text, re.IGNORECASE)
                    if match:
                        return int(match.group(1))

    # 2. Search in main lead paragraph text
    lead_paragraph = soup.select_one(".mw-parser-output > p")
    if lead_paragraph:
        match = re.search(r"Chapter\s*(\d+)", lead_paragraph.text, re.IGNORECASE)
        if match:
            return int(match.group(1))

    # Default fallback
    return 1


def extract_image_url(infobox):
    """Extract full URL of character sprite image."""
    if not infobox:
        return None

    img_tag = infobox.select_one(".pi-image-collection img, figure.pi-item img, .pi-media-collection img")
    if img_tag:
        src = img_tag.get("src") or img_tag.get("data-src")
        if src:
            return urljoin(BASE_URL, src)

    return None


def parse_character_page(url):
    """Scrape individual character page and return structured data dictionary."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Get title
        title_tag = soup.find("h1", id="firstHeading")
        raw_name = title_tag.text.strip() if title_tag else "Unknown"

        # Default object format
        char_data = {
            "name": raw_name.upper(),
            "gender": "Unknown",
            "type": "Unknown",
            "chapter": 1,
            "class": "NPC",
            "image": None,
            "url": url,
        }

        infobox = soup.select_one("aside.portable-infobox, .portable-infobox")

        if infobox:
            # Get Image
            char_data["image"] = extract_image_url(infobox)

            # Get Data Items
            for item in infobox.select(".pi-data-item"):
                source = item.get("data-source", "").lower()
                label = item.select_one(".pi-data-label")
                value = item.select_one(".pi-data-value")

                if not value:
                    continue

                lbl_text = label.text.strip().lower() if label else ""
                val_text = sanitize_text(value.text)

                # Parse gender or pronouns
                if "pronouns" in source or "gender" in source or "pronouns" in lbl_text or "gender" in lbl_text:
                    char_data["gender"] = extract_gender(val_text)

                # Parse species, type, or classification
                elif (
                    "type" in source
                    or "species" in source
                    or "classification" in source
                    or "type" in lbl_text
                    or "species" in lbl_text
                    or "classification" in lbl_text
                ):
                    char_data["type"] = val_text

                # Parse role or class
                elif "role" in source or "class" in source or "role" in lbl_text or "class" in lbl_text:
                    char_data["class"] = val_text

        # Chapter fallback search
        char_data["chapter"] = extract_chapter(soup, infobox)

        # Category Fallbacks
        cat_links = [a.text.strip() for a in soup.select("#mw-normal-catlinks ul li a")]

        if char_data["type"] == "Unknown":
            if "Lightners" in cat_links:
                char_data["type"] = "Lightner"
            elif "Darkners" in cat_links:
                char_data["type"] = "Darkner"

        if char_data["class"] == "NPC":
            if "Bosses" in cat_links or "Enemies" in cat_links:
                char_data["class"] = "Boss / Enemy"
            elif "Main characters" in cat_links:
                char_data["class"] = "Main Character"

        return char_data

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


def get_character_links():
    """Fetch links from Category:Characters."""
    print("Fetching character URLs...")
    response = requests.get(CATEGORY_URL, headers=HEADERS)
    if response.status_code != 200:
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    character_links = []

    for link in soup.select(".mw-category a, .mw-category-group a"):
        href = link.get("href")
        if href and "/w/" in href and ":" not in href.replace("/w/", ""):
            full_url = urljoin(BASE_URL, href)
            if full_url not in character_links:
                character_links.append(full_url)

    print(f"Found {len(character_links)} character links.")
    return character_links


def main():
    links = get_character_links()
    
    # Apply limit based on MAX_CHARACTERS variable
    if MAX_CHARACTERS and MAX_CHARACTERS > 0:
        target_links = links[:MAX_CHARACTERS]
    else:
        target_links = links

    characters = []
    total_to_process = len(target_links)

    print(f"\nStarting extraction for {total_to_process} character(s)...")
    
    for index, url in enumerate(target_links, start=1):
        print(f"[{index}/{total_to_process}] Extracting: {url}")
        data = parse_character_page(url)

        if data:
            characters.append(data)

        time.sleep(0.3)

    output_file = "deltarune_characters.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=4)

    print(f"\nExtraction complete! Saved {len(characters)} character(s) to '{output_file}'.")


if __name__ == "__main__":
    main()
