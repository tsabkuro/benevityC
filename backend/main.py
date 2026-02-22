import json
import logging
import os
import sys
import time
from datetime import timedelta
from email.utils import parsedate_to_datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline.gdacs_client import GDACSClient
from pipeline.orchestrator import ScraperPipeline
from pipeline.news_searcher import EVENT_TYPE_LABELS
from models import DisasterEvent

# Make ai_pipeline importable from this directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ai_pipeline"))
from embeddings import chunk_article, embed_chunks          # noqa: E402
from retrieval import retrieve_relevant_chunks              # noqa: E402
from generation import generate_campaign_kit               # noqa: E402


app = FastAPI()
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gdacs_client = GDACSClient()
pipeline = ScraperPipeline()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/events")
def get_events():
    events = gdacs_client.fetch_events()
    return {"events": events}


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@app.post("/api/scrape/stream")
def scrape_stream(request: DisasterEvent):
    def generate():
        if not request:
            yield _sse({"type": "error", "message": "Query is required"})
            return
        
        event_type = request.event_type
        country = request.country
        event_name = request.event_name
        date = request.date
        type_str = EVENT_TYPE_LABELS.get(event_type.upper(), event_type)
        max_articles = request.max_articles or 5
        query = [type_str]
        if event_name:
            query.append(event_name)
        elif country:
            query.append(country)
        else:
            yield _sse({"type": "error", "message": "Failed to retrieve event"})
            return
        
        relevance_keywords = query.copy() # keywords for relevance filtering
        if date:
            try:
                dt = parsedate_to_datetime(date)
                after = dt.strftime("%Y-%m-%d")
                before = (dt + timedelta(days=5)).strftime("%Y-%m-%d")
                query.append("after:" + after)
                query.append("before:" + before)
            except Exception:
                logger.warning("Could not parse event date for query window: %s", date)
                yield _sse({"type": "error", "message": "Failed parse event date"})
                return

        query = '+'.join(query) # join query to a single string with + delim

        yield _sse({"type": "status", "message": 'Searching for "' + query + '"'})

        # oversample so we still end up with max_articles even if some fail/are irrelevant
        search_limit = max_articles * 4  # tweak 3–6 depending on speed/quality tradeoff

        try:
            results = pipeline.news_searcher.search(query, search_limit)
        except Exception:
            logger.exception("Search failed for query=%s", query)
            yield _sse({"type": "error", "message": "Failed to search news"})
            return

        total = len(results)
        if total == 0:
            yield _sse({"type": "error", "message": "Did not find relevant articles"})
            return

        yield _sse({
            "type": "status",
            "message": f"Found {total} results. Scraping up to {max_articles} articles..."
        })

        sent = 0

        for i, result in enumerate(results):
            if sent >= max_articles:
                break

            n = str(i + 1)
            yield _sse({
                "type": "progress",
                "message": "[" + n + "/" + str(total) + "] Resolving " + str(result.source) + "...",
                "current": i + 1,
                "total": total,
            })

            real_url = pipeline.news_searcher.resolve_url(result.url)
            article = pipeline.article_scraper.scrape(real_url)

            if not article:
                yield _sse({
                    "type": "progress",
                    "message": "[" + n + "/" + str(total) + "] Skipped (could not parse)",
                    "current": i + 1,
                    "total": total,
                })
                continue

            # Relevance filter
            if relevance_keywords:
                haystack = (article.title + " " + article.text).lower()
                if not any((kw or "").lower() in haystack for kw in relevance_keywords):
                    yield _sse({
                        "type": "progress",
                        "message": "[" + n + "/" + str(total) + "] Skipped (not relevant)",
                        "current": i + 1,
                        "total": total,
                    })
                    continue

            sent += 1
            yield _sse({"type": "article", "article": article.model_dump()})

        yield _sse({"type": "done", "sent": sent, "requested": max_articles})

    return StreamingResponse(generate(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Campaign kit generation
# ---------------------------------------------------------------------------

class ArticleInput(BaseModel):
    url: str
    title: str
    text: str
    publish_date: str | None = None
    image_urls: list[str] = []


class GenerateRequest(BaseModel):
    articles: list[ArticleInput]
    query: str


@app.post("/api/generate")
def generate_kit(request: GenerateRequest):
    campaign_id = f"campaign_{int(time.time())}"

    all_chunks = []
    for article in request.articles:
        chunks = chunk_article(
            article_text=article.text,
            source_url=article.url,
            title=article.title,
            publish_date=article.publish_date or "",
            campaign_id=campaign_id,
        )
        all_chunks.extend(chunks)

    all_chunks = embed_chunks(all_chunks)
    retrieved = retrieve_relevant_chunks(request.query, all_chunks, top_k=5)
    source_urls = list({chunk["source_url"] for chunk, _ in retrieved})

    # Collect images only from the retrieved articles, preserving order
    seen_img: set[str] = set()
    article_image_urls: list[str] = []
    url_to_images = {a.url: a.image_urls for a in request.articles}
    for chunk, _ in retrieved:
        for img in url_to_images.get(chunk["source_url"], []):
            if img not in seen_img:
                seen_img.add(img)
                article_image_urls.append(img)

    return generate_campaign_kit(retrieved, source_urls, article_image_urls)
