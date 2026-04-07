"""
PDF report generation service.
Generates a detailed analysis report using reportlab.
"""
import io
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


def generate_pdf_report(analysis: dict) -> bytes:
    """
    Generate a PDF report from document analysis results.

    Args:
        analysis: The complete analysis result dict from ai_detector

    Returns:
        PDF file as bytes
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, KeepTogether
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    except ImportError:
        raise ImportError("reportlab not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Colors ──
    RED = colors.HexColor('#EF4444')
    YELLOW = colors.HexColor('#F59E0B')
    GREEN = colors.HexColor('#10B981')
    DARK = colors.HexColor('#1E293B')
    ACCENT = colors.HexColor('#6366F1')
    LIGHT_GRAY = colors.HexColor('#F1F5F9')

    # ── Custom styles ──
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=DARK,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=20,
        fontName='Helvetica'
    )
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=ACCENT,
        spaceBefore=16,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        borderPad=4
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK,
        spaceAfter=6,
        leading=14,
        fontName='Helvetica'
    )
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#64748B'),
        fontName='Helvetica'
    )

    # ════════════════════════════════════════
    # HEADER
    # ════════════════════════════════════════
    story.append(Paragraph("AI Content Detection Report", title_style))
    story.append(Paragraph(
        f"Document: <b>{analysis.get('filename', 'Unknown')}</b> &nbsp;|&nbsp; "
        f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=16))

    # ════════════════════════════════════════
    # SUMMARY SCORES
    # ════════════════════════════════════════
    story.append(Paragraph("Executive Summary", section_header_style))

    ai_prob = analysis.get('ai_probability', 0)
    human_score = analysis.get('humanization_score', 100)

    # Color-code the AI probability
    if ai_prob >= 65:
        prob_color = '#EF4444'
        verdict = 'HIGH AI Content Detected'
    elif ai_prob >= 35:
        prob_color = '#F59E0B'
        verdict = 'MODERATE AI Patterns Detected'
    else:
        prob_color = '#10B981'
        verdict = 'LOW AI Content — Likely Human'

    score_data = [
        ['Metric', 'Score', 'Interpretation'],
        ['AI Probability', f"{ai_prob:.1f}%", verdict],
        ['Humanization Score', f"{human_score:.1f}%",
         'High' if human_score >= 65 else ('Moderate' if human_score >= 35 else 'Low')],
        ['Burstiness (Sentence Variation)', f"{analysis.get('burstiness_score', 0):.3f}",
         'Natural' if analysis.get('burstiness_score', 0) > 0 else 'Uniform (AI-like)'],
        ['Lexical Diversity (TTR)', f"{analysis.get('lexical_diversity', 0):.3f}",
         'Rich' if analysis.get('lexical_diversity', 0) > 0.6 else 'Repetitive'],
        ['Avg. Sentence Length', f"{analysis.get('avg_sentence_length', 0):.1f} words",
         'Normal' if 10 <= analysis.get('avg_sentence_length', 0) <= 25 else 'Unusual'],
        ['Readability (Flesch)', f"{analysis.get('readability_score', 0):.1f}",
         'Easy' if analysis.get('readability_score', 0) >= 60 else 'Complex'],
    ]

    score_table = Table(score_data, colWidths=[6*cm, 3.5*cm, 7*cm])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BACKGROUND', (0, 2), (-1, 2), LIGHT_GRAY),
        ('BACKGROUND', (0, 4), (-1, 4), LIGHT_GRAY),
        ('BACKGROUND', (0, 6), (-1, 6), LIGHT_GRAY),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 12))

    # ════════════════════════════════════════
    # SENTENCE BREAKDOWN
    # ════════════════════════════════════════
    total = analysis.get('total_sentences', 1)
    red = analysis.get('red_count', 0)
    yellow = analysis.get('yellow_count', 0)
    green = analysis.get('green_count', 0)

    story.append(Paragraph("Sentence-Level Breakdown", section_header_style))

    breakdown_data = [
        ['Category', 'Count', '% of Document'],
        [Paragraph('<font color="#EF4444"><b>Red (High AI Risk)</b></font>', body_style),
         str(red), f"{red/total*100:.1f}%"],
        [Paragraph('<font color="#F59E0B"><b>Yellow (Suspicious)</b></font>', body_style),
         str(yellow), f"{yellow/total*100:.1f}%"],
        [Paragraph('<font color="#10B981"><b>Green (Human-like)</b></font>', body_style),
         str(green), f"{green/total*100:.1f}%"],
        ['Total Sentences', str(total), '100%'],
    ]
    bd_table = Table(breakdown_data, colWidths=[8*cm, 3*cm, 5.5*cm])
    bd_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
    ]))
    story.append(bd_table)
    story.append(Spacer(1, 12))

    # ════════════════════════════════════════
    # TOP AI WORDS
    # ════════════════════════════════════════
    top_words = analysis.get('top_ai_words', [])
    if top_words:
        story.append(Paragraph("Most Frequent AI Words Detected", section_header_style))
        word_rows = [['Word', 'Occurrences']]
        for item in top_words[:8]:
            word_rows.append([item['word'], str(item['count'])])
        w_table = Table(word_rows, colWidths=[10*cm, 6.5*cm])
        w_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(w_table)
        story.append(Spacer(1, 12))

    # ════════════════════════════════════════
    # SECTION ANALYSIS
    # ════════════════════════════════════════
    sections = analysis.get('sections', [])
    if sections:
        story.append(Paragraph("Section-wise Analysis", section_header_style))
        sec_rows = [['Section', 'AI Score', 'Humanization', 'Sentences', 'Flagged']]
        for sec in sections:
            ai_s = sec.get('ai_score', 0)
            if ai_s >= 65:
                score_text = f'<font color="#EF4444"><b>{ai_s:.1f}%</b></font>'
            elif ai_s >= 35:
                score_text = f'<font color="#F59E0B"><b>{ai_s:.1f}%</b></font>'
            else:
                score_text = f'<font color="#10B981"><b>{ai_s:.1f}%</b></font>'
            sec_rows.append([
                sec.get('name', ''),
                Paragraph(score_text, small_style),
                f"{sec.get('humanization_score', 0):.1f}%",
                str(sec.get('sentence_count', 0)),
                str(sec.get('flagged_count', 0)),
            ])
        s_table = Table(sec_rows, colWidths=[5*cm, 3*cm, 3*cm, 3*cm, 2.5*cm])
        s_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), DARK),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (0, -1), 8),
        ]))
        story.append(s_table)
        story.append(Spacer(1, 12))

    # ════════════════════════════════════════
    # FLAGGED SENTENCES SAMPLE
    # ════════════════════════════════════════
    sentences = analysis.get('sentences', [])
    red_sentences = [s for s in sentences if s.get('risk_level') == 'red'][:5]

    if red_sentences:
        story.append(Paragraph("Highest-Risk Sentences (Sample)", section_header_style))
        for i, sent in enumerate(red_sentences, 1):
            score = sent.get('score', 0)
            text = sent.get('text', '')[:200] + ('...' if len(sent.get('text', '')) > 200 else '')
            reasons = sent.get('reasons', [])

            sent_para = Paragraph(
                f'<b>{i}.</b> <font color="#EF4444">[{score:.0f}%]</font> {text}',
                body_style
            )
            story.append(sent_para)
            if reasons:
                for reason in reasons[:2]:
                    story.append(Paragraph(
                        f'&nbsp;&nbsp;&nbsp;• {reason}',
                        small_style
                    ))
            story.append(Spacer(1, 4))

    # ════════════════════════════════════════
    # RECOMMENDATIONS
    # ════════════════════════════════════════
    story.append(Paragraph("Recommendations", section_header_style))

    recommendations = [
        "Replace overused AI words (delve, pivotal, multifaceted, leverage, underscore) with simpler alternatives.",
        "Vary sentence length deliberately — mix short punchy sentences with longer ones.",
        "Add specific data points, numbers, and concrete examples instead of vague claims.",
        "Use first-person voice (I, we) where appropriate rather than passive constructions.",
        "Remove filler transitions (furthermore, moreover, it is important to note) or use them sparingly.",
        "Replace 'a myriad of' / 'a plethora of' with specific quantities or simply 'many'.",
        "Avoid starting consecutive sentences with the same transition word.",
        "Include domain-specific language and informal hedges that reflect genuine expertise.",
    ]

    for rec in recommendations:
        story.append(Paragraph(f"• {rec}", body_style))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1')))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"Report generated by AI Detector v3.0 | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | "
        f"Processing time: {analysis.get('processing_time_ms', 0):.0f}ms",
        small_style
    ))

    doc.build(story)
    return buffer.getvalue()
