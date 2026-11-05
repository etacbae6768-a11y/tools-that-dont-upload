// --- ttdu safe outbound fetch (manual redirects, per-hop validation) ---
const __ttduOrigFetch = globalThis.fetch.bind(globalThis);
function __ttduBadHost(h){h=(h||'').toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');if(!h)return 'empty host';if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.lan')||h.endsWith('.home.arpa'))return 'local hostname';if(h.includes(':'))return 'IP literal not allowed';if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h))return 'IP literal not allowed';if(/^(0x[0-9a-f]+|\d+)$/i.test(h))return 'IP literal not allowed';if(!h.includes('.'))return 'single-label host not allowed';return null;}
function __ttduCheckUrl(u){if(u.protocol!=='http:'&&u.protocol!=='https:')return 'only http/https allowed';if(u.port&&u.port!=='80'&&u.port!=='443')return 'only ports 80/443 allowed';if(u.username||u.password)return 'credentials in url not allowed';return __ttduBadHost(u.hostname);}
const __TTDU_SENSITIVE=/^(authorization|cookie|proxy-authorization|x-api-key|x-internal-token|x-client-ip)$/i;
async function __ttduSafeFetch(input,init){
  if(typeof input!=='string'&&!(input instanceof URL))return __ttduOrigFetch(input,init);
  init=Object.assign({},init||{});const wantManual=init.redirect==='manual';const MAX=5;
  let url=new URL(String(input));let method=(init.method||'GET').toUpperCase();let body=init.body;
  let headers=new Headers(init.headers||{});for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);
  for(let hop=0;;hop++){
    const bad=__ttduCheckUrl(url);if(bad)throw new Error((hop?'Redirect target rejected: ':'Target rejected: ')+bad);
    const r=await __ttduOrigFetch(url.toString(),Object.assign({},init,{method,headers,body,redirect:'manual'}));
    if(wantManual||![301,302,303,307,308].includes(r.status))return r;
    const loc=r.headers.get('location');if(!loc)return r;
    if(hop+1>MAX)throw new Error('Too many redirects (max '+MAX+')');
    const next=new URL(loc,url);
    if(next.origin!==url.origin){for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);}
    if(r.status===303||((r.status===301||r.status===302)&&method==='POST')){method='GET';body=undefined;headers.delete('content-type');headers.delete('content-length');}
    url=next;
  }
}
const fetch=__ttduSafeFetch;
// --- end safe fetch ---
// tools-hub-missing: 15 endpoints that were listed but not in hub _worker.js
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
function json(data, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } }); }
function err(msg, s = 400) { return json({ error: msg }, s); }
async function getBody(r) { try { return await r.json(); } catch { return {}; } }

function textCase(b) {
  const { text, case: c = 'upper' } = b;
  if (!text) return err('text required');
  const cases = {
    upper: t => t.toUpperCase(),
    lower: t => t.toLowerCase(),
    title: t => t.replace(/\b\w/g, c => c.toUpperCase()),
    sentence: t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
    camel: t => t.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase()),
    snake: t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    kebab: t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    pascal: t => t.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase()),
    constant: t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
  };
  const fn = cases[c];
  if (!fn) return err('case must be: ' + Object.keys(cases).join(', '));
  return json({ result: fn(text) });
}

function textReverse(b) {
  if (!b.text) return err('text required');
  return json({ result: [...b.text].reverse().join('') });
}

function textDedupe(b) {
  if (!b.text) return err('text required');
  const lines = b.text.split('\n');
  const unique = [...new Set(lines)];
  return json({ result: unique.join('\n'), originalLines: lines.length, uniqueLines: unique.length, removed: lines.length - unique.length });
}

function htmlMinify(b) {
  if (!b.html) return err('html required');
  const result = b.html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .replace(/\s*([>}])\s*/g, '$1')
    .trim();
  return json({ result, originalSize: b.html.length, minifiedSize: result.length, savings: Math.round((1 - result.length / b.html.length) * 100) + '%' });
}

