import feedparser

from models import DisasterEvent

GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml"


class GDACSClient:
    def fetch_events(self) -> list[DisasterEvent]:
        feed = feedparser.parse(GDACS_RSS_URL)
        events = []
        for entry in feed.entries:
            event = self._parse_entry(entry)
            if event:
                events.append(event)
        return events

    def _parse_entry(self, entry) -> DisasterEvent | None:
        try:
            severity_raw = entry.get("gdacs_severity", "Unknown")
            if isinstance(severity_raw, dict):
                severity = f"{severity_raw.get('value', '')} {severity_raw.get('unit', '')}".strip()
            else:
                severity = str(severity_raw)

            return DisasterEvent(
                event_type=entry.get("gdacs_eventtype", "Unknown"),
                event_name=entry.get("eventname", ""),
                title=entry.get("title", ""),
                country=entry.get("gdacs_country", "Unknown"),
                severity=severity,
                alert_level=entry.get("gdacs_alertlevel", "Unknown"),
                lat=float(entry.get("geo_lat", 0)),
                lon=float(entry.get("geo_long", 0)),
                date=entry.get("published", ""),
                gdacs_url=entry.get("link", ""),
            )
        except (ValueError, KeyError):
            return None
