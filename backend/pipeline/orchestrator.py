from models import Article, DisasterEvent
from pipeline.gdacs_client import GDACSClient
from pipeline.news_searcher import NewsSearcher
from pipeline.article_scraper import ArticleScraper


class ScraperPipeline:
    def __init__(self):
        self.gdacs_client = GDACSClient()
        self.news_searcher = NewsSearcher()
        self.article_scraper = ArticleScraper()
