from urllib.parse import quote
import httpx
from bs4 import BeautifulSoup
from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

class CarturestiScraper(BookStoreScraper):
    name = "carturesti"

    async def search(self, query: str, browser=None) -> list[BookOffer]:
        offers: list[BookOffer] = []
        url = f"https://carturesti.ro/product/search/{quote(query)}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    return offers
                
                soup = BeautifulSoup(response.text, 'html.parser')
                cards = soup.select('prod-list-box, prod-grid-box, .md-card')

                for card in cards:
                    title_el = card.select_one('h5.md-title, .title')
                    author_el = card.select_one('div.subtitlu-produs a, .author')
                    price_el = card.select_one('span.suma')
                    link_el = card.select_one('a.select-item-event, a')

                    title = title_el.get_text(strip=True) if title_el else None
                    if not title:
                        continue

                    author = author_el.get_text(strip=True) if author_el else None
                    
                    price = None
                    if price_el:
                        try:
                            price = float(price_el.get('content', 0) or price_el.get_text(strip=True).replace(',', '.'))
                        except:
                            pass

                    url_prod = link_el.get('href') if link_el else None
                    if url_prod and not url_prod.startswith('http'):
                        url_prod = f"https://carturesti.ro{url_prod}"

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
            print(f"[Cărturești Error]: {e}")

        offers.sort(key=lambda o: (o.price is None, o.price))
        return offers
