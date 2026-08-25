"""
Modular prompt engineering for multi-platform content generation.
Applies audience, tone, and detail constraints to generate targeted deliverables.
"""

from typing import Literal
from pydantic import BaseModel


class IngestionParameters(BaseModel):
    """Input parameters controlling content generation."""

    target_audience: Literal["General Public", "Executives", "Technical Experts", "Media"]
    tone: Literal["Formal", "Urgent", "Conversational", "Reassuring"]
    language: Literal["English", "Hindi"]
    detail_level: Literal["Brief", "Standard", "Comprehensive"]
    selected_outputs: list[str]


def get_audience_constraint(audience: str) -> str:
    """Return audience-specific writing guidelines."""
    constraints = {
        "Executives": (
            "Use direct, strategic language. Focus on high-level business impact, ROI, and actionable metrics. "
            "Emphasize strategic advantages, risk mitigation, and competitive positioning. "
            "Assume deep industry knowledge but limited time. Include specific numbers and quantified outcomes."
        ),
        "Technical Experts": (
            "Use precise domain terminology and technical specifications. Assume advanced knowledge. "
            "Include implementation details, architectural considerations, and technical trade-offs. "
            "Reference standards, protocols, or technical frameworks. Provide code examples or technical references where relevant."
        ),
        "General Public": (
            "Use simple, accessible language. Avoid jargon and technical terminology. "
            "Use clear analogies and relatable examples. Explain concepts from first principles. "
            "Focus on practical implications and real-world applications. Make content approachable for non-specialists."
        ),
        "Media": (
            "Use press-release style writing. Start with a compelling headline that captures the most important information. "
            "Use inverted pyramid structure (most important information first). "
            "Include punchy, quotable statements. Provide context and background efficiently. "
            "Make content suitable for publication in news outlets."
        ),
    }
    return constraints.get(audience, constraints["General Public"])


def get_tone_constraint(tone: str) -> str:
    """Return tone-specific vocabulary and phrasing guidelines."""
    constraints = {
        "Formal": (
            "Use sophisticated vocabulary and professional terminology. "
            "Employ complex sentence structures. Avoid contractions. Use passive voice where appropriate. "
            "Maintain a neutral, authoritative tone. Include formal phrases and structured language."
        ),
        "Urgent": (
            "Use action-oriented language with strong verbs. Create sense of immediacy. "
            "Use short, punchy sentences. Include calls-to-action. Employ power words. "
            "Convey importance through word choice and pacing. Use exclamation marks sparingly but effectively."
        ),
        "Conversational": (
            "Use colloquial language and contractions. Write as if speaking to a friend. "
            "Use short sentences and paragraphs. Include rhetorical questions. "
            "Be personable and relatable. Use active voice. Share insights naturally."
        ),
        "Reassuring": (
            "Use calm, confident language. Emphasize stability and reliability. "
            "Include supporting evidence and backing. Use phrases that build confidence. "
            "Acknowledge concerns while providing solutions. Maintain optimistic but realistic tone."
        ),
    }
    return constraints.get(tone, constraints["Formal"])


def get_detail_constraints(detail_level: str) -> tuple[int, str]:
    """Return word limit and detail guidelines for the specified level."""
    constraints = {
        "Brief": (
            150,
            "Provide only essential information. Omit background details. Use bulleted format where possible. "
            "Focus on key takeaways. Maximum 150 words total.",
        ),
        "Standard": (
            300,
            "Balance comprehensiveness with conciseness. Include context and supporting details. "
            "Organize with clear sections. Maximum 300 words total.",
        ),
        "Comprehensive": (
            600,
            "Provide thorough coverage with extensive context. Include background, analysis, and implications. "
            "Use detailed sections with subsections. Maximum 600 words total.",
        ),
    }
    return constraints.get(detail_level, constraints["Standard"])


def get_language_instruction(language: str) -> str:
    """Return language-specific instruction."""
    if language == "Hindi":
        return "You MUST write the entire response in Hindi. Use proper Hindi terminology and grammar. Do not mix English."
    return "You MUST write the entire response in English. Use proper English grammar and terminology."


