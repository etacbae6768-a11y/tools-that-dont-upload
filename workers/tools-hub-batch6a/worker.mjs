// tools-hub-batch6a: 25 endpoints (250→275)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// HTTP Testing
function httpBinPost(b){return j({method:'POST',data:b,timestamp:new Date().toISOString()});}
function httpBinGet(url){var p=Object.fromEntries(url.searchParams);return j({method:'GET',args:p,timestamp:new Date().toISOString()});}
async function httpDelay(b){var ms=Math.min((b.seconds||1)*1000,10000);await new Promise(r=>setTimeout(r,ms));return j({delayed:ms/1000,unit:'seconds'});}
function httpStatusCode(b){var code=parseInt(b.code)||200;return new Response(JSON.stringify({status:code}),{status:code,headers:{'Content-Type':'application/json',...C}});}
function httpRedirect(b,url){var target=b.url||'https://toolsthatdontupload.com';var code=parseInt(b.code)||302;return Response.redirect(target,code);}

// Crypto
async function hmacSign(b){var{text,key,algorithm}=b;if(!text||!key)return e('text and key required');var algo=algorithm==='SHA-512'?'SHA-512':'SHA-256';var k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:algo},false,['sign']);var sig=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(text));return j({hmac:Array.from(new Uint8Array(sig)).map(x=>x.toString(16).padStart(2,'0')).join(''),algorithm:'HMAC-'+algo});}
function checksum(b){if(!b.text)return e('text required');var crc=0xFFFFFFFF;for(var i=0;i<b.text.length;i++){crc^=b.text.charCodeAt(i);for(var j2=0;j2<8;j2++)crc=crc&1?crc>>>1^0xEDB88320:crc>>>1;}return j({crc32:((crc^0xFFFFFFFF)>>>0).toString(16).toUpperCase().padStart(8,'0'),decimal:(crc^0xFFFFFFFF)>>>0});}
function tokenGenerate(b){var{format,length}=b;var len=Math.min(length||32,128);var bytes=new Uint8Array(len);crypto.getRandomValues(bytes);var hex=Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');if(format==='uuid')return j({token:crypto.randomUUID(),format:'uuid'});if(format==='base64')return j({token:btoa(String.fromCharCode(...bytes.slice(0,len))),format:'base64'});if(format==='bearer')return j({token:'tk_'+hex.substring(0,40),format:'bearer'});return j({token:hex.substring(0,len*2),format:'hex'});}
function hashCompare(b){if(!b.hash1||!b.hash2)return e('hash1 and hash2 required');var a=b.hash1.toLowerCase(),b2=b.hash2.toLowerCase();var match=a.length===b2.length;for(var i=0;i<a.length;i++)match=match&&a[i]===b2[i];return j({match:match,length1:a.length,length2:b2.length});}
async function keyPairGen(b){var algo=b.algorithm||'ECDSA';try{var kp;if(algo==='RSA'){kp=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);}else{kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);}var pub=await crypto.subtle.exportKey('jwk',kp.publicKey);return j({algorithm:algo,publicKey:pub,note:'Private key not exported for security'});}catch(err){return e(err.message);}}

