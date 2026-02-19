from newspaper import Article as NewspaperArticle

from models import Article


class ArticleScraper:
    def scrape(self, url: str) -> Article | None:
        try:
            article = NewspaperArticle(url)
            article.download()
            article.parse()
            article.nlp()
        except Exception:
            return None

        if not article.text:
            return None

        publish_date = None
        if article.publish_date:
            publish_date = str(article.publish_date)

        return Article(
            url=url,
            title=article.title or "",
            text=article.text,
            authors=article.authors or [],
            publish_date=publish_date,
            source=article.source_url or "",
            summary=article.summary or "",
        )
