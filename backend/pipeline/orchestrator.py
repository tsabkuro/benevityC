from models import Article, DisasterEvent
from pipeline.gdacs_client import GDACSClient
from pipeline.news_searcher import NewsSearcher
from pipeline.article_scraper import ArticleScraper


class ScraperPipeline:
    def __init__(self):
        self.gdacs_client = GDACSClient()
        self.news_searcher = NewsSearcher()
        self.article_scraper = ArticleScraper()

    def run(self, event_type: str | None = None) -> list[Article]:
        events = self.gdacs_client.fetch_events()
        if event_type:
            events = [e for e in events if e.event_type.lower() == event_type.lower()]
        articles = []
        for event in events:
            query = self.news_searcher.build_query(event.event_type, event.country, event.date)
            articles.extend(self._search_and_scrape(query))
        return articles

    def run_custom_query(self, query: str) -> list[Article]:
        return self._search_and_scrape(query)

    def _search_and_scrape(self, query: str) -> list[Article]:
        results = self.news_searcher.search(query)
        articles = []
        for result in results:
            real_url = self.news_searcher.resolve_url(result.url)
            article = self.article_scraper.scrape(real_url)
            if article:
                articles.append(article)
        return articles
