from pydantic import BaseModel, Field


class DisasterEvent(BaseModel):
    event_type: str
    title: str
    event_name: str
    country: str
    severity: str
    alert_level: str
    lat: float
    lon: float
    date: str
    gdacs_url: str
    max_articles: int = Field(default=5, ge=1, le=50)


class NewsResult(BaseModel):
    title: str
    url: str
    source: str
    pub_date: str


class Article(BaseModel):
    url: str
    title: str
    text: str
    authors: list[str]
    publish_date: str | None
    source: str
    summary: str
