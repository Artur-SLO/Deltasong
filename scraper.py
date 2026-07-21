import json
import re
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://deltarune.wiki"
CATEGORY_URL = f"{BASE_URL}/w/Category:Characters"

MAX_CHARACTERS = 10

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
    if "they/them" in combined or "they / them" in combined or "non-binary" in combined:
        return "Non-binary"

    # Priority 2: Fallback pronoun counting in text
    he_count = len(re.findall(r"\b(he|his|him)\b", combined))
    she_count = len(re.findall(r"\b(she|her|hers)\b", combined))

    if he_count > she_count and he_count > 2:
        return "Male"
    if she_count > he_count and she_count > 2:
        return "Female"

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
    # Strategy 1: Check Chapter headers under 'Main story' (e.g., ### Chapter 1)
    chapter_headers = []
    for header in soup.select("h2, h3, h4, .mw-heading"):
        text = header.text.strip()
        match = re.search(r"Chapter\s*(\d+)", text, re.IGNORECASE)
        if match:
            chapter_headers.append(int(match.group(1)))

    if chapter_headers:
        return min(chapter_headers)

    # Strategy 2: Search intro paragraph or full body text
    match = re.search(r"\bChapter\s*(\d+)\b|\bCh\.\s*(\d+)\b", full_text, re.IGNORECASE)
    if match:
        return int(match.group(1) or match.group(2))

    return 1


def parse_class(first_paragraph, categories_text, infobox_text):
    """Determine character role/class (Boss, Enemy, Vendor, Main Character, NPC)."""
    combined = (first_paragraph + " " + categories_text + " " + infobox_text).lower()

    if "main character" in combined or "main_characters" in combined:
        return "Main Character"
    if "boss" in combined or "miniboss" in combined or "enemies" in combined or "enemy" in combined:
        return "Boss / Enemy"
    if "vendor" in combined or "shopkeeper" in combined or "sells" in combined:
        return "Vendor"

    return "NPC"


def extract_image_url(soup):
    """Extract character image from meta tags, infobox, or main body."""
    # Open Graph meta tag (Contains primary page sprite)
    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        return og_img["content"]

    # Infobox image tag
    img = soup.select_one("aside img, .portable-infobox img, .mw-parser-output img")
    if img:
        src = img.get("src") or img.get("data-src")
        if src:
            return urljoin(BASE_URL, src)

    return None


def parse_character_page(url):
    """Scrape and parse character page content using text body and DOM structure."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Name
        title_tag = soup.find("h1", id="firstHeading") or soup.find("h1")
        raw_name = title_tag.text.strip() if title_tag else "Unknown"

        # Raw Texts
        infobox_el = soup.select_one("aside.portable-infobox, .portable-infobox, table.infobox")
        infobox_text = clean_text(infobox_el.text) if infobox_el else ""

        lead_p = soup.select_one(".mw-parser-output > p")
        first_paragraph = clean_text(lead_p.text) if lead_p else ""

        cat_links = [clean_text(a.text) for a in soup.select("#mw-normal-catlinks ul li a, .catlinks a")]
        categories_text = " ".join(cat_links)

        full_body_text = clean_text(soup.text)

        # Build Character Data
        char_data = {
            "name": raw_name.upper(),
            "gender": parse_gender(full_body_text, infobox_text),
            "type": parse_type(first_paragraph, categories_text, infobox_text),
            "chapter": parse_chapter(soup, full_body_text),
            "class": parse_class(first_paragraph, categories_text, infobox_text),
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


def main():
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
