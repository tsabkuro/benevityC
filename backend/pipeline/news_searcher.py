from datetime import timedelta
from email.utils import parsedate_to_datetime

import feedparser
import requests
from googlenewsdecoder import new_decoderv1

from models import NewsResult
import logging

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en&gl=US&ceid=US:en"

EVENT_TYPE_LABELS = {
    "EQ": "earthquake",
    "TC": "tropical cyclone",
    "FL": "flood",
    "WF": "wildfire",
    "VO": "volcano",
    "DR": "drought",
    "TS": "tsunami",
}

class NewsSearcher:
    

    def build_query(self, event_type: str, country: str, date: str | None = None) -> str:
        label = EVENT_TYPE_LABELS.get(event_type.upper(), event_type)
        q = label + " " + country
        if date:
            try:
                dt = parsedate_to_datetime(date)
            except Exception:
                return q
            after = (dt - timedelta(days=2)).strftime("%Y-%m-%d")
            before = (dt + timedelta(days=2)).strftime("%Y-%m-%d")
            q += " after:" + after + " before:" + before
        return q

    def search(self, query: str) -> list[NewsResult]:
        url = GOOGLE_NEWS_RSS.format(query=query)
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        feed = feedparser.parse(response.content)
        results = []
        entries = feed.get("entries", [])
        for entry in entries:
            result = self._parse_entry(entry)
            if result:
                results.append(result)
        return results

    def _parse_entry(self, entry: dict) -> NewsResult | None:
        try:
            source = entry.get("source", None)
            source = source.get("title", None) if isinstance(source, dict) else str(source) # maybe we should get href instead
            title = entry.get("title", None)
            url = entry.get("link", None)
            pub_date = entry.get("published", None)
            if not (source or title or url or pub_date):
                return None
            return NewsResult(
                title=title, 
                url=url,
                source=source,
                pub_date=pub_date)
        except (ValueError, KeyError):
            return None

    def resolve_url(self, google_url: str) -> str:
        try:
            result = new_decoderv1(google_url)
            if result.get("status") and result.get("decoded_url"):
                return result["decoded_url"]
        except Exception:
            pass
        return google_url