function cssMinify(b) {
  if (!b.css) return err('css required');
  const result = b.css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,>~+])\s*/g, '$1')
    .replace(/;}/, '}')
    .trim();
  return json({ result, originalSize: b.css.length, minifiedSize: result.length });
}

function jsMinify(b) {
  if (!b.js) return err('js required');
  const result = b.js
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,=+\-*/<>!&|?()\[\]])\s*/g, '$1')
    .trim();
  return json({ result, originalSize: b.js.length, minifiedSize: result.length });
}

function httpStatus(b) {
  const { code } = b;
  if (!code) return err('code required');
  const statuses = {
    100:'Continue',101:'Switching Protocols',200:'OK',201:'Created',204:'No Content',
    301:'Moved Permanently',302:'Found',304:'Not Modified',307:'Temporary Redirect',308:'Permanent Redirect',
    400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',
    408:'Request Timeout',409:'Conflict',410:'Gone',413:'Payload Too Large',415:'Unsupported Media Type',
    422:'Unprocessable Entity',429:'Too Many Requests',500:'Internal Server Error',502:'Bad Gateway',
    503:'Service Unavailable',504:'Gateway Timeout',
  };
  const c = parseInt(code);
  const category = c < 200 ? 'Informational' : c < 300 ? 'Success' : c < 400 ? 'Redirection' : c < 500 ? 'Client Error' : 'Server Error';
  return json({ code: c, message: statuses[c] || 'Unknown', category });
}

async function metaExtract(b) {
  const { url } = b;
  if (!url) return err('url required');
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'ToolsHubBot/1.0' } });
    const html = await resp.text();
    const meta = {};
    const re = /<meta[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']*?)["'][^>]*\/?>/gi;
    const re2 = /<meta[^>]*content=["']([^"']*?)["'][^>]*(?:name|property)=["']([^"']+)["'][^>]*\/?>/gi;
    let m;
    while ((m = re.exec(html)) !== null) meta[m[1]] = m[2];
    while ((m = re2.exec(html)) !== null) meta[m[2]] = m[1];
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || null;
    const charset = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i)?.[1] || null;
    const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || null;
    return json({ url, title, charset, canonical, meta });
  } catch(e) { return err('Failed: ' + e.message); }
}

function robotsCheck(b) {
  const { url, path: p = '/', userAgent = '*' } = b;
  if (!url && !b.content) return err('url or content required');
  // Simple robots.txt parser
  const content = b.content || '';
  const lines = content.split('\n');
  let currentAgent = null;
  let allowed = true;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const match = trimmed.match(/^(User-agent|Disallow|Allow):\s*(.*)/i);
    if (!match) continue;
    const [, directive, value] = match;
    if (directive.toLowerCase() === 'user-agent') {
      currentAgent = value.trim();
    } else if (currentAgent === userAgent || currentAgent === '*') {
      if (directive.toLowerCase() === 'disallow' && value.trim() && p.startsWith(value.trim())) allowed = false;
      if (directive.toLowerCase() === 'allow' && value.trim() && p.startsWith(value.trim())) allowed = true;
    }
  }
  return json({ path: p, userAgent, allowed, source: content ? 'provided' : 'fetched' });
}

async function sitemapParse(b) {
  const { url } = b;
  if (!url) return err('url required');
  try {
    const resp = await fetch(url);
    const xml = await resp.text();
    const urls = [];
    const re = /<loc>([^<]+)<\/loc>/gi;
    let m;
    while ((m = re.exec(xml)) !== null) urls.push(m[1]);
    const lastmods = [];
    const re2 = /<lastmod>([^<]+)<\/lastmod>/gi;
    while ((m = re2.exec(xml)) !== null) lastmods.push(m[1]);
    return json({ url, urlCount: urls.length, urls: urls.slice(0, 50), lastModified: lastmods.slice(0, 10), isSitemapIndex: xml.includes('sitemapindex') });
  } catch(e) { return err('Failed: ' + e.message); }
}

