from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
DOWNLOAD_DIR = ROOT / "public" / "downloads" / "artefacts"
TMP_PDF_DIR = ROOT / "tmp" / "pdfs" / "public-artefacts"
TMP_SHEET_DIR = ROOT / "tmp" / "spreadsheets" / "public-artefacts"


def ensure_dirs() -> None:
    for directory in (DOWNLOAD_DIR, TMP_PDF_DIR, TMP_SHEET_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ArtefactTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.black,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "ArtefactSubtitle",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4b5563"),
            spaceAfter=14,
        ),
        "section": ParagraphStyle(
            "ArtefactSection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=16,
            textColor=colors.black,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "ArtefactBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=colors.black,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "ArtefactBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            leftIndent=12,
            bulletIndent=0,
            textColor=colors.black,
            spaceAfter=3,
        ),
    }


def add_pdf_header(story, styles, title: str, subtitle: str) -> None:
    story.append(Paragraph("KIRegister Artefakt", styles["subtitle"]))
    story.append(Paragraph(title, styles["title"]))
    story.append(Paragraph(subtitle, styles["subtitle"]))
    story.append(
        Table(
            [["Dokumentstatus", "Beispiel / herunterladbare Vorlage"], ["Formatlogik", "Institutional minimalism / file-backed artefact"]],
            colWidths=[55 * mm, 110 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LEADING", (0, 0), (-1, -1), 12),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8))


def add_paragraph_section(story, styles, heading: str, paragraphs: list[str]) -> None:
    story.append(Paragraph(heading, styles["section"]))
    for paragraph in paragraphs:
        story.append(Paragraph(paragraph, styles["body"]))


def add_bullet_section(story, styles, heading: str, items: list[str]) -> None:
    story.append(Paragraph(heading, styles["section"]))
    for item in items:
        story.append(Paragraph(item, styles["bullet"], bulletText="-"))


def add_table_section(story, styles, heading: str, rows: list[tuple[str, str]]) -> None:
    story.append(Paragraph(heading, styles["section"]))
    table = Table(
        rows,
        colWidths=[55 * mm, 110 * mm],
        style=TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        ),
    )
    story.append(table)


def create_pdf(path: Path, title: str, subtitle: str, sections: list[dict[str, object]]) -> None:
    styles = build_styles()
    story = []
    add_pdf_header(story, styles, title, subtitle)

    for section in sections:
        kind = section["kind"]
        if kind == "paragraphs":
            add_paragraph_section(story, styles, section["heading"], section["items"])
        elif kind == "bullets":
            add_bullet_section(story, styles, section["heading"], section["items"])
        elif kind == "table":
            add_table_section(story, styles, section["heading"], section["rows"])

    document = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    document.build(story)


def style_sheet_header(row) -> None:
    fill = PatternFill(fill_type="solid", fgColor="1F2937")
    font = Font(color="FFFFFF", bold=True)
    border = Border(bottom=Side(style="thin", color="D1D5DB"))
    alignment = Alignment(vertical="center", wrap_text=True)

    for cell in row:
        cell.fill = fill
        cell.font = font
        cell.border = border
        cell.alignment = alignment


def style_body_cell(cell) -> None:
    cell.alignment = Alignment(vertical="top", wrap_text=True)
    cell.border = Border(bottom=Side(style="thin", color="E5E7EB"))


def autosize_columns(worksheet) -> None:
    for column in worksheet.columns:
        length = 0
        column_letter = column[0].column_letter
        for cell in column:
            value = "" if cell.value is None else str(cell.value)
            length = max(length, len(value))
        worksheet.column_dimensions[column_letter].width = min(max(length + 2, 12), 36)


def create_use_case_register_workbook(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Register"

    headers = [
        "Use Case ID",
        "Organisation",
        "Bereich",
        "Zweck",
        "System",
        "Owner",
        "Datenbezug",
        "Wirkung",
        "AI Act Kategorie",
        "Review Status",
        "Verify Link",
    ]
    sheet.append(headers)
    style_sheet_header(sheet[1])

    rows = [
        [
            "UC-2026-001",
            "Nordstadt Automotive Systems GmbH",
            "Supplier Quality",
            "Automatisierte Eingangspruefung technischer Lieferantendokumente",
            "Technical Document Classifier",
            "Leitung Supplier Quality",
            "Keine personenbezogenen Daten im Regelfall",
            "Vorbereitung von Freigabeentscheidungen",
            "Minimales Risiko",
            "REVIEWED",
            "https://kiregister.com/de/verify",
        ],
        [
            "UC-2026-002",
            "Nordstadt Automotive Systems GmbH",
            "Einkauf",
            "Vorstrukturierung von Lieferantenantworten fuer Beschaffungsfreigaben",
            "Supplier Request Assistant",
            "Leitung Einkauf",
            "Lieferantenstammdaten und Anfragetexte",
            "Beschaffungsnaehe, keine finale Automatisierung",
            "Begrenztes Risiko",
            "PROOF_READY",
            "https://kiregister.com/de/verify",
        ],
        [
            "UC-2026-003",
            "Nordstadt Automotive Systems GmbH",
            "Legal & Governance",
            "Vorbereitung von Transparenzhinweisen fuer externe Kommunikation",
            "Disclosure Drafting Copilot",
            "Head of Governance",
            "Vertrags- und Kommunikationsentwuerfe",
            "Externe Kommunikation mit menschlicher Freigabe",
            "Begrenztes Risiko",
            "REVIEWED",
            "https://kiregister.com/de/verify",
        ],
    ]

    for row in rows:
        sheet.append(row)

    for row in sheet.iter_rows(min_row=2):
        for cell in row:
            style_body_cell(cell)

    sheet.freeze_panes = "A2"
    autosize_columns(sheet)

    definitions = workbook.create_sheet("Felddefinitionen")
    definitions.append(["Feld", "Bedeutung"])
    style_sheet_header(definitions[1])
    for row in [
        ("Use Case ID", "Stabile Referenz pro KI-Einsatzfall."),
        ("Zweck", "Konkrete operative Nutzung statt Tool-Sammelbegriff."),
        ("Datenbezug", "Welche Datenarten oder Schutzbedarfe im Einsatz beruehrt werden."),
        ("AI Act Kategorie", "Aktuelle fachliche Einordnung des Einsatzfalls."),
        ("Verify Link", "Oeffentliche oder interne Nachweisreferenz."),
    ]:
        definitions.append(row)

    for row in definitions.iter_rows(min_row=2):
        for cell in row:
            style_body_cell(cell)

    autosize_columns(definitions)
    workbook.save(path)


def create_supplier_request_workbook(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Supplier Request"

    headers = ["Feld", "Pflicht", "Beschreibung", "Antwort Lieferant"]
    sheet.append(headers)
    style_sheet_header(sheet[1])

    rows = [
        ("Lieferantenorganisation", "Ja", "Juristische Einheit oder offizielle Lieferantenbezeichnung.", ""),
        ("Use Case Titel", "Ja", "Konkreter KI-Einsatzfall, nicht nur das Tool.", ""),
        ("Zweck", "Ja", "Wofuer der Einsatzfall im operativen Ablauf genutzt wird.", ""),
        ("Owner Rolle", "Ja", "Verantwortliche Rolle auf Lieferantenseite.", ""),
        ("System / Modell", "Ja", "Produkt-, Modell- oder Systembezeichnung.", ""),
        ("Datenbezug", "Ja", "Welche Datenarten oder Dokumente verarbeitet werden.", ""),
        ("Entscheidungsnaehe", "Ja", "Vorbereitung, Empfehlung, Freigabenaehe oder reine Dokumentation.", ""),
        ("Externe Wirkung", "Ja", "Ob die Nutzung Kunden, OEMs, Bewerber oder andere Externe betrifft.", ""),
        ("Pruefstatus", "Ja", "z. B. UNREVIEWED, REVIEWED oder PROOF_READY.", ""),
        ("Verify / Artefakt Link", "Nein", "Link auf Pass, Verify-Seite oder Export.", ""),
        ("Offene Risiken", "Nein", "Freitext fuer bekannte Luecken oder Eskalationspunkte.", ""),
    ]

    for row in rows:
        sheet.append(row)

    for row in sheet.iter_rows(min_row=2):
        for cell in row:
            style_body_cell(cell)

    sheet.freeze_panes = "A2"
    autosize_columns(sheet)

    response = workbook.create_sheet("Beispielantwort")
    response.append(headers)
    style_sheet_header(response[1])
    sample_rows = [
        ("Lieferantenorganisation", "Ja", "Juristische Einheit oder offizielle Lieferantenbezeichnung.", "Nordstadt Automotive Systems GmbH"),
        ("Use Case Titel", "Ja", "Konkreter KI-Einsatzfall, nicht nur das Tool.", "Automatisierte Eingangspruefung technischer Lieferantendokumente"),
        ("Zweck", "Ja", "Wofuer der Einsatzfall im operativen Ablauf genutzt wird.", "Vorpruefung technischer Unterlagen vor manueller Freigabe."),
        ("Owner Rolle", "Ja", "Verantwortliche Rolle auf Lieferantenseite.", "Leitung Supplier Quality"),
        ("System / Modell", "Ja", "Produkt-, Modell- oder Systembezeichnung.", "Technical Document Classifier"),
        ("Datenbezug", "Ja", "Welche Datenarten oder Dokumente verarbeitet werden.", "Technische Zeichnungen, Lastenhefte, Lieferantendokumente"),
        ("Entscheidungsnaehe", "Ja", "Vorbereitung, Empfehlung, Freigabenaehe oder reine Dokumentation.", "Vorbereitung mit manueller Freigabe"),
        ("Externe Wirkung", "Ja", "Ob die Nutzung Kunden, OEMs, Bewerber oder andere Externe betrifft.", "Indirekte Wirkung auf Beschaffung und Nachweiskette"),
        ("Pruefstatus", "Ja", "z. B. UNREVIEWED, REVIEWED oder PROOF_READY.", "REVIEWED"),
        ("Verify / Artefakt Link", "Nein", "Link auf Pass, Verify-Seite oder Export.", "https://kiregister.com/de/verify"),
        ("Offene Risiken", "Nein", "Freitext fuer bekannte Luecken oder Eskalationspunkte.", "Keine finalen Entscheidungen ohne menschliche Pruefung."),
    ]

    for row in sample_rows:
        response.append(row)

    for row in response.iter_rows(min_row=2):
        for cell in row:
            style_body_cell(cell)

    response.freeze_panes = "A2"
    autosize_columns(response)
    workbook.save(path)


def generate_assets() -> None:
    ensure_dirs()

    create_pdf(
        DOWNLOAD_DIR / "ki-register-use-case-pass-beispiel.pdf",
        "Beispiel Use-Case Pass",
        "Beispielhafter KI-Einsatzfall fuer Lieferanten- und Governance-Kontexte.",
        [
            {
                "kind": "table",
                "heading": "Stammdaten",
                "rows": [
                    ("Organisation", "Nordstadt Automotive Systems GmbH"),
                    ("Bereich", "Supplier Quality"),
                    ("Use Case", "Automatisierte Eingangspruefung technischer Lieferantendokumente"),
                    ("Owner Rolle", "Leitung Supplier Quality"),
                    ("AI Act Kategorie", "Minimales Risiko / dokumentationspflichtiger Einsatzfall"),
                    ("Status", "REVIEWED"),
                ],
            },
            {
                "kind": "paragraphs",
                "heading": "Zweck und operative Rolle",
                "items": [
                    "Das System klassifiziert eingehende technische Lieferantendokumente vor der manuellen Freigabe. Es priorisiert Unterlagen nach Vollstaendigkeit, Relevanz und Nacharbeitsbedarf.",
                    "Es trifft keine finale Freigabeentscheidung. Die letzte Entscheidung verbleibt bei einer verantwortlichen Person im Supplier-Quality-Team.",
                ],
            },
            {
                "kind": "bullets",
                "heading": "Nachweislogik",
                "items": [
                    "Verantwortliche Rolle ist pro Einsatzfall benannt.",
                    "Datenbezug und Dokumenttypen sind nachvollziehbar beschrieben.",
                    "Review-Zyklus ist auf vierteljaehrlich gesetzt.",
                    "Verify-Link und Export koennen an OEM-Anfragen angedockt werden.",
                ],
            },
        ],
    )

    create_pdf(
        DOWNLOAD_DIR / "ki-register-practitioner-kit-workshopleitfaden.pdf",
        "Practitioner Kit / Workshopleitfaden",
        "Beispielhafter Ablauf fuer Berater, Auditoren und Trainer im KIRegister-Kontext.",
        [
            {
                "kind": "table",
                "heading": "Workshoprahmen",
                "rows": [
                    ("Dauer", "120 Minuten"),
                    ("Teilnehmer", "Fachbereich, Governance, Legal oder Datenschutz, verantwortliche Teamleitung"),
                    ("Primarziel", "Reale Einsatzfaelle erfassen und Verantwortungen sauber zuordnen"),
                ],
            },
            {
                "kind": "bullets",
                "heading": "Ablauf",
                "items": [
                    "Konkrete Einsaetze sammeln, nicht nur Tools oder Anbieter.",
                    "Pro Einsatzfall Owner, Wirkung und Datenbezug festhalten.",
                    "Offene Risiken markieren und nicht vorschnell glattschreiben.",
                    "Mindestens einen belastbaren Use-Case Pass und einen Review-Pfad hinterlassen.",
                ],
            },
            {
                "kind": "paragraphs",
                "heading": "Ergebnis",
                "items": [
                    "Nach dem Termin liegt ein anschlussfaehiges Registerobjekt vor, auf dem weitere Reviews, Richtlinienverknuepfungen und externe Nachweise aufbauen koennen.",
                ],
            },
        ],
    )

    create_pdf(
        DOWNLOAD_DIR / "ki-register-use-case-pass-explainer-one-pager.pdf",
        "Use-Case Pass Explainer / One-Pager",
        "Kurzer Einordnungsbogen fuer Einkauf, Legal und Governance.",
        [
            {
                "kind": "paragraphs",
                "heading": "Kernaussage",
                "items": [
                    "Der Use-Case Pass dokumentiert einen einzelnen KI-Einsatzfall so, dass Zweck, Verantwortung, Wirkung und Nachweis in einem Objekt zusammenlaufen.",
                    "Das reduziert Rueckfragen zwischen Fachbereich, Einkauf, Legal und Partnern, weil sich Entscheidungen auf eine definierte Einheit beziehen lassen.",
                ],
            },
            {
                "kind": "bullets",
                "heading": "Wofuer der One-Pager genutzt wird",
                "items": [
                    "Einordnung vor Beschaffungs- oder Governance-Gespraechen",
                    "Schneller Start fuer Partner und interne Stakeholder",
                    "Bruecke zwischen Richtlinie, Einsatzfall und Verify-/Export-Logik",
                ],
            },
        ],
    )

    create_pdf(
        DOWNLOAD_DIR / "ki-register-supplier-response-beispiel.pdf",
        "Supplier Response / Beispielantwort",
        "Ausgefuellte Musterantwort fuer einen OEM-Supplier-Request.",
        [
            {
                "kind": "table",
                "heading": "Antwortprofil",
                "rows": [
                    ("Lieferantenorganisation", "Nordstadt Automotive Systems GmbH"),
                    ("Use Case", "Vorpruefung technischer Lieferantendokumente"),
                    ("Owner Rolle", "Leitung Supplier Quality"),
                    ("Pruefstatus", "REVIEWED"),
                    ("Verify Referenz", "https://kiregister.com/de/verify"),
                ],
            },
            {
                "kind": "paragraphs",
                "heading": "Kurze Einordnung",
                "items": [
                    "Der Einsatzfall dient der operativen Vorstrukturierung und Priorisierung. Finale Freigaben erfolgen ausschliesslich durch menschliche Pruefung.",
                    "Die Dokumentation ist auf denselben Feldern aufgebaut wie der interne Pass, sodass Rueckfragen entlang der Lieferkette reduziert werden.",
                ],
            },
        ],
    )

    create_use_case_register_workbook(
        DOWNLOAD_DIR / "ki-register-use-case-register-beispiel.xlsx"
    )
    create_supplier_request_workbook(
        DOWNLOAD_DIR / "ki-register-supplier-request-template.xlsx"
    )


if __name__ == "__main__":
    generate_assets()
