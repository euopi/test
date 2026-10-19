'use strict';

// A YouTube client that runs entirely in the browser. Metadata comes from the
// YouTube Data API v3 (your own key), playback from the embedded player, and
// subscriptions/history/watch later live in localStorage.

const API = 'https://www.googleapis.com/youtube/v3/';
const $app = document.getElementById('app');
const $q = document.getElementById('q');

/* ---------- storage ---------- */

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('tube:' + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('tube:' + key, JSON.stringify(value)); } catch {}
  },
  del(key) {
    try { localStorage.removeItem('tube:' + key); } catch {}
  },
};

const DEFAULT_SETTINGS = { apiKey: '', region: 'US', autoplay: true, pauseHistory: false };
const settings = () => ({ ...DEFAULT_SETTINGS, ...store.get('settings', {}) });

const getSubs = () => store.get('subs', []);
const getLater = () => store.get('later', []);
const getHistory = () => store.get('history', []);

/* ---------- formatting ---------- */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// search.list returns entity-encoded titles; everything else is plain text.
function decode(s) {
  const el = document.createElement('textarea');
  el.innerHTML = s || '';
  return el.value;
}

function parseDuration(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso || '');
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  const mm = h ? String(m).padStart(2, '0') : m;
  return (h ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0');
}

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const fmtCount = n => compact.format(+n || 0);

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
function timeAgo(date) {
  const secs = (new Date(date) - Date.now()) / 1000;
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return 'just now';
}

// "90", "90s", "1m30s", "1h2m3s" -> seconds
function parseT(t) {
  if (!t) return null;
  if (/^\d+$/.test(t)) return +t;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  return m && m[0] ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : null;
}

const tsToSec = ts => ts.split(':').reduce((acc, n) => acc * 60 + +n, 0);

// Turns a pasted YouTube URL into one of our routes, or null.
function parseYouTubeUrl(input) {
  let u;
  try { u = new URL(String(input).trim()); } catch { return null; }
  if (!/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(u.hostname)) return null;
  const t = parseT(u.searchParams.get('t') || u.searchParams.get('start'));
  const list = u.searchParams.get('list');
  const watch = id => `#/watch?v=${id}${list ? '&list=' + encodeURIComponent(list) : ''}${t ? '&t=' + t : ''}`;
  let m;
  if (u.hostname.endsWith('youtu.be') && (m = u.pathname.match(/^\/([\w-]{11})/))) return watch(m[1]);
  const v = u.searchParams.get('v');
  if (v && /^[\w-]{11}$/.test(v)) return watch(v);
  if ((m = u.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})/))) return watch(m[1]);
  if ((m = u.pathname.match(/^\/channel\/(UC[\w-]{22})/))) return `#/channel/${m[1]}`;
  if ((m = u.pathname.match(/^\/(@[\w.-]+)/))) return `#/channel/${encodeURIComponent(m[1])}`;
  if (list) return `#/playlist/${encodeURIComponent(list)}`;
  return null;
}

