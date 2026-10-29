from dataclasses import dataclass

@dataclass
class BookOffer:
    store: str
    title: str
    author: str | None
    price: float | None
    currency: str
    available: bool
    url: str
