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
    # Kept for its surveillance/policing reporting (ICE contracts, police
    # tech), not its consumer-tech coverage. The digest instructions scope it.
    dict(name="404 Media", kind="rss", url="https://www.404media.co/rss/",
         lang="en", cap=4, hours=48, full_text=True),
    # Kept for tech's political economy in the Global South - displacement,
    # labour, sovereignty - not product or industry news.
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

    # --- Original-language sources (digest output is still English) --------
    # Article bodies 403 this IP, but the reader proxy in fetch_news.py
    # retrieves them, so full text is available after all.
    dict(name="RFI", kind="rss", url="https://www.rfi.fr/fr/rss",
         lang="fr", cap=4, hours=24, full_text=True),
    dict(name="Mediapart", kind="rss", url="https://www.mediapart.fr/articles/feed",
         lang="fr", cap=4, hours=48, full_text=False),  # paywalled
    dict(name="Afrique XXI", kind="rss", lang="fr", cap=3, hours=96,
         full_text=True, url="https://afriquexxi.info/?page=backend&lang=fr"),

    # Orient XXI and Diario Red 403 this server's whole IP range at the CDN.
    # Everything was tried: three public proxies, the Internet Archive (stale
    # snapshots, and its save-on-demand times out), full browser headers, and
    # decoding the Google News links (opaque tokens). Only a fetch from a
    # non-blocked IP would work. So: headlines via Google News, and a higher
    # cap than the others, since a list of what they published is the most
    # that is available and is still worth having.
    dict(name="Orient XXI", kind="rss", lang="fr", cap=8, hours=168, full_text=False,
         url="https://news.google.com/rss/search?q=site:orientxxi.info+when:7d&hl=fr&gl=FR&ceid=FR:fr"),
    dict(name="Diario Red", kind="rss", lang="es", cap=8, hours=48, full_text=False,
         url="https://news.google.com/rss/search?q=site:diario-red.com+when:2d&hl=es&gl=ES&ceid=ES:es"),

    # Not hard-paywalled, but subscriber articles cut off at a "(...)" marker,
    # which fetch_news.py flags as partial. Closest match to Orient XXI's
    # register - long-form French analysis - which is why it is here.
    dict(name="Le Monde diplomatique", kind="rss", lang="fr", cap=4, hours=120,
         full_text=True, url="https://www.monde-diplomatique.fr/recents.xml"),

    # Free to read (non-profit funded), bodies come through at 7-12k chars.
    # Added as MENA coverage after Orient XXI proved unreachable. Note the feed
    # path: /rss.xml is a stale archive with items from 2018, /rss/news is live.
    dict(name="Middle East Eye", kind="rss", url="https://www.middleeasteye.net/rss/news",
         lang="en", cap=4, hours=24, full_text=True),

    # --- French left --------------------------------------------------------
    # Independent left weekly. One feed only - no per-section feeds - but it
    # carries everything: politics, society, ecology, world, culture. Covers
    # LFI and the wider left closely without being aligned to either.
    dict(name="Politis", kind="rss", url="https://www.politis.fr/flux-rss/",
         lang="fr", cap=5, hours=48, full_text=True),

    # PARTY-ALIGNED, not journalism: this is LFI's own outlet stating LFI's
    # position. Kept deliberately for that, and the digest is told to label it
    # so its claims are never presented as independent reporting.
    dict(name="L'Insoumission (LFI-aligned)", kind="rss", lang="fr", cap=3,
         hours=48, full_text=True, url="https://linsoumission.fr/feed/"),

    # --- The EU as an institution -------------------------------------------
    # Coverage of Brussels itself - the Commission, Parliament, Council,
    # directives and enlargement - rather than European countries' domestic
    # news. Euractiv would belong here but 403s this server on every path.
    dict(name="EUobserver", kind="rss", url="https://euobserver.com/feed/",
         lang="en", cap=4, hours=48, full_text=True),
    # Brussels insider reporting. Most articles come through; the Pro tier
    # returns near-empty, which shows up as a very short body.
    dict(name="Politico Europe", kind="rss", url="https://www.politico.eu/feed/",
         lang="en", cap=4, hours=24, full_text=True),
    # Left-leaning EU policy commentary. Publishes only a few times a month,
    # so it needs a 30-day window to contribute at all; seen.json prevents
    # the same essay appearing twice.
    dict(name="Social Europe", kind="rss", url="https://www.socialeurope.eu/feed",
         lang="en", cap=2, hours=720, full_text=True),

    # --- Belgium ------------------------------------------------------------
    # Belgian media splits by language community, so following national
    # politics needs both. The quality press (De Standaard, De Morgen, Le Soir,
    # L'Echo, Knack, La Libre) is all paywalled or blocks us; the public
    # broadcasters are free and serve full text.
    dict(name="RTBF (Belgium, FR)", kind="rss", lang="fr", cap=4, hours=24,
         full_text=True, url="https://rss.rtbf.be/article/rss/rtbfinfo_belgique.xml"),
    # Note: this feed is NOT date-sorted, so the date filter does the work.
    dict(name="VRT NWS (Belgium, NL)", kind="rss", lang="nl", cap=4, hours=24,
         full_text=True, url="https://www.vrt.be/vrtnws/nl.rss.articles.xml"),
    # Flemish left outlet - covers labour and the PVDA's side of Belgian
    # politics, which the broadcasters cover more neutrally.
    dict(name="De Wereld Morgen (NL)", kind="rss", lang="nl", cap=3, hours=48,
         full_text=True, url="https://www.dewereldmorgen.be/rss.xml"),

    # --- Algeria ------------------------------------------------------------
    # TSA for breaking news, Le Matin d'Algerie for the critical/analytical
    # take - between them the news and the argument about it.
    dict(name="TSA (Tout Sur l'Algerie)", kind="rss", url="https://www.tsa-algerie.com/feed/",
         lang="fr", cap=4, hours=24, full_text=True),
    dict(name="Le Matin d'Algerie", kind="rss", url="https://lematindalgerie.com/feed/",
         lang="fr", cap=4, hours=24, full_text=True),

]
