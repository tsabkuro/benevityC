import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline.gdacs_client import GDACSClient
from pipeline.orchestrator import ScraperPipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gdacs_client = GDACSClient()
pipeline = ScraperPipeline()


class ScrapeRequest(BaseModel):
    query: str | None = None
    event_type: str | None = None
    event_date: str | None = None
    country: str | None = None


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/events")
def get_events():
    events = gdacs_client.fetch_events()
    return {"events": events}


@app.post("/api/scrape")
def scrape(request: ScrapeRequest):
    if request.query:
        articles = pipeline.run_custom_query(request.query)
    elif request.event_type:
        articles = pipeline.run(event_type=request.event_type)
    else:
        articles = pipeline.run()
    return {"articles": articles, "count": len(articles)}


def _sse(data: dict) -> str:
    return "data: " + json.dumps(data) + "\n\n"


@app.post("/api/scrape/stream")
def scrape_stream(request: ScrapeRequest):
    def generate():
        base_query = request.query or ""
        if not base_query:
            yield _sse({"type": "error", "message": "Query is required"})
            return

        if request.event_date:
            from pipeline.news_searcher import NewsSearcher
            ns = NewsSearcher()
            # Parse event_type and country from the query (format: "label country")
            # but we just append date filters directly
            from datetime import timedelta
            from email.utils import parsedate_to_datetime
            try:
                dt = parsedate_to_datetime(request.event_date)
                after = (dt - timedelta(days=2)).strftime("%Y-%m-%d")
                before = (dt + timedelta(days=2)).strftime("%Y-%m-%d")
                query = base_query + " after:" + after + " before:" + before
            except Exception:
                query = base_query
        else:
            query = base_query

        # Build keywords for relevance filtering from country name
        relevance_keywords = []
        if request.country:
            # Split country into words, keep meaningful ones (3+ chars)
            for word in request.country.lower().split():
                if len(word) >= 3 and word not in ("the", "and", "region"):
                    relevance_keywords.append(word)

        yield _sse({"type": "status", "message": 'Searching for "' + query + '"...'})

        try:
            results = pipeline.news_searcher.search(query)
        except Exception:
            yield _sse({"type": "error", "message": "Failed to search news"})
            return

        total = len(results)
        msg = "Found " + str(total) + " results. Scraping articles..."
        yield _sse({"type": "status", "message": msg})

        for i, result in enumerate(results):
            n = str(i + 1)
            yield _sse({
                "type": "progress",
                "message": "[" + n + "/" + str(total) + "] Resolving " + result.source + "...",
                "current": i + 1,
                "total": total,
            })

            real_url = pipeline.news_searcher.resolve_url(result.url)
            article = pipeline.article_scraper.scrape(real_url)

            if article:
                # Check relevance: does the article mention the country/location?
                if relevance_keywords:
                    haystack = (article.title + " " + article.text).lower()
                    if not any(kw in haystack for kw in relevance_keywords):
                        yield _sse({
                            "type": "progress",
                            "message": "[" + n + "/" + str(total) + "] Skipped (not relevant to " + request.country + ")",
                            "current": i + 1,
                            "total": total,
                        })
                        continue
                yield _sse({"type": "article", "article": article.model_dump()})
            else:
                yield _sse({
                    "type": "progress",
                    "message": "[" + n + "/" + str(total) + "] Skipped (could not parse)",
                    "current": i + 1,
                    "total": total,
                })

        yield _sse({"type": "done"})

    return StreamingResponse(generate(), media_type="text/event-stream")
