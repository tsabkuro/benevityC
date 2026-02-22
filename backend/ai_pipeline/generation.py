import json
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from config import GCP_PROJECT, GCP_LOCATION, GENERATION_MODEL, CAMPAIGN_KIT_SCHEMA

vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)

_GENERATION_CONFIG = GenerationConfig(
    response_mime_type="application/json",
    response_schema=CAMPAIGN_KIT_SCHEMA,
    temperature=0.2,
    max_output_tokens=8192,
)


def _build_prompt(context: str, sources: str, image_urls: list[str]) -> str:
    images_section = ""
    if image_urls:
        image_list = "\n".join(image_urls)
        images_section = f"""
AVAILABLE ARTICLE IMAGES:
{image_list}

"""

    image_instruction = (
        "- image_url: Copy EXACTLY ONE URL from the AVAILABLE ARTICLE IMAGES list above. "
        "Choose the image that best represents the disaster visually (prefer wide/editorial "
        "news photos over maps or infographics). Do NOT generate, modify, or invent any URL."
        if image_urls
        else "- image_url: Set to empty string \"\" — no images were provided."
    )

    return f"""You are a campaign content writer for Benevity, a humanitarian aid platform.
Using ONLY the following verified source material, generate a campaign kit.

SOURCE MATERIAL:
{context}

SOURCES:
{sources}
{images_section}
Instructions:
- title: A compelling, empathetic campaign title.
- location: The affected geographic area.
- event_type: One of: earthquake, flood, hurricane, wildfire, tsunami, other.
- summary: A 2-3 paragraph empathetic, professional summary as a single string.
- key_claims: Array of objects each with "claim" (a key factual statement) and "source_url" \
(must be one of the URLs listed under SOURCES above — do not invent URLs).
- confidence_score: Float between 0.0 and 1.0 reflecting how well the claims are supported.
- {image_instruction}

Do NOT include any information not present in the source material."""


def _validate_urls(kit: dict, allowed_urls: list) -> tuple[bool, list]:
    """Return (is_valid, bad_urls). bad_urls is empty when valid."""
    allowed = set(allowed_urls)
    bad = [
        claim["source_url"]
        for claim in kit.get("key_claims", [])
        if claim.get("source_url") not in allowed
    ]
    return (len(bad) == 0), bad


def _sanitize_image_url(kit: dict, allowed_image_urls: list) -> dict:
    """If image_url is not in the allowed set, clear it rather than retrying."""
    url = kit.get("image_url", "")
    if url and url not in set(allowed_image_urls):
        kit["image_url"] = ""
    return kit


def generate_campaign_kit(
    retrieved_chunks: list,
    source_urls: list,
    article_image_urls: list[str] | None = None,
) -> dict:
    """Generate a campaign kit from retrieved chunks using Gemini structured output."""
    model = GenerativeModel(GENERATION_MODEL)
    image_urls = article_image_urls or []

    context = "\n\n---\n\n".join([chunk["text"] for chunk, _ in retrieved_chunks])
    sources = "\n".join(source_urls)
    prompt = _build_prompt(context, sources, image_urls)

    # First attempt
    response = model.generate_content(prompt, generation_config=_GENERATION_CONFIG)
    try:
        kit = json.loads(response.text)
    except (json.JSONDecodeError, ValueError) as e:
        return {"error": f"Model returned malformed JSON: {e}. Try again."}

    # Sanitize image URL (clear if hallucinated, don't retry for this)
    kit = _sanitize_image_url(kit, image_urls)

    valid, bad_urls = _validate_urls(kit, source_urls)
    if valid:
        return kit

    # Retry once with a correction instruction for bad source URLs
    correction_prompt = (
        f"{prompt}\n\n"
        f"CORRECTION: Your previous response contained source_url values that are not in the "
        f"SOURCES list: {bad_urls}. Every source_url in key_claims MUST be one of:\n{sources}\n"
        f"Regenerate the campaign kit using only those exact URLs."
    )
    retry_response = model.generate_content(
        correction_prompt, generation_config=_GENERATION_CONFIG
    )
    try:
        retry_kit = json.loads(retry_response.text)
    except (json.JSONDecodeError, ValueError) as e:
        return {"error": f"Model returned malformed JSON on retry: {e}. Try again."}

    retry_kit = _sanitize_image_url(retry_kit, image_urls)

    valid, bad_urls = _validate_urls(retry_kit, source_urls)
    if valid:
        return retry_kit

    return {
        "error": (
            f"Generated key_claims contain URLs not present in the provided sources: {bad_urls}"
        )
    }
