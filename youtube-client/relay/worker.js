// Tube relay: a Cloudflare Worker that passes an Invidious server through
// your own workers.dev address, for networks that block Invidious by name.
// Put this Worker's address (e.g. tube-relay.yourname.workers.dev) at the
// top of the ad-free server list in Tube's Settings.
//
// Video pages (/embed/<id>) get a bare player of the relay's own: it reads the
// server's embed page only to find the video file, so you never see
// Invidious's site, and when something fails it says what. Everything else
// (the video file itself, captions) is passed through as-is. It only relays
// the one server below (and its subdomains), so it can't be used as a
// general-purpose proxy.

const TARGET = 'invidious.flokinet.to'; // any working Invidious server

const site = host => host.split('.').slice(-2).join('.');
const allowed = host => host === TARGET || host.endsWith('.' + site(TARGET));

// Responses whose text may contain absolute links back to the server.
const TEXT = /text\/html|javascript|json|text\/css|mpegurl|dash\+xml|text\/plain/i;

const DROP_REQUEST = ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'];
const DROP_RESPONSE = ['content-security-policy', 'x-frame-options', 'strict-transport-security'];

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unescapeHtml = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function attrs(tag) {
  const out = {};
  for (const [, k, , v1, v2] of tag.matchAll(/([\w-]+)=("([^"]*)"|'([^']*)')/g)) out[k] = unescapeHtml(v1 ?? v2);
  return out;
}

// The readable part of an Invidious error page, without its menus.
function pageText(html) {
  return unescapeHtml(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/Released under the AGPLv3 on GitHub\.|View JavaScript license information\.|View privacy policy\.|Error -|\b(Invidious|Log in|Source code|Documentation|Donate)\b/g, ' ')
    .replace(/Current version:.*$/s, '')
    .replace(/\s+/g, ' ').trim().slice(0, 300);
}

const shell = body => new Response(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><style>
html, body { margin: 0; height: 100%; background: #000; color: #ddd; font: 15px/1.4 system-ui, sans-serif; }
video { width: 100%; height: 100%; display: block; }
.msg { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.msg small { color: #999; }
</style></head><body>${body}</body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

async function playerPage(request, id, url) {
  const start = Math.max(0, parseInt(url.searchParams.get('t') || '0', 10) || 0);
  const autoplay = url.searchParams.get('autoplay') !== '0';
  let html = '';
  let status = 0;
  try {
    const res = await fetch(`https://${TARGET}/embed/${id}?local=true`, {
      headers: {
        'user-agent': request.headers.get('user-agent') || 'Mozilla/5.0',
        'accept-language': request.headers.get('accept-language') || 'en',
      },
    });
    status = res.status;
    html = await res.text();
  } catch (err) {
    html = String(err);
  }
  const video = [...html.matchAll(/<source\b[^>]*>/g)].map(m => attrs(m[0]))
    .find(a => a.src && /^video\/mp4/.test(a.type || ''));
  if (!video) {
    return shell(`<div class="msg"><strong>${escapeHtml(TARGET)} couldn't load this video.</strong>
      <span>${escapeHtml(pageText(html) || 'No reason given.')}</span>
      <small>Server answered ${status || 'nothing'}. If every video does this, the server is refusing the relay or YouTube is
      blocking it: change TARGET at the top of the relay code to another Invidious server and redeploy.</small></div>`);
  }
  const tracks = [...html.matchAll(/<track\b[^>]*>/g)].map(m => attrs(m[0])).filter(a => a.src)
    .map(a => `<track kind="captions" src="${escapeHtml(a.src)}" label="${escapeHtml(a.label || '')}">`).join('');
  return shell(`<video id="v" controls playsinline${autoplay ? ' autoplay' : ''} src="${escapeHtml(video.src)}${start ? '#t=' + start : ''}">${tracks}</video>
<div class="msg" id="msg" hidden></div>
<script>
const v = document.getElementById('v'), msg = document.getElementById('msg');
v.addEventListener('error', async () => {
  let text = 'The video file failed to load.';
  try {
    const r = await fetch(v.currentSrc || v.src, { headers: { range: 'bytes=0-1' } });
    text = r.ok
      ? 'The video downloaded fine, but this browser cannot play its format (MP4/H.264).'
      : 'The server refused the video file (it answered ' + r.status + '). Try another TARGET server in the relay.';
  } catch (e) {}
  msg.textContent = text;
  msg.hidden = false;
});
</script>`);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = url.origin;

    const embed = url.pathname.match(/^\/embed\/([\w-]{11})$/);
    if (embed && request.method === 'GET') return playerPage(request, embed[1], url);

    // /__host/<subdomain>/... reaches the server's other hosts (some
    // Invidious servers stream video from a separate "companion" host).
    let host = TARGET;
    let path = url.pathname;
    const m = path.match(/^\/__host\/([^/]+)(\/.*)?$/);
    if (m) {
      host = m[1];
      path = m[2] || '/';
    }
    if (!allowed(host)) return new Response('Not allowed', { status: 403 });

    const headers = new Headers(request.headers);
    for (const h of DROP_REQUEST) headers.delete(h);
    if (headers.has('origin')) headers.set('origin', `https://${host}`);
    if (headers.has('referer')) headers.set('referer', `https://${host}/`);

    const res = await fetch(`https://${host}${path}${url.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      redirect: 'manual',
    });

    const toRelay = (text, slash = '/') => text.replace(
      new RegExp(`https:\\${slash}\\${slash}([a-z0-9.-]+\\.[a-z]{2,})`, 'gi'),
      (all, h) => {
        if (!allowed(h)) return all;
        const relayed = h === TARGET ? origin : `${origin}/__host/${h}`;
        return slash === '/' ? relayed : relayed.replaceAll('/', '\\/');
      },
    );

    const out = new Headers(res.headers);
    for (const h of DROP_RESPONSE) out.delete(h);
    out.set('access-control-allow-origin', '*');
    if (out.has('location')) out.set('location', toRelay(out.get('location')));
    const cookies = res.headers.getSetCookie?.() || [];
    if (cookies.length) {
      out.delete('set-cookie');
      for (const c of cookies) out.append('set-cookie', c.replace(/;\s*domain=[^;]*/i, ''));
    }

    if (TEXT.test(out.get('content-type') || '') && request.method !== 'HEAD') {
      // Plain links, and the escaped https:\/\/ form found inside JSON.
      const text = toRelay(toRelay(await res.text()), '\\/');
      out.delete('content-length'); // the text changed size
      out.delete('content-encoding'); // and arrives here already decompressed
      return new Response(text, { status: res.status, headers: out });
    }
    return new Response(res.body, { status: res.status, headers: out });
  },
};
