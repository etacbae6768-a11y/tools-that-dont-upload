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
// tools-hub-batch7a: 25 endpoints (300→325)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// JWT encode (HS256)
async function jwtEncode(b){var{payload,secret}=b;if(!payload||!secret)return e('payload and secret required');
var header={alg:'HS256',typ:'JWT'};var toB64=function(o){return btoa(JSON.stringify(o)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');};
var unsigned=toB64(header)+'.'+toB64(payload);
var key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
var sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(unsigned));
var sigB64=btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
return j({token:unsigned+'.'+sigB64,header:header,payload:payload});}

// Base32
function base32(b){var{text,mode}=b;if(!text)return e('text required');var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
if(mode==='decode'){var bits='';for(var i=0;i<text.length;i++){if(text[i]==='=')break;var idx=chars.indexOf(text[i].toUpperCase());if(idx>=0)bits+=idx.toString(2).padStart(5,'0');}var bytes=[];for(var i=0;i<bits.length-7;i+=8)bytes.push(parseInt(bits.substr(i,8),2));return j({result:String.fromCharCode.apply(null,bytes)});}
var bits='';for(var i=0;i<text.length;i++)bits+=text.charCodeAt(i).toString(2).padStart(8,'0');var result='';for(var i=0;i<bits.length;i+=5){var chunk=bits.substr(i,5);if(chunk.length<5)chunk=chunk+('0'.repeat(5-chunk.length));result+=chars[parseInt(chunk,2)];}while(result.length%8)result+='=';return j({result:result});}

// ASCII art
function asciiArt(b){if(!b.text)return e('text required');var font={A:['  #  ','# # #','#####','#   #','#   #'],B:['#### ','#   #','#### ','#   #','#### '],C:[' ### ','#   ','#   ','#   ',' ### '],D:['### ','#  #','#  #','#  #','### '],E:['####','#   ','### ','#   ','####'],F:['####','#   ','### ','#   ','#   '],G:[' ### ','#    ','# ##','#  #',' ## '],H:['#   #','#   #','#####','#   #','#   #'],I:['###',' # ',' # ',' # ','###'],K:['#  #','# # ','##  ','# # ','#  #'],L:['#   ','#   ','#   ','#   ','####'],M:['#   #','## ##','# # #','#   #','#   #'],N:['#   #','##  #','# # #','#  ##','#   #'],O:[' ## ','#  #','#  #','#  #',' ## '],P:['### ','#  #','### ','#   ','#   '],R:['### ','#  #','### ','# # ','#  #'],S:[' ###','#   ',' ## ','   #','### '],T:['#####','  #  ','  #  ','  #  ','  #  '],U:['#   #','#   #','#   #','#   #',' ### '],W:['#   #','#   #','# # #','## ##','#   #'],X:['#   #',' # # ','  #  ',' # # ','#   #'],Y:['#   #',' # # ','  #  ','  #  ','  #  '],Z:['#####','   # ','  #  ',' #   ','#####'],' ':['   ','   ','   ','   ','   ']};
var lines=['','','','',''];var t=b.text.toUpperCase();for(var i=0;i<t.length;i++){var ch=font[t[i]]||font[' '];for(var r=0;r<5;r++)lines[r]+=(ch[r]||'   ')+' ';}return j({art:lines.join('\n'),text:b.text});}

// JSON query
function jsonQuery(b){var{data,where,select}=b;if(!data)return e('data (array) required');if(!Array.isArray(data))return e('data must be array');var result=data;if(where){for(var k in where){var val=where[k];result=result.filter(function(item){return item[k]===val||String(item[k])===String(val);});}}if(select&&Array.isArray(select)){result=result.map(function(item){var r={};select.forEach(function(k2){r[k2]=item[k2];});return r;});}return j({result:result,count:result.length});}

// CSV merge
function csvMerge(b){if(!b.csv1||!b.csv2)return e('csv1 and csv2 required');var r1=b.csv1.trim().split('\n');var r2=b.csv2.trim().split('\n');var h1=r1[0].split(',');var h2=r2[0].split(',');var allH=[...new Set([...h1,...h2])];var merged=[allH.join(',')];for(var i=1;i<r1.length;i++){var vals=r1[i].split(',');var row={};h1.forEach(function(h,idx){row[h]=vals[idx]||'';});merged.push(allH.map(function(h){return row[h]||'';}).join(','));}for(var i=1;i<r2.length;i++){var vals=r2[i].split(',');var row={};h2.forEach(function(h,idx){row[h]=vals[idx]||'';});merged.push(allH.map(function(h){return row[h]||'';}).join(','));}return j({csv:merged.join('\n'),rows:merged.length-1,columns:allH.length});}

// CSV stats
function csvStats(b){if(!b.csv)return e('csv required');var rows=b.csv.trim().split('\n');var headers=rows[0].split(',').map(function(h){return h.trim();});var cols={};headers.forEach(function(h){cols[h]=[];});for(var i=1;i<rows.length;i++){var vals=rows[i].split(',');headers.forEach(function(h,idx){if(vals[idx])cols[h].push(vals[idx].trim());});}var stats={};for(var h in cols){var nums=cols[h].map(Number).filter(function(n){return!isNaN(n);});if(nums.length>0){nums.sort(function(a,b2){return a-b2;});var sum=nums.reduce(function(a,b2){return a+b2;},0);stats[h]={type:'numeric',count:nums.length,min:nums[0],max:nums[nums.length-1],mean:Math.round(sum/nums.length*100)/100,sum:sum};}else{stats[h]={type:'text',count:cols[h].length,unique:new Set(cols[h]).size};}}return j({stats:stats,rows:rows.length-1,columns:headers.length});}

// XML format
function xmlFormat(b){if(!b.xml)return e('xml required');var indent=0;var result=b.xml.replace(/>\s*</g,'><').split(/(<[^>]+>)/g).filter(Boolean).map(function(token){if(token.match(/^<\//)){indent--;return '  '.repeat(Math.max(0,indent))+token;}if(token.match(/^<[^/][^>]*[^/]>$/)){var r='  '.repeat(indent)+token;indent++;return r;}return '  '.repeat(indent)+token;}).join('\n');return j({formatted:result});}

// String template
function stringTemplate(b){if(!b.template||!b.data)return e('template and data required');var result=b.template;for(var k in b.data){result=result.replace(new RegExp('\\{\\{'+k+'\\}\\}','g'),b.data[k]);}return j({result:result});}

// String operations
function stringCountChars(b){if(!b.text)return e('text required');var freq={};for(var i=0;i<b.text.length;i++){var c=b.text[i];freq[c]=(freq[c]||0)+1;}var sorted=Object.entries(freq).sort(function(a,b2){return b2[1]-a[1];});return j({frequencies:Object.fromEntries(sorted),unique:Object.keys(freq).length,total:b.text.length});}
function stringRotate(b){if(!b.text)return e('text required');var n=(b.positions||1)%b.text.length;return j({result:b.text.slice(n)+b.text.slice(0,n)});}
function stringInterleave(b){if(!b.text1||!b.text2)return e('text1 and text2 required');var r='';var max=Math.max(b.text1.length,b.text2.length);for(var i=0;i<max;i++){if(i<b.text1.length)r+=b.text1[i];if(i<b.text2.length)r+=b.text2[i];}return j({result:r});}

// Security
async function passwordHash(b){if(!b.password)return e('password required');var salt=new Uint8Array(16);crypto.getRandomValues(salt);var key=await crypto.subtle.importKey('raw',new TextEncoder().encode(b.password),'PBKDF2',false,['deriveBits']);var bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:100000,hash:'SHA-256'},key,256);var hash=Array.from(new Uint8Array(bits)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');var saltHex=Array.from(salt).map(function(x){return x.toString(16).padStart(2,'0');}).join('');return j({hash:saltHex+':'+hash,algorithm:'PBKDF2-SHA256',iterations:100000});}
function corsHeaders(b){var origin=b.origin||'*';var methods=b.methods||['GET','POST','OPTIONS'];var headers=b.headers||['Content-Type','Authorization'];return j({headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':methods.join(', '),'Access-Control-Allow-Headers':headers.join(', '),'Access-Control-Max-Age':'86400'},nginx:'add_header Access-Control-Allow-Origin "'+origin+'";\nadd_header Access-Control-Allow-Methods "'+methods.join(', ')+'";',apache:'Header set Access-Control-Allow-Origin "'+origin+'"\nHeader set Access-Control-Allow-Methods "'+methods.join(', ')+'"'});}
function cspGenerate(b){var{self:s,scripts,styles,images,fonts,connect,frame}=b;var parts=[];parts.push("default-src "+(s?"'self'":"'none'"));if(scripts)parts.push("script-src 'self' "+scripts.join(' '));if(styles)parts.push("style-src 'self' "+styles.join(' '));if(images)parts.push("img-src 'self' "+(images.join(' ')));if(fonts)parts.push("font-src 'self' "+fonts.join(' '));if(connect)parts.push("connect-src 'self' "+connect.join(' '));if(frame)parts.push("frame-src "+frame.join(' '));return j({csp:parts.join('; '),header:'Content-Security-Policy: '+parts.join('; ')});}
async function sriHash(b){if(!b.url&&!b.content)return e('url or content required');var content=b.content;if(b.url){var r=await fetch(b.url);content=await r.text();}var hash=await crypto.subtle.digest('SHA-384',new TextEncoder().encode(content));var b64=btoa(String.fromCharCode(...new Uint8Array(hash)));return j({integrity:'sha384-'+b64,algorithm:'sha384'});}
async function securityHeaders(b){if(!b.url)return e('url required');try{var r=await fetch(b.url,{method:'HEAD'});var checks={};var important=['strict-transport-security','content-security-policy','x-content-type-options','x-frame-options','x-xss-protection','referrer-policy','permissions-policy'];important.forEach(function(h){checks[h]=r.headers.get(h)||null;});var score=Object.values(checks).filter(Boolean).length;return j({url:b.url,headers:checks,score:score+'/'+important.length,grade:score>=6?'A':score>=4?'B':score>=2?'C':'F'});}catch(err){return e('Failed: '+err.message);}}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/jwt-encode':return jwtEncode(body);
  case'/api/base32':return base32(body);
  case'/api/ascii-art':return asciiArt(body);
  case'/api/json-query':return jsonQuery(body);
  case'/api/csv-merge':return csvMerge(body);
  case'/api/csv-stats':return csvStats(body);
  case'/api/xml-format':return xmlFormat(body);
  case'/api/string-template':return stringTemplate(body);
  case'/api/string-count-chars':return stringCountChars(body);
  case'/api/string-rotate':return stringRotate(body);
  case'/api/string-interleave':return stringInterleave(body);
  case'/api/password-hash':return passwordHash(body);
  case'/api/cors-headers':return corsHeaders(body);
  case'/api/csp-generate':return cspGenerate(body);
  case'/api/sri-hash':return sriHash(body);
  case'/api/security-headers':return securityHeaders(body);
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
