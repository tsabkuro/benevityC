from newspaper import Article as NewspaperArticle
import logging

from models import Article
from pipeline.article_image import extract_article_image_urls

logger = logging.getLogger(__name__)

class ArticleScraper:
    def scrape(self, url: str) -> Article | None:
        try:
            article = NewspaperArticle(url)
            article.download()

            # Grab HTML right after download (before parse/nlp)
            html = getattr(article, "html", "") or ""

            article.parse()
            article.nlp()
        except Exception:
            logger.exception("Failed scraping/NLP for %s", url)
            return None

        if not article.text:
            return None

        publish_date = str(article.publish_date) if article.publish_date else None

        image_urls = extract_article_image_urls(html, url, max_images=10)

        return Article(
            url=url,
            title=article.title or "",
            text=article.text,
            authors=article.authors or [],
            publish_date=publish_date,
            source=article.source_url or "",
            summary=article.summary or "",
            image_urls=image_urls,
        )