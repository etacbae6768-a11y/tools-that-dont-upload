// tools-hub-batch10b: 25 endpoints (final push to 500)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function arrayZip(b){if(!b.arrays||!Array.isArray(b.arrays))return e('arrays required');var maxLen=Math.max.apply(null,b.arrays.map(function(a){return a.length;}));var result=[];for(var i=0;i<maxLen;i++){result.push(b.arrays.map(function(a){return a[i];}));}return j({result:result});}
function arrayUnzip(b){if(!b.array)return e('array required');var result=b.array[0].map(function(_,i){return b.array.map(function(row){return row[i];});});return j({result:result});}
function jsonToTsv(b){if(!b.data||!Array.isArray(b.data))return e('data required');var keys=Object.keys(b.data[0]);var tsv=keys.join('\t')+'\n'+b.data.map(function(r){return keys.map(function(k){return String(r[k]||'');}).join('\t');}).join('\n');return j({tsv:tsv,rows:b.data.length});}
function tsvToJson(b){if(!b.tsv)return e('tsv required');var rows=b.tsv.trim().split('\n');var headers=rows[0].split('\t');return j({data:rows.slice(1).map(function(r){var vals=r.split('\t');var obj={};headers.forEach(function(h,i){obj[h.trim()]=vals[i]?.trim();});return obj;}),rows:rows.length-1});}
function textToAcronym(b){if(!b.text)return e('text required');var words=b.text.split(/\s+/).filter(function(w){return w.length>0&&w[0]===w[0].toUpperCase();});var acronym=words.map(function(w){return w[0];}).join('');return j({acronym:acronym,from:b.text});}
function mathFactorial(b){if(b.n===undefined)return e('n required');var n=parseInt(b.n);if(n<0||n>170)return e('n must be 0-170');var r=1;for(var i=2;i<=n;i++)r*=i;return j({factorial:r,n:n});}
function mathPower(b){if(b.base===undefined||b.exp===undefined)return e('base and exp required');return j({result:Math.pow(b.base,b.exp),base:b.base,exponent:b.exp});}
function mathLog(b){if(b.value===undefined)return e('value required');return j({ln:Math.log(b.value),log2:Math.log2(b.value),log10:Math.log10(b.value),value:b.value});}
function mathTrig(b){if(b.angle===undefined)return e('angle required');var rad=b.unit==='rad'?b.angle:b.angle*Math.PI/180;return j({sin:Math.round(Math.sin(rad)*1e6)/1e6,cos:Math.round(Math.cos(rad)*1e6)/1e6,tan:Math.round(Math.tan(rad)*1e6)/1e6,angle:b.angle,unit:b.unit||'deg'});}
function textToTitle(b){if(!b.text)return e('text required');var small=new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it']);return j({result:b.text.toLowerCase().split(' ').map(function(w,i){return i===0||!small.has(w)?w.charAt(0).toUpperCase()+w.slice(1):w;}).join(' ')});}
function jsonToXmlAttr(b){if(!b.data)return e('data required');var root=b.root||'item';var attrs=Object.entries(b.data).map(function(e2){return e2[0]+'="'+String(e2[1]).replace(/"/g,'&quot;')+'"';}).join(' ');return j({xml:'<'+root+' '+attrs+' />'});}
function arrayStats(b){if(!b.array)return e('array required');var nums=b.array.filter(function(x){return typeof x==='number';});var strs=b.array.filter(function(x){return typeof x==='string';});return j({total:b.array.length,numbers:nums.length,strings:strs.length,booleans:b.array.filter(function(x){return typeof x==='boolean';}).length,nulls:b.array.filter(function(x){return x===null;}).length,objects:b.array.filter(function(x){return typeof x==='object'&&x!==null;}).length,unique:new Set(b.array.map(JSON.stringify)).size});}
function textExtractNumbers(b){if(!b.text)return e('text required');var nums=b.text.match(/-?\d+\.?\d*/g)||[];return j({numbers:nums.map(Number),count:nums.length,sum:nums.reduce(function(s,n){return s+Number(n);},0),avg:nums.length?nums.reduce(function(s,n){return s+Number(n);},0)/nums.length:0});}
function jsonToFormData(b){if(!b.data)return e('data required');var parts=[];for(var k in b.data){parts.push(encodeURIComponent(k)+'='+encodeURIComponent(b.data[k]));}return j({formData:parts.join('&'),contentType:'application/x-www-form-urlencoded',fields:Object.keys(b.data).length});}
function textExtractDates(b){if(!b.text)return e('text required');var patterns=[/\d{4}-\d{2}-\d{2}/g,/\d{2}\/\d{2}\/\d{4}/g,/\d{2}\.\d{2}\.\d{4}/g];var dates=[];patterns.forEach(function(p){var m=b.text.match(p);if(m)dates.push.apply(dates,m);});return j({dates:[...new Set(dates)],count:new Set(dates).size});}
function numberToOrdinal(b){if(b.number===undefined)return e('number required');var n=parseInt(b.number);var s=['th','st','nd','rd'];var v=n%100;return j({ordinal:n+(s[(v-20)%10]||s[v]||s[0]),number:n});}
function textRemoveDuplicateWords(b){if(!b.text)return e('text required');var words=b.text.split(/\s+/);var seen=new Set();var result=words.filter(function(w){var lower=w.toLowerCase();if(seen.has(lower))return false;seen.add(lower);return true;});return j({result:result.join(' '),original:words.length,unique:result.length,removed:words.length-result.length});}
function jsonToHtmlList(b){if(!b.data)return e('data required');function toList(obj){if(Array.isArray(obj))return'<ul>'+obj.map(function(i){return'<li>'+(typeof i==='object'?toList(i):i)+'</li>';}).join('')+'</ul>';if(typeof obj==='object'){return'<ul>'+Object.entries(obj).map(function(e2){return'<li><strong>'+e2[0]+':</strong> '+(typeof e2[1]==='object'?toList(e2[1]):e2[1])+'</li>';}).join('')+'</ul>';}return String(obj);}return j({html:toList(b.data)});}
function colorInvert(b){if(!b.hex)return e('hex required');var h=b.hex.replace('#','');var r=255-parseInt(h.substr(0,2),16);var g=255-parseInt(h.substr(2,2),16);var bl=255-parseInt(h.substr(4,2),16);return j({inverted:'#'+[r,g,bl].map(function(v){return v.toString(16).padStart(2,'0');}).join(''),original:b.hex});}
function arrayDifference(b){if(!b.array1||!b.array2)return e('array1 and array2 required');var s1=new Set(b.array1.map(JSON.stringify));var s2=new Set(b.array2.map(JSON.stringify));var onlyIn1=b.array1.filter(function(x){return!s2.has(JSON.stringify(x));});var onlyIn2=b.array2.filter(function(x){return!s1.has(JSON.stringify(x));});return j({onlyInFirst:onlyIn1,onlyInSecond:onlyIn2,common:b.array1.filter(function(x){return s2.has(JSON.stringify(x));})});}
function textExtractHashtags(b){if(!b.text)return e('text required');var tags=b.text.match(/#[\w]+/g)||[];return j({hashtags:[...new Set(tags)],count:new Set(tags).size});}
function textExtractMentions(b){if(!b.text)return e('text required');var mentions=b.text.match(/@[\w]+/g)||[];return j({mentions:[...new Set(mentions)],count:new Set(mentions).size});}
function jsonToYamlSimple(b){if(!b.data)return e('data required');function toY(obj,indent){var sp='  '.repeat(indent||0);var lines=[];for(var k in obj){if(typeof obj[k]==='object'&&obj[k]!==null&&!Array.isArray(obj[k])){lines.push(sp+k+':');lines.push(toY(obj[k],(indent||0)+1));}else if(Array.isArray(obj[k])){lines.push(sp+k+':');obj[k].forEach(function(i){lines.push(sp+'  - '+JSON.stringify(i));});}else{lines.push(sp+k+': '+JSON.stringify(obj[k]));}}return lines.join('\n');}return j({yaml:toY(b.data,0)});}
function arraySample(b){if(!b.array)return e('array required');var n=Math.min(b.count||1,b.array.length);var shuffled=[...b.array];for(var i=shuffled.length-1;i>0;i--){var r2=Math.floor(Math.random()*(i+1));var t=shuffled[i];shuffled[i]=shuffled[r2];shuffled[r2]=t;}return j({sample:shuffled.slice(0,n),count:n});}
function textToBase64Url(b){if(!b.text)return e('text required');var b64=btoa(unescape(encodeURIComponent(b.text)));var urlSafe=b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return j({base64url:urlSafe,base64:b64});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/array-zip':return arrayZip(body);
  case'/api/array-unzip':return arrayUnzip(body);
  case'/api/json-to-tsv':return jsonToTsv(body);
  case'/api/tsv-to-json':return tsvToJson(body);
  case'/api/text-to-acronym':return textToAcronym(body);
  case'/api/math-factorial':return mathFactorial(body);
  case'/api/math-power':return mathPower(body);
  case'/api/math-log':return mathLog(body);
  case'/api/math-trig':return mathTrig(body);
  case'/api/text-to-title':return textToTitle(body);
  case'/api/json-to-xml-attr':return jsonToXmlAttr(body);
  case'/api/array-stats':return arrayStats(body);
  case'/api/text-extract-numbers':return textExtractNumbers(body);
  case'/api/json-to-form-data':return jsonToFormData(body);
  case'/api/text-extract-dates':return textExtractDates(body);
  case'/api/number-to-ordinal':return numberToOrdinal(body);
  case'/api/text-remove-dup-words':return textRemoveDuplicateWords(body);
  case'/api/json-to-html-list':return jsonToHtmlList(body);
  case'/api/color-invert':return colorInvert(body);
  case'/api/array-difference':return arrayDifference(body);
  case'/api/text-extract-hashtags':return textExtractHashtags(body);
  case'/api/text-extract-mentions':return textExtractMentions(body);
  case'/api/json-to-yaml-v2':return jsonToYamlSimple(body);
  case'/api/array-sample':return arraySample(body);
  case'/api/text-to-base64url':return textToBase64Url(body);
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
