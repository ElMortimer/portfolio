from urllib.parse import quote
import httpx
from bs4 import BeautifulSoup
from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

class ElefantScraper(BookStoreScraper):
    name = "elefant"

    async def search(self, query: str, browser=None) -> list[BookOffer]:
        offers: list[BookOffer] = []
        url = f"https://www.elefant.ro/search?SearchTerm={quote(query)}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    return offers
                
                soup = BeautifulSoup(response.text, 'html.parser')
                cards = soup.select('div.product-tile')

                for card in cards:
                    title_el = card.select_one('a.product-title')
                    author_el = card.select_one('a.product-manufacturer')
                    price_el = card.select_one('.current-price')

                    title = title_el.get_text(strip=True) if title_el else None
                    if not title or "audiobook" in title.lower():
                        continue

                    author = author_el.get_text(strip=True) if author_el else None
                    
                    price = None
                    if price_el:
                        try:
                            raw = price_el.get_text(strip=True).replace('lei', '').replace('.', '').replace(',', '.')
                            price = float(''.join(c for c in raw if c.isdigit() or c == '.'))
                        except:
                            pass

                    url_prod = title_el.get('href') if title_el else None

                    if not self._is_relevant(title, author, query):
                        continue

                    offers.append(BookOffer(
                        store=self.name,
                        title=title,
                        author=author,
                        price=price,
                        currency="RON",
                        available=True,
                        url=url_prod,
                    ))
        except Exception as e:
            print(f"[Elefant Error]: {e}")

        offers.sort(key=lambda o: (o.price is None, o.price))
        return offers
