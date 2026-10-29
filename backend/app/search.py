import asyncio
import logging
import re
import unicodedata
from playwright.async_api import Browser

from app.models import BookOffer
from app.scrapers.carturesti import CarturestiScraper
from app.scrapers.elefant import ElefantScraper

logger = logging.getLogger(__name__)

SCRAPERS = [
    CarturestiScraper(),
    ElefantScraper(),
]

def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9\s]", "", text.lower())
    return re.sub(r"\s+", " ", text).strip()

def _sort_key(offer: BookOffer, query: str):
    exact_match = _normalize(offer.title) == _normalize(query)
    return (
        not exact_match,
        offer.price is None,
        offer.price,
    )

def _dedupe(offers: list[BookOffer]) -> list[BookOffer]:
    seen: dict[tuple[str, str], BookOffer] = {}
    for offer in offers:
        key = (offer.store, offer.url)
        seen[key] = offer
    return list(seen.values())

async def search_all_stores(query: str, browser: Browser) -> list[BookOffer]:
    results_per_store = await asyncio.gather(
        *[scraper.search(query, browser) for scraper in SCRAPERS],
        return_exceptions=True,
    )

    all_offers: list[BookOffer] = []
    for scraper, store_result in zip(SCRAPERS, results_per_store):
        if isinstance(store_result, Exception):
            logger.warning(f"Scraper {scraper.name} failed: {store_result}")
            continue
        all_offers.extend(store_result)

    all_offers = _dedupe(all_offers)
    all_offers.sort(key=lambda o: _sort_key(o, query))
    return all_offers
