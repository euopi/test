'use strict';

// A YouTube client that runs entirely in the browser. Metadata comes from the
// YouTube Data API v3 (your own key, or a Google sign-in), playback from the
// embedded player. Signed in, subscriptions, ratings, comments and playlists
// act on your real account; watch later and history always live in
// localStorage, since the API exposes neither.

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

const DEFAULT_SETTINGS = { apiKey: '', clientId: '', region: 'US', autoplay: true, pauseHistory: false, hideShorts: true, explore: 50, smartMatch: true };
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

function accessError() {
  return isSignedIn()
    ? new ApiError('Your Google sign-in expired (they last an hour).', 'authExpired', 401)
    : new ApiError('No API key set.', 'noKey', 0);
}

// Reads use the sign-in token while it's valid and the API key otherwise.
// auth: true means the call only makes sense for the signed-in account.
async function yt(endpoint, params = {}, { method = 'GET', body, auth = false, keyOnly = false } = {}) {
  const token = keyOnly ? null : validToken();
  const { apiKey } = settings();
  if (auth && !token) throw isSignedIn() ? accessError() : new ApiError('Sign in to do that.', 'signedOut', 401);
  if (!token && !apiKey) throw keyOnly ? new ApiError('No API key set.', 'noKey', 0) : accessError();
  const url = new URL(API + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  else url.searchParams.set('key', apiKey);
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    throw new ApiError('Network error reaching the YouTube API.', 'network', 0);
  }
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      store.set('auth', { ...getAuth(), exp: 0 });
      throw accessError();
    }
    const e = data.error || {};
    throw new ApiError(e.message || res.statusText, e.errors?.[0]?.reason || '', res.status);
  }
  return data;
}

/* ---------- Google sign-in ---------- */

// force-ssl covers reading the account plus subscribing, rating, commenting
// and editing playlists.
const SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
let gisPromise = null;
let tokenClient = null;
let pendingAuth = null;

const getAuth = () => store.get('auth', null);
const isSignedIn = () => !!getAuth();
const canSignIn = () => !!settings().clientId;
const hasAccess = () => !!(settings().apiKey || validToken());

function validToken() {
  const a = getAuth();
  return a?.token && a.exp - 60e3 > Date.now() ? a.token : null;
}

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = () => { gisPromise = null; reject(new Error('Could not load Google sign-in.')); };
    document.head.append(s);
  });
  return gisPromise;
}

function settleAuth(fn) {
  const p = pendingAuth;
  pendingAuth = null;
  if (p) fn(p);
}

function getTokenClient() {
  const { clientId } = settings();
  if (!clientId) throw new ApiError('Add an OAuth client ID in Settings to sign in.', 'noClientId', 0);
  if (!window.google?.accounts?.oauth2) {
    loadGis().catch(() => {});
    throw new ApiError('Google sign-in is still loading. Try again in a second.', 'gisLoading', 0);
  }
  if (tokenClient?.clientId !== clientId) {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: resp => settleAuth(p => resp.error
        ? p.reject(new ApiError(resp.error_description || resp.error, 'authFailed', 0))
        : p.resolve(resp)),
      error_callback: err => settleAuth(p => p.reject(new ApiError(
        err.type === 'popup_closed' ? 'The sign-in window was closed.'
          : err.type === 'popup_failed_to_open' ? 'Your browser blocked the sign-in popup.'
          : err.message || 'Sign-in failed.', 'authFailed', 0))),
    });
    tokenClient = { clientId, client };
  }
  return tokenClient.client;
}

// Must start straight from a click (or submit) handler, before any await,
// or the browser blocks Google's popup.
async function signIn() {
  const client = getTokenClient();
  const prev = getAuth();
  const resp = await new Promise((resolve, reject) => {
    pendingAuth?.reject(new ApiError('Sign-in was restarted.', 'authFailed', 0));
    pendingAuth = { resolve, reject };
    client.requestAccessToken({ prompt: prev ? '' : 'consent' });
  });
  if (!google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPE)) {
    throw new ApiError('YouTube access wasn\'t granted. Tick the YouTube box on Google\'s consent screen.', 'authFailed', 0);
  }
  store.set('auth', { ...prev, token: resp.access_token, exp: Date.now() + resp.expires_in * 1000 });
  let user = { id: '', name: 'Your account', thumb: '' };
  try {
    const c = (await yt('channels', { part: 'snippet', mine: true }, { auth: true })).items?.[0];
    if (c) user = { id: c.id, name: c.snippet.title, thumb: bestThumb(c.snippet.thumbnails) };
  } catch {}
  if (prev?.user && prev.user.id !== user.id) store.del('feed');
  store.set('auth', { ...getAuth(), user });
  renderAccount();
}

function signOut() {
  const token = getAuth()?.token;
  if (token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(token, () => {});
  for (const k of ['auth', 'acctSubs', 'feed']) store.del(k);
  renderAccount();
}

async function withAuth(fn) {
  if (!validToken()) await signIn();
  return fn();
}

// Click handler for an account action: signs in first if needed, and
// reports failures instead of leaving the button stuck.
const action = (btn, fn) => () => {
  btn.disabled = true;
  withAuth(fn).catch(err => toast(err.message)).finally(() => { btn.disabled = false; });
};

function renderAccount() {
  const el = document.getElementById('account');
  const user = getAuth()?.user;
  if (user) {
    el.innerHTML = `<a href="#/library" class="acct" title="${esc(user.name)}">${user.thumb
      ? `<img class="avatar sm" src="${esc(user.thumb)}" alt="${esc(user.name)}">` : esc(user.name)}</a>`;
  } else if (canSignIn()) {
    el.innerHTML = '<button class="btn primary" data-signin>Sign in</button>';
  } else {
    el.innerHTML = '';
  }
}

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: 'toast', className: 'toast', role: 'status' });
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 4000);
}

// The signed-in account's subscriptions, cached for 6 hours. With an expired
// token the cached copy is still good enough to build the feed.
async function accountSubs() {
  const user = getAuth()?.user?.id || '';
  const cached = store.get('acctSubs');
  if (cached?.user === user && (!validToken() || Date.now() - cached.at < 6 * 3600e3)) return cached.subs;
  const subs = [];
  let pageToken;
  do {
    const d = await yt('subscriptions', { part: 'snippet', mine: true, maxResults: 50, order: 'alphabetical', pageToken }, { auth: true });
    for (const s of d.items || []) {
      subs.push({ id: s.snippet.resourceId.channelId, title: s.snippet.title, thumb: bestThumb(s.snippet.thumbnails), subId: s.id });
    }
    pageToken = d.nextPageToken;
  } while (pageToken);
  store.set('acctSubs', { user, at: Date.now(), subs });
  return subs;
}

function updateAccountSubs(fn) {
  const c = store.get('acctSubs');
  if (c) store.set('acctSubs', { ...c, subs: fn(c.subs) });
  store.del('feed');
}

// Wires a Subscribe button. Signed in it acts on the real account, otherwise
// on the local list. ch.thumb may be filled in after the call.
function mountSubButton(btn, ch) {
  const paint = on => {
    btn.textContent = on ? 'Subscribed' : 'Subscribe';
    btn.classList.toggle('primary', !on);
  };
  if (!isSignedIn()) {
    paint(isSubbed(ch.id));
    btn.onclick = () => paint(toggleSub(ch));
    return;
  }
  let subId = store.get('acctSubs')?.subs.find(s => s.id === ch.id)?.subId || null;
  paint(!!subId);
  if (validToken()) {
    yt('subscriptions', { part: 'id', mine: true, forChannelId: ch.id }, { auth: true })
      .then(d => { subId = d.items?.[0]?.id || null; paint(!!subId); })
      .catch(() => {});
  }
  btn.onclick = action(btn, async () => {
    if (subId) {
      await yt('subscriptions', { id: subId }, { method: 'DELETE', auth: true });
      subId = null;
      updateAccountSubs(subs => subs.filter(s => s.id !== ch.id));
    } else {
      const d = await yt('subscriptions', { part: 'snippet' }, {
        method: 'POST', auth: true,
        body: { snippet: { resourceId: { kind: 'youtube#channel', channelId: ch.id } } },
      });
      subId = d.id;
      updateAccountSubs(subs => [...subs.filter(s => s.id !== ch.id), { id: ch.id, title: ch.title, thumb: ch.thumb, subId }]
        .sort((a, b) => a.title.localeCompare(b.title)));
    }
    paint(!!subId);
  });
}

