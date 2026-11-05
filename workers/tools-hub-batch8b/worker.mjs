// tools-hub-batch8b: 22 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function textHighlight(b){if(!b.text||!b.words)return e('text and words required');var result=b.text;b.words.forEach(function(w){result=result.replace(new RegExp(w,'gi'),'**'+w+'**');});return j({result:result});}
function textCompare(b){if(!b.text1||!b.text2)return e('text1 and text2 required');var a=b.text1,b2=b.text2;var maxLen=Math.max(a.length,b2.length);var same=0;for(var i=0;i<Math.min(a.length,b2.length);i++){if(a[i]===b2[i])same++;}return j({similarity:Math.round(same/maxLen*1000)/1000,sameChars:same,text1Length:a.length,text2Length:b2.length});}
function textNormalize(b){if(!b.text)return e('text required');var form=b.form||'NFC';return j({result:b.text.normalize(form),form:form});}
function stringHash(b){if(!b.text)return e('text required');var h=5381;for(var i=0;i<b.text.length;i++){h=((h<<5)+h)+b.text.charCodeAt(i);}return j({djb2:(h>>>0).toString(16),decimal:h>>>0});}
function vatValidate(b){if(!b.vat)return e('vat required');var clean=b.vat.replace(/[\s.-]/g,'').toUpperCase();var country=clean.substring(0,2);return j({vat:clean,country:country,valid:/^[A-Z]{2}[A-Z0-9]{5,12}$/.test(clean)});}
function swiftValidate(b){if(!b.swift)return e('swift required');var s=b.swift.toUpperCase().replace(/\s/g,'');return j({swift:s,valid:/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s),bank:s.substring(0,4),country:s.substring(4,6)});}
function zipValidate(b){if(!b.zip)return e('zip required');var patterns={US:/^\d{5}(-\d{4})?$/,KR:/^\d{5}$/,JP:/^\d{3}-\d{4}$/,DE:/^\d{5}$/,UK:/^[A-Z]{1,2}\d[A-Z0-9]?\s?\d[A-Z]{2}$/i};var p=patterns[(b.country||'US').toUpperCase()];return j({zip:b.zip,valid:p?p.test(b.zip):null,country:b.country||'US'});}
function passwordPolicy(b){if(!b.password)return e('password required');var p=b.password;return j({valid:p.length>=8&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/\d/.test(p)&&/[^a-zA-Z0-9]/.test(p),checks:{length:p.length>=8,upper:/[A-Z]/.test(p),lower:/[a-z]/.test(p),digit:/\d/.test(p),special:/[^a-zA-Z0-9]/.test(p)}});}
function dateDiffDetailed(b){if(!b.date1||!b.date2)return e('date1 and date2 required');var diff=Math.abs(new Date(b.date2)-new Date(b.date1));return j({totalDays:Math.floor(diff/86400000),totalHours:Math.floor(diff/3600000),years:Math.floor(diff/31536000000),months:Math.floor(diff%31536000000/2592000000),days:Math.floor(diff%2592000000/86400000)});}
function timezoneList2(){var zones=['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Europe/Berlin','Asia/Tokyo','Asia/Seoul','Asia/Shanghai','Australia/Sydney'];var now=new Date();return j({timezones:zones.map(function(tz){try{return{tz:tz,time:now.toLocaleString('en-US',{timeZone:tz,hour12:false})};}catch(e2){return{tz:tz};}}),count:zones.length});}
function dateFormatConvert(b){if(!b.date)return e('date required');var d=new Date(b.date);return j({iso:d.toISOString(),us:(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear(),eu:d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(),unix:Math.floor(d.getTime()/1000)});}
function fiscalYear(b){if(!b.date)return e('date required');var d=new Date(b.date);var m=d.getMonth()+1;var fy=m>=4?d.getFullYear():d.getFullYear()-1;return j({fiscalYear:'FY'+(fy%100)+'-'+((fy+1)%100),quarter:'Q'+Math.ceil(((m-4+12)%12+1)/3)});}
function quadratic(b){if(b.a===undefined)return e('a,b,c required');var disc=b.b*b.b-4*b.a*b.c;if(disc<0)return j({solutions:'complex',discriminant:disc});var x1=(-b.b+Math.sqrt(disc))/(2*b.a);var x2=(-b.b-Math.sqrt(disc))/(2*b.a);return j({x1:Math.round(x1*1e6)/1e6,x2:Math.round(x2*1e6)/1e6,discriminant:disc});}
function lcmMulti(b){if(!b.numbers)return e('numbers required');function gcd(a,b2){return b2===0?a:gcd(b2,a%b2);}var r=b.numbers[0];for(var i=1;i<b.numbers.length;i++)r=Math.abs(r*b.numbers[i])/gcd(r,b.numbers[i]);return j({lcm:r});}
function geometricMean(b){if(!b.numbers)return e('numbers required');var n=b.numbers;return j({geometric:Math.round(Math.pow(n.reduce(function(p,x){return p*x;},1),1/n.length)*1e6)/1e6,arithmetic:Math.round(n.reduce(function(s,x){return s+x;},0)/n.length*1e6)/1e6});}
function stdDev(b){if(!b.numbers)return e('numbers required');var n=b.numbers;var mean=n.reduce(function(s,x){return s+x;},0)/n.length;var v=n.reduce(function(s,x){return s+Math.pow(x-mean,2);},0)/n.length;return j({stddev:Math.round(Math.sqrt(v)*1e6)/1e6,variance:Math.round(v*1e6)/1e6,mean:Math.round(mean*1e6)/1e6});}
function percentile2(b){if(!b.numbers)return e('numbers and percentile required');var n=[...b.numbers].sort(function(a,b2){return a-b2;});var p=b.percentile/100;var idx=p*(n.length-1);return j({value:n[Math.round(idx)],percentile:b.percentile});}
function uaGenerate(b){var uas=['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0','Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0','Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15'];var count=Math.min(b.count||3,10);var results=[];for(var i=0;i<count;i++)results.push(uas[i%uas.length]);return j({userAgents:results});}
function cacheHeaders(b){var maxAge=b.maxAge||3600;return j({cacheControl:'public, max-age='+maxAge,expires:new Date(Date.now()+maxAge*1000).toUTCString()});}
async function etagGenerate(b){if(!b.content)return e('content required');var hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.content));var hex=Array.from(new Uint8Array(hash)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');return j({etag:'"'+hex.substring(0,16)+'"'});}
function acceptHeader(b){if(!b.accept)return e('accept header required');var types=b.accept.split(',').map(function(t){return{type:t.trim().split(';')[0].trim()};}).sort();return j({types:types,preferred:types[0]?.type});}
const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/text-highlight':return textHighlight(body);
  case'/api/text-compare':return textCompare(body);
  case'/api/text-normalize':return textNormalize(body);
  case'/api/string-hash':return stringHash(body);
  case'/api/vat-validate':return vatValidate(body);
  case'/api/swift-validate':return swiftValidate(body);
  case'/api/zip-validate':return zipValidate(body);
  case'/api/password-policy':return passwordPolicy(body);
  case'/api/date-diff-detailed':return dateDiffDetailed(body);
  case'/api/timezone-list':return timezoneList2();
  case'/api/date-format-convert':return dateFormatConvert(body);
  case'/api/fiscal-year':return fiscalYear(body);
  case'/api/quadratic':return quadratic(body);
  case'/api/lcm-multi':return lcmMulti(body);
  case'/api/geometric-mean':return geometricMean(body);
  case'/api/standard-deviation':return stdDev(body);
  case'/api/percentile':return percentile2(body);
  case'/api/user-agent-generate':return uaGenerate(body);
  case'/api/http-cache-headers':return cacheHeaders(body);
  case'/api/etag-generate':return etagGenerate(body);
  case'/api/accept-header':return acceptHeader(body);
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