// Plain text -> HTML with links, and timestamps that seek the player.
function richText(text) {
  return String(text || '').split(/(https?:\/\/[^\s<>"]+)/g).map((part, i) => {
    if (i % 2) {
      const internal = parseYouTubeUrl(part);
      return internal
        ? `<a href="${esc(internal)}">${esc(part)}</a>`
        : `<a href="${esc(part)}" target="_blank" rel="noopener noreferrer">${esc(part)}</a>`;
    }
    return esc(part).replace(/(^|[^\d:])((?:\d{1,2}:)?\d{1,2}:\d{2})(?![\d:])/g,
      (_, pre, ts) => `${pre}<a href="#" class="ts" data-t="${tsToSec(ts)}">${ts}</a>`);
  }).join('');
}

/* ---------- API ---------- */

class ApiError extends Error {
  constructor(message, reason, status) {
    super(message);
    this.reason = reason;
    this.status = status;
  }
}

async function yt(endpoint, params) {
  const { apiKey } = settings();
  if (!apiKey) throw new ApiError('No API key set.', 'noKey', 0);
  const url = new URL(API + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  url.searchParams.set('key', apiKey);
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError('Network error reaching the YouTube API.', 'network', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data.error || {};
    throw new ApiError(e.message || res.statusText, e.errors?.[0]?.reason || '', res.status);
  }
  return data;
}

function bestThumb(t = {}) {
  return (t.medium || t.high || t.standard || t.default || t.maxres || {}).url || '';
}

function toVideo(item) {
  const sn = item.snippet || {}, st = item.statistics || {}, cd = item.contentDetails || {};
  return {
    id: item.id,
    title: sn.title,
    channelId: sn.channelId,
    channelTitle: sn.channelTitle,
    publishedAt: sn.publishedAt,
    thumb: bestThumb(sn.thumbnails),
    duration: parseDuration(cd.duration),
    views: st.viewCount,
    likes: st.likeCount,
    comments: st.commentCount,
    live: sn.liveBroadcastContent,
    description: sn.description,
  };
}

// Strip the fields we don't want copied into localStorage for every video.
const slim = ({ description, likes, comments, ...v }) => v;

// Fetch full video objects for a list of IDs, preserving order and
// dropping anything private or deleted.
async function hydrate(ids) {
  ids = [...new Set(ids.filter(Boolean))];
  const found = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const data = await yt('videos', {
      part: 'snippet,statistics,contentDetails',
      id: ids.slice(i, i + 50).join(','),
      maxResults: 50,
    });
    for (const item of data.items || []) found.set(item.id, toVideo(item));
  }
  return ids.map(id => found.get(id)).filter(Boolean);
}

async function pool(items, size, fn) {
  const queue = [...items];
  const worker = async () => { while (queue.length) await fn(queue.shift()); };
  await Promise.all(Array.from({ length: Math.min(size, queue.length) }, worker));
}

const channelCache = new Map();
async function getChannel(id) {
  if (!channelCache.has(id)) {
    channelCache.set(id, yt('channels', { part: 'snippet,statistics', id })
      .then(d => d.items?.[0] || null)
      .catch(err => { channelCache.delete(id); throw err; }));
  }
  return channelCache.get(id);
}

/* ---------- library state ---------- */

function isSubbed(id) { return getSubs().some(s => s.id === id); }

function toggleSub(ch) {
  const subs = getSubs();
  const i = subs.findIndex(s => s.id === ch.id);
  if (i >= 0) subs.splice(i, 1);
  else subs.push({ id: ch.id, title: ch.title, thumb: ch.thumb || '' });
  subs.sort((a, b) => a.title.localeCompare(b.title));
  store.set('subs', subs);
  return i < 0;
}

function isLater(id) { return getLater().some(v => v.id === id); }

function toggleLater(v) {
  const later = getLater();
  const i = later.findIndex(x => x.id === v.id);
  if (i >= 0) later.splice(i, 1);
  else later.unshift(slim(v));
  store.set('later', later);
  return i < 0;
}

function recordHistory(v) {
  if (settings().pauseHistory) return;
  const history = getHistory();
  const old = history.find(h => h.id === v.id);
  const entry = { ...slim(v), watchedAt: Date.now(), progress: old?.progress || 0 };
  store.set('history', [entry, ...history.filter(h => h.id !== v.id)].slice(0, 300));
}

function saveProgress(id, seconds, duration) {
  if (settings().pauseHistory) return;
  const history = getHistory();
  const entry = history.find(h => h.id === id);
  if (!entry || (!isFinite(seconds) && !duration)) return;
  if (duration) entry.duration = Math.round(duration);
  // Finished videos are remembered as fully watched, not resumed at the credits.
  entry.progress = duration && seconds > duration - 20 ? entry.duration : Math.floor(seconds);
  store.set('history', history);
}

let progressCache = null;
function progressFor(id) {
  progressCache ||= new Map(getHistory().map(h => [h.id, h]));
  const h = progressCache.get(id);
  return h && h.duration && h.progress > 5 ? Math.min(100, h.progress / h.duration * 100) : 0;
}

function resumePoint(id) {
  const h = getHistory().find(x => x.id === id);
  if (!h || !h.progress || h.progress < 10) return 0;
  return h.duration && h.progress >= h.duration - 20 ? 0 : h.progress;
}

/* ---------- components ---------- */

const spinner = () => '<div class="spinner" role="status" aria-label="Loading"></div>';
const notice = (html) => `<div class="notice">${html}</div>`;

function errorBox(err) {
  if (err.reason === 'noKey') {
    return notice(`<h2>Add an API key to get started</h2>
      <p>This client reads YouTube through the official Data API, which needs a free key from Google.
      It takes about two minutes to set up.</p>
      <p><a class="btn primary" href="#/settings">Open settings</a></p>`);
  }
  const hints = {
    quotaExceeded: 'Your key has used its daily quota (10,000 units). It resets at midnight Pacific time. Searches cost 100 units each, so they burn through it fastest.',
    keyInvalid: 'The API key was rejected. Check it in Settings.',
    badRequest: 'The API key was rejected. Check it in Settings.',
    accessNotConfigured: 'The YouTube Data API v3 is not enabled for this key\'s Google Cloud project.',
    forbidden: 'Google refused the request. If you restricted the key by referrer, make sure this page\'s address is on the list.',
  };
  return notice(`<h2>Something went wrong</h2><p>${esc(err.message)}</p>
    ${hints[err.reason] ? `<p class="muted">${esc(hints[err.reason])}</p>` : ''}`);
}

function videoCard(v, { list } = {}) {
  const href = `#/watch?v=${encodeURIComponent(v.id)}${list ? '&list=' + encodeURIComponent(list) : ''}`;
  const badge = v.live === 'live' ? '<span class="badge live">LIVE</span>'
    : v.live === 'upcoming' ? '<span class="badge">UPCOMING</span>'
    : v.duration ? `<span class="badge">${fmtTime(v.duration)}</span>` : '';
  const pct = progressFor(v.id);
  const sub = [v.views != null ? fmtCount(v.views) + ' views' : '', v.publishedAt ? timeAgo(v.publishedAt) : '']
    .filter(Boolean).join(' · ');
  return `<article class="card">
    <a class="thumb" href="${href}">
      <img loading="lazy" src="${esc(v.thumb)}" alt="">
      ${badge}${pct ? `<span class="progress" style="width:${pct.toFixed(1)}%"></span>` : ''}
    </a>
    <div class="meta">
      <a class="title" href="${href}" title="${esc(v.title)}">${esc(v.title)}</a>
      <a class="byline" href="#/channel/${encodeURIComponent(v.channelId)}">${esc(v.channelTitle)}</a>
      <div class="sub">${sub}</div>
    </div>
  </article>`;
}

function channelCard(c) {
  return `<article class="card channel-card">
    <a class="avatar-lg" href="#/channel/${encodeURIComponent(c.id)}"><img loading="lazy" src="${esc(c.thumb)}" alt=""></a>
    <div class="meta center">
      <a class="title" href="#/channel/${encodeURIComponent(c.id)}">${esc(c.title)}</a>
      <div class="sub">Channel</div>
    </div>
  </article>`;
}

function playlistCard(p) {
  return `<article class="card">
    <a class="thumb" href="#/playlist/${encodeURIComponent(p.id)}">
      <img loading="lazy" src="${esc(p.thumb)}" alt="">
      <span class="badge">${p.count != null ? esc(p.count) + ' videos' : 'Playlist'}</span>
    </a>
    <div class="meta">
      <a class="title" href="#/playlist/${encodeURIComponent(p.id)}">${esc(p.title)}</a>
      <a class="byline" href="#/channel/${encodeURIComponent(p.channelId)}">${esc(p.channelTitle)}</a>
    </div>
  </article>`;
}

// Grid with a "Load more" button that also fires when scrolled into view.
// loadPage(pageToken) resolves to { html, next }.
function mountPager(ctx, grid, more, loadPage, emptyText = 'Nothing here yet.') {
  let token, busy = false;
  const load = async () => {
    if (busy || !ctx.alive()) return;
    busy = true;
    more.hidden = false;
    more.disabled = true;
    more.textContent = 'Loading…';
    try {
      const { html, next } = await loadPage(token);
      if (!ctx.alive()) return;
      grid.insertAdjacentHTML('beforeend', html);
      token = next;
      more.hidden = !next;
      if (!grid.children.length) grid.outerHTML = `<p class="muted empty">${esc(emptyText)}</p>`;
    } catch (err) {
      if (!ctx.alive()) return;
      more.hidden = true;
      grid.insertAdjacentHTML('afterend', errorBox(err));
    } finally {
      busy = false;
      more.disabled = false;
      more.textContent = 'Load more';
    }
  };
  more.onclick = load;
  const io = new IntersectionObserver(entries => {
    if (!ctx.alive()) return io.disconnect();
    if (entries.some(e => e.isIntersecting) && !more.hidden && token) load();
  }, { rootMargin: '600px' });
  io.observe(more);
  return load();
}

/* ---------- player ---------- */

let player = null;
let playerTimer = null;
let ytApiPromise = null;

function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  ytApiPromise ||= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { ytApiPromise = null; reject(new Error('Could not load the YouTube player.')); };
    document.head.append(s);
  });
  return ytApiPromise;
}