function bestThumb(t = {}) {
  return (t.medium || t.high || t.standard || t.default || t.maxres || {}).url || '';
}

// Asking for the embed size makes the API report the video's real shape,
// which is the only reliable way to spot a Short: vertical and 3 min or less.
const LIST_PARTS = { part: 'snippet,statistics,contentDetails,player', maxWidth: 1000 };

function toVideo(item) {
  const sn = item.snippet || {}, st = item.statistics || {}, cd = item.contentDetails || {}, pl = item.player || {};
  const duration = parseDuration(cd.duration);
  const vertical = pl.embedWidth && pl.embedHeight ? +pl.embedHeight > +pl.embedWidth : null;
  const hashtag = /#shorts?\b/i.test(`${sn.title} ${sn.description}`);
  return {
    id: item.id,
    title: sn.title,
    channelId: sn.channelId,
    channelTitle: sn.channelTitle,
    publishedAt: sn.publishedAt,
    thumb: bestThumb(sn.thumbnails),
    duration,
    short: duration > 0 && duration <= 180 && ((vertical ?? duration <= 60) || hashtag),
    views: st.viewCount,
    likes: st.likeCount,
    comments: st.commentCount,
    live: sn.liveBroadcastContent,
    description: sn.description,
    categoryId: sn.categoryId,
    tags: sn.tags,
  };
}

// Strip the fields we don't want copied into localStorage for every video.
const slim = ({ description, likes, comments, tags, src, ...v }) => v;
// Recommendation candidates keep a few tags for matching.
const recoSlim = v => ({ ...slim(v), tags: (v.tags || []).slice(0, 15) });

