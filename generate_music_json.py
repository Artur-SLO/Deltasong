import json
import re
import sys
import os
from bs4 import BeautifulSoup

def parse_duration_to_seconds(time_str):
    """Converts 'MM:SS' or 'HH:MM:SS' string into duration in seconds."""
    if not time_str:
        return 0
    parts = list(map(int, time_str.split(':')))
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    elif len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0

def extract_chapter_from_title(title, default_chapter=1):
    """Attempts to identify the Chapter number from the track or playlist title."""
    match = re.search(r'Chapter\s*(\d+)', title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return default_chapter

def extract_music_data_from_html(html_file_path):
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    songs = []

    # Detects if the filename contains chapter indication (e.g., chapter2.html)
    chapter_from_filename = extract_chapter_from_title(html_file_path, default_chapter=1)

    # STRATEGY 1: Extract from the 'ytInitialData' JSON object (most accurate)
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and 'ytInitialData' in script.string:
            try:
                match_json = re.search(r'ytInitialData\s*=\s*({.*?});', script.string)
                if match_json:
                    data = json.loads(match_json.group(1))

                    contents = data.get('contents', {}) \
                    .get('twoColumnWatchNextResults', {}) \
                    .get('playlist', {}) \
                    .get('playlist', {}) \
                    .get('contents', [])

                    for item in contents:
                        video_data = item.get('playlistPanelVideoRenderer', {})
                        if not video_data:
                            continue

                        title = video_data.get('title', {}).get('simpleText', '')
                        video_id = video_data.get('videoId', '')
                        duration_text = video_data.get('lengthText', {}).get('simpleText', '0:00')

                        if title and video_id:
                            songs.append({
                                "title": title.strip(),
                                "chapter": extract_chapter_from_title(title, default_chapter=chapter_from_filename),
                                "duration_seconds": parse_duration_to_seconds(duration_text),
                                "duration_formatted": duration_text,
                                "url": f"https://www.youtube.com/watch?v={video_id}"
                            })
            except Exception as e:
                print(f"Warning parsing internal JSON: {e}")

    # STRATEGY 2: Fallback via HTML DOM parsing
    if not songs:
        playlist_items = soup.select('ytd-playlist-panel-video-renderer')
        for item in playlist_items:
            title_el = item.select_one('#video-title')
            duration_el = item.select_one('#text.ytd-thumbnail-overlay-time-status-renderer')

            title = title_el.text.strip() if title_el else None
            href = title_el.get('href', '') if title_el else None
            duration_text = duration_el.text.strip() if duration_el else "0:00"

            if title and href:
                video_id_match = re.search(r'v=([a-zA-Z0-9_-]+)', href)
                video_url = f"https://www.youtube.com/watch?v={video_id_match.group(1)}" if video_id_match else href

                songs.append({
                    "title": title,
                    "chapter": extract_chapter_from_title(title, default_chapter=chapter_from_filename),
                    "duration_seconds": parse_duration_to_seconds(duration_text),
                    "duration_formatted": duration_text,
                    "url": video_url
                })

    return songs

def main():
    # Accepts HTML file from CLI arguments or defaults to 'input.html'
    input_file = sys.argv[1] if len(sys.argv) > 1 else "input.html"
    output_file = "deltarune_soundtrack.json"

    if not os.path.exists(input_file):
        sys.exit(f"Error: File '{input_file}' not found.")

    # 1. Load existing tracklist if the JSON file already exists
    existing_songs = []
    existing_urls = set()

    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            try:
                existing_songs = json.load(f)
                existing_urls = {song["url"] for song in existing_songs if "url" in song}
                print(f"Loaded existing '{output_file}' with {len(existing_songs)} track(s).")
            except json.JSONDecodeError:
                print("Warning: Existing JSON file was corrupted, starting fresh list.")

    # 2. Extract tracks from the input HTML file
    print(f"Processing file: {input_file}...")
    extracted_songs = extract_music_data_from_html(input_file)

    # 3. Append only new tracks (deduplicated by YouTube URL)
    added_count = 0
    for song in extracted_songs:
        if song["url"] not in existing_urls:
            existing_songs.append(song)
            existing_urls.add(song["url"])
            added_count += 1

    # 4. Save the cumulative JSON array
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(existing_songs, f, ensure_ascii=False, indent=4)

    print(f"Success! Added {added_count} new track(s). Total tracks in JSON: {len(existing_songs)}.")

if __name__ == "__main__":
    main()
