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
// tools-hub-batch13: Critical missing tools for AI agents
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function jsonToSwift2(b){if(!b.data)return e('data required');var n=b.name||'Root';var lines=['struct '+n+': Codable {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'Int':'Double'):typeof v==='boolean'?'Bool':'Any';lines.push('    var '+k+': '+t);}lines.push('}');return j({swift:lines.join('\n')});}
function jsonToPhp(b){if(!b.data)return e('data required');var n=b.name||'Root';var lines=['<?php','class '+n+' {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'string':typeof v==='number'?(Number.isInteger(v)?'int':'float'):typeof v==='boolean'?'bool':'mixed';lines.push('    public '+t+' $'+k+';');}lines.push('}');return j({php:lines.join('\n')});}
function jsonToRuby(b){if(!b.data)return e('data required');var n=b.name||'Root';var attrs=Object.keys(b.data).map(function(k){return':'+k;}).join(', ');var lines=[n+' = Struct.new('+attrs+')'];return j({ruby:lines.join('\n')});}
async function webFetch(b){if(!b.url)return e('url required');try{var r=await fetch(b.url,{headers:{'User-Agent':'ToolsHubBot/1.0'}});var html=await r.text();var text=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();var title=(html.match(/<title>([^<]*)<\/title>/i)||[])[1]||'';return j({url:b.url,title:title,text:text.substring(0,b.maxLength||5000),textLength:text.length,status:r.status});}catch(err){return e('Failed: '+err.message);}}
async function urlInfo(b){if(!b.url)return e('url required');try{var r=await fetch(b.url,{method:'HEAD'});return j({url:b.url,status:r.status,contentType:r.headers.get('content-type'),contentLength:r.headers.get('content-length'),server:r.headers.get('server'),lastModified:r.headers.get('last-modified'),etag:r.headers.get('etag'),redirected:r.redirected,finalUrl:r.url});}catch(err){return e('Failed: '+err.message);}}
function mdToText(b){if(!b.markdown)return e('markdown required');var t=b.markdown.replace(/^#{1,6}\s+/gm,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^[\-*+]\s+/gm,'').replace(/^>\s*/gm,'').replace(/`{1,3}[^`]*`{1,3}/g,function(m){return m.replace(/`/g,'');}).trim();return j({text:t});}
function htmlToMd(b){if(!b.html)return e('html required');var md=b.html.replace(/<h1[^>]*>(.*?)<\/h1>/gi,'# $1\n').replace(/<h2[^>]*>(.*?)<\/h2>/gi,'## $1\n').replace(/<h3[^>]*>(.*?)<\/h3>/gi,'### $1\n').replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**').replace(/<b[^>]*>(.*?)<\/b>/gi,'**$1**').replace(/<em[^>]*>(.*?)<\/em>/gi,'*$1*').replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,'[$2]($1)').replace(/<li[^>]*>(.*?)<\/li>/gi,'- $1\n').replace(/<br\s*\/?>/gi,'\n').replace(/<p[^>]*>(.*?)<\/p>/gi,'$1\n\n').replace(/<[^>]+>/g,'').trim();return j({markdown:md});}
function textToMd(b){if(!b.text)return e('text required');var lines=b.text.split('\n');var md=lines.map(function(l){if(l.match(/^[A-Z][A-Z\s]+$/))return'## '+l;if(l.match(/^\d+\./))return l;if(l.match(/^[-*]/))return l;if(l.trim()==='')return'';return l;}).join('\n');return j({markdown:md});}
function detectFormat(b){if(!b.text)return e('text required');var t=b.text.trim();var format='unknown';if(t.startsWith('{')&&t.endsWith('}'))format='json';else if(t.startsWith('[')&&t.endsWith(']'))format='json-array';else if(t.startsWith('<'))format=t.includes('<?xml')?'xml':'html';else if(t.includes(',')&&t.split('\n')[0].split(',').length>1)format='csv';else if(t.includes(': ')&&!t.includes(','))format='yaml';else if(t.includes('\t')&&t.split('\n')[0].split('\t').length>1)format='tsv';else if(t.startsWith('#'))format='markdown';else format='text';return j({format:format,length:t.length,lines:t.split('\n').length});}
function jsonDiff2(b){if(!b.before||!b.after)return e('before and after required');var changes=[];function diff(a,b2,path){for(var k in b2){var p=path?path+'.'+k:k;if(!(k in a))changes.push({type:'added',path:p,value:b2[k]});else if(JSON.stringify(a[k])!==JSON.stringify(b2[k])){if(typeof a[k]==='object'&&typeof b2[k]==='object')diff(a[k],b2[k],p);else changes.push({type:'changed',path:p,from:a[k],to:b2[k]});}}for(var k in a){if(!(k in b2))changes.push({type:'removed',path:path?path+'.'+k:k,value:a[k]});}}diff(b.before,b.after,'');return j({changes:changes,count:changes.length});}
const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/json-to-swift':return jsonToSwift2(body);
  case'/api/json-to-php':return jsonToPhp(body);
  case'/api/json-to-ruby':return jsonToRuby(body);
  case'/api/web-fetch':return webFetch(body);
  case'/api/url-info':return urlInfo(body);
  case'/api/markdown-to-text':return mdToText(body);
  case'/api/html-to-markdown':return htmlToMd(body);
  case'/api/text-to-markdown':return textToMd(body);
  case'/api/detect-format':return detectFormat(body);
  case'/api/json-diff-v2':return jsonDiff2(body);
  default:return new Response('Not Found',{status:404});
}}};

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
