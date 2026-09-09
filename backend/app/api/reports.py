from io import BytesIO

from docx import Document
from fastapi import APIRouter, Query
from fastapi.responses import Response
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.services.store import get_store
from app.utils.errors import ApiError

router = APIRouter()


def _report_payload(analysis: dict) -> dict:
    return {
        "kpis": analysis.get("kpis"),
        "insights": analysis.get("insights"),
        "alerts": analysis.get("alerts"),
        "recommendations": analysis.get("recommendations"),
        "top_sold": analysis.get("top_sold"),
        "top_profit": analysis.get("top_profit"),
        "low_stock": analysis.get("low_stock"),
        "trend": analysis.get("trend"),
        "anomalies": analysis.get("anomalies"),
        "week_over_week": analysis.get("week_over_week"),
    }


def _lines(report: dict) -> list[str]:
    kpis = report.get("kpis") or {}
    lines = [
        f"Chiffre d'affaires : {kpis.get('revenue', 0):,.0f} FCFA",
        f"Coûts : {kpis.get('cost', 0):,.0f} FCFA",
        f"Bénéfice : {kpis.get('profit', 0):,.0f} FCFA",
        f"Marge : {kpis.get('margin_pct', 0):.1f} %",
        "",
        "Insights",
        *[f"• {item}" for item in report.get("insights") or []],
        "",
        "Recommandations",
        *[
            f"• [{item.get('priority', '')}] {item.get('action', '')} — {item.get('why', '')}"
            for item in report.get("recommendations") or []
        ],
    ]
    return lines


def _pdf(report: dict) -> bytes:
    output = BytesIO()
    document = SimpleDocTemplate(output, pagesize=A4, title="Rapport BizIA")
    styles = getSampleStyleSheet()
    story = [Paragraph("Rapport d'analyse BizIA", styles["Title"]), Spacer(1, 16)]
    for line in _lines(report):
        story.append(Spacer(1, 8) if not line else Paragraph(line, styles["BodyText"]))
    document.build(story)
    return output.getvalue()


def _docx(report: dict) -> bytes:
    output = BytesIO()
    document = Document()
    document.add_heading("Rapport d'analyse BizIA", level=0)
    for line in _lines(report):
        if line in {"Insights", "Recommandations"}:
            document.add_heading(line, level=1)
        elif line:
            document.add_paragraph(line)
    document.save(output)
    return output.getvalue()


@router.post("/generate")
def generate_report(format: str = Query(default="json", pattern="^(json|pdf|docx)$")):
    analysis = get_store().get_last_analysis()
    if analysis is None:
        raise ApiError(
            400,
            "no_analysis",
            "Lancez une analyse avant d'exporter un rapport.",
        )
    report = _report_payload(analysis)
    if format == "pdf":
        return Response(
            _pdf(report),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="bizia-rapport.pdf"'},
        )
    if format == "docx":
        return Response(
            _docx(report),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="bizia-rapport.docx"'},
        )
    return {"status": "ok", "report": report}
