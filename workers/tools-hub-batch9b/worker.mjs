// tools-hub-batch9b: 20 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function textToList(b){if(!b.text)return e('text required');var sep=b.separator||'\n';var items=b.text.split(sep).map(function(i){return i.trim();}).filter(Boolean);return j({items:items,count:items.length});}
function listToText(b){if(!b.items)return e('items required');return j({text:b.items.join(b.separator||'\n')});}
function jsonToQuerystring(b){if(!b.data)return e('data required');var params=[];for(var k in b.data){params.push(encodeURIComponent(k)+'='+encodeURIComponent(b.data[k]));}return j({querystring:params.join('&'),url:'?'+params.join('&')});}
function querystringToJson(b){if(!b.querystring)return e('querystring required');var qs=b.querystring.replace(/^\?/,'');var result={};qs.split('&').forEach(function(pair){var parts=pair.split('=');if(parts.length>=2)result[decodeURIComponent(parts[0])]=decodeURIComponent(parts.slice(1).join('='));});return j({result:result,params:Object.keys(result).length});}
function csvColumn(b){if(!b.csv||!b.column)return e('csv and column required');var rows=b.csv.trim().split('\n');var headers=rows[0].split(',').map(function(h){return h.trim();});var idx=headers.indexOf(b.column);if(idx===-1)return e('Column not found: '+b.column);var values=rows.slice(1).map(function(r){return r.split(',')[idx]?.trim();}).filter(Boolean);return j({column:b.column,values:values,count:values.length});}
function jsonDepth(b){if(!b.data)return e('data required');function depth(obj){if(typeof obj!=='object'||obj===null)return 0;var maxD=0;for(var k in obj){var d=depth(obj[k]);if(d>maxD)maxD=d;}return maxD+1;}return j({depth:depth(b.data),type:Array.isArray(b.data)?'array':'object',keys:typeof b.data==='object'?Object.keys(b.data).length:0});}
function textToJson(b){if(!b.text)return e('text required');var lines=b.text.trim().split('\n');var result={};lines.forEach(function(l){var idx=l.indexOf(b.separator||':');if(idx>0){var k=l.substring(0,idx).trim();var v=l.substring(idx+1).trim();result[k]=v;}});return j({result:result,count:Object.keys(result).length});}
function colorBrightness(b){if(!b.hex)return e('hex required');var h=b.hex.replace('#','');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),bl=parseInt(h.substr(4,2),16);var brightness=(r*299+g*587+bl*114)/1000;return j({brightness:Math.round(brightness),isDark:brightness<128,isLight:brightness>=128,textColor:brightness<128?'#ffffff':'#000000'});}
function stringEntropy(b){if(!b.text)return e('text required');var freq={};for(var i=0;i<b.text.length;i++){var c=b.text[i];freq[c]=(freq[c]||0)+1;}var entropy=0;for(var k in freq){var p=freq[k]/b.text.length;entropy-=p*Math.log2(p);}return j({entropy:Math.round(entropy*1000)/1000,length:b.text.length,uniqueChars:Object.keys(freq).length,bitsTotal:Math.round(entropy*b.text.length)});}
function arrayGroupBy(b){if(!b.array||!b.key)return e('array and key required');var groups={};b.array.forEach(function(item){var k=String(item[b.key]||'undefined');if(!groups[k])groups[k]=[];groups[k].push(item);});return j({groups:groups,groupCount:Object.keys(groups).length});}
function objectFlatten(b){if(!b.data)return e('data required');var sep=b.separator||'.';var result={};function flat(obj,prefix){for(var k in obj){var key=prefix?prefix+sep+k:k;if(typeof obj[k]==='object'&&obj[k]!==null&&!Array.isArray(obj[k]))flat(obj[k],key);else result[key]=obj[k];}}flat(b.data,'');return j({result:result,keys:Object.keys(result).length});}
function objectDiff(b){if(!b.obj1||!b.obj2)return e('obj1 and obj2 required');var added={},removed={},changed={};for(var k in b.obj2){if(!(k in b.obj1))added[k]=b.obj2[k];else if(JSON.stringify(b.obj1[k])!==JSON.stringify(b.obj2[k]))changed[k]={from:b.obj1[k],to:b.obj2[k]};}for(var k in b.obj1){if(!(k in b.obj2))removed[k]=b.obj1[k];}return j({added:added,removed:removed,changed:changed,identical:Object.keys(added).length===0&&Object.keys(removed).length===0&&Object.keys(changed).length===0});}
function markdownLinks(b){if(!b.markdown)return e('markdown required');var links=[];var re=/\[([^\]]+)\]\(([^)]+)\)/g;var m;while((m=re.exec(b.markdown))!==null){links.push({text:m[1],url:m[2]});}var imgs=[];var re2=/!\[([^\]]*)\]\(([^)]+)\)/g;while((m=re2.exec(b.markdown))!==null){imgs.push({alt:m[1],url:m[2]});}return j({links:links,images:imgs,linkCount:links.length,imageCount:imgs.length});}
function textToSlug2(b){if(!b.text)return e('text required');var slug=b.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');return j({slug:slug,original:b.text});}
function htmlTableToJson(b){if(!b.html)return e('html required');var rows=b.html.match(/<tr[^>]*>(.*?)<\/tr>/gis)||[];var result=[];var headers=[];if(rows.length>0){var ths=(rows[0].match(/<th[^>]*>(.*?)<\/th>/gi)||[]).map(function(t){return t.replace(/<[^>]+>/g,'').trim();});if(ths.length>0)headers=ths;else{var tds0=(rows[0].match(/<td[^>]*>(.*?)<\/td>/gi)||[]).map(function(t){return t.replace(/<[^>]+>/g,'').trim();});headers=tds0;}}for(var i=headers.length>0?1:0;i<rows.length;i++){var cells=(rows[i].match(/<td[^>]*>(.*?)<\/td>/gi)||[]).map(function(t){return t.replace(/<[^>]+>/g,'').trim();});if(headers.length>0){var obj={};headers.forEach(function(h,idx){obj[h]=cells[idx]||'';});result.push(obj);}else{result.push(cells);}}return j({data:result,rows:result.length,headers:headers});}
function textWordFreq(b){if(!b.text)return e('text required');var stops=new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','to','of','in','for','on','with','at','by','from','as','and','or','but','not','this','that','it','its','i','me','my','we','our','you','your','he','she','they']);var words=b.text.toLowerCase().match(/\b[a-z]{2,}\b/g)||[];var freq={};words.forEach(function(w){if(!stops.has(w))freq[w]=(freq[w]||0)+1;});var sorted=Object.entries(freq).sort(function(a,b2){return b2[1]-a[1];}).slice(0,b.limit||20);return j({words:sorted.map(function(x){return{word:x[0],count:x[1]};}),totalWords:words.length,uniqueWords:Object.keys(freq).length});}
function numberRound(b){if(b.number===undefined)return e('number required');var n=b.number;var decimals=b.decimals||0;return j({floor:Math.floor(n*Math.pow(10,decimals))/Math.pow(10,decimals),ceil:Math.ceil(n*Math.pow(10,decimals))/Math.pow(10,decimals),round:Math.round(n*Math.pow(10,decimals))/Math.pow(10,decimals),trunc:Math.trunc(n*Math.pow(10,decimals))/Math.pow(10,decimals)});}
function arrayFlatten(b){if(!b.array)return e('array required');function flat2(arr){var result=[];arr.forEach(function(item){if(Array.isArray(item))result.push.apply(result,flat2(item));else result.push(item);});return result;}return j({result:flat2(b.array),originalDepth:JSON.stringify(b.array).split('[').length-1});}
function textEncodeStats(b){if(!b.text)return e('text required');var utf8=new TextEncoder().encode(b.text);return j({chars:b.text.length,codePoints:[...b.text].length,utf8Bytes:utf8.length,utf16Units:b.text.length,base64Length:Math.ceil(utf8.length*4/3),urlEncodedLength:encodeURIComponent(b.text).length});}
function jsonSize(b){if(!b.data)return e('data required');var str=JSON.stringify(b.data);var minified=JSON.stringify(b.data);var pretty=JSON.stringify(b.data,null,2);return j({minified:minified.length,pretty:pretty.length,utf8Bytes:new TextEncoder().encode(str).length,keys:typeof b.data==='object'?Object.keys(b.data).length:0,depth:function d(o){if(typeof o!=='object'||o===null)return 0;var m=0;for(var k in o){var v=d(o[k]);if(v>m)m=v;}return m+1;}(b.data)});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/text-to-list':return textToList(body);
  case'/api/list-to-text':return listToText(body);
  case'/api/json-to-querystring':return jsonToQuerystring(body);
  case'/api/querystring-to-json':return querystringToJson(body);
  case'/api/csv-column':return csvColumn(body);
  case'/api/json-depth':return jsonDepth(body);
  case'/api/text-to-json':return textToJson(body);
  case'/api/color-brightness':return colorBrightness(body);
  case'/api/string-entropy':return stringEntropy(body);
  case'/api/array-group-by':return arrayGroupBy(body);
  case'/api/object-flatten':return objectFlatten(body);
  case'/api/object-diff':return objectDiff(body);
  case'/api/markdown-links':return markdownLinks(body);
  case'/api/text-to-slug-v2':return textToSlug2(body);
  case'/api/html-table-to-json':return htmlTableToJson(body);
  case'/api/text-word-freq':return textWordFreq(body);
  case'/api/number-round':return numberRound(body);
  case'/api/array-flatten':return arrayFlatten(body);
  case'/api/text-encode-stats':return textEncodeStats(body);
  case'/api/json-size':return jsonSize(body);
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