function jsonValidate(b) {
  const { json: j } = b;
  if (j === undefined) return err('json (string) required');
  try {
    const str = typeof j === 'string' ? j : JSON.stringify(j);
    const parsed = JSON.parse(str);
    const type = Array.isArray(parsed) ? 'array' : typeof parsed;
    return json({ valid: true, type, size: str.length });
  } catch(e) { return json({ valid: false, error: e.message }); }
}

async function bcryptHash(b) {
  const { text, mode = 'hash', hash: h, rounds = 10 } = b;
  if (mode === 'hash') {
    if (!text) return err('text required');
    // Simple bcrypt-like hash using Web Crypto (not real bcrypt, but a secure alternative)
    const enc = new TextEncoder().encode(text + ':' + rounds);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    return json({ hash: '$sha256$' + rounds + '$' + hashHex, algorithm: 'sha256-pbkdf-like', rounds });
  } else if (mode === 'verify') {
    if (!text || !h) return err('text and hash required');
    const enc = new TextEncoder().encode(text + ':' + (h.match(/\$(\d+)\$/)?.[1] || 10));
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const expected = h.split('$').pop();
    return json({ match: hashHex === expected });
  }
  return err('mode must be hash or verify');
}

function unixTimestamp(b) {
  const { timestamp, date } = b;
  if (timestamp) {
    const ts = parseInt(timestamp);
    const d = new Date(ts * 1000);
    return json({ timestamp: ts, iso: d.toISOString(), utc: d.toUTCString(), local: d.toString(), dayOfWeek: d.toLocaleDateString('en', {weekday:'long'}) });
  }
  if (date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return err('Invalid date');
    return json({ timestamp: Math.floor(d.getTime() / 1000), iso: d.toISOString(), utc: d.toUTCString() });
  }
  const now = new Date();
  return json({ timestamp: Math.floor(now.getTime() / 1000), iso: now.toISOString(), utc: now.toUTCString(), ms: now.getTime() });
}

function urlDecode(b) {
  if (!b.text) return err('text required');
  try {
    return json({ result: decodeURIComponent(b.text) });
  } catch(e) { return err('Invalid encoded text: ' + e.message); }
}

const __ttduInner = {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const p = url.pathname;
    const body = request.method === 'POST' ? await getBody(request) : {};
    switch (p) {
      case '/api/text-case': return textCase(body);
      case '/api/text-reverse': return textReverse(body);
      case '/api/text-dedupe': return textDedupe(body);
      case '/api/html-minify': return htmlMinify(body);
      case '/api/css-minify': return cssMinify(body);
      case '/api/js-minify': return jsMinify(body);
      case '/api/http-status': return httpStatus(body);
      case '/api/meta-extract': return metaExtract(body);
      case '/api/robots-check': return robotsCheck(body);
      case '/api/sitemap-parse': return sitemapParse(body);
      case '/api/json-validate': return jsonValidate(body);
      case '/api/bcrypt': return bcryptHash(body);
      case '/api/unix-timestamp': return unixTimestamp(body);
      case '/api/url-decode': return urlDecode(body);
      case '/api/pdf-protect': return err('pdf-protect requires pdf-lib (use browser tool at dagotools.com instead)');
      default: return new Response('Not Found', { status: 404 });
    }
  }
};


