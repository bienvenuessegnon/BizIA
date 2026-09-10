from pathlib import Path

import pytest
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from app.services.ingestion import IngestionError, parse_tabular
from app.utils.settings import REPO_ROOT

SAMPLES = REPO_ROOT / "data" / "samples"

_PRODUCT_ROWS = [
    ["sku", "name", "category", "unit_price", "stock_quantity"],
    ["HUILE-1L", "Huile 1L", "Epicerie", "1500", "4"],
    ["RIZ-5KG", "Riz 5kg", "Epicerie", "3000", "18"],
]

_SALE_ROWS = [
    ["sku", "qte", "prix", "date"],
    ["HUILE-1L", "3", "1500", "2026-08-25T09:00:00+00:00"],
]


def _write_table_pdf(path: Path, rows: list[list[str]]) -> None:
    document = SimpleDocTemplate(str(path), pagesize=A4)
    table = Table(rows, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.9, 0.9, 0.9)),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    document.build([table])


def _pdf_first_page_png(pdf_path: Path, png_path: Path) -> None:
    import pypdfium2 as pdfium

    document = pdfium.PdfDocument(str(pdf_path))
    try:
        document[0].render(scale=2).to_pil().convert("RGB").save(png_path)
    finally:
        document.close()


def test_parse_sample_products() -> None:
    products, sales = parse_tabular(str(SAMPLES / "produits.csv"), "produits.csv")
    assert sales == []
    assert len(products) == 5
    assert products[0]["sku"] == "HUILE-1L"
    assert products[0]["low_stock_threshold"] == 5


def test_parse_sample_sales_csv() -> None:
    products, sales = parse_tabular(str(SAMPLES / "ventes.csv"), "ventes.csv")
    assert products == []
    assert len(sales) == 16
    assert sales[0]["product_sku"] == "HUILE-1L"
    assert sales[0]["sold_at"]


def test_parse_sample_sales_excel() -> None:
    products, sales = parse_tabular(str(SAMPLES / "ventes.xlsx"), "ventes.xlsx")
    assert products == []
    assert len(sales) == 16


def test_french_aliases(tmp_path: Path) -> None:
    path = tmp_path / "ventes.csv"
    path.write_text("produit,qte,prix,date\nHUILE-1L,3,1500,2026-08-25T09:00:00+00:00\n", encoding="utf-8")
    products, sales = parse_tabular(str(path), "ventes.csv")
    assert products == []
    assert sales[0]["product_sku"] == "HUILE-1L"
    assert sales[0]["quantity"] == 3
    assert sales[0]["unit_price"] == 1500
    assert sales[0]["channel"] == "csv"


def test_unsupported_type(tmp_path: Path) -> None:
    path = tmp_path / "notes.docx"
    path.write_bytes(b"PK")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "notes.docx")
    assert error.value.code == "unsupported_type"
    assert error.value.status_code == 415


def test_parse_products_pdf(tmp_path: Path) -> None:
    path = tmp_path / "produits.pdf"
    _write_table_pdf(path, _PRODUCT_ROWS)
    products, sales = parse_tabular(str(path), "produits.pdf")
    assert sales == []
    assert [item["sku"] for item in products] == ["HUILE-1L", "RIZ-5KG"]
    assert products[0]["unit_price"] == 1500 or float(products[0]["unit_price"]) == 1500.0


def test_parse_sales_pdf(tmp_path: Path) -> None:
    path = tmp_path / "ventes.pdf"
    _write_table_pdf(path, _SALE_ROWS)
    products, sales = parse_tabular(str(path), "ventes.pdf")
    assert products == []
    assert sales[0]["product_sku"] == "HUILE-1L"
    assert int(float(sales[0]["quantity"])) == 3
    assert sales[0]["channel"] == "pdf"


def test_parse_sales_pdf_over_several_pages(tmp_path: Path) -> None:
    """Un tableau coupé par un saut de page garde toutes ses lignes."""
    rows = [_SALE_ROWS[0]] + [
        ["HUILE-1L", "1", "1500", f"2026-08-{day:02d}"] for day in range(1, 32)
    ] * 3
    path = tmp_path / "ventes-longues.pdf"
    _write_table_pdf(path, rows)

    products, sales = parse_tabular(str(path), "ventes-longues.pdf")
    assert products == []
    assert len(sales) == len(rows) - 1


def test_parse_sample_sales_pdf() -> None:
    products, sales = parse_tabular(str(SAMPLES / "ventes.pdf"), "ventes.pdf")
    assert products == []
    assert len(sales) == 16


def test_parse_sample_products_pdf() -> None:
    products, sales = parse_tabular(str(SAMPLES / "produits.pdf"), "produits.pdf")
    assert sales == []
    assert [item["sku"] for item in products] == [
        "HUILE-1L",
        "RIZ-5KG",
        "SAVON",
        "EAU-15L",
        "PAIN",
    ]


def test_parse_sample_products_excel() -> None:
    products, sales = parse_tabular(str(SAMPLES / "produits.xlsx"), "produits.xlsx")
    assert sales == []
    assert len(products) == 5


def test_parse_products_image(tmp_path: Path) -> None:
    pdf_path = tmp_path / "produits.pdf"
    png_path = tmp_path / "produits.png"
    _write_table_pdf(pdf_path, _PRODUCT_ROWS)
    _pdf_first_page_png(pdf_path, png_path)
    products, sales = parse_tabular(str(png_path), "produits.png")
    assert sales == []
    assert any(item["sku"] == "HUILE-1L" for item in products)


def test_unreadable_pdf(tmp_path: Path) -> None:
    path = tmp_path / "notes.pdf"
    path.write_bytes(b"%PDF-fake")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "notes.pdf")
    assert error.value.status_code in {400, 422}


def test_unknown_schema(tmp_path: Path) -> None:
    path = tmp_path / "misc.csv"
    path.write_text("foo,bar\n1,2\n", encoding="utf-8")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "misc.csv")
    assert error.value.code == "unknown_schema"
    assert error.value.status_code == 422


def test_parse_error(tmp_path: Path) -> None:
    path = tmp_path / "broken.xlsx"
    path.write_bytes(b"ceci n'est pas un excel")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "broken.xlsx")
    assert error.value.code == "parse_error"
    assert error.value.status_code == 400
