import json
import re
import sys
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://deltarune.wiki"
CATEGORY_URL = f"{BASE_URL}/w/Category:Characters"
LOCATIONS_URL = f"{BASE_URL}/w/Category:Locations"

MAX_CHARACTERS = 10

if len(sys.argv) > 1:
    arg_input = sys.argv[1]

    if arg_input.isdigit() and int(arg_input) >= 0:
        MAX_CHARACTERS = int(arg_input)
    else:
        sys.exit("Error: argument needs to be a positive integer")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}


def clean_text(text):
    """Remove footnotes [1], [2] and normalize whitespace."""
    if not text:
        return ""
    cleaned = re.sub(r"\[\d+\]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def parse_gender(full_text, infobox_text=""):
    """Extract gender using pronouns in infobox or body text."""
    combined = (infobox_text + " " + full_text).lower()

    # Priority 1: Check pronoun specifications
    if "he/him" in combined or "he / him" in combined:
        return "Male"
    if "she/her" in combined or "she / her" in combined:
        return "Female"
    if "they/them" in combined or "they / them" in combined or "non-binary" in combined or "it/its" in combined or "it / its" in combined:
        return "Non-binary"

    return "Unknown"


def parse_type(first_paragraph, categories_text, infobox_text):
    """Extract type/species from classification, intro sentence, or categories."""
    combined = (infobox_text + " " + first_paragraph + " " + categories_text).lower()

    # Check for core Deltarune species
    if "darkner" in combined:
        return "Darkner"
    if "lightner" in combined:
        return "Lightner"

    # Check classification in infobox (e.g. Plant, Animal, etc.)
    match = re.search(r"classification\s*([a-zA-Z]+)", infobox_text, re.IGNORECASE)
    if match:
        return match.group(1).title()

    # Intro sentence pattern: "... is a <Type> ..."
    match_intro = re.search(r"is a\s+([a-zA-Z]+)\b", first_paragraph, re.IGNORECASE)
    if match_intro and match_intro.group(1).lower() not in ["character", "recurring", "hidden", "primary"]:
        return match_intro.group(1).title()

    return "Unknown"


def parse_chapter(soup, full_text):
    """Find the earliest chapter mentioned in headers or intro text."""
    chapter_headers = []
    for header in soup.select("h2, h3, h4, .mw-heading"):
        text = header.text.strip()
        match = re.search(r"Chapter\s*(\d+)", text, re.IGNORECASE)
        if match:
            chapter_headers.append(int(match.group(1)))

    if chapter_headers:
        return min(chapter_headers)

    match = re.search(r"\bChapter\s*(\d+)\b|\bCh\.\s*(\d+)\b", full_text, re.IGNORECASE)
    if match:
        return int(match.group(1) or match.group(2))

    return 1


def parse_class(first_paragraph, categories_text, infobox_text):
    """Determine character role/class (Main Character, Boss, Enemy, Vendor, Ally, NPC)."""
    cats_lower = categories_text.lower()
    first_p_lower = first_paragraph.lower()
    infobox_lower = infobox_text.lower()
    combined = f"{first_p_lower} {cats_lower} {infobox_lower}"

    if "main characters" in cats_lower or "main character" in first_p_lower:
        return "Main Character"
    if "bosses" in cats_lower or any(k in combined for k in ["secret boss", "shadow crystal boss"]):
        return "Boss"
    if "enemies" in cats_lower or "enemy" in first_p_lower:
        return "Enemy"
    if "vendors" in cats_lower or any(k in combined for k in ["shopkeeper", "item shop"]):
        return "Vendor"
    if any(k in combined for k in ["party member", "joins the party", "recruit"]):
        return "Ally"

    return "NPC"


def parse_first_appearance(infobox_el, full_text):
    """Extract the first location under 'Appearances' from the infobox HTML structure."""
    if infobox_el:
        for item in infobox_el.select(".pi-data-item, tr, div"):
            label_el = item.select_one(".pi-data-label, th, h3, h4")
            val_el = item.select_one(".pi-data-value, td, div")

            if label_el and val_el and "appearance" in label_el.text.strip().lower():
                first_link = val_el.select_one("ul li a, ol li a, a")
                if first_link and clean_text(first_link.text):
                    return clean_text(first_link.text)

                lines = [clean_text(line) for line in val_el.text.split("\n") if clean_text(line)]
                if lines:
                    return lines[0]

    match = re.search(
        r"first appears in\s+([A-Za-z0-9\s\'\?]+?)(?=\s+and|\s+or|\.|\,)",
        full_text,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).strip().title()

    return "Unknown"


def extract_image_url(soup):
    """Extract character image URL, prioritizing animated GIFs."""
    for img in soup.select("aside img, .portable-infobox img, .mw-parser-output img"):
        src = img.get("src") or img.get("data-src") or ""
        if ".gif" in src.lower() and not any(ignored_term in src.lower() for ignored_term in ["icon", "logo", "badge"]):
            return urljoin(BASE_URL, src)

    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        return og_img["content"]

    img = soup.select_one("aside img, .portable-infobox img, .mw-parser-output img")
    if img:
        src = img.get("src") or img.get("data-src")
        if src:
            return urljoin(BASE_URL, src)

    return None


def parse_character_page(url, location_map=None):
    """Scrape and parse character page content using text body and DOM structure."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        title_tag = soup.find("h1", id="firstHeading") or soup.find("h1")
        raw_name = title_tag.text.strip() if title_tag else "Unknown"

        infobox_el = soup.select_one("aside.portable-infobox, .portable-infobox, table.infobox")
        infobox_text = clean_text(infobox_el.text) if infobox_el else ""

        lead_p = soup.select_one(".mw-parser-output > p")
        first_paragraph = clean_text(lead_p.text) if lead_p else ""

        cat_links = [clean_text(a.text) for a in soup.select("#mw-normal-catlinks ul li a, .catlinks a")]
        categories_text = " ".join(cat_links)

        full_body_text = clean_text(soup.text)

        first_app = parse_first_appearance(infobox_el, full_body_text)
        loc_map = location_map or {}

        char_data = {
            "name": raw_name.upper(),
            "gender": parse_gender(full_body_text, infobox_text),
            "type": parse_type(first_paragraph, categories_text, infobox_text),
            "chapter": parse_chapter(soup, full_body_text),
            "class": parse_class(first_paragraph, categories_text, infobox_text),
            "first_appearance": first_app,
            "first_appearance_index": loc_map.get(first_app.lower(), 0),
            "image": extract_image_url(soup),
            "url": url,
        }

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

    for link in soup.select(".mw-category a, .mw-category-group a, #mw-pages a"):
        href = link.get("href")
        if href and "/w/" in href and ":" not in href.replace("/w/", ""):
            full_url = urljoin(BASE_URL, href)
            if full_url not in character_links:
                character_links.append(full_url)

    print(f"Found {len(character_links)} character links.")
    return character_links


def fetch_location_map():
    """
    Scrapes Category:Locations dynamically in top-to-bottom, left-to-right order.
    """
    print("Fetching location index map dynamically...")
    try:
        response = requests.get(LOCATIONS_URL, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            print("Warning: Failed to fetch locations page, index mapping will default to 0.")
            return {}

        soup = BeautifulSoup(response.text, "html.parser")

        location_map = {}
        current_index = 1


        # Galery items
        gallery_items = soup.select(".gallerybox")
        for box in gallery_items:
            a_tag = box.select_one(".gallerytext a, .thumb a")
            if a_tag:
                raw_loc = a_tag.get("title") or clean_text(a_tag.text)
                loc_name = clean_text(re.sub(r"\s*\(.*?\)", "", raw_loc))

                if loc_name and loc_name.lower() not in location_map:
                    location_map[loc_name.lower()] = current_index
                    current_index += 1

        print(f"Dynamic Location Map successfully generated with {len(location_map)} entries!")
        return location_map

    except Exception as e:
        print(f"Error fetching dynamic location map: {e}")
        return {}


def main():
    location_map = fetch_location_map()
    links = get_character_links()

    if MAX_CHARACTERS and MAX_CHARACTERS > 0:
        target_links = links[:MAX_CHARACTERS]
    else:
        target_links = links

    characters = []
    total_to_process = len(target_links)

    print(f"\nStarting extraction for {total_to_process} character(s)...")

    for index, url in enumerate(target_links, start=1):
        print(f"[{index}/{total_to_process}] Extracting: {url}")
        data = parse_character_page(url, location_map)

        if data:
            characters.append(data)

        time.sleep(0.3)

    output_file = "deltarune_characters.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=4)

    output_file = "deltarune_locations.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(location_map, f, ensure_ascii=False, indent=4)

    print(f"\nExtraction complete! Saved {len(characters)} character(s) to '{output_file}'.")



if __name__ == "__main__":
    main()
