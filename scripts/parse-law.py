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
    preamble = soup.find(id="pbl_1")
    if preamble:
        recitals = preamble.find_all("div", id=re.compile(r"^rct_\d+"))
        print(f"Found {len(recitals)} recitals.")
        for rct in recitals:
            rct_id = rct.get("id")
            text = clean_text(rct.get_text())
            num_match = re.search(r'\((\d+)\)', text)
            number = num_match.group(1) if num_match else rct_id.replace("rct_", "")
            
            data["recitals"].append({
                "id": rct_id,
                "number": number,
                "text": text,
                "type": "recital"
            })

    # 2. Parse Enactment Part (Verfügender Teil)
    enactment = soup.find(id="enc_1")
    if enactment:
        chapters = enactment.find_all("div", id=re.compile(r"^cpt_[IVXLC]+$"))
        if not chapters:
             chapters = enactment.find_all("div", id=re.compile(r"^cpt_"))

        print(f"Found {len(chapters)} chapters.")
        
        for cpt in chapters:
            cpt_id = cpt.get("id")
            full_text = clean_text(cpt.get_text())
            title = cpt_id 
            title_match = re.search(r'(KAPITEL\s+[IVXLC]+.*?)(?=Artikel|$)', full_text, re.IGNORECASE)
            if title_match:
                title = title_match.group(1).strip()
            
            chapter_data = {
                "id": cpt_id,
                "title": title,
                "articles": []
            }

            # STRICTER REGEX: End with digit to avoid .tit_1 etc.
            articles = cpt.find_all("div", id=re.compile(r"^art_\d+$"))
            
            for art in articles:
                art_id = art.get("id")
                art_title = ""
                full_art_text = clean_text(art.get_text())
                
                # Check for standard structure <p class="ti-art"> and <p class="sti-art">
                sti = art.find("p", class_="sti-art")
                ti = art.find("p", class_="ti-art")
                
                if ti and sti:
                     art_title = f"{clean_text(ti.get_text())} - {clean_text(sti.get_text())}"
                elif ti:
                     art_title = clean_text(ti.get_text())
                else:
                    # Fallback regex extraction
                    match = re.match(r'(Artikel\s+\d+\s+.*?)(?=\s\(\d|\sDer|\sDie|\sDas)', full_art_text)
                    if match:
                         art_title = match.group(0)
                    else:
                         # Very simple fallback: First words
                         art_title = " ".join(full_art_text.split()[:5]) + "..."

                chapter_data["articles"].append({
                    "id": art_id,
                    "title": art_title,
                    "text": full_art_text,
                    "type": "article"
                })
            
            data["chapters"].append(chapter_data)

    # 3. Annexes
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
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2) 
        print(f"Successfully saved structured data to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error parsing HTML: {e}")

if __name__ == "__main__":
    main()
