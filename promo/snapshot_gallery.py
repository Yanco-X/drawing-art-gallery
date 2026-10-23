"""
Saves the gallery exactly as a visitor sees it, for recording the promo video.

Run it with the backend up (docker compose + flask on :5000):

    python promo/snapshot_gallery.py

It asks the API as an anonymous visitor, so nothing owner-only is saved.
Output goes to promo/snapshot/ (git-ignored).
"""

import json
import math
import os
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "snapshot")


def get_json(path):
    with urllib.request.urlopen(API + path, timeout=30) as response:
        return json.load(response)


def absolute(url):
    return url if url.startswith("http") else API + url


def local_path_for(url):
    parsed = urllib.parse.urlparse(absolute(url))
    return os.path.join(OUT, "media", parsed.netloc.replace(":", "_"), parsed.path.lstrip("/"))


def image_urls_in(node, found):
    if isinstance(node, dict):
        for key, value in node.items():
            if key.endswith("Url") and isinstance(value, str) and value:
                found.add(value)
            elif key == "tileSource" and value:
                found.update(tile_urls(value))
            else:
                image_urls_in(value, found)
    elif isinstance(node, list):
        for item in node:
            image_urls_in(item, found)


def tile_urls(source):
    urls = []
    for level in range(source["maxLevel"] + 1):
        scale = 2 ** (source["maxLevel"] - level)
        columns = math.ceil(math.ceil(source["width"] / scale) / source["tileSize"])
        rows = math.ceil(math.ceil(source["height"] / scale) / source["tileSize"])
        for x in range(columns):
            for y in range(rows):
                urls.append(f"{source['base']}/{level}/{x}_{y}.webp")
    return urls


def download(url):
    target = local_path_for(url)
    if os.path.exists(target):
        return True
    os.makedirs(os.path.dirname(target), exist_ok=True)
    try:
        with urllib.request.urlopen(absolute(url), timeout=60) as response:
            data = response.read()
    except Exception as error:
        print(f"  skipped {url}: {error}")
        return False
    with open(target, "wb") as handle:
        handle.write(data)
    return True


def main():
    routes = {}
    routes["/api/session/me"] = get_json("/api/session/me")
    routes["/api/pieces"] = get_json("/api/pieces")
    routes["/api/pieces?sketchbook=true"] = get_json("/api/pieces?sketchbook=true")
    routes["/api/collections"] = get_json("/api/collections")
    routes["/api/about"] = get_json("/api/about")
    routes["/api/socials"] = get_json("/api/socials")

    for collection in routes["/api/collections"]:
        path = f"/api/collections/{collection['slug']}"
        routes[path] = get_json(path)

    piece_ids = {
        piece["id"]
        for key in ("/api/pieces", "/api/pieces?sketchbook=true")
        for piece in routes[key]
    }
    piece_ids.update(piece["id"] for piece in routes["/api/about"]["pieces"])
    for piece_id in sorted(piece_ids):
        path = f"/api/pieces/{piece_id}"
        routes[path] = get_json(path)

    urls = set()
    image_urls_in(routes, urls)
    print(f"{len(routes)} API responses, {len(urls)} image files to save")

    os.makedirs(OUT, exist_ok=True)
    with ThreadPoolExecutor(max_workers=16) as pool:
        saved = sum(pool.map(download, sorted(urls)))

    url_map = {
        url: os.path.relpath(local_path_for(url), OUT).replace(os.sep, "/")
        for url in urls
    }
    with open(os.path.join(OUT, "routes.json"), "w", encoding="utf-8") as handle:
        json.dump({"api": API, "routes": routes, "media": url_map}, handle, ensure_ascii=False)

    print(f"Saved {saved} of {len(urls)} images to {OUT}")


if __name__ == "__main__":
    main()
