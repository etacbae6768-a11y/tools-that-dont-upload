// User input in a GET query string ends up in URLs (browser history, proxies, referrers, logs).
// Such requests keep working until the sunset date and carry Deprecation / Sunset / Warning / Link
// headers. From the sunset date they are rejected with 405. Both dates can be overridden with the
// plain-text bindings GET_QUERY_SINCE and GET_QUERY_SUNSET (ISO 8601) without a code change.
export const GETQ_SINCE = '2026-10-14T00:00:00Z';
export const GETQ_SUNSET = '2026-11-16T00:00:00Z';
export const GETQ_DOC = 'https://toolsthatdontupload.com/docs/';

export function getQueryPolicy(request, env, exempt) {
  if (request.method !== 'GET') return null;
  const u = new URL(request.url);
  if (!u.search || u.search === '?') return null;
  if (exempt && exempt(u)) return null;
  const since = Date.parse((env && env.GET_QUERY_SINCE) || GETQ_SINCE);
  const sunset = Date.parse((env && env.GET_QUERY_SUNSET) || GETQ_SUNSET);
  if (Number.isFinite(sunset) && Date.now() >= sunset) return { block: true };
  const day = new Date(sunset).toISOString().slice(0, 10);
  return {
    block: false,
    headers: {
      Deprecation: '@' + Math.floor(since / 1000),
      Sunset: new Date(sunset).toUTCString(),
      Warning: '299 - "Input in the URL query is deprecated and stops working on ' + day + '. Send it as a JSON POST body."',
      Link: '<' + GETQ_DOC + '>; rel="deprecation"',
    },
  };
}

export function withDeprecation(resp, headers) {
  if (!headers) return resp;
  const r = new Response(resp.body, resp);
  for (const [k, v] of Object.entries(headers)) r.headers.set(k, v);
  const ex = r.headers.get('Access-Control-Expose-Headers');
  r.headers.set('Access-Control-Expose-Headers', (ex ? ex + ',' : '') + 'Deprecation,Sunset,Warning,Link');
  return r;
}