const PLAYER_ERRORS = {
  2: 'Invalid video ID.',
  5: 'This video can\'t be played in an HTML5 player.',
  100: 'This video was removed or is private.',
  101: 'The uploader has disabled playback outside YouTube.',
  150: 'The uploader has disabled playback outside YouTube.',
  153: 'The player needs a referrer. Serve this folder over http://localhost instead of opening the file directly (see the README).',
};

async function mountPlayer(ctx, id, { start = 0, onEnd } = {}) {
  const el = document.getElementById('player');
  if (location.protocol === 'file:') {
    el.outerHTML = `<div class="player-error">${esc(PLAYER_ERRORS[153])}</div>`;
    return;
  }
  let YT;
  try {
    YT = await loadPlayerApi();
  } catch (err) {
    if (ctx.alive()) el.outerHTML = `<div class="player-error">${esc(err.message)}</div>`;
    return;
  }
  if (!ctx.alive()) return;
  player = new YT.Player('player', {
    host: 'https://www.youtube-nocookie.com',
    videoId: id,
    playerVars: {
      autoplay: settings().autoplay ? 1 : 0,
      start: Math.floor(start),
      rel: 0,
      playsinline: 1,
      origin: location.origin,
    },
    events: {
      onStateChange(e) {
        if (e.data === YT.PlayerState.ENDED) {
          saveProgress(id, Infinity, player?.getDuration?.());
          onEnd?.();
        }
      },
      onError(e) {
        const msg = PLAYER_ERRORS[e.data] || `Player error ${e.data}.`;
        const box = document.querySelector('.player-wrap');
        if (box) box.insertAdjacentHTML('beforeend', `<div class="player-error overlay">${esc(msg)}
          <a href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener">Watch on YouTube</a></div>`);
      },
    },
  });
  const tick = () => {
    const t = player?.getCurrentTime?.();
    if (t) saveProgress(id, t, player.getDuration?.());
  };
  playerTimer = setInterval(tick, 5000);
  player._tubeTick = tick;
}

function teardownPlayer() {
  clearInterval(playerTimer);
  playerTimer = null;
  if (!player) return;
  try { player._tubeTick?.(); player.destroy(); } catch {}
  player = null;
}

/* ---------- views ---------- */

async function viewHome(ctx) {
  if (!getSubs().length) return viewTrending(ctx, true);
  $app.innerHTML = `<div class="head"><h1>Subscriptions</h1></div>${spinner()}`;
  const videos = await subscriptionFeed();
  if (!ctx.alive()) return;
  $app.innerHTML = `<div class="head">
      <h1>Subscriptions</h1>
      <button class="btn" id="refresh">Refresh</button>
    </div>
    ${videos.length ? `<div class="grid">${videos.map(v => videoCard(v)).join('')}</div>`
      : '<p class="muted empty">No recent uploads from your subscriptions.</p>'}`;
  document.getElementById('refresh').onclick = () => {
    store.del('feed');
    route();
  };
}

