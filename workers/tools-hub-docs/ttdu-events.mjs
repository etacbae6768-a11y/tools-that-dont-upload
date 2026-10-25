// Minimal request metadata for operations and dispute handling, written to Workers Analytics Engine
// (binding EVENTS, dataset ttdu_api_events). Recorded: time (automatic), Worker, known route (never the
// query), method, status, duration, request/response size bucket, country, API key id (truncated
// SHA-256 of the key, never the key), daily-salted IP hash, source (edge / service binding / MCP).
// Never recorded: bodies, files, file names, query values, header values, e-mail addresses, raw IPs.
// Without the EVENTS binding nothing is written. Without LOG_SALT_KEY the IP hash is left empty.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function sizeBucket(n) {
  if (n === null || n === undefined || n === '' || !Number.isFinite(Number(n))) return 'na';
  n = Number(n);
  if (n <= 0) return '0';
  if (n < 1024) return '<1K';
  if (n < 10240) return '<10K';
  if (n < 102400) return '<100K';
  if (n < 1048576) return '<1M';
  if (n < 10485760) return '<10M';
  return '>=10M';
}

let saltCache = { day: '', secret: null, key: null };
async function dayKey(secret, day) {
  if (saltCache.day === day && saltCache.secret === secret) return saltCache.key;
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const daySalt = await crypto.subtle.sign('HMAC', base, enc.encode('ttdu-ip-salt\n' + day));
  const key = await crypto.subtle.importKey('raw', daySalt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  saltCache = { day, secret, key };
  return key;
}

export async function ipHash(env, ip, now = new Date()) {
  if (!env || !env.LOG_SALT_KEY || !ip) return '';
  const key = await dayKey(env.LOG_SALT_KEY, now.toISOString().slice(0, 10));
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(ip))).slice(0, 16);
}

export async function keyId(request) {
  const k = request.headers.get('x-api-key') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!k) return '';
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(k))).slice(0, 16);
}

async function record(worker, routeOf, request, env, status, ms, resp) {
  const u = new URL(request.url);
  const internal = !!(env.INTERNAL_TOKEN && request.headers.get('x-internal-token') === env.INTERNAL_TOKEN);
  const source = internal ? 'mcp' : request.cf ? 'edge' : 'binding';
  const ip = internal ? request.headers.get('x-client-ip') : request.headers.get('cf-connecting-ip');
  const country = (request.cf && request.cf.country) || '';
  env.EVENTS.writeDataPoint({
    blobs: [
      worker,
      (routeOf && routeOf(u.pathname)) || 'other',
      request.method,
      country,
      await keyId(request),
      await ipHash(env, ip),
      sizeBucket(request.headers.get('content-length')),
      sizeBucket(resp && resp.headers.get('content-length')),
      source,
    ],
    doubles: [status, ms],
    indexes: [worker],
  });
}

export async function withEvents(worker, routeOf, request, env, ctx, handler) {
  const t0 = Date.now();
  let resp = null;
  let status = 500;
  try {
    resp = await handler();
    status = resp.status;
    return resp;
  } finally {
    if (env && env.EVENTS) {
      const p = record(worker, routeOf, request, env, status, Date.now() - t0, resp).catch(() => {});
      if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p);
      else await p;
    }
  }
}
