from abc import ABC, abstractmethod
from app.models import BookOffer

class BookStoreScraper(ABC):
    name: str = "base"

    @abstractmethod
    async def search(self, query: str, browser=None) -> list[BookOffer]:
        pass

    def _is_relevant(self, title: str, author: str | None, query: str) -> bool:
        if not title:
            return False
        
        q_words = query.lower().split()
        t_lower = title.lower()
        a_lower = author.lower() if author else ""
        
        return any(word in t_lower or word in a_lower for word in q_words)