// Fetch full video objects for a list of IDs, preserving order and
// dropping anything private or deleted.
async function hydrate(ids) {
  ids = [...new Set(ids.filter(Boolean))];
  const found = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const data = await yt('videos', {
      ...LIST_PARTS,
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

// Older cached videos predate the "short" flag; guess from length.
const isShort = v => v.short ?? (v.duration > 0 && v.duration <= 60);
const noShorts = videos => (settings().hideShorts ? videos.filter(v => !isShort(v)) : videos);

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

/* ---------- recommendations ---------- */

// A taste profile learned in the browser: weights per channel, category and
// topic (title words and tags). Watching, finishing, liking and "Not
// interested" adjust them; everything halves in weight every 45 days so
// old phases fade out. The home feed scores candidate videos against it.

const HOUR = 3600e3;
const DAY = 24 * HOUR;

const STOPWORDS = new Set(`the and for with you your that this from are was were what when where which who why how not
  but all any can has have had its into out our their them they then there these those than too very just about after
  before more most some such only own same other over under again also been being both each few off once here did does
  doing down during until while above below between through against because could would should might will shall may must
  ever every new official video videos full episode part live feat feat. ft vs hd 4k music lyrics lyric audio trailer
  clip clips shorts short best top make made watch today day days year years one two three first last get got let lets
  ill youre dont cant wont isnt im ive del los las por para con una uno que les des est pour dans sur aux pas plus elle`
  .split(/\s+/));

function tokenize(text) {
  return String(text || '').toLowerCase().normalize('NFKC').split(/[^\p{L}\p{N}']+/u)
    .map(t => t.replace(/'/g, ''))
    .filter(t => t.length >= 3 && !/^\d+$/.test(t) && !STOPWORDS.has(t));
}

function termsFor(v) {
  const out = new Set(tokenize(v.title));
  for (const tag of (v.tags || []).slice(0, 15)) {
    const t = String(tag).toLowerCase().trim();
    if (t.length >= 3 && t.length <= 30 && !STOPWORDS.has(t)) out.add(t);
  }
  return [...out].slice(0, 30);
}

const emptyProfile = () => ({ channels: {}, names: {}, categories: {}, terms: {}, watches: 0, at: Date.now() });

function loadProfile() {
  const p = { ...emptyProfile(), ...store.get('profile', {}) };
  const f = 0.5 ** ((Date.now() - p.at) / (45 * DAY));
  if (f < 0.999) {
    for (const k of ['channels', 'categories', 'terms']) for (const id in p[k]) p[k][id] *= f;
    p.at = Date.now();
  }
  return p;
}

const hasProfile = p => Object.keys(p.channels).length > 0;
const topEntries = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);

function prune(map, n) {
  return Object.fromEntries(Object.entries(map)
    .filter(([, w]) => Math.abs(w) >= 0.01)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, n));
}

function saveProfile(p) {
  p.channels = prune(p.channels, 400);
  p.categories = prune(p.categories, 40);
  p.terms = prune(p.terms, 1500);
  p.names = Object.fromEntries(Object.keys(p.channels).filter(id => p.names[id]).map(id => [id, p.names[id]]));
  store.set('profile', p);
}

const bump = (map, key, by) => { if (key) map[key] = (map[key] || 0) + by; };

function applySignal(p, v, amount) {
  bump(p.channels, v.channelId, amount);
  if (v.channelId && v.channelTitle) p.names[v.channelId] = v.channelTitle;
  bump(p.categories, v.categoryId, amount * 0.6);
  const terms = termsFor(v);
  const each = amount * 0.8 / Math.sqrt(terms.length || 1);
  for (const t of terms) bump(p.terms, t, each);
}

function learn(v, amount, isWatch = false) {
  if (!v || !amount || settings().pauseHistory) return;
  const p = loadProfile();
  applySignal(p, v, amount);
  if (isWatch) p.watches++;
  saveProfile(p);
}

// Watching counts a little on its own; finishing or bailing early adds or
// takes away more when you leave the page.
let watching = null;
function endWatch() {
  const v = watching;
  watching = null;
  if (!v) return;
  const h = getHistory().find(x => x.id === v.id);
  if (!h?.duration) return;
  const frac = h.progress / h.duration;
  if (frac >= 0.6) learn(v, 1);
  else if (frac < 0.15 && h.duration > 90) learn(v, -0.7);
}

const comp = w => (w ? Math.sign(w) * Math.log1p(Math.abs(w)) : 0);

function hashUnit(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

// How well a video's topics match yours: the summed weight of the topics it
// shares with your profile, and how many of them are clearly yours.
function topicMatch(v, p) {
  const terms = termsFor(v);
  let sum = 0, matched = 0;
  for (const t of terms) {
    const w = p.terms[t] || 0;
    sum += comp(w);
    if (w > 0.3) matched++;
  }
  return { score: sum / Math.sqrt(terms.length || 1), matched };
}

const isFamiliar = (v, p, subIds) => subIds.has(v.channelId) || (p.channels[v.channelId] || 0) > 0.5;

// Topic match counts for more than channel loyalty, so a strong match from a
// new channel can beat a so-so upload from one you watch.
function scoreVideo(v, p, subIds, day, match, meaning) {
  const ageDays = Math.max(0, (Date.now() - Date.parse(v.publishedAt)) / DAY) || 0;
  return (meaning == null ? 0 : 5 * (meaning - MEANING_BASE))
    + 0.6 * comp(p.channels[v.channelId] || 0)
    + 0.4 * comp(p.categories[v.categoryId] || 0)
    + 1.2 * match.score
    + (subIds.has(v.channelId) ? 0.4 : 0)
    + 1.0 * Math.exp(-ageDays / 7)
    + 0.08 * Math.log10(1 + (+v.views || 0))
    + 0.25 * (hashUnit(v.id + day) - 0.5); // a little daily shuffle
}

function whyFor(v, familiar, subIds, byMeaning) {
  if (subIds.has(v.channelId)) return '';
  if (familiar) return 'From a channel you watch';
  if (byMeaning) return 'Similar to videos you\'ve watched';
  return v.why || '';
}

// Videos shown on four different days without being opened drop out, so the
// feed doesn't keep offering the same things.
function recordImpressions(videos, day) {
  const seen = store.get('reco:seen', {});
  for (const v of videos) {
    const s = seen[v.id] ||= { days: 0, last: '' };
    if (s.last !== day) { s.days++; s.last = day; }
  }
  store.set('reco:seen', Object.fromEntries(Object.entries(seen).slice(-1500)));
}

// Best scores first, with no channel hogging the feed and a share of slots
// (the "familiar vs. new" setting) kept for channels you don't already watch.
function rankFeed(candidates, p, subIds, meaning = null) {
  const hidden = new Set(store.get('reco:hidden', []));
  const watched = new Map(getHistory().map(h => [h.id, h]));
  const seen = store.get('reco:seen', {});
  const day = new Date().toDateString();
  const learned = hasProfile(p);
  const byId = new Map();
  for (const v of candidates) {
    if (!v?.id || byId.has(v.id) || hidden.has(v.id) || v.live === 'upcoming') continue;
    if (settings().hideShorts && isShort(v)) continue;
    const h = watched.get(v.id);
    if (h && (!h.duration || h.progress / h.duration > 0.5)) continue;
    if ((p.channels[v.channelId] || 0) < -3.5) continue; // "Not interested" twice, roughly
    if ((seen[v.id]?.days || 0) >= 4) continue;
    const familiar = isFamiliar(v, p, subIds);
    const match = topicMatch(v, p);
    const sem = meaning?.get(v.id) ?? null;
    // A channel you don't know has to be clearly on-topic to get in, by
    // shared topics or by meaning. This is what keeps random chart videos
    // out. With smart matching on, a keyword hit that means something else
    // ("build" a PC vs. "build" in Minecraft) is turned away too.
    const byWords = match.matched >= 2 || (match.matched === 1 && (p.categories[v.categoryId] || 0) > 1);
    const byMeaning = sem != null && sem >= MEANING_ADMIT;
    if (learned && !familiar && !(byWords && (sem == null || sem >= MEANING_VETO)) && !byMeaning) continue;
    byId.set(v.id, { v, familiar, byMeaning: byMeaning && !byWords, score: scoreVideo(v, p, subIds, day, match, sem) });
  }
  const items = [...byId.values()];
  const perChannel = new Map();
  const pick = want => {
    let best = -1, bestScore = -Infinity;
    items.forEach((it, i) => {
      if (!want(it)) return;
      const adj = it.score - 0.8 * (perChannel.get(it.v.channelId) || 0);
      if (adj > bestScore) { bestScore = adj; best = i; }
    });
    return best;
  };
  const explore = settings().explore / 100;
  const out = [];
  for (let n = 0; out.length < 96 && items.length; n++) {
    const wantNew = Math.floor((n + 1) * explore) > Math.floor(n * explore);
    let i = pick(it => it.familiar !== wantNew);
    if (i < 0) i = pick(() => true);
    const [it] = items.splice(i, 1);
    perChannel.set(it.v.channelId, (perChannel.get(it.v.channelId) || 0) + 1);
    out.push({ ...it.v, why: whyFor(it.v, it.familiar, subIds, it.byMeaning) });
  }
  recordImpressions(out.slice(0, 24), day);
  return out;
}

async function cachedSource(name, ttl, fetcher) {
  const cached = store.get('reco:' + name);
  if (cached && Date.now() - cached.at < ttl) return cached.videos;
  try {
    const videos = (await fetcher()).map(v => ({ ...recoSlim(v), src: name }));
    store.set('reco:' + name, { at: Date.now(), videos });
    return videos;
  } catch (err) {
    if (cached) return cached.videos;
    throw err;
  }
}

function clearRecoCache({ all = false } = {}) {
  for (const k of ['channels', 'categories', 'trending']) store.del('reco:' + k);
  if (all) for (const k of ['neighbors', 'topics', 'searched', 'hidden', 'seen', 'dismissed']) store.del('reco:' + k);
  store.del('feed');
}

async function latestUploads(channelIds, per) {
  const ids = [];
  await pool(channelIds, 6, async id => {
    try {
      const d = await yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + id.slice(2), maxResults: per });
      ids.push(...(d.items || []).map(i => i.contentDetails.videoId));
    } catch (err) {
      if (err.status !== 404) throw err;
    }
  });
  return hydrate(ids);
}

async function categoryNames() {
  let names = store.get('catNames', null);
  if (!names) {
    const d = await yt('videoCategories', { part: 'snippet', regionCode: settings().region });
    names = Object.fromEntries((d.items || []).map(c => [c.id, c.snippet.title]));
    store.set('catNames', names);
  }
  return names;
}

async function categoryTrending(p) {
  const names = await categoryNames().catch(() => ({}));
  const out = [];
  for (const [id] of topEntries(p.categories, 3).filter(([, w]) => w > 0)) {
    try {
      const d = await yt('videos', {
        ...LIST_PARTS, chart: 'mostPopular', videoCategoryId: id,
        regionCode: settings().region, maxResults: 25,
      });
      const why = names[id] ? `Popular in ${names[id]}` : 'Popular in a category you watch';
      out.push(...(d.items || []).map(toVideo).map(v => ({ ...v, why })));
    } catch { /* some categories have no chart */ }
  }
  return out;
}

// Channels featured on the pages of channels you like, minus ones you know.
async function neighborUploads(seeds, known, names) {
  const found = new Map(); // new channel -> the channel that featured it
  await pool(seeds.slice(0, 8), 4, async id => {
    try {
      const d = await yt('channelSections', { part: 'contentDetails', channelId: id });
      for (const s of d.items || []) {
        for (const c of s.contentDetails?.channels || []) if (!known.has(c) && !found.has(c)) found.set(c, id);
      }
    } catch {}
  });
  const picks = [...found.keys()].sort(() => Math.random() - 0.5).slice(0, 15);
  const videos = picks.length ? await latestUploads(picks, 3) : [];
  return videos.map(v => {
    const by = names[found.get(v.channelId)];
    return { ...v, why: by ? `Featured by ${by}` : 'Similar to channels you watch' };
  });
}

// Specific searches built from your taste: the strongest topics that appear
// together in videos you finished, then your strongest multi-word tags. Plain
// single words only as a last resort, since they search too broadly.
function searchQueries(p, searched) {
  const now = Date.now();
  const usable = q => q && now - (searched[q] || 0) > 3 * DAY;
  const fromWatched = [], fromTags = [], fromWords = [];
  for (const h of getHistory().filter(h => h.duration && h.progress / h.duration >= 0.6).slice(0, 30)) {
    const terms = [...new Set(tokenize(h.title))].filter(t => (p.terms[t] || 0) > 0.3)
      .sort((a, b) => p.terms[b] - p.terms[a]).slice(0, 3);
    if (terms.length >= 2) fromWatched.push(terms.join(' '));
  }
  for (const [t, w] of topEntries(p.terms, 300)) {
    if (w <= 0) break;
    if (t.includes(' ')) fromTags.push(t);
    else if (t.length >= 5) fromWords.push(t);
  }
  const out = [];
  for (const list of [fromWatched.slice(0, 2), fromTags.slice(0, 3), fromWatched.slice(2), fromTags.slice(3), fromWords]) {
    for (const q of list) if (out.length < 4 && usable(q) && !out.includes(q)) out.push(q);
  }
  return out;
}

// Four searches a day (400 quota units), each query rested for three days.
async function topicSearches(p) {
  const searched = store.get('reco:searched', {});
  const now = Date.now();
  const reason = new Map();
  for (const q of searchQueries(p, searched)) {
    const d = await yt('search', {
      part: 'snippet', q, type: 'video', maxResults: 15, regionCode: settings().region,
      publishedAfter: new Date(now - 365 * DAY).toISOString(),
    });
    for (const i of d.items || []) if (!reason.has(i.id.videoId)) reason.set(i.id.videoId, q);
    searched[q] = now;
  }
  store.set('reco:searched', Object.fromEntries(Object.entries(searched).filter(([, at]) => now - at < 14 * DAY)));
  return (await hydrate([...reason.keys()])).map(v => ({ ...v, why: `Related to "${reason.get(v.id)}"` }));
}

async function recommendations(subs, p, onStatus) {
  const subIds = new Set(subs.map(s => s.id));
  const learned = hasProfile(p);
  const topChannels = topEntries(p.channels, 30).filter(([, w]) => w > 0).map(([id]) => id);
  const known = new Set([...subIds, ...topChannels]);
  const names = { ...p.names, ...Object.fromEntries(subs.map(s => [s.id, s.title])) };
  const results = await Promise.allSettled([
    subs.length ? subscriptionFeed(subs) : [],
    cachedSource('channels', 3 * HOUR, () => {
      const ids = topChannels.filter(id => !subIds.has(id)).slice(0, 8);
      return ids.length ? latestUploads(ids, 5) : [];
    }),
    cachedSource('categories', 6 * HOUR, () => categoryTrending(p)),
    // The general chart is only a stand-in until there's a profile to go on.
    learned ? [] : cachedSource('trending', 6 * HOUR, async () => ((await yt('videos', {
      ...LIST_PARTS, chart: 'mostPopular', regionCode: settings().region, maxResults: 30,
    })).items || []).map(toVideo)),
    cachedSource('neighbors', DAY, () => neighborUploads(topChannels.length ? topChannels : [...subIds], known, names)),
    learned ? cachedSource('topics', DAY, () => topicSearches(p)) : [],
  ]);
  const ok = results.filter(r => r.status === 'fulfilled');
  if (!ok.length) throw results[0].reason;
  const candidates = ok.flatMap(r => r.value);
  const meaning = await semanticScores(candidates, onStatus);
  return rankFeed(candidates, p, subIds, meaning);
}

/* ---------- smart matching ---------- */

// A small multilingual language model (paraphrase-multilingual-MiniLM-L12-v2,
// ~118 MB, cached by the browser after the first download) turns each title
// into a "meaning" vector, so a video can match your history even when it
// shares no words with it, including across languages. Vectors are kept in
// IndexedDB, keyed by model, so each video is only processed once.

const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
const EMBED_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
let embedderPromise = null;

function loadEmbedder(onProgress) {
  embedderPromise ||= (async () => {
    const { pipeline, env } = await import(TRANSFORMERS_URL);
    env.allowLocalModels = false;
    const files = new Map();
    return pipeline('feature-extraction', EMBED_MODEL, {
      dtype: 'q8',
      progress_callback: e => {
        if (e.status !== 'progress' || !e.total) return;
        files.set(e.file, [e.loaded, e.total]);
        const [loaded, total] = [...files.values()].reduce((a, [l, t]) => [a[0] + l, a[1] + t], [0, 0]);
        onProgress?.(loaded / total);
      },
    });
  })();
  embedderPromise.catch(() => { embedderPromise = null; });
  return embedderPromise;
}

const vectorStore = (() => {
  let dbPromise = null;
  const memory = new Map(); // fallback when IndexedDB is unavailable
  const open = () => dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open('tube', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('vectors');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise(resolve => {
      const tx = db.transaction('vectors', mode);
      const result = fn(tx.objectStore('vectors'));
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => resolve(result);
    });
  };
  return {
    async getMany(keys) {
      try {
        return await run('readonly', st => {
          const out = new Map();
          for (const k of keys) {
            const req = st.get(k);
            req.onsuccess = () => { if (req.result) out.set(k, req.result); };
          }
          return out;
        });
      } catch {
        return new Map(keys.filter(k => memory.has(k)).map(k => [k, memory.get(k)]));
      }
    },
    async putMany(entries) {
      for (const [k, v] of entries) memory.set(k, v);
      try { await run('readwrite', st => { for (const [k, v] of entries) st.put(v, k); }); } catch {}
    },
    async clear() {
      memory.clear();
      try { await run('readwrite', st => st.clear()); } catch {}
    },
  };
})();

const embedText = v => [v.title, ...(v.tags || []).slice(0, 5)].filter(Boolean).join(' | ');

// Vectors for every video, keyed by video ID, computing only the missing ones.
async function embedAll(videos, onStatus) {
  const unique = [...new Map(videos.filter(v => v?.id && v.title).map(v => [v.id, v])).values()];
  const key = id => EMBED_MODEL + ':' + id;
  const stored = await vectorStore.getMany(unique.map(v => key(v.id)));
  const vecs = new Map([...stored].map(([k, vec]) => [k.slice(EMBED_MODEL.length + 1), vec]));
  const missing = unique.filter(v => !vecs.has(v.id));
  if (!missing.length) return vecs;
  const extractor = await loadEmbedder(f => onStatus?.(`Downloading the matching model (first time only)… ${Math.round(f * 100)}%`));
  for (let i = 0; i < missing.length; i += 32) {
    onStatus?.(`Matching videos to your taste… ${Math.min(100, Math.round(i / missing.length * 100))}%`);
    const batch = missing.slice(i, i + 32);
    const out = await extractor(batch.map(embedText), { pooling: 'mean', normalize: true });
    const dim = out.dims[1];
    const fresh = batch.map((v, j) => [v.id, out.data.slice(j * dim, (j + 1) * dim)]);
    fresh.forEach(([id, vec]) => vecs.set(id, vec));
    await vectorStore.putMany(fresh.map(([id, vec]) => [key(id), vec]));
  }
  return vecs;
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// For each candidate: how close it is in meaning to the most similar things
// you've watched (mostly the single closest, so one strong interest isn't
// diluted by your others; recent and finished ones count a bit more), minus
// a penalty if it resembles something you marked "Not interested". Measured
// on real English, Spanish and French titles: unrelated videos mostly land
// at 0.15-0.25, related ones 0.36-0.65 (see the thresholds below). null when
// smart matching is off, there's too little history, or the model can't load.
const MEANING_ADMIT = 0.36; // close enough to let in a channel you don't know
const MEANING_VETO = 0.24;  // below this, a keyword match is a false alarm
const MEANING_BASE = 0.28;  // roughly where "unrelated" ends
async function semanticScores(candidates, onStatus) {
  const history = getHistory().slice(0, 300);
  if (!settings().smartMatch || history.length < 3) return null;
  const dismissed = store.get('reco:dismissed', []);
  try {
    const vecs = await embedAll([...history, ...dismissed, ...candidates], onStatus);
    const now = Date.now();
    const refs = history.filter(h => vecs.has(h.id)).map(h => ({
      vec: vecs.get(h.id),
      w: 0.8 + 0.1 * (h.duration && h.progress / h.duration >= 0.6 ? 1 : 0) + 0.1 * 0.5 ** ((now - (h.watchedAt || now)) / (45 * DAY)),
    }));
    const negs = dismissed.map(d => vecs.get(d.id)).filter(Boolean);
    const scores = new Map();
    for (const c of candidates) {
      const vec = vecs.get(c.id);
      if (!vec) continue;
      const [first = 0, second = first] = refs.map(r => dot(vec, r.vec) * r.w).sort((a, b) => b - a);
      let score = 0.7 * first + 0.3 * second;
      const worst = negs.reduce((m, n) => Math.max(m, dot(vec, n)), 0);
      if (worst > 0.5) score -= (worst - 0.5) * 1.5;
      scores.set(c.id, score);
    }
    return scores;
  } catch (err) {
    console.warn('Smart matching unavailable:', err);
    return null;
  } finally {
    onStatus?.('');
  }
}

// Google Takeout's watch-history.json (or .html). Rebuilds the profile from
// it, weighting recent watches more, and fills in categories and tags for the
// latest 1,000 videos (20 quota units).
async function importWatchHistory(file, status) {
  status.textContent = 'Reading your history…';
  const text = await file.text();
  const entries = [];
  const watchId = url => /[?&]v=([\w-]{11})/.exec(url || '')?.[1];
  const channelId = url => /channel\/(UC[\w-]{22})/.exec(url || '')?.[1] || '';
  if (/^\s*\[/.test(text)) {
    for (const e of JSON.parse(text)) {
      const id = watchId(e.titleUrl);
      if (!id || e.details?.some(d => /ads/i.test(d.name))) continue;
      entries.push({
        id, title: String(e.title || '').replace(/^Watched\s+/, ''),
        channelId: channelId(e.subtitles?.[0]?.url), channelTitle: e.subtitles?.[0]?.name || '',
        time: Date.parse(e.time) || 0,
      });
    }
  } else {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    for (const cell of doc.querySelectorAll('.content-cell')) {
      const links = cell.querySelectorAll('a');
      const id = watchId(links[0]?.getAttribute('href'));
      if (!id || /From Google Ads/i.test((cell.closest('.outer-cell') || cell.parentElement)?.textContent)) continue;
      const lastText = [...cell.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).pop();
      entries.push({
        id, title: links[0].textContent, channelId: channelId(links[1]?.getAttribute('href')),
        channelTitle: links[1]?.textContent || '', time: Date.parse(lastText) || 0,
      });
    }
  }
  if (!entries.length) {
    status.textContent = 'No watched videos found. Pick watch-history.json or watch-history.html from the Takeout "history" folder.';
    return;
  }

  const now = Date.now();
  // Takeout lists newest first; without a parseable date, use the position.
  const weight = (e, i) => Math.max(0.03, 0.5 ** ((e.time ? (now - e.time) / DAY : i / 20) / 120));
  const p = emptyProfile();
  entries.forEach((e, i) => {
    const w = weight(e, i);
    bump(p.channels, e.channelId, w);
    if (e.channelId && e.channelTitle) p.names[e.channelId] = e.channelTitle;
    const terms = tokenize(e.title);
    for (const t of terms) bump(p.terms, t, w * 0.5 / Math.sqrt(terms.length || 1));
  });

  const recent = [];
  const seen = new Set();
  entries.forEach((e, i) => {
    if (recent.length < 1000 && !seen.has(e.id)) { seen.add(e.id); recent.push([e, i]); }
  });
  let detailed = 0;
  if (hasAccess()) {
    status.textContent = `Found ${entries.length.toLocaleString()} watches. Fetching details for the latest ${recent.length}…`;
    try {
      const videos = new Map((await hydrate(recent.map(([e]) => e.id))).map(v => [v.id, v]));
      const history = new Map(getHistory().map(h => [h.id, h]));
      for (const [e, i] of recent) {
        const v = videos.get(e.id);
        if (!v) continue;
        detailed++;
        const w = weight(e, i);
        bump(p.categories, v.categoryId, w * 0.6);
        const tags = termsFor({ title: '', tags: v.tags });
        for (const t of tags) bump(p.terms, t, w * 0.4 / Math.sqrt(tags.length || 1));
        if (history.size < 300 && !history.has(v.id)) {
          history.set(v.id, { ...slim(v), watchedAt: e.time || now - i * 60e3, progress: v.duration });
        }
      }
      store.set('history', [...history.values()].sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 300));
    } catch { /* channel and title signals are still useful on their own */ }
  }
  p.watches = entries.length;
  p.importedAt = now;
  p.imported = entries.length;
  saveProfile(p);
  clearRecoCache({ all: true });
  status.textContent = `Imported ${entries.length.toLocaleString()} watches across ${Object.keys(p.channels).length} channels`
    + (detailed ? `, with full details for ${detailed}.` : '.');
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
      <p><a class="btn primary" href="#/settings">Open settings</a>
      ${canSignIn() ? ' <button class="btn" data-signin>Or sign in with Google</button>' : ''}</p>`);
  }
  if (err.reason === 'authExpired' || err.reason === 'signedOut') {
    return notice(`<h2>${err.reason === 'authExpired' ? 'Sign in again' : 'Sign in'}</h2><p>${esc(err.message)}</p>
      <p><button class="btn primary" data-signin>Sign in with Google</button></p>`);
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

function videoCard(v, { list, dismiss } = {}) {
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
      ${v.why ? `<div class="why">${esc(v.why)}</div>` : ''}
    </div>
    ${dismiss ? `<button class="dismiss" data-dismiss="${esc(v.id)}" title="Not interested" aria-label="Not interested">×</button>` : ''}
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
      if (!grid.children.length && !next) grid.insertAdjacentHTML('afterend', `<p class="muted empty">${esc(emptyText)}</p>`);
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
  // iframe_api pulls in a second script; if that one is blocked, the ready
  // callback never fires, so give up after a few seconds.
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
  return Promise.race([ytApiPromise, timeout]);
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
  } catch {
    // Blockers often stop youtube.com/iframe_api but let the embed through.
    if (ctx.alive()) mountBarePlayer(id, start, onEnd);
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

// The embed without YouTube's helper script. It speaks the same postMessage
// protocol the script uses, so seeking, resume tracking and autoplay-next
// keep working; if the messages go unanswered, the video still plays.
const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

function mountBarePlayer(id, start, onEnd) {
  const src = `${EMBED_ORIGIN}/embed/${encodeURIComponent(id)}?` + new URLSearchParams({
    autoplay: settings().autoplay ? 1 : 0, start: Math.floor(start), rel: 0, playsinline: 1,
    enablejsapi: 1, origin: location.origin,
  });
  const frame = Object.assign(document.createElement('iframe'), {
    id: 'player', src, allowFullscreen: true, referrerPolicy: 'strict-origin-when-cross-origin',
  });
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  document.getElementById('player').replaceWith(frame);

  let currentTime = 0, duration = 0;
  const send = msg => frame.contentWindow?.postMessage(JSON.stringify({ id: 1, channel: 'widget', ...msg }), EMBED_ORIGIN);
  const onMessage = e => {
    if (e.origin !== EMBED_ORIGIN || e.source !== frame.contentWindow) return;
    let data;
    try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
    const info = data?.info;
    if (data?.event === 'onError') {
      player?.onBareError?.(info);
      return;
    }
    if (!info || typeof info !== 'object') {
      if (data?.event === 'onStateChange' && info === 0) ended();
      return;
    }
    if (typeof info.currentTime === 'number') currentTime = info.currentTime;
    if (typeof info.duration === 'number' && info.duration) duration = info.duration;
    if (info.playerState === 0) ended();
  };
  let didEnd = false;
  const ended = () => {
    if (didEnd) return;
    didEnd = true;
    saveProgress(id, Infinity, duration);
    onEnd?.();
  };
  window.addEventListener('message', onMessage);
  frame.addEventListener('load', () => {
    // Keep knocking until the player inside the frame is ready to listen.
    let tries = 0;
    const knock = setInterval(() => {
      send({ event: 'listening' });
      if (++tries > 10 || duration) clearInterval(knock);
    }, 500);
  });

  player = {
    seekTo: t => { didEnd = false; send({ event: 'command', func: 'seekTo', args: [t, true] }); },
    playVideo: () => send({ event: 'command', func: 'playVideo', args: [] }),
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    destroy: () => window.removeEventListener('message', onMessage),
    onBareError: code => {
      const msg = PLAYER_ERRORS[code] || `Player error ${code}.`;
      document.querySelector('.player-wrap')?.insertAdjacentHTML('beforeend', `<div class="player-error overlay">${esc(msg)}
        <a href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener">Watch on YouTube</a></div>`);
    },
  };
  const tick = () => { if (currentTime) saveProgress(id, currentTime, duration); };
  playerTimer = setInterval(tick, 5000);
  player._tubeTick = tick;
}

function teardownPlayer() {
  clearInterval(playerTimer);
  playerTimer = null;
  if (player) {
    try { player._tubeTick?.(); player.destroy(); } catch {}
    player = null;
  }
  endWatch();
}

/* ---------- views ---------- */

let feedIndex = new Map();

async function viewHome(ctx) {
  const tab = ctx.params.get('tab') === 'subs' ? 'subs' : 'foryou';
  $app.innerHTML = `${spinner()}<p class="muted small center" id="reco-status"></p>`;
  const onStatus = text => {
    const el = document.getElementById('reco-status');
    if (el && ctx.alive()) el.textContent = text;
  };
  const subs = isSignedIn() ? await accountSubs() : getSubs();
  if (!ctx.alive()) return;
  const profile = loadProfile();
  const learned = hasProfile(profile);
  if (!subs.length && !learned) return viewTrending(ctx, true);

  const showSubs = tab === 'subs' && subs.length;
  const videos = showSubs ? noShorts(await subscriptionFeed(subs)) : await recommendations(subs, profile, onStatus);
  if (!ctx.alive()) return;
  feedIndex = new Map(videos.map(v => [v.id, v]));
  const note = showSubs ? 'Newest uploads from your subscriptions.'
    : learned ? `Tuned to ${profile.watches.toLocaleString()} videos you've watched. <a href="#/library">See what it learned</a>.`
    : 'Watch a few videos, or import your YouTube history in <a href="#/library">Library</a>, and this gets personal.';
  $app.innerHTML = `<div class="head">
      <nav class="tabs inline">
        <a href="#/" class="${showSubs ? '' : 'active'}">For you</a>
        ${subs.length ? `<a href="#/?tab=subs" class="${showSubs ? 'active' : ''}">Subscriptions</a>` : ''}
      </nav>
      <button class="btn" id="refresh">Refresh</button>
    </div>
    <p class="muted small lede">${note}</p>
    ${videos.length ? `<div class="grid">${videos.map(v => videoCard(v, { dismiss: !showSubs })).join('')}</div>`
      : '<p class="muted empty">Nothing new right now.</p>'}`;
  document.getElementById('refresh').onclick = () => {
    clearRecoCache();
    const c = store.get('acctSubs');
    if (c && validToken()) store.set('acctSubs', { ...c, at: 0 });
    route();
  };
}

// Newest uploads across all subscriptions. Each channel's "uploads" playlist
// is UU + the channel ID minus its UC prefix, and costs 1 quota unit to read.
async function subscriptionFeed(subs) {
  const key = subs.map(s => s.id).sort().join(',');
  const cached = store.get('feed');
  if (cached && cached.key === key && Date.now() - cached.at < 15 * 60e3) return cached.videos;

  const recent = [];
  await pool(subs, 6, async sub => {
    try {
      const data = await yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + sub.id.slice(2), maxResults: 10 });
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
    .map(v => ({ ...recoSlim(v), src: 'subs' }));
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
      ...LIST_PARTS,
      chart: 'mostPopular',
      regionCode: region,
      maxResults: 24,
      pageToken: token,
    });
    return { html: noShorts((data.items || []).map(toVideo)).map(v => videoCard(v)).join(''), next: data.nextPageToken };
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
    const videos = new Map(noShorts(await hydrate(items.filter(i => i.id.videoId).map(i => i.id.videoId))).map(v => [v.id, v]));
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
  if (!hasAccess()) {
    info.innerHTML = errorBox(accessError());
    return;
  }

  if (list) {
    renderQueue(ctx, list, id).then(href => { nextHref = href; }).catch(err => {
      const q = document.getElementById('queue');
      if (q && ctx.alive()) q.innerHTML = errorBox(err);
    });
  }

  const data = await yt('videos', { ...LIST_PARTS, id });
  if (!ctx.alive()) return;
  const item = data.items?.[0];
  if (!item) {
    info.innerHTML = notice('<p>This video is private, deleted, or doesn\'t exist.</p>');
    return;
  }
  const v = toVideo(item);
  recordHistory(v);
  learn(v, 1, true);
  watching = v;
  document.title = `${v.title} · Tube`;

  const stats = [fmtCount(v.views) + ' views', new Date(v.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })];
  const account = isSignedIn() || canSignIn();
  if (v.likes != null && !account) stats.push(fmtCount(v.likes) + ' likes');

  info.innerHTML = `
    <h1 class="video-title">${esc(v.title)}</h1>
    <div class="video-row">
      <a class="channel-chip" href="#/channel/${encodeURIComponent(v.channelId)}">
        <img class="avatar" id="ch-avatar" alt="">
        <span><strong>${esc(v.channelTitle)}</strong><span class="muted small" id="ch-subs"></span></span>
      </a>
      <button class="btn" id="sub">Subscribe</button>
      <span class="spacer"></span>
      ${account ? `<span class="rate">
        <button class="btn" id="like" aria-label="Like">▲ <span id="like-count">${v.likes != null ? fmtCount(v.likes) : ''}</span></button>
        <button class="btn" id="dislike" aria-label="Dislike">▼</button>
      </span>
      <span class="pop-wrap">
        <button class="btn" id="save">Save</button>
        <div class="popover" id="save-pop" hidden></div>
      </span>` : ''}
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

  const chInfo = { id: v.channelId, title: v.channelTitle, thumb: '' };
  getChannel(v.channelId).then(ch => {
    if (!ch || !ctx.alive()) return;
    chInfo.thumb = bestThumb(ch.snippet.thumbnails);
    document.getElementById('ch-avatar').src = chInfo.thumb;
    if (!ch.statistics.hiddenSubscriberCount) {
      document.getElementById('ch-subs').textContent = fmtCount(ch.statistics.subscriberCount) + ' subscribers';
    }
  }).catch(() => {});

  mountSubButton(document.getElementById('sub'), chInfo);
  if (account) {
    mountRating(v);
    mountSaveMenu(v);
  }
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

function mountRating(v) {
  const likeBtn = document.getElementById('like');
  const dislikeBtn = document.getElementById('dislike');
  const baseLikes = +v.likes || 0;
  let initial = 'none';
  let rating = 'none';
  const paint = () => {
    likeBtn.classList.toggle('on', rating === 'like');
    dislikeBtn.classList.toggle('on', rating === 'dislike');
    if (v.likes != null) {
      const n = baseLikes - (initial === 'like' ? 1 : 0) + (rating === 'like' ? 1 : 0);
      document.getElementById('like-count').textContent = fmtCount(n);
    }
  };
  if (validToken()) {
    yt('videos/getRating', { id: v.id }, { auth: true }).then(d => {
      initial = rating = d.items?.[0]?.rating || 'none';
      paint();
    }).catch(() => {});
  }
  const rate = target => async () => {
    const next = rating === target ? 'none' : target;
    await yt('videos/rate', { id: v.id, rating: next }, { method: 'POST', auth: true });
    const weight = { like: 2, dislike: -3, none: 0 };
    learn(v, weight[next] - weight[rating]);
    rating = next;
    paint();
  };
  likeBtn.onclick = action(likeBtn, rate('like'));
  dislikeBtn.onclick = action(dislikeBtn, rate('dislike'));
}

function mountSaveMenu(v) {
  const btn = document.getElementById('save');
  const pop = document.getElementById('save-pop');
  const add = async (playlistId, el) => {
    await yt('playlistItems', { part: 'snippet' }, {
      method: 'POST', auth: true,
      body: { snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId: v.id } } },
    });
    el.classList.add('done');
    toast('Saved to ' + el.dataset.title);
  };
  btn.onclick = action(btn, async () => {
    if (!pop.hidden) { pop.hidden = true; return; }
    pop.hidden = false;
    pop.innerHTML = spinner();
    const d = await yt('playlists', { part: 'snippet', mine: true, maxResults: 50 }, { auth: true });
    pop.innerHTML = `<div class="pop-title">Save to playlist</div>
      ${(d.items || []).map(p => `<button class="pop-item" data-pl="${esc(p.id)}" data-title="${esc(p.snippet.title)}">${esc(p.snippet.title)}</button>`).join('')}
      <form class="pop-new"><input placeholder="New private playlist" required maxlength="150"><button class="btn">Create</button></form>`;
    pop.querySelectorAll('[data-pl]').forEach(el => { el.onclick = action(el, () => add(el.dataset.pl, el)); });
    const form = pop.querySelector('form');
    form.onsubmit = e => {
      e.preventDefault();
      const title = form.querySelector('input').value.trim();
      action(form.querySelector('button'), async () => {
        const p = await yt('playlists', { part: 'snippet,status' }, {
          method: 'POST', auth: true,
          body: { snippet: { title }, status: { privacyStatus: 'private' } },
        });
        form.insertAdjacentHTML('beforebegin', `<button class="pop-item" data-pl="${esc(p.id)}" data-title="${esc(title)}">${esc(title)}</button>`);
        const el = form.previousElementSibling;
        el.onclick = action(el, () => add(p.id, el));
        form.reset();
        await add(p.id, el);
      })();
    };
  });
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
  const title = meta.items?.[0]?.snippet.title || (list === 'LL' ? 'Liked videos' : 'Playlist');
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
    ${isSignedIn() || canSignIn() ? `<form class="comment-form" id="c-form">
      <textarea id="c-text" rows="2" placeholder="Add a comment…" required maxlength="10000"></textarea>
      <button class="btn primary">Comment</button>
    </form>` : ''}
    <div id="c-list"></div>
    <button class="btn more" id="c-more" hidden>Load more</button>`;
  document.getElementById('c-order').onchange = e => loadComments(ctx, v, e.target.value);
  const listEl = document.getElementById('c-list');

  const form = document.getElementById('c-form');
  if (form) {
    form.onsubmit = e => {
      e.preventDefault();
      const text = document.getElementById('c-text').value.trim();
      if (!text) return;
      action(form.querySelector('button'), async () => {
        const d = await yt('commentThreads', { part: 'snippet' }, {
          method: 'POST', auth: true,
          body: { snippet: { videoId: v.id, topLevelComment: { snippet: { textOriginal: text } } } },
        });
        box.querySelector('.empty')?.remove();
        listEl.insertAdjacentHTML('afterbegin', commentHtml(d.snippet.topLevelComment));
        form.reset();
      })();
    };
  }

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
      <button class="btn" id="sub">Subscribe</button>
    </div>
    <nav class="tabs">
      <a href="${base}" class="${tab === 'videos' ? 'active' : ''}">Videos</a>
      <a href="${base}?tab=playlists" class="${tab === 'playlists' ? 'active' : ''}">Playlists</a>
    </nav>
    <div class="grid" id="grid"></div>
    <button class="btn more" id="more" hidden>Load more</button>`;

  mountSubButton(document.getElementById('sub'), { id: ch.id, title: sn.title, thumb });

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
      return { html: noShorts(videos).map(v => videoCard(v)).join(''), next: d.nextPageToken };
    }, settings().hideShorts ? 'No videos here (Shorts are hidden in Settings).' : 'This channel has no videos.');
  }
}

async function viewPlaylist(ctx, id) {
  $app.innerHTML = spinner();
  const data = await yt('playlists', { part: 'snippet,contentDetails', id });
  if (!ctx.alive()) return;
  const user = getAuth()?.user;
  // The liked-videos playlist can be read but has no playlist record of its own.
  const p = data.items?.[0] || (id === 'LL' && user ? {
    snippet: { title: 'Liked videos', channelId: user.id, channelTitle: user.name },
    contentDetails: { itemCount: '' },
  } : null);
  if (!p) {
    $app.innerHTML = notice('<p>Playlist not found, or it\'s private.</p>');
    return;
  }
  document.title = `${p.snippet.title} · Tube`;
  $app.innerHTML = `<div class="head">
      <div>
        <h1>${esc(p.snippet.title)}</h1>
        <div class="muted small"><a href="#/channel/${encodeURIComponent(p.snippet.channelId)}">${esc(p.snippet.channelTitle)}</a>
          ${p.contentDetails.itemCount !== '' ? `· ${esc(p.contentDetails.itemCount)} videos` : ''}</div>
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

const subChips = (subs, attr) => `<div class="chips">${subs.map(c => `<span class="chip">
    <a href="#/channel/${encodeURIComponent(c.id)}">${c.thumb ? `<img class="avatar sm" src="${esc(c.thumb)}" alt="">` : ''}${esc(c.title)}</a>
    <button class="link" ${attr}="${esc(c.subId || c.id)}" data-channel="${esc(c.id)}" aria-label="Unsubscribe from ${esc(c.title)}">×</button>
  </span>`).join('')}</div>`;

async function viewLibrary(ctx) {
  const later = getLater(), history = getHistory(), s = settings();
  const auth = getAuth();
  document.title = 'Library · Tube';

  const localSubs = getSubs();
  const subsSection = auth
    ? `<section class="lib-section">
        <div class="account-head">
          ${auth.user?.thumb ? `<img class="avatar-xl" src="${esc(auth.user.thumb)}" alt="">` : ''}
          <div><h1>${esc(auth.user?.name || 'Your account')}</h1>
            <div class="muted small">Signed in with Google${validToken() ? '' : ' (session expired)'}</div></div>
          <span class="spacer"></span>
          ${validToken() ? '' : '<button class="btn primary" data-signin>Sign in again</button>'}
          <button class="btn" id="signout">Sign out</button>
        </div>
      </section>
      <section class="lib-section">
        <div class="head"><h2>Subscriptions <span class="muted" id="sub-count"></span></h2></div>
        <div id="acct-subs">${spinner()}</div>
      </section>
      <section class="lib-section">
        <div class="head"><h2>Your playlists</h2></div>
        <div class="grid" id="my-lists">${playlistCard({ id: 'LL', title: 'Liked videos', thumb: '', channelId: auth.user?.id || '', channelTitle: auth.user?.name || '' })}</div>
        <button class="btn more" id="my-lists-more" hidden>Load more</button>
      </section>`
    : `<section class="lib-section">
        <div class="head">
          <h1>Subscriptions <span class="muted">${localSubs.length}</span></h1>
          <div class="filters">
            ${canSignIn() ? '<button class="btn primary" data-signin>Sign in with Google</button>' : ''}
            <label class="btn">Import from Google Takeout<input type="file" id="takeout" accept=".csv,text/csv" hidden></label>
          </div>
        </div>
        ${localSubs.length ? subChips(localSubs, 'data-unsub')
          : `<p class="muted">No subscriptions yet. Hit Subscribe on any channel, sign in to use your real ones,
             or import them: export "YouTube and YouTube Music → subscriptions" from
             <a href="https://takeout.google.com" target="_blank" rel="noopener">Google Takeout</a>
             and pick the <code>subscriptions.csv</code> file.</p>`}
        <p class="muted small" id="import-status"></p>
      </section>`;

  const profile = loadProfile();
  const chip = (label, attr, key) => `<span class="chip"><span class="chip-label">${esc(label)}</span>
    <button class="link" ${attr}="${esc(key)}" aria-label="Forget ${esc(label)}">×</button></span>`;
  const topChannels = topEntries(profile.channels, 15).filter(([, w]) => w > 0.05);
  const topTerms = topEntries(profile.terms, 24).filter(([, w]) => w > 0.05);
  const topCats = topEntries(profile.categories, 6).filter(([, w]) => w > 0.05);
  const tasteSection = `<section class="lib-section">
      <div class="head">
        <h2>Recommendations</h2>
        <div class="filters">
          <label class="btn">Import YouTube watch history<input type="file" id="watch-history" accept=".json,.html,application/json,text/html" hidden></label>
          <button class="btn" id="reset-reco"${hasProfile(profile) ? '' : ' disabled'}>Reset</button>
        </div>
      </div>
      <p class="muted small" id="wh-status">${profile.importedAt
        ? `Built from ${profile.imported.toLocaleString()} imported watches (${new Date(profile.importedAt).toLocaleDateString()}) plus what you've watched here since.`
        : `To import: in <a href="https://takeout.google.com" target="_blank" rel="noopener">Google Takeout</a>, click Deselect all, tick
           "YouTube and YouTube Music", click "All YouTube data included" and keep only history. Under "Multiple formats" you can switch
           history to JSON (HTML works too). Then pick <code>watch-history.json</code> from the download's history folder.`}</p>
      ${hasProfile(profile) ? `<div class="tastes">
        <h3>Channels it favors</h3>
        <div class="chips">${topChannels.map(([id]) => chip(profile.names[id] || id, 'data-forget-channel', id)).join('')}</div>
        <h3>Topics</h3>
        <div class="chips">${topTerms.map(([t]) => chip(t, 'data-forget-term', t)).join('')}</div>
        ${topCats.length ? `<h3>Categories</h3>
        <div class="chips" id="cat-chips">${topCats.map(([id]) => chip(store.get('catNames', {})[id] || 'Category ' + id, 'data-forget-cat', id)).join('')}</div>` : ''}
        <p class="muted small">Hit × to make it forget something. "Not interested" on a home video teaches it what to show less of.</p>
      </div>` : '<p class="muted small">Nothing learned yet. Watch some videos or import your history.</p>'}
    </section>`;

  $app.innerHTML = `${subsSection}

    ${tasteSection}

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
      <p class="muted small">Watch later, history, local subscriptions and what the recommendations learned live only in this browser. Export them to move them somewhere else
        (your API key and sign-in are left out).</p>
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
  const takeout = document.getElementById('takeout');
  if (takeout) takeout.onchange = e => importTakeout(e.target.files[0]);
  document.getElementById('export').onclick = () => {
    const blob = new Blob([JSON.stringify({ subs: getSubs(), later: getLater(), history: getHistory(), profile: store.get('profile', null) }, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'tube-backup.json' });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById('import').onchange = async e => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      for (const key of ['subs', 'later', 'history']) if (Array.isArray(data[key])) store.set(key, data[key]);
      if (data.profile?.channels) store.set('profile', data.profile);
      route();
    } catch {
      alert('That file isn\'t a Tube backup.');
    }
  };

  document.getElementById('watch-history').onchange = async e => {
    const status = document.getElementById('wh-status');
    try {
      await importWatchHistory(e.target.files[0], status);
      if (ctx.alive()) setTimeout(route, 1500);
    } catch (err) {
      status.textContent = 'Couldn\'t read that file: ' + err.message;
    }
  };
  document.getElementById('reset-reco').onclick = () => {
    if (!confirm('Forget everything the recommendations have learned?')) return;
    store.del('profile');
    clearRecoCache({ all: true });
    route();
  };
  const forget = (attr, key) => $app.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => {
    const p = loadProfile();
    delete p[key][b.getAttribute(attr)];
    saveProfile(p);
    clearRecoCache();
    b.closest('.chip').remove();
  });
  forget('data-forget-channel', 'channels');
  forget('data-forget-term', 'terms');
  forget('data-forget-cat', 'categories');
  if (topCats.some(([id]) => !store.get('catNames', {})[id]) && hasAccess()) {
    yt('videoCategories', { part: 'snippet', regionCode: s.region }).then(d => {
      const names = Object.fromEntries((d.items || []).map(c => [c.id, c.snippet.title]));
      store.set('catNames', names);
      if (!ctx.alive()) return;
      $app.querySelectorAll('[data-forget-cat]').forEach(b => {
        const label = b.parentElement.querySelector('.chip-label');
        if (names[b.dataset.forgetCat]) label.textContent = names[b.dataset.forgetCat];
      });
    }).catch(() => {});
  }

  if (!auth) return;
  document.getElementById('signout').onclick = () => { signOut(); route(); };

  const subsBox = document.getElementById('acct-subs');
  accountSubs().then(subs => {
    if (!ctx.alive()) return;
    document.getElementById('sub-count').textContent = subs.length;
    subsBox.innerHTML = subs.length ? subChips(subs, 'data-unsub-api') : '<p class="muted">You aren\'t subscribed to anything yet.</p>';
    subsBox.querySelectorAll('[data-unsub-api]').forEach(b => {
      b.onclick = action(b, async () => {
        await yt('subscriptions', { id: b.dataset.unsubApi }, { method: 'DELETE', auth: true });
        updateAccountSubs(list => list.filter(c => c.id !== b.dataset.channel));
        b.closest('.chip').remove();
      });
    });
  }).catch(err => { if (ctx.alive()) subsBox.innerHTML = errorBox(err); });

  if (validToken()) {
    mountPager(ctx, document.getElementById('my-lists'), document.getElementById('my-lists-more'), async token => {
      const d = await yt('playlists', { part: 'snippet,contentDetails', mine: true, maxResults: 24, pageToken: token }, { auth: true });
      return {
        html: (d.items || []).map(p => playlistCard({
          id: p.id, title: p.snippet.title, thumb: bestThumb(p.snippet.thumbnails),
          channelId: p.snippet.channelId, channelTitle: p.snippet.channelTitle, count: p.contentDetails.itemCount,
        })).join(''),
        next: d.nextPageToken,
      };
    });
  }
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
      <label>Google OAuth client ID (optional, for signing in)
        <input id="client-id" value="${esc(s.clientId)}" placeholder="1234…apps.googleusercontent.com" autocomplete="off" spellcheck="false">
      </label>
      <label>Region for Trending (two-letter country code)
        <input id="region" value="${esc(s.region)}" maxlength="2" pattern="[A-Za-z]{2}" required>
      </label>
      <label class="check"><input type="checkbox" id="autoplay"${s.autoplay ? ' checked' : ''}> Autoplay videos, and the next one in a playlist</label>
      <label class="check"><input type="checkbox" id="pause"${s.pauseHistory ? ' checked' : ''}> Pause watch history</label>
      <label>For you: familiar channels vs. new ones
        <span class="range-row"><span class="muted small">Familiar</span>
          <input type="range" id="explore" min="0" max="90" step="10" value="${esc(s.explore)}">
          <span class="muted small">New</span></span>
      </label>
      <label class="check"><input type="checkbox" id="smart-match"${s.smartMatch ? ' checked' : ''}> Smart matching: an AI model that runs in
        your browser and matches videos by meaning, not just shared words, across 50+ languages (118 MB one-time download)</label>
      <label class="check"><input type="checkbox" id="hide-shorts"${s.hideShorts ? ' checked' : ''}> Hide Shorts everywhere (home, subscriptions, trending, search, channels)</label>
      <button class="btn primary" type="submit">Save</button>
      <span class="muted small" id="saved"></span>
    </form>

    <h2>Getting a key</h2>
    <ol class="steps">
      <li>Go to the <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">Google Cloud console</a> and create a project (any name).</li>
      <li>Open <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener">YouTube Data API v3</a> and click Enable.</li>
      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Credentials</a>, then Create credentials → API key.</li>
      <li>Recommended: edit the key, set "Application restrictions" to Websites and add <code>${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}*</code>,
        then under "API restrictions" allow only the YouTube Data API v3. That way the key is useless to anyone who finds it.</li>
      <li>Paste it above. It stays in this browser's localStorage and is only ever sent to googleapis.com.</li>
    </ol>
    <p class="muted small">The free quota is 10,000 units a day. Most things cost 1 unit; a search costs 100, so roughly 100 searches a day
      plus plenty of browsing. Subscribing, rating, commenting and saving to a playlist cost 50 each.</p>

    <h2>Signing in with Google</h2>
    <p class="small">Optional. Signed in, your home feed comes from your real subscriptions, and Subscribe, like/dislike, comments and
      Save act on your actual YouTube account. Watch later and history stay local: Google doesn't let any app read the real ones.</p>
    <ol class="steps">
      <li>In the same Cloud project, open <a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noopener">Google Auth Platform</a>
        and click Get started. Any app name works; pick <strong>External</strong> as the audience.</li>
      <li>Under <a href="https://console.cloud.google.com/auth/audience" target="_blank" rel="noopener">Audience</a>, leave it in
        <strong>Testing</strong> and add your own Gmail address as a test user.</li>
      <li>Under <a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noopener">Clients</a>, create a client of type
        <strong>Web application</strong>. Add <code>${esc(location.origin)}</code> under "Authorized JavaScript origins"
        (plus <code>http://localhost:8000</code> if you also run it locally). No redirect URIs needed.</li>
      <li>Paste the client ID above, save, and hit Sign in at the top.</li>
    </ol>
    <p class="muted small">Google will warn that the app isn't verified. That's expected for a personal app in testing mode; click
      Continue. Sign-ins last an hour, after which the app asks again with a quick popup.</p>
    ${isSignedIn() ? '<p><button class="btn" id="signout">Sign out</button></p>' : ''}

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
      clientId: document.getElementById('client-id').value.trim(),
      region: document.getElementById('region').value.trim().toUpperCase() || 'US',
      autoplay: document.getElementById('autoplay').checked,
      pauseHistory: document.getElementById('pause').checked,
      hideShorts: document.getElementById('hide-shorts').checked,
      explore: +document.getElementById('explore').value,
      smartMatch: document.getElementById('smart-match').checked,
    });
    store.del('feed');
    if (settings().clientId) loadGis().catch(() => {});
    renderAccount();
  };
  document.getElementById('signout')?.addEventListener('click', () => { signOut(); route(); });
  document.getElementById('test-key').onclick = async () => {
    save();
    keyStatus.textContent = 'Testing…';
    try {
      await yt('videos', { part: 'id', chart: 'mostPopular', maxResults: 1, regionCode: settings().region }, { keyOnly: true });
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
    if (!confirm('Erase your API key, sign-in, subscriptions, watch later list and history from this browser?')) return;
    signOut();
    for (const k of ['settings', 'subs', 'later', 'history', 'feed', 'profile', 'catNames']) store.del(k);
    vectorStore.clear();
    clearRecoCache({ all: true });
    renderAccount();
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

$app.addEventListener('click', e => {
  const btn = e.target.closest('[data-dismiss]');
  if (!btn) return;
  const id = btn.dataset.dismiss;
  const v = feedIndex.get(id);
  learn(v, -2);
  store.set('reco:hidden', [id, ...store.get('reco:hidden', [])].slice(0, 500));
  if (v) store.set('reco:dismissed', [{ id, title: v.title, tags: v.tags }, ...store.get('reco:dismissed', [])].slice(0, 60));
  btn.closest('.card').remove();
  toast('Got it. You\'ll see less like that.');
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

// Any "Sign in" button anywhere. signIn() must run inside the click itself.
document.addEventListener('click', e => {
  if (!e.target.closest('[data-signin]')) return;
  signIn().then(route).catch(err => toast(err.message));
});

window.addEventListener('hashchange', route);
window.addEventListener('pagehide', () => player?._tubeTick?.());
if (settings().clientId) loadGis().catch(() => {});
// One-time cleanups when stored data changes shape.
const cacheVersion = store.get('cacheVersion') || 0;
if (cacheVersion < 3) {
  // Cached feeds from before Shorts detection can't be filtered properly.
  clearRecoCache();
  store.del('reco:neighbors');
  store.del('reco:topics');
}
if (cacheVersion < 4) vectorStore.clear(); // vectors from the earlier English-only model
store.set('cacheVersion', 4);
renderAccount();
route();
