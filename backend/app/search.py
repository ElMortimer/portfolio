from app.scrapers.carturesti import CarturestiScraper
from app.scrapers.elefant import ElefantScraper
from app.models import BookOffer

SCRAPERS = [
    CarturestiScraper(),
    ElefantScraper(),
]

async def search_all_stores(query: str, browser=None) -> list[BookOffer]:
    all_offers: list[BookOffer] = []
    
    for scraper in SCRAPERS:
        try:
            offers = await scraper.search(query, browser=None)
            all_offers.extend(offers)
        except Exception as e:
            print(f"Eroare la scraperul {scraper.name}: {e}")
            
    all_offers.sort(key=lambda o: (o.price is None, o.price))
    
    return all_offers
