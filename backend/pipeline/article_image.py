# backend/pipeline/article_image.py
from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

_IMAGE_EXT_RE = re.compile(r"\.(jpg|jpeg|png|webp|gif|bmp|tiff|avif)(\?|$)", re.I)

# crude-but-effective MVP filters
_BAD_SUBSTRINGS = (
    "doubleclick",
    "googlesyndication",
    "adservice",
    "/ads",
    "ads.",
    "ad-",
    "analytics",
    "pixel",
    "tracking",
    "beacon",
    "sprite",
    "icon",
    "logo",
    "favicon",
    "avatar",
    "gravatar",
    "promo",
    "newsletter",
)

_LAZY_ATTRS = (
    "data-src",
    "data-original",
    "data-lazy-src",
    "data-url",
    "data-img",
    "data-image",
)


def _strip_fragment(u: str) -> str:
    p = urlparse(u)
    return urlunparse(p._replace(fragment=""))


def _pick_best_from_srcset(srcset: str) -> str | None:
    # choose the largest by descriptor (e.g. 1200w / 2x)
    parts = [p.strip() for p in (srcset or "").split(",") if p.strip()]
    best_url = None
    best_score = -1

    for part in parts:
        tokens = part.split()
        if not tokens:
            continue
        url = tokens[0]
        score = 0
        if len(tokens) >= 2:
            d = tokens[1].lower()
            try:
                if d.endswith("w"):
                    score = int(d[:-1])
                elif d.endswith("x"):
                    score = int(float(d[:-1]) * 1000)
            except Exception:
                score = 0

        if score > best_score:
            best_score = score
            best_url = url

    return best_url or (parts[-1].split()[0] if parts else None)


def _is_junk_image(url: str) -> bool:
    u = (url or "").strip()
    if not u:
        return True
    lu = u.lower()
    if lu.startswith("data:"):
        return True
    if lu.endswith(".svg"):
        return True
    if any(bad in lu for bad in _BAD_SUBSTRINGS):
        return True
    return False


def _maybe_too_small(img_tag) -> bool:
    # If width/height are present and tiny, skip (icons, etc.)
    def to_int(x):
        try:
            return int(str(x).strip())
        except Exception:
            return 0

    w = to_int(img_tag.get("width"))
    h = to_int(img_tag.get("height"))
    if w and h and (w * h) < (180 * 120):  # tweak as needed
        return True
    return False


def extract_article_image_urls(html: str, page_url: str, max_images: int = 10) -> list[str]:
    """
    Extract "likely article images" from the HTML:
    - og/twitter meta images
    - <img> tags in <article> or <main> preferred
    - supports lazy-load attrs + srcset
    - filters ads/logos/icons/tracking
    """
    soup = BeautifulSoup(html or "", "html.parser")

    seen: set[str] = set()
    out: list[str] = []

    def add(raw: str | None):
        if not raw:
            return
        raw = raw.strip()
        if not raw:
            return

        absolute = urljoin(page_url, raw)
        absolute = _strip_fragment(absolute)

        if _is_junk_image(absolute):
            return

        # OPTIONAL: keep URLs without extensions too, but prefer obvious images
        # If you want to be stricter, uncomment the next lines.
        # if not _IMAGE_EXT_RE.search(absolute):
        #     return

        if absolute not in seen:
            seen.add(absolute)
            out.append(absolute)

    # 1) meta images (often the main article image)
    meta_keys = [
        ("property", "og:image"),
        ("property", "og:image:url"),
        ("name", "twitter:image"),
        ("name", "twitter:image:src"),
    ]
    for attr, key in meta_keys:
        tag = soup.find("meta", attrs={attr: key})
        if tag and tag.get("content"):
            add(tag["content"])

    # 2) prefer images inside <article> or <main>
    container = soup.find("article") or soup.find("main")
    search_root = container if container else soup

    # handle <picture><source srcset=...> + <img ...>
    for pic in search_root.find_all("picture"):
        source = pic.find("source")
        if source and source.get("srcset"):
            add(_pick_best_from_srcset(source["srcset"]))
        img = pic.find("img")
        if img:
            if _maybe_too_small(img):
                continue
            add(img.get("src"))
            for a in _LAZY_ATTRS:
                add(img.get(a))
            if img.get("srcset"):
                add(_pick_best_from_srcset(img["srcset"]))

    # plain <img>
    for img in search_root.find_all("img"):
        if _maybe_too_small(img):
            continue

        # prefer src/srcset, then lazy attrs
        if img.get("srcset"):
            add(_pick_best_from_srcset(img["srcset"]))
        add(img.get("src"))

        for a in _LAZY_ATTRS:
            add(img.get(a))

        if len(out) >= max_images:
            break

    return out[:max_images]