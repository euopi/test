// Tube relay: a Cloudflare Worker that passes an Invidious server through
// your own workers.dev address, for networks that block Invidious by name.
// Put this Worker's address (e.g. tube-relay.yourname.workers.dev) at the
// top of the ad-free server list in Tube's Settings.
//
// It only relays the one server below (and that server's own subdomains),
// so it can't be used as a general-purpose proxy.

const TARGET = 'invidious.flokinet.to'; // any working Invidious server

const site = host => host.split('.').slice(-2).join('.');
const allowed = host => host === TARGET || host.endsWith('.' + site(TARGET));

// Responses whose text may contain absolute links back to the server.
const TEXT = /text\/html|javascript|json|text\/css|mpegurl|dash\+xml|text\/plain/i;

const DROP_REQUEST = ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'];
const DROP_RESPONSE = ['content-security-policy', 'x-frame-options', 'strict-transport-security'];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = url.origin;

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
