from abc import ABC, abstractmethod
from playwright.async_api import Browser
from app.models import BookOffer

class BookStoreScraper(ABC):
    name: str

    @staticmethod
    def _is_relevant(title: str, author: str | None, query: str) -> bool:
        text_to_search = f"{title} {author or ''}".lower()
        query_words = query.lower().split()
        return all(word in text_to_search for word in query_words)

    @abstractmethod
    async def search(self, query: str, browser: Browser) -> list[BookOffer]:
        pass
