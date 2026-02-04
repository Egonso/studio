import os
import json
from bs4 import BeautifulSoup
import re

# Configuration
INPUT_FILE = "eukiakt inhalt/package.htm"
OUTPUT_FILE = "src/data/eu-ai-act.json"

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    data = {
        "recitals": [],
        "chapters": [],
        "annexes": []
    }

    # 1. Parse Recitals (Präambel)
    # They seem to be in div#pbl_1 -> div[id^="rct_"]
    preamble = soup.find(id="pbl_1")
    if preamble:
        recitals = preamble.find_all("div", id=re.compile(r"^rct_\d+"))
        print(f"Found {len(recitals)} recitals.")
        for rct in recitals:
            rct_id = rct.get("id")
            # The text is usually in a table/tr/td inside the div, specific processing might be needed
            # Based on view_file output: table -> tr -> td:nth-child(2) -> p.oj-normal
            # Or just get all text
            text = clean_text(rct.get_text())
            # Extract number from ID or text if possible
            num_match = re.search(r'\((\d+)\)', text)
            number = num_match.group(1) if num_match else rct_id.replace("rct_", "")
            
            data["recitals"].append({
                "id": rct_id,
                "number": number,
                "text": text,
                "type": "recital"
            })

    # 2. Parse Enactment Part (Verfügender Teil)
    # Structure: div#enc_1 -> div[id^="cpt_"] (Chapters) -> div[id^="art_"] (Articles)
    enactment = soup.find(id="enc_1")
    if enactment:
        # Find all Chapters
        chapters = enactment.find_all("div", id=re.compile(r"^cpt_[IVXLC]+$")) # Roman numerals usually
        # Fallback if regex is too strict or structure differs: find all direct children that are chapters
        if not chapters:
             chapters = enactment.find_all("div", id=re.compile(r"^cpt_"))

        print(f"Found {len(chapters)} chapters.")
        
        for cpt in chapters:
            cpt_id = cpt.get("id")
            # Title is usually in a link or just text at the top of the div
            # Determine Title: looks for the first p.toc-eli-label or similar if parsed from TOC, 
            # but in the content body (enc_1), we look effectively at the content.
            # Usually the title is the first text node or container.
            
            # Extract full text first to see title
            full_text = clean_text(cpt.get_text())
            title_match = re.search(r'(KAPITEL\s+[IVXLC]+.*?)(?=Artikel|$)', full_text, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else cpt_id
            
            chapter_data = {
                "id": cpt_id,
                "title": title,
                "articles": []
            }

            # Find Articles inside this Chapter
            # Note: findAll might be recursive, so we must be careful not to grab articles from nested sub-structures if any
            # But Articles are usually direct children of Chapters or Sections in EU law.
            # Sections might exist (Abschnitt). 
            # If sections exist (e.g. div[id^="sct_"]), we should handle them or flatten them.
            # For simplicity, we search for all articles strictly inside this chapter div's tree.
            
            articles = cpt.find_all("div", id=re.compile(r"^art_\d+"))
            
            for art in articles:
                art_id = art.get("id")
                art_text_content = clean_text(art.get_text())
                
                # Extract Title (e.g. "Artikel 5 Verbotene Praktiken...")
                # Usually follows pattern: "Artikel X [Title] [Body]"
                # Let's try to split title and body if possible, or just keep full text.
                # For RAG, full text is fine. For Viewer, we might want title.
                
                # Simple extraction for now
                chapter_data["articles"].append({
                    "id": art_id,
                    "text": art_text_content,
                    "type": "article"
                })
            
            data["chapters"].append(chapter_data)

    # 3. Annexes
    # id^="anx_"
    annexes = soup.find_all("div", id=re.compile(r"^anx_"))
    print(f"Found {len(annexes)} annexes.")
    for anx in annexes:
         data["annexes"].append({
             "id": anx.get("id"),
             "text": clean_text(anx.get_text()),
             "type": "annex"
         })

    return data

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print(f"Parsing {INPUT_FILE}...")
    try:
        data = parse_html(INPUT_FILE)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully saved structured data to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error parsing HTML: {e}")
        # Identify if missing library
        if "No module named 'bs4'" in str(e):
            print("Please run: pip install beautifulsoup4")

if __name__ == "__main__":
    main()
