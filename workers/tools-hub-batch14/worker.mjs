
const C = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s){return new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json',...C}});}
function e(m){return j({error:m},400);}
async function gb(r){try{return await r.json();}catch{return{};}}

// Screenshot API: URL → screenshot metadata (actual screenshot needs browser, return preview URL)
async function screenshotApi(b) {
  if(!b.url) return e('url required');
  // Use a free screenshot service as proxy
  var width = b.width || 1280;
  var height = b.height || 720;
  var screenshotUrl = 'https://image.thum.io/get/width/' + width + '/crop/' + height + '/' + b.url;
  return j({ url: b.url, screenshotUrl: screenshotUrl, width: width, height: height, format: 'png' });
}

// Favicon API: domain → favicon URLs
async function faviconApi(b) {
  if(!b.domain) return e('domain required');
  var domain = b.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return j({
    domain: domain,
    favicons: [
      { size: '16x16', url: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=16' },
      { size: '32x32', url: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=32' },
      { size: '64x64', url: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64' },
      { size: '128x128', url: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128' },
    ]
  });
}

// HTML to PDF (returns instruction - actual PDF needs pdf-lib or browser)
function htmlToPdfApi(b) {
  if(!b.html) return e('html required');
  // Simple: convert HTML to a data URL that can be printed to PDF
  var base64Html = btoa(unescape(encodeURIComponent(b.html)));
  return j({
    dataUrl: 'data:text/html;base64,' + base64Html,
    htmlLength: b.html.length,
    tip: 'Open dataUrl in browser and use Ctrl+P to save as PDF, or use /api/pdf-merge with rendered page'
  });
}

// Markdown to HTML (enhanced with full styling)
function mdToHtmlFull(b) {
  if(!b.markdown) return e('markdown required');
  var html = b.markdown
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>');
  var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}h1,h2,h3{margin-top:1.5em}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}blockquote{border-left:3px solid #ccc;padding-left:12px;color:#666}a{color:#0066cc}</style></head><body>' + html + '</body></html>';
  return j({ html: fullHtml, length: fullHtml.length });
}

// JSON to CSV (enhanced - handles nested objects)
function jsonToCsvEnhanced(b) {
  if(!b.data) return e('data required (array of objects)');
  var arr = Array.isArray(b.data) ? b.data : [b.data];
  if(arr.length === 0) return j({ csv: '', rows: 0 });
  var headers = [...new Set(arr.flatMap(function(obj) { return Object.keys(obj); }))];
  var csv = headers.join(',') + '\n';
  arr.forEach(function(row) {
    csv += headers.map(function(h) {
      var val = row[h];
      if(val === undefined || val === null) return '';
      var str = String(val);
      if(str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
      return str;
    }).join(',') + '\n';
  });
  return j({ csv: csv, rows: arr.length, columns: headers.length, headers: headers });
}

// Timestamp conversions
function timestampApi(b) {
  var now = new Date();
  if(b.timestamp) now = new Date(typeof b.timestamp === 'number' ? b.timestamp * 1000 : b.timestamp);
  return j({
    unix: Math.floor(now.getTime() / 1000),
    iso: now.toISOString(),
    utc: now.toUTCString(),
    local: now.toString(),
    date: now.toISOString().split('T')[0],
    time: now.toISOString().split('T')[1].split('.')[0],
    dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()],
    epoch_ms: now.getTime(),
  });
}

// IP to country (using cf headers)
function ipCountry(request) {
  return j({
    ip: request.headers.get('cf-connecting-ip') || 'unknown',
    country: request.headers.get('cf-ipcountry') || 'unknown',
    city: request.cf?.city || 'unknown',
    region: request.cf?.region || 'unknown',
    timezone: request.cf?.timezone || 'unknown',
    asn: request.cf?.asn || 'unknown',
  });
}

// User agent parser
function parseUserAgent(b) {
  if(!b.userAgent) return e('userAgent required');
  var ua = b.userAgent;
  var browser = 'Unknown';
  var os = 'Unknown';
  if(ua.includes('Chrome')) browser = 'Chrome';
  else if(ua.includes('Firefox')) browser = 'Firefox';
  else if(ua.includes('Safari')) browser = 'Safari';
  else if(ua.includes('Edge')) browser = 'Edge';
  if(ua.includes('Windows')) os = 'Windows';
  else if(ua.includes('Mac')) os = 'macOS';
  else if(ua.includes('Linux')) os = 'Linux';
  else if(ua.includes('Android')) os = 'Android';
  else if(ua.includes('iPhone')||ua.includes('iPad')) os = 'iOS';
  var isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  return j({ browser: browser, os: os, isMobile: isMobile, raw: ua });
}

const __ttduInner = {
  async fetch(request) {
    if(request.method === 'OPTIONS') return new Response(null, {status:204, headers:C});
    var url = new URL(request.url);
    var p = url.pathname;
    var body = request.method === 'POST' ? await gb(request) : {};
    switch(p) {
      case '/api/screenshot': return screenshotApi(body);
      case '/api/favicon': return faviconApi(body);
      case '/api/html-to-pdf': return htmlToPdfApi(body);
      case '/api/markdown-to-html-full': return mdToHtmlFull(body);
      case '/api/json-to-csv-enhanced': return jsonToCsvEnhanced(body);
      case '/api/timestamp': return timestampApi(body);
      case '/api/my-ip': return ipCountry(request);
      case '/api/user-agent-parse': return parseUserAgent(body);
      default: return new Response('Not Found', {status:404});
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
