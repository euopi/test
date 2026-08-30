"""News sources for the daily digest.

Each entry:
  name        Display name in the digest.
  kind        "rss" (parse a feed) or "index" (scrape a listing page for links).
  url         Feed URL, or listing page URL for "index".
  lang        Language of the source content. Non-"en" gets translated.
  cap         Max articles taken from this source per run.
  hours       Lookback window. Dailies use 24; weeklies and lab blogs need
              more or they never appear. seen.json stops anything repeating.
  full_text   False when we can only ever get headline + blurb (paywall or
              IP block), so the digest entry is necessarily thinner.
  ua          Optional user-agent override: a few sites block the browser one.
  link_re     "index" only: regex matching article URLs on the listing page.
  base        "index" only: prefix for relative links.
"""

SOURCES = [
    # --- Wires -------------------------------------------------------------
    # AP dropped public RSS in 2023, but its homepage is fetchable, so we take
    # article links off the front page and read the articles directly.
    dict(name="The AP", kind="index", url="https://apnews.com/", lang="en",
         cap=6, hours=24, full_text=True,
         link_re=r'https://apnews\.com/article/[a-z0-9-]+'),

    # Reuters 401s every path from a datacenter IP. Google News gives headlines,
    # but its links are opaque redirects we can't follow - headline-only.
    dict(name="Reuters", kind="rss", lang="en", cap=6, hours=24, full_text=False,
         url="https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en"),

    # --- English -----------------------------------------------------------
    dict(name="Al Jazeera English", kind="rss", lang="en", cap=5, hours=24,
         full_text=True, url="https://www.aljazeera.com/xml/rss/all.xml"),
    dict(name="Jacobin", kind="rss", url="https://jacobin.com/feed",
         lang="en", cap=4, hours=48, full_text=True),
    dict(name="ProPublica", kind="rss", lang="en", cap=3, hours=72,
         full_text=True, url="https://www.propublica.org/feeds/propublica/main"),
    dict(name="404 Media", kind="rss", url="https://www.404media.co/rss/",
         lang="en", cap=4, hours=48, full_text=True),
    dict(name="Rest of World", kind="rss", url="https://restofworld.org/feed/",
         lang="en", cap=3, hours=96, full_text=True),
    dict(name="Labor Notes", kind="rss", url="https://labornotes.org/rss.xml",
         lang="en", cap=3, hours=96, full_text=True),
    dict(name="Geese Magazine", kind="rss", url="https://www.geesemag.com/feed.xml",
         lang="en", cap=3, hours=96, full_text=True),

    # Paywalled: feed gives headline + standfirst, article fetches stop at the
    # lede. Summaries from these are necessarily thinner.
    dict(name="Financial Times", kind="rss", url="https://www.ft.com/rss/home",
         lang="en", cap=4, hours=24, full_text=False),
    # Blocks the browser user-agent but serves a plain one. Yes, backwards.
    dict(name="The Information", kind="rss", lang="en", cap=3, hours=72,
         full_text=False, ua="NewsDigest/1.0",
         url="https://www.theinformation.com/feed"),

    # --- Original-language sources (digest output is still English) --------
    # Feed is fine; article bodies 403, so headline + feed summary only.
    dict(name="RFI", kind="rss", url="https://www.rfi.fr/fr/rss",
         lang="fr", cap=4, hours=24, full_text=False),
    dict(name="Mediapart", kind="rss", url="https://www.mediapart.fr/articles/feed",
         lang="fr", cap=4, hours=48, full_text=False),  # paywalled
    dict(name="Afrique XXI", kind="rss", lang="fr", cap=3, hours=96,
         full_text=True, url="https://afriquexxi.info/?page=backend&lang=fr"),

    # Orient XXI and Diario Red 403 this server's IP on every path, so we take
    # headlines via Google News and cannot reach the bodies.
    dict(name="Orient XXI", kind="rss", lang="fr", cap=3, hours=168, full_text=False,
         url="https://news.google.com/rss/search?q=site:orientxxi.info+when:7d&hl=fr&gl=FR&ceid=FR:fr"),
    dict(name="Diario Red", kind="rss", lang="es", cap=3, hours=48, full_text=False,
         url="https://news.google.com/rss/search?q=site:diario-red.com+when:2d&hl=es&gl=ES&ceid=ES:es"),

    # --- AI lab announcements ----------------------------------------------
    # Feed is served, but article pages 403 this IP (even via curl).
    dict(name="OpenAI", kind="rss", url="https://openai.com/news/rss.xml",
         lang="en", cap=4, hours=96, full_text=False),
    dict(name="Google DeepMind", kind="rss", url="https://deepmind.google/blog/rss.xml",
         lang="en", cap=4, hours=96, full_text=True),
    # No RSS, so we scrape the news index for post links.
    dict(name="Anthropic", kind="index", url="https://www.anthropic.com/news",
         lang="en", cap=4, hours=96, full_text=True,
         link_re=r'href="(/news/[a-z0-9-]+)"', base="https://www.anthropic.com"),
]