// Newest uploads across all subscriptions. Each channel's "uploads" playlist
// is UU + the channel ID minus its UC prefix, and costs 1 quota unit to read.
async function subscriptionFeed() {
  const subs = getSubs();
  const key = subs.map(s => s.id).sort().join(',');
  const cached = store.get('feed');
  if (cached && cached.key === key && Date.now() - cached.at < 15 * 60e3) return cached.videos;

  const recent = [];
  await pool(subs, 6, async sub => {
    try {
      const data = await yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + sub.id.slice(2), maxResults: 6 });
      for (const it of data.items || []) {
        recent.push({ id: it.contentDetails.videoId, at: it.contentDetails.videoPublishedAt || '' });
      }
    } catch (err) {
      if (err.status !== 404) throw err; // channels with no uploads 404 here
    }
  });
  recent.sort((a, b) => b.at.localeCompare(a.at));
  const videos = (await hydrate(recent.slice(0, 150).map(r => r.id)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map(slim);
  store.set('feed', { key, at: Date.now(), videos });
  return videos;
}

async function viewTrending(ctx, isHome = false) {
  const { region } = settings();
  $app.innerHTML = `<div class="head"><h1>Trending <span class="muted">${esc(region)}</span></h1></div>
    ${isHome ? '<p class="muted lede">Subscribe to channels and this page becomes your feed.</p>' : ''}
    <div class="grid" id="grid"></div>
    <button class="btn more" id="more" hidden>Load more</button>`;
  await mountPager(ctx, document.getElementById('grid'), document.getElementById('more'), async token => {
    const data = await yt('videos', {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      regionCode: region,
      maxResults: 24,
      pageToken: token,
    });
    return { html: (data.items || []).map(toVideo).map(v => videoCard(v)).join(''), next: data.nextPageToken };
  });
}

async function viewSearch(ctx) {
  const q = ctx.params.get('q') || '';
  const order = ctx.params.get('order') || 'relevance';
  const type = ctx.params.get('type') || 'video,channel,playlist';
  $q.value = q;
  document.title = `${q} · Tube`;
  if (!q.trim()) {
    $app.innerHTML = notice('<p>Type something into the search box.</p>');
    return;
  }
  const select = (name, value, options) => `<select data-filter="${name}">${options.map(([v, label]) =>
    `<option value="${v}"${v === value ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
  $app.innerHTML = `<div class="head">
      <h1 class="ellipsis">${esc(q)}</h1>
      <div class="filters">
        ${select('type', type, [['video,channel,playlist', 'All'], ['video', 'Videos'], ['channel', 'Channels'], ['playlist', 'Playlists']])}
        ${select('order', order, [['relevance', 'Relevance'], ['date', 'Upload date'], ['viewCount', 'View count'], ['rating', 'Rating']])}
      </div>
    </div>
    <div class="grid" id="grid"></div>
    <button class="btn more" id="more" hidden>Load more</button>`;
  $app.querySelectorAll('[data-filter]').forEach(sel => sel.onchange = () => {
    const p = new URLSearchParams(ctx.params);
    p.set(sel.dataset.filter, sel.value);
    location.hash = '#/search?' + p;
  });
  await mountPager(ctx, document.getElementById('grid'), document.getElementById('more'), async token => {
    const data = await yt('search', {
      part: 'snippet', q, type, order, maxResults: 20, pageToken: token, regionCode: settings().region,
    });
    const items = data.items || [];
    const videos = new Map((await hydrate(items.filter(i => i.id.videoId).map(i => i.id.videoId))).map(v => [v.id, v]));
    const html = items.map(item => {
      const sn = item.snippet;
      if (item.id.videoId) return videos.has(item.id.videoId) ? videoCard(videos.get(item.id.videoId)) : '';
      if (item.id.channelId) return channelCard({ id: item.id.channelId, title: decode(sn.title), thumb: bestThumb(sn.thumbnails) });
      if (item.id.playlistId) {
        return playlistCard({
          id: item.id.playlistId, title: decode(sn.title), thumb: bestThumb(sn.thumbnails),
          channelId: sn.channelId, channelTitle: decode(sn.channelTitle),
        });
      }
      return '';
    }).join('');
    return { html, next: data.nextPageToken };
  }, 'No results.');
}

async function viewWatch(ctx) {
  const id = ctx.params.get('v') || '';
  const list = ctx.params.get('list');
  if (!/^[\w-]{11}$/.test(id)) {
    $app.innerHTML = notice('<p>That doesn\'t look like a video ID.</p>');
    return;
  }
  const t = parseT(ctx.params.get('t'));
  $app.innerHTML = `<div class="watch${list ? ' with-list' : ''}">
    <div class="primary">
      <div class="player-wrap"><div id="player"></div></div>
      <div id="info">${spinner()}</div>
      <section id="comments" class="comments"></section>
    </div>
    ${list ? '<aside id="queue" class="queue"></aside>' : ''}
  </div>`;

  let nextHref = null;
  mountPlayer(ctx, id, {
    start: t ?? resumePoint(id),
    onEnd: () => { if (nextHref && settings().autoplay) location.hash = nextHref; },
  });

  const info = document.getElementById('info');
  if (!settings().apiKey) {
    info.innerHTML = errorBox(new ApiError('', 'noKey'));
    return;
  }

  if (list) {
    renderQueue(ctx, list, id).then(href => { nextHref = href; }).catch(err => {
      const q = document.getElementById('queue');
      if (q && ctx.alive()) q.innerHTML = errorBox(err);
    });
  }

  const data = await yt('videos', { part: 'snippet,statistics,contentDetails', id });
  if (!ctx.alive()) return;
  const item = data.items?.[0];
  if (!item) {
    info.innerHTML = notice('<p>This video is private, deleted, or doesn\'t exist.</p>');
    return;
  }
  const v = toVideo(item);
  recordHistory(v);
  document.title = `${v.title} · Tube`;

  const stats = [fmtCount(v.views) + ' views', new Date(v.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })];
  if (v.likes != null) stats.push(fmtCount(v.likes) + ' likes');

  info.innerHTML = `
    <h1 class="video-title">${esc(v.title)}</h1>
    <div class="video-row">
      <a class="channel-chip" href="#/channel/${encodeURIComponent(v.channelId)}">
        <img class="avatar" id="ch-avatar" alt="">
        <span><strong>${esc(v.channelTitle)}</strong><span class="muted small" id="ch-subs"></span></span>
      </a>
      <button class="btn ${isSubbed(v.channelId) ? '' : 'primary'}" id="sub">${isSubbed(v.channelId) ? 'Subscribed' : 'Subscribe'}</button>
      <span class="spacer"></span>
      <button class="btn" id="later">${isLater(v.id) ? 'Saved' : 'Watch later'}</button>
      <button class="btn" id="share">Copy link</button>
      <a class="btn" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener">YouTube ↗</a>
    </div>
    <div class="description collapsed" id="desc">
      <div class="muted small">${stats.map(esc).join(' · ')}</div>
      <div class="desc-text">${richText(v.description) || '<span class="muted">No description.</span>'}</div>
      <button class="link" id="desc-toggle">Show more</button>
    </div>`;

  const desc = document.getElementById('desc');
  const toggle = document.getElementById('desc-toggle');
  if (desc.querySelector('.desc-text').scrollHeight <= 120) {
    desc.classList.remove('collapsed');
    toggle.hidden = true;
  }
  toggle.onclick = () => {
    toggle.textContent = desc.classList.toggle('collapsed') ? 'Show more' : 'Show less';
  };

  let channelThumb = '';
  getChannel(v.channelId).then(ch => {
    if (!ch || !ctx.alive()) return;
    channelThumb = bestThumb(ch.snippet.thumbnails);
    document.getElementById('ch-avatar').src = channelThumb;
    if (!ch.statistics.hiddenSubscriberCount) {
      document.getElementById('ch-subs').textContent = fmtCount(ch.statistics.subscriberCount) + ' subscribers';
    }
  }).catch(() => {});

  const subBtn = document.getElementById('sub');
  subBtn.onclick = () => {
    const on = toggleSub({ id: v.channelId, title: v.channelTitle, thumb: channelThumb });
    subBtn.textContent = on ? 'Subscribed' : 'Subscribe';
    subBtn.classList.toggle('primary', !on);
  };
  const laterBtn = document.getElementById('later');
  laterBtn.onclick = () => { laterBtn.textContent = toggleLater(v) ? 'Saved' : 'Watch later'; };
  document.getElementById('share').onclick = async e => {
    const at = Math.floor(player?.getCurrentTime?.() || 0);
    const url = `https://youtu.be/${v.id}${at > 5 ? '?t=' + at : ''}`;
    try { await navigator.clipboard.writeText(url); e.target.textContent = 'Copied'; }
    catch { prompt('Copy this link:', url); }
  };

  loadComments(ctx, v);
}

// Sidebar for watching inside a playlist. Resolves to the next video's route.
async function renderQueue(ctx, list, currentId) {
  const box = document.getElementById('queue');
  box.innerHTML = spinner();
  const [meta, items] = await Promise.all([
    yt('playlists', { part: 'snippet', id: list }),
    yt('playlistItems', { part: 'snippet', playlistId: list, maxResults: 50 }),
  ]);
  if (!ctx.alive()) return null;
  const entries = (items.items || [])
    .filter(it => it.snippet.resourceId?.videoId && bestThumb(it.snippet.thumbnails))
    .map(it => ({ id: it.snippet.resourceId.videoId, title: it.snippet.title, thumb: bestThumb(it.snippet.thumbnails),
      channel: it.snippet.videoOwnerChannelTitle || '' }));
  const idx = entries.findIndex(e => e.id === currentId);
  const title = meta.items?.[0]?.snippet.title || 'Playlist';
  box.innerHTML = `<div class="queue-head">
      <a href="#/playlist/${encodeURIComponent(list)}"><strong>${esc(title)}</strong></a>
      <span class="muted small">${idx >= 0 ? idx + 1 : '–'} / ${entries.length}</span>
    </div>
    <ol class="queue-list">${entries.map((e, i) => `<li class="${i === idx ? 'current' : ''}">
      <a href="#/watch?v=${encodeURIComponent(e.id)}&list=${encodeURIComponent(list)}">
        <img loading="lazy" src="${esc(e.thumb)}" alt="">
        <span><span class="q-title">${esc(e.title)}</span><span class="muted small">${esc(e.channel)}</span></span>
      </a></li>`).join('')}</ol>`;
  box.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
  const next = entries[idx + 1];
  return next ? `#/watch?v=${encodeURIComponent(next.id)}&list=${encodeURIComponent(list)}` : null;
}

function commentHtml(c, { replies = 0, threadId } = {}) {
  const s = c.snippet;
  return `<div class="comment">
    <a href="#/channel/${encodeURIComponent(s.authorChannelId?.value || '')}"><img class="avatar" loading="lazy" src="${esc(s.authorProfileImageUrl)}" alt=""></a>
    <div>
      <div class="small"><strong>${esc(s.authorDisplayName)}</strong> <span class="muted">${timeAgo(s.publishedAt)}${s.updatedAt !== s.publishedAt ? ' (edited)' : ''}</span></div>
      <div class="comment-text">${richText(s.textOriginal ?? s.textDisplay)}</div>
      ${s.likeCount ? `<div class="muted small">▲ ${fmtCount(s.likeCount)}</div>` : ''}
      ${replies ? `<details class="replies" data-thread="${esc(threadId)}"><summary>${replies} ${replies === 1 ? 'reply' : 'replies'}</summary><div class="reply-list">${spinner()}</div></details>` : ''}
    </div>
  </div>`;
}

function loadComments(ctx, v, order = 'relevance') {
  const box = document.getElementById('comments');
  box.innerHTML = `<div class="head small-head">
      <h2>${v.comments != null ? fmtCount(v.comments) + ' ' : ''}Comments</h2>
      <select id="c-order"><option value="relevance">Top</option><option value="time"${order === 'time' ? ' selected' : ''}>Newest</option></select>
    </div>
    <div id="c-list"></div>
    <button class="btn more" id="c-more" hidden>Load more</button>`;
  document.getElementById('c-order').onchange = e => loadComments(ctx, v, e.target.value);
  const listEl = document.getElementById('c-list');

  listEl.addEventListener('toggle', async e => {
    const d = e.target;
    if (!d.matches?.('details.replies') || !d.open || d.dataset.loaded) return;
    d.dataset.loaded = '1';
    const out = d.querySelector('.reply-list');
    try {
      const data = await yt('comments', { part: 'snippet', parentId: d.dataset.thread, maxResults: 100, textFormat: 'plainText' });
      out.innerHTML = (data.items || []).map(c => commentHtml(c)).join('');
    } catch (err) {
      out.innerHTML = errorBox(err);
    }
  }, true);

  mountPager(ctx, listEl, document.getElementById('c-more'), async token => {
    try {
      const data = await yt('commentThreads', {
        part: 'snippet', videoId: v.id, order, maxResults: 20, pageToken: token, textFormat: 'plainText',
      });
      const html = (data.items || []).map(t => commentHtml(t.snippet.topLevelComment, {
        replies: t.snippet.totalReplyCount, threadId: t.id,
      })).join('');
      return { html, next: data.nextPageToken };
    } catch (err) {
      if (err.reason === 'commentsDisabled') return { html: '', next: null };
      throw err;
    }
  }, 'No comments.');
}

async function viewChannel(ctx, ref) {
  $app.innerHTML = spinner();
  const tab = ctx.params.get('tab') === 'playlists' ? 'playlists' : 'videos';
  const lookup = ref.startsWith('@') ? { forHandle: ref } : { id: ref };
  const data = await yt('channels', { part: 'snippet,statistics,contentDetails,brandingSettings', ...lookup });
  if (!ctx.alive()) return;
  const ch = data.items?.[0];
  if (!ch) {
    $app.innerHTML = notice('<p>Channel not found.</p>');
    return;
  }
  const sn = ch.snippet, st = ch.statistics;
  const thumb = bestThumb(sn.thumbnails);
  const banner = ch.brandingSettings?.image?.bannerExternalUrl;
  document.title = `${sn.title} · Tube`;
  const facts = [sn.customUrl, st.hiddenSubscriberCount ? '' : fmtCount(st.subscriberCount) + ' subscribers', fmtCount(st.videoCount) + ' videos']
    .filter(Boolean);
  const base = `#/channel/${encodeURIComponent(ch.id)}`;
  $app.innerHTML = `
    ${banner ? `<div class="banner" style="background-image:url('${esc(banner)}=w1600')"></div>` : ''}
    <div class="channel-head">
      <img class="avatar-xl" src="${esc(thumb)}" alt="">
      <div class="channel-info">
        <h1>${esc(sn.title)}</h1>
        <div class="muted small">${facts.map(esc).join(' · ')}</div>
        ${sn.description ? `<p class="channel-desc small">${richText(sn.description)}</p>` : ''}
      </div>
      <button class="btn ${isSubbed(ch.id) ? '' : 'primary'}" id="sub">${isSubbed(ch.id) ? 'Subscribed' : 'Subscribe'}</button>
    </div>
    <nav class="tabs">
      <a href="${base}" class="${tab === 'videos' ? 'active' : ''}">Videos</a>
      <a href="${base}?tab=playlists" class="${tab === 'playlists' ? 'active' : ''}">Playlists</a>
    </nav>
    <div class="grid" id="grid"></div>
    <button class="btn more" id="more" hidden>Load more</button>`;

  const subBtn = document.getElementById('sub');
  subBtn.onclick = () => {
    const on = toggleSub({ id: ch.id, title: sn.title, thumb });
    subBtn.textContent = on ? 'Subscribed' : 'Subscribe';
    subBtn.classList.toggle('primary', !on);
  };

  const grid = document.getElementById('grid'), more = document.getElementById('more');
  if (tab === 'playlists') {
    await mountPager(ctx, grid, more, async token => {
      const d = await yt('playlists', { part: 'snippet,contentDetails', channelId: ch.id, maxResults: 24, pageToken: token });
      return {
        html: (d.items || []).map(p => playlistCard({
          id: p.id, title: p.snippet.title, thumb: bestThumb(p.snippet.thumbnails),
          channelId: ch.id, channelTitle: sn.title, count: p.contentDetails.itemCount,
        })).join(''),
        next: d.nextPageToken,
      };
    }, 'This channel has no public playlists.');
  } else {
    const uploads = ch.contentDetails.relatedPlaylists.uploads;
    await mountPager(ctx, grid, more, async token => {
      const d = await yt('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 24, pageToken: token });
      const videos = await hydrate((d.items || []).map(i => i.contentDetails.videoId));
      return { html: videos.map(v => videoCard(v)).join(''), next: d.nextPageToken };
    }, 'This channel has no videos.');
  }
}

async function viewPlaylist(ctx, id) {
  $app.innerHTML = spinner();
  const data = await yt('playlists', { part: 'snippet,contentDetails', id });
  if (!ctx.alive()) return;
  const p = data.items?.[0];
  if (!p) {
    $app.innerHTML = notice('<p>Playlist not found, or it\'s private.</p>');
    return;
  }
  document.title = `${p.snippet.title} · Tube`;
  $app.innerHTML = `<div class="head">
      <div>
        <h1>${esc(p.snippet.title)}</h1>
        <div class="muted small"><a href="#/channel/${encodeURIComponent(p.snippet.channelId)}">${esc(p.snippet.channelTitle)}</a>
          · ${esc(p.contentDetails.itemCount)} videos</div>
      </div>
      <a class="btn primary" id="play-all" hidden>Play all</a>
    </div>
    ${p.snippet.description ? `<p class="small lede">${richText(p.snippet.description)}</p>` : ''}
    <div class="grid" id="grid"></div>
    <button class="btn more" id="more" hidden>Load more</button>`;
  const playAll = document.getElementById('play-all');
  await mountPager(ctx, document.getElementById('grid'), document.getElementById('more'), async token => {
    const d = await yt('playlistItems', { part: 'contentDetails', playlistId: id, maxResults: 24, pageToken: token });
    const videos = await hydrate((d.items || []).map(i => i.contentDetails.videoId));
    if (!token && videos.length) {
      playAll.href = `#/watch?v=${encodeURIComponent(videos[0].id)}&list=${encodeURIComponent(id)}`;
      playAll.hidden = false;
    }
    return { html: videos.map(v => videoCard(v, { list: id })).join(''), next: d.nextPageToken };
  }, 'This playlist is empty.');
}

function viewLibrary() {
  const subs = getSubs(), later = getLater(), history = getHistory(), s = settings();
  document.title = 'Library · Tube';
  $app.innerHTML = `
    <section class="lib-section">
      <div class="head">
        <h1>Subscriptions <span class="muted">${subs.length}</span></h1>
        <div class="filters">
          <label class="btn">Import from Google Takeout<input type="file" id="takeout" accept=".csv,text/csv" hidden></label>
        </div>
      </div>
      ${subs.length ? `<div class="chips">${subs.map(c => `<span class="chip">
          <a href="#/channel/${encodeURIComponent(c.id)}">${c.thumb ? `<img class="avatar sm" src="${esc(c.thumb)}" alt="">` : ''}${esc(c.title)}</a>
          <button class="link" data-unsub="${esc(c.id)}" aria-label="Unsubscribe from ${esc(c.title)}">×</button>
        </span>`).join('')}</div>`
        : `<p class="muted">No subscriptions yet. Hit Subscribe on any channel, or import your real ones:
           export "YouTube and YouTube Music → subscriptions" from <a href="https://takeout.google.com" target="_blank" rel="noopener">Google Takeout</a>
           and pick the <code>subscriptions.csv</code> file.</p>`}
      <p class="muted small" id="import-status"></p>
    </section>

    <section class="lib-section">
      <div class="head"><h2>Watch later <span class="muted">${later.length}</span></h2></div>
      ${later.length ? `<div class="grid">${later.map(v => videoCard(v)).join('')}</div>` : '<p class="muted">Nothing saved.</p>'}
    </section>

    <section class="lib-section">
      <div class="head">
        <h2>History <span class="muted">${history.length}</span></h2>
        <div class="filters">
          <label class="check"><input type="checkbox" id="pause"${s.pauseHistory ? ' checked' : ''}> Pause history</label>
          <button class="btn" id="clear-history"${history.length ? '' : ' disabled'}>Clear</button>
        </div>
      </div>
      ${history.length ? `<div class="grid">${history.map(v => videoCard(v)).join('')}</div>` : '<p class="muted">Nothing watched yet.</p>'}
    </section>

    <section class="lib-section">
      <div class="head"><h2>Backup</h2></div>
      <p class="muted small">Everything here lives only in this browser. Export it to move it somewhere else (your API key is left out).</p>
      <div class="filters">
        <button class="btn" id="export">Export</button>
        <label class="btn">Import<input type="file" id="import" accept=".json,application/json" hidden></label>
      </div>
    </section>`;

  $app.querySelectorAll('[data-unsub]').forEach(b => b.onclick = () => {
    store.set('subs', getSubs().filter(c => c.id !== b.dataset.unsub));
    b.closest('.chip').remove();
  });
  document.getElementById('pause').onchange = e => store.set('settings', { ...settings(), pauseHistory: e.target.checked });
  document.getElementById('clear-history').onclick = () => {
    if (confirm('Clear your whole watch history?')) { store.set('history', []); route(); }
  };
  document.getElementById('takeout').onchange = e => importTakeout(e.target.files[0]);
  document.getElementById('export').onclick = () => {
    const blob = new Blob([JSON.stringify({ subs: getSubs(), later: getLater(), history: getHistory() }, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'tube-backup.json' });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById('import').onchange = async e => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      for (const key of ['subs', 'later', 'history']) if (Array.isArray(data[key])) store.set(key, data[key]);
      route();
    } catch {
      alert('That file isn\'t a Tube backup.');
    }
  };
}

async function importTakeout(file) {
  const status = document.getElementById('import-status');
  if (!file) return;
  const found = new Map();
  for (const line of (await file.text()).split(/\r?\n/)) {
    const m = /^(UC[\w-]{22}),[^,]*,(.*)$/.exec(line.trim());
    if (m) found.set(m[1], { id: m[1], title: m[2].replace(/^"|"$/g, '').replace(/""/g, '"'), thumb: '' });
  }
  if (!found.size) {
    status.textContent = 'No channels found in that file. It should be subscriptions.csv from Google Takeout.';
    return;
  }
  const merged = new Map(getSubs().map(s => [s.id, s]));
  for (const [id, s] of found) if (!merged.has(id)) merged.set(id, s);
  // Avatars aren't in the export; fetch them 50 at a time (1 unit per call).
  const missing = [...merged.values()].filter(s => !s.thumb).map(s => s.id);
  status.textContent = `Importing ${found.size} channels…`;
  try {
    for (let i = 0; i < missing.length; i += 50) {
      const d = await yt('channels', { part: 'snippet', id: missing.slice(i, i + 50).join(','), maxResults: 50 });
      for (const c of d.items || []) {
        merged.set(c.id, { id: c.id, title: c.snippet.title, thumb: bestThumb(c.snippet.thumbnails) });
      }
    }
  } catch { /* avatars are cosmetic; keep the import */ }
  store.set('subs', [...merged.values()].sort((a, b) => a.title.localeCompare(b.title)));
  store.del('feed');
  route();
}

function viewSettings() {
  const s = settings();
  document.title = 'Settings · Tube';
  $app.innerHTML = `<div class="settings">
    <h1>Settings</h1>
    <form id="settings-form">
      <label>YouTube Data API key
        <span class="row">
          <input id="key" type="password" value="${esc(s.apiKey)}" placeholder="AIza…" autocomplete="off" spellcheck="false">
          <button type="button" class="btn" id="show-key">Show</button>
          <button type="button" class="btn" id="test-key">Test</button>
        </span>
      </label>
      <p class="small" id="key-status"></p>
      <label>Region for Trending (two-letter country code)
        <input id="region" value="${esc(s.region)}" maxlength="2" pattern="[A-Za-z]{2}" required>
      </label>
      <label class="check"><input type="checkbox" id="autoplay"${s.autoplay ? ' checked' : ''}> Autoplay videos, and the next one in a playlist</label>
      <label class="check"><input type="checkbox" id="pause"${s.pauseHistory ? ' checked' : ''}> Pause watch history</label>
      <button class="btn primary" type="submit">Save</button>
      <span class="muted small" id="saved"></span>
    </form>

    <h2>Getting a key</h2>
    <ol class="steps">
      <li>Go to the <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">Google Cloud console</a> and create a project (any name).</li>
      <li>Open <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener">YouTube Data API v3</a> and click Enable.</li>
      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Credentials</a>, then Create credentials → API key.</li>
      <li>Recommended: edit the key, set "Application restrictions" to Websites and add <code>${esc(location.origin)}/*</code>,
        then under "API restrictions" allow only the YouTube Data API v3. That way the key is useless to anyone who finds it.</li>
      <li>Paste it above. It stays in this browser's localStorage and is only ever sent to googleapis.com.</li>
    </ol>
    <p class="muted small">The free quota is 10,000 units a day. Most things cost 1 unit; a search costs 100, so roughly 100 searches a day
      plus plenty of browsing. Nothing here signs in to your Google account, so your real YouTube subscriptions and history are untouched.</p>

    <h2>Data</h2>
    <button class="btn danger" id="wipe">Erase everything stored by this app</button>
  </div>`;

  const keyInput = document.getElementById('key');
  const keyStatus = document.getElementById('key-status');
  document.getElementById('show-key').onclick = e => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    e.target.textContent = keyInput.type === 'password' ? 'Show' : 'Hide';
  };
  const save = () => {
    store.set('settings', {
      ...settings(),
      apiKey: keyInput.value.trim(),
      region: document.getElementById('region').value.trim().toUpperCase() || 'US',
      autoplay: document.getElementById('autoplay').checked,
      pauseHistory: document.getElementById('pause').checked,
    });
    store.del('feed');
  };
  document.getElementById('test-key').onclick = async () => {
    save();
    keyStatus.textContent = 'Testing…';
    try {
      await yt('videos', { part: 'id', chart: 'mostPopular', maxResults: 1, regionCode: settings().region });
      keyStatus.textContent = 'The key works.';
      keyStatus.className = 'small ok';
    } catch (err) {
      keyStatus.textContent = err.message;
      keyStatus.className = 'small bad';
    }
  };
  document.getElementById('settings-form').onsubmit = e => {
    e.preventDefault();
    save();
    const saved = document.getElementById('saved');
    saved.textContent = 'Saved.';
    setTimeout(() => { saved.textContent = ''; }, 2000);
  };
  document.getElementById('wipe').onclick = () => {
    if (!confirm('Erase your API key, subscriptions, watch later list and history from this browser?')) return;
    for (const k of ['settings', 'subs', 'later', 'history', 'feed']) store.del(k);
    route();
  };
}

/* ---------- router ---------- */

const routes = [
  [/^\/$/, viewHome],
  [/^\/trending$/, ctx => viewTrending(ctx)],
  [/^\/search$/, viewSearch],
  [/^\/watch$/, viewWatch],
  [/^\/channel\/([^/]+)$/, viewChannel],
  [/^\/playlist\/([^/]+)$/, viewPlaylist],
  [/^\/library$/, viewLibrary],
  [/^\/settings$/, viewSettings],
];

let routeToken = 0;

async function route() {
  const token = ++routeToken;
  teardownPlayer();
  progressCache = null;
  const hash = location.hash.slice(1) || '/';
  const qIndex = hash.indexOf('?');
  const path = qIndex < 0 ? hash : hash.slice(0, qIndex);
  const params = new URLSearchParams(qIndex < 0 ? '' : hash.slice(qIndex + 1));
  document.title = 'Tube';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === path));
  if (path !== '/search') $q.value = '';
  window.scrollTo(0, 0);

  const match = routes.find(([re]) => re.test(path));
  if (!match) {
    $app.innerHTML = notice('<p>Page not found. <a href="#/">Go home</a></p>');
    return;
  }
  const args = path.match(match[0]).slice(1).map(decodeURIComponent);
  const ctx = { params, alive: () => token === routeToken };
  try {
    await match[1](ctx, ...args);
  } catch (err) {
    console.error(err);
    if (ctx.alive()) $app.innerHTML = errorBox(err);
  }
}

document.getElementById('search').addEventListener('submit', e => {
  e.preventDefault();
  const q = $q.value.trim();
  if (!q) return;
  $q.blur();
  location.hash = parseYouTubeUrl(q) || '#/search?q=' + encodeURIComponent(q);
});

// Timestamps in descriptions and comments seek the current player.
$app.addEventListener('click', e => {
  const ts = e.target.closest('a.ts');
  if (!ts) return;
  e.preventDefault();
  if (player?.seekTo) {
    player.seekTo(+ts.dataset.t, true);
    player.playVideo?.();
    document.querySelector('.player-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

document.addEventListener('keydown', e => {
  if (e.key === '/' && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    $q.focus();
    $q.select();
  }
});

window.addEventListener('hashchange', route);
window.addEventListener('pagehide', () => player?._tubeTick?.());
route();
