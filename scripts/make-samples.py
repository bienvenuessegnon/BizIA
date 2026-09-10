#!/usr/bin/env python3
"""Génère les échantillons PDF et Excel à partir des CSV de référence.

Les CSV restent la source de vérité : les autres formats en sont dérivés, donc
un catalogue et un journal de ventes importés ensemble restent cohérents.

    python3 scripts/make-samples.py
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

SAMPLES = Path(__file__).resolve().parents[1] / "data" / "samples"

HEADER_BG = colors.Color(0.87, 0.90, 0.96)
GRID = colors.Color(0.65, 0.68, 0.75)


def write_pdf(path: Path, title: str, frame: pd.DataFrame) -> None:
    document = SimpleDocTemplate(
        str(path),
        pagesize=landscape(A4),
        title=title,
        author="BizIA",
    )
    styles = getSampleStyleSheet()
    rows = [list(frame.columns)] + frame.astype(str).values.tolist()
    table = Table(rows, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
                ("GRID", (0, 0), (-1, -1), 0.5, GRID),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    document.build([Paragraph(title, styles["Heading2"]), Spacer(1, 12), table])
    print(f"écrit {path.relative_to(SAMPLES.parents[1])}")


def main() -> None:
    products = pd.read_csv(SAMPLES / "produits.csv")
    sales = pd.read_csv(SAMPLES / "ventes.csv")

    # Une date seule reste lisible dans un tableau et le backend la complète.
    sales_readable = sales.drop(columns=["channel"]).copy()
    sales_readable["sold_at"] = sales_readable["sold_at"].str.slice(0, 10)

    products.to_excel(SAMPLES / "produits.xlsx", index=False)
    print("écrit data/samples/produits.xlsx")

    write_pdf(SAMPLES / "produits.pdf", "Catalogue produits", products)
    write_pdf(SAMPLES / "ventes.pdf", "Journal des ventes", sales_readable)


if __name__ == "__main__":
    main()