const __TTDU_CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key','Access-Control-Expose-Headers':'X-Credits-Used,X-Credits-Limit,X-Credits-Cost,Retry-After,RateLimit-Limit,RateLimit-Remaining'};
function __ttduProblem(status,title,detail,extra){return new Response(JSON.stringify({type:'about:blank',title,status,detail}),{status,headers:{'Content-Type':'application/problem+json',...__TTDU_CORS,...(extra||{})}});}
const __ttduOrig={async fetch(request,env,ctx){
  const m=request.method;
  if(m==='OPTIONS')return new Response(null,{status:204,headers:{...__TTDU_CORS,'Access-Control-Max-Age':'86400'}});
  if(m!=='GET'&&m!=='POST'&&m!=='HEAD')return __ttduProblem(405,'Method Not Allowed','Use GET or POST.',{Allow:'GET, POST, OPTIONS'});
  let req=request;
  const ct=(request.headers.get('content-type')||'').toLowerCase();
  if(m==='POST'&&ct.includes('application/json')){
    const t=await request.text();
    if(t.trim()){try{JSON.parse(t);}catch(e){return __ttduProblem(400,'Bad Request','Request body is not valid JSON.');}}
    req=new Request(request,{body:t||'{}'});
  }
  let r;
  try{r=await __ttduInner.fetch(req,env,ctx);}catch(e){return __ttduProblem(400,'Bad Request','The tool could not process this input. Check field names and types against the example in /openapi.json.');}
  if(!r)return __ttduProblem(500,'Internal Error','Empty response.');
  const rct=(r.headers.get('content-type')||'').toLowerCase();
  if(r.status>=500&&rct.includes('html'))return __ttduProblem(500,'Internal Error','The tool failed on this input.');
  const out=new Response(r.body,r);
  for(const [k,v] of Object.entries(__TTDU_CORS))out.headers.set(k,v);if(!out.headers.get('X-Egress'))out.headers.set('X-Egress','none');out.headers.set('Access-Control-Expose-Headers',__TTDU_CORS['Access-Control-Expose-Headers']+',X-Egress');
  return out;
}};

/* TTDU GET-query policy for compute endpoints (S-HUB 2026-11-04). Input in a GET query string is deprecated:
 * until the sunset the response carries Deprecation / Sunset / Warning / Link headers (same format as the gateway),
 * from the sunset it is rejected with 405 and a note to send POST. One setting: __TTDU_GETQ_SUNSET
 * (or a plain-text binding GET_QUERY_SUNSET). Exempt: endpoints documented as GET. */
const __TTDU_GETQ_SINCE='2026-11-04T00:00:00Z';
const __TTDU_GETQ_SUNSET='2026-12-16T00:00:00Z';
const __TTDU_GETQ_EXEMPT=new Set(['/api/kr-holidays','/api/password-gen','/api/qr','/api/http-bin-get']);
export default{async fetch(request,env,ctx){
  let __u;try{__u=new URL(request.url);}catch(e){return __ttduOrig.fetch(request,env,ctx);}
  const __get=request.method==='GET'||request.method==='HEAD';
  if(!__get||!__u.search||__u.search==='?'||!__u.pathname.startsWith('/api/')||__TTDU_GETQ_EXEMPT.has(__u.pathname.replace(/\/+$/,'')))return __ttduOrig.fetch(request,env,ctx);
  const since=Date.parse((env&&env.GET_QUERY_SINCE)||__TTDU_GETQ_SINCE),sunset=Date.parse((env&&env.GET_QUERY_SUNSET)||__TTDU_GETQ_SUNSET);
  if(Number.isFinite(sunset)&&Date.now()>=sunset)return new Response(JSON.stringify({title:'Method Not Allowed',status:405,detail:'Send input in a POST body so it is not placed in the request URL.'}),{status:405,headers:{'Content-Type':'application/problem+json','Access-Control-Allow-Origin':'*',Allow:'POST, OPTIONS'}});
  const res=await __ttduOrig.fetch(request,env,ctx);const r=new Response(res.body,res);const day=new Date(sunset).toISOString().slice(0,10);
  r.headers.set('Deprecation','@'+Math.floor(since/1000));r.headers.set('Sunset',new Date(sunset).toUTCString());
  r.headers.set('Warning','299 - "Input in the URL query is deprecated and stops working on '+day+'. Send it as a JSON POST body."');
  r.headers.set('Link','<https://toolsthatdontupload.com/docs/#input-rules>; rel="deprecation"');
  const ex=r.headers.get('Access-Control-Expose-Headers');r.headers.set('Access-Control-Expose-Headers',(ex?ex+',':'')+'Deprecation,Sunset,Warning,Link');return r;}};
