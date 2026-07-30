import sys
import os
import json
import re
import requests
from bs4 import BeautifulSoup

URL_TARGET = "https://deltarune.wiki/w/Item"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0"
}

def clean_text(element):
    """Normalize text content from HTML elements."""
    if not element:
        return ""
    text = element.get_text(separator=" ")
    cleaned = re.sub(r"\[\d+\]", "", text)  # Removes footnotes like [1]
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def extract_types_from_table(table):
    """
    Extracts 'type' and 'weapontype' directly from the MediaWiki 'data-mw' JSON attribute,
    with a fallback to preceding section headers.
    """
    item_type = None
    weapon_type = None

    # 1. Inspect 'data-mw' attribute (Most reliable source in MediaWiki HTML)
    data_mw = table.get("data-mw", "")
    if data_mw:
        try:
            parsed_mw = json.loads(data_mw)
            for part in parsed_mw.get("parts", []):
                template_data = part.get("template", {})
                params = template_data.get("params", {})
                
                if "type" in params:
                    item_type = params["type"].get("wt", "").strip()
                if "weapontype" in params:
                    weapon_type = params["weapontype"].get("wt", "").strip()
        except Exception:
            pass

    # 2. Fallback to section headers if 'data-mw' is missing
    if not item_type:
        prev_h = table.find_previous(["h2", "h3", "h4"])
        if prev_h:
            h_text = prev_h.get_text().strip()
            item_type = h_text

    # Normalize category names
    if item_type:
        lower_t = item_type.lower()
        if "weapon" in lower_t:
            item_type = "Weapons"
        elif "armor" in lower_t:
            item_type = "Armor"
        elif "key" in lower_t:
            item_type = "Key Items"
        elif "light" in lower_t:
            item_type = "Light World items"
        elif "consumable" in lower_t:
            item_type = "Consumables"

    # Normalize weapon subtype
    if weapon_type:
        w_lower = weapon_type.lower()
        if "sword" in w_lower:
            weapon_type = "Swords"
        elif "ax" in w_lower:
            weapon_type = "Axes"
        elif "scarf" in w_lower or "scarves" in w_lower:
            weapon_type = "Scarves"
        elif "ring" in w_lower:
            weapon_type = "Rings"
        elif "null" in w_lower or "none" in w_lower:
            weapon_type = "Other"

    # Ensure fallback weapon type
    if item_type == "Weapons" and not weapon_type:
        prev_sub = table.find_previous(["h3", "h4"])
        if prev_sub:
            s_text = prev_sub.get_text().strip()
            weapon_type = s_text if s_text in ["Swords", "Axes", "Scarves", "Rings"] else "Other"
        else:
            weapon_type = "Other"

    return item_type or "Consumables", weapon_type

def parse_html_content(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    items = []

    # Select all item tables
    tables = soup.select("table.items-table, table.wikitable")

    for table in tables:
        item_type, weapon_type = extract_types_from_table(table)

        rows = table.select("tbody tr") or table.select("tr")
        for row in rows:
            cols = row.find_all(["td", "th"])

            # Must have all 5 data columns
            if len(cols) >= 5:
                name = clean_text(cols[0])
                description = clean_text(cols[1])
                effects = clean_text(cols[2])
                source = clean_text(cols[3])
                buy = clean_text(cols[4])

                if not name or name.lower() in ["name", "item"]:
                    continue

                item_obj = {
                    "name": name,
                    "description": description,
                    "effects": effects if effects else "None",
                    "type": item_type,
                    "source": source if source else "Unknown",
                    "buy": buy if buy else "N/A"
                }

                # Include weapon_type if category is Weapons
                if item_type == "Weapons":
                    item_obj["weapon_type"] = weapon_type if weapon_type else "Other"

                items.append(item_obj)

    return items

def main():
    output_file = "deltarune_items.json"

    # Check if an HTML file path was provided in command line arguments
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            print(f"Reading local HTML file: '{file_path}'...")
            with open(file_path, "r", encoding="utf-8") as f:
                html_content = f.read()
        else:
            sys.exit(f"Error: File '{file_path}' not found.")
    else:
        print(f"Scraping live data from {URL_TARGET}...")
        try:
            res = requests.get(URL_TARGET, headers=HEADERS, timeout=10)
            res.raise_for_status()
            html_content = res.text
        except Exception as e:
            sys.exit(f"Failed to fetch live URL: {e}")

    extracted_items = parse_html_content(html_content)

    # Save to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(extracted_items, f, ensure_ascii=False, indent=4)

    print(f"Success! {len(extracted_items)} items parsed and saved to '{output_file}'.")

if __name__ == "__main__":
    main()