def construct_system_prompt(output_format: str, params: IngestionParameters) -> str:
    """
    Construct a tailored system prompt applying audience, tone, and detail constraints.

    Args:
        output_format: The target deliverable format (e.g., "Executive Summary", "LinkedIn Post")
        params: Ingestion parameters controlling the generation

    Returns:
        Complete system prompt for LLM generation
    """
    audience_constraint = get_audience_constraint(params.target_audience)
    tone_constraint = get_tone_constraint(params.tone)
    word_limit, detail_constraint = get_detail_constraints(params.detail_level)
    language_instruction = get_language_instruction(params.language)

    format_specific_instructions = {
        "Executive Summary": (
            "You are generating an Executive Summary for high-level stakeholders. "
            "Structure the output with:\n"
            "1. Key Findings (2-3 bullet points with the most important takeaways)\n"
            "2. Risk Factors (if applicable, list top 2-3 risks)\n"
            "3. Recommended Next Steps (3-4 actionable recommendations)\n"
            "Format as clean Markdown with proper heading levels (##, ###). "
            "Each section must be concise but informative."
        ),
        "LinkedIn Post": (
            "You are crafting a LinkedIn post designed for high engagement and professional reach. "
            "Structure the output with:\n"
            "1. Hook (compelling opening line that stops the scroll)\n"
            "2. Body (3-5 formatted bullet points with key insights)\n"
            "3. Call-to-Action (1 engaging closing line)\n"
            "4. Hashtags (3-5 relevant hashtags)\n"
            "Use Markdown formatting. Keep the tone professional yet personable. "
            "Optimize for LinkedIn's algorithm with proper line breaks and formatting."
        ),
        "Twitter/X Post": (
            "You are crafting a Twitter/X thread (3-5 sequential tweets) on the topic. "
            "Each tweet must:\n"
            "- Be 280 characters or less\n"
            "- Stand alone as a complete thought but connect to the thread\n"
            "- Use simple, punchy language\n"
            "- Include 1 relevant emoji per tweet (optional)\n"
            "Start tweet 1 with 'Tweet 1:' prefix. Number each tweet sequentially. "
            "Build narrative momentum through the thread. Make it tweet-worthy."
        ),
        "Advisory": (
            "You are writing an official advisory/alert document. "
            "Structure the output with:\n"
            "1. Header (format: [ALERT] Title | Risk Level: CRITICAL/HIGH/MEDIUM/LOW | Date)\n"
            "2. Summary (one-line executive summary)\n"
            "3. Impact Analysis (2-3 paragraphs on potential impacts)\n"
            "4. Remediation Actions (numbered list of 3-5 specific actions)\n"
            "5. References (if applicable)\n"
            "Use formal advisory language. Be precise and technical where applicable."
        ),
        "Video Package": (
            "You are creating a video script package. Structure output as a table/grid with three columns:\n"
            "[Visual Cue] | [Audio / Voiceover] | [On-Screen Graphic]\n"
            "Each row represents a scene/segment (3-5 segments total). "
            "Visual Cue: Describe what's shown on screen.\n"
            "Audio/Voiceover: Write the exact script to be spoken.\n"
            "On-Screen Graphic: Describe text, graphics, or animations that appear.\n"
            "Format clearly with proper column separation for easy video production use."
        ),
        "Infographic": (
            "You are designing an infographic structure. "
            "Provide a detailed layout plan with:\n"
            "1. Title/Headline\n"
            "2. Key Statistics (3-5 important numbers/facts)\n"
            "3. Main Content Sections (visual groupings)\n"
            "4. Icons/Graphics Suggestions (what visual elements to use)\n"
            "5. Call-to-Action (closing message)\n"
            "Format as a structured outline for a designer to implement."
        ),
        "Presentation": (
            "You are structuring a presentation (PowerPoint/Google Slides format). "
            "Provide slide-by-slide breakdown:\n"
            "Slide 1: Title\n"
            "Slide 2-3: Key Points (bullet format)\n"
            "Slide 4-5: Supporting Evidence/Data\n"
            "Slide 6: Implications/Next Steps\n"
            "Slide 7: Call-to-Action\n"
            "Include speaker notes suggestions. Format for easy copy-paste into slide software."
        ),
    }

    format_instruction = format_specific_instructions.get(
        output_format,
        f"You are generating a {output_format} document."
    )

    system_prompt = f"""You are a professional content generation specialist.

OUTPUT FORMAT: {output_format}
{format_instruction}

AUDIENCE: {params.target_audience}
{audience_constraint}

TONE: {params.tone}
{tone_constraint}

DETAIL LEVEL: {params.detail_level}
{detail_constraint}
ABSOLUTE WORD LIMIT: {word_limit} words maximum. Do not exceed this limit.

{language_instruction}

CRITICAL CONSTRAINTS:
1. Accuracy: Stay true to the source material. Do not invent facts.
2. Clarity: Use clear, unambiguous language appropriate for the target audience.
3. Engagement: Write in a way that captures and maintains attention.
4. Structure: Follow the format specifications exactly.
5. Professionalism: Maintain high editorial standards.

Generate the {output_format} now:"""

    return system_prompt


def construct_user_prompt(extracted_text: str, output_format: str) -> str:
    """
    Construct the user prompt (source content + generation request).

    Args:
        extracted_text: Source content from Phase 1 ingestion
        output_format: Target deliverable format

    Returns:
        User prompt for LLM generation
    """
    return f"""Based on the following source material, generate a {output_format}:

SOURCE MATERIAL:
────────────────────────────────────────────
{extracted_text}
────────────────────────────────────────────

Generate the {output_format} now. Ensure it matches all the constraints specified in the system prompt."""