// Data Format
function yamlFormat(b){if(!b.yaml)return e('yaml required');var lines=b.yaml.split('\n');var valid=true;var errors=[];lines.forEach(function(l,i){if(l.trim()&&!l.match(/^\s*(#.*|-\s|[a-zA-Z0-9_-]+\s*:.*)$/))errors.push('Line '+(i+1));});return j({formatted:b.yaml.trim(),lines:lines.length,valid:errors.length===0,errors:errors});}
function iniToJson(b){if(!b.ini)return e('ini required');var result={};var section='';b.ini.split('\n').forEach(function(l){l=l.trim();if(!l||l.startsWith(';')||l.startsWith('#'))return;var sm=l.match(/^\[(.+)\]$/);if(sm){section=sm[1];result[section]={};return;}var kv=l.split('=');if(kv.length>=2){var k=kv[0].trim(),v=kv.slice(1).join('=').trim();if(section)result[section][k]=v;else result[k]=v;}});return j({result:result});}
function jsonToIni(b){if(!b.data)return e('data required');var lines=[];for(var k in b.data){if(typeof b.data[k]==='object'){lines.push('['+k+']');for(var k2 in b.data[k])lines.push(k2+'='+b.data[k][k2]);}else{lines.push(k+'='+b.data[k]);}}return j({ini:lines.join('\n')});}
function propertiesToJson(b){if(!b.properties)return e('properties required');var result={};b.properties.split('\n').forEach(function(l){l=l.trim();if(!l||l.startsWith('#'))return;var idx=l.indexOf('=');if(idx>0)result[l.substring(0,idx).trim()]=l.substring(idx+1).trim();});return j({result:result});}
function envToJson(b){if(!b.env)return e('env required');var result={};b.env.split('\n').forEach(function(l){l=l.trim();if(!l||l.startsWith('#'))return;var idx=l.indexOf('=');if(idx>0){var k=l.substring(0,idx).trim();var v=l.substring(idx+1).trim().replace(/^["']|["']$/g,'');result[k]=v;}});return j({result:result});}

// Text Processing
function textIndent(b){if(!b.text)return e('text required');var spaces=b.spaces||2;var mode=b.mode||'indent';if(mode==='dedent')return j({result:b.text.split('\n').map(function(l){return l.replace(new RegExp('^\\s{0,'+spaces+'}'),'');}).join('\n')});return j({result:b.text.split('\n').map(function(l){return ' '.repeat(spaces)+l;}).join('\n')});}
function textSortLines(b){if(!b.text)return e('text required');var lines=b.text.split('\n');var order=b.order||'asc';lines.sort();if(order==='desc')lines.reverse();return j({result:lines.join('\n'),lineCount:lines.length});}
function textRemoveBlank(b){if(!b.text)return e('text required');var lines=b.text.split('\n').filter(function(l){return l.trim().length>0;});return j({result:lines.join('\n'),removed:b.text.split('\n').length-lines.length});}
function textPrefix(b){if(!b.text)return e('text required');var prefix=b.prefix||'';var suffix=b.suffix||'';return j({result:b.text.split('\n').map(function(l){return prefix+l+suffix;}).join('\n')});}
function textBetween(b){if(!b.text||!b.start||!b.end)return e('text, start, and end required');var s=b.text.indexOf(b.start);var en=b.text.indexOf(b.end,s+b.start.length);if(s===-1||en===-1)return j({found:false,result:null});return j({found:true,result:b.text.substring(s+b.start.length,en)});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/http-bin-post':return httpBinPost(body);
  case'/api/http-bin-get':return httpBinGet(url);
  case'/api/http-delay':return httpDelay(body);
  case'/api/http-status-code':return httpStatusCode(body);
  case'/api/http-redirect':return httpRedirect(body,url);
  case'/api/hmac':return hmacSign(body);
  case'/api/checksum':return checksum(body);
  case'/api/token-generate':return tokenGenerate(body);
  case'/api/hash-compare':return hashCompare(body);
  case'/api/key-pair':return keyPairGen(body);
  case'/api/yaml-format':return yamlFormat(body);
  case'/api/ini-to-json':return iniToJson(body);
  case'/api/json-to-ini':return jsonToIni(body);
  case'/api/properties-to-json':return propertiesToJson(body);
  case'/api/env-to-json':return envToJson(body);
  case'/api/text-indent':return textIndent(body);
  case'/api/text-sort-lines':return textSortLines(body);
  case'/api/text-remove-blank':return textRemoveBlank(body);
  case'/api/text-prefix':return textPrefix(body);
  case'/api/text-between':return textBetween(body);
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
