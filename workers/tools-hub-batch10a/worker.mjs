// tools-hub-batch10a: 25 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function htmlClean(b){if(!b.html)return e('html required');var clean=b.html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/\son\w+="[^"]*"/gi,'').replace(/\son\w+='[^']*'/gi,'').replace(/javascript:/gi,'').replace(/<iframe[\s\S]*?<\/iframe>/gi,'');return j({html:clean,removed:b.html.length-clean.length});}
function cssColorToRgb(b){if(!b.color)return e('color required');var c=b.color.trim();if(c.startsWith('#')){var h=c.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];return j({r:parseInt(h.substr(0,2),16),g:parseInt(h.substr(2,2),16),b:parseInt(h.substr(4,2),16),hex:c,rgb:'rgb('+parseInt(h.substr(0,2),16)+','+parseInt(h.substr(2,2),16)+','+parseInt(h.substr(4,2),16)+')'});}return e('Provide hex color');}
function urlEnrichment(b){if(!b.url)return e('url required');try{var u=new URL(b.url);return j({url:b.url,protocol:u.protocol.replace(':',''),hostname:u.hostname,domain:u.hostname.split('.').slice(-2).join('.'),subdomain:u.hostname.split('.').length>2?u.hostname.split('.')[0]:null,path:u.pathname,query:Object.fromEntries(u.searchParams),hash:u.hash,port:u.port||null,isSecure:u.protocol==='https:',isIP:/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)});}catch(err){return e('Invalid URL');}}
function textCleanWhitespace(b){if(!b.text)return e('text required');var cleaned=b.text.replace(/\t/g,' ').replace(/ +/g,' ').replace(/\n{3,}/g,'\n\n').replace(/^\s+$/gm,'').trim();return j({result:cleaned,original:b.text.length,cleaned:cleaned.length,saved:b.text.length-cleaned.length});}
function jsonToMarkdownTable(b){if(!b.data||!Array.isArray(b.data))return e('data (array) required');var keys=Object.keys(b.data[0]);var md='| '+keys.join(' | ')+' |\n| '+keys.map(function(){return'---';}).join(' | ')+' |\n';b.data.forEach(function(row){md+='| '+keys.map(function(k){return String(row[k]||'');}).join(' | ')+' |\n';});return j({markdown:md.trim(),rows:b.data.length,columns:keys.length});}
function stringPadMulti(b){if(!b.text)return e('text required');var w=b.width||40;var ch=b.char||' ';var left=b.text.padStart(w,ch);var right=b.text.padEnd(w,ch);var center=b.text.padStart(Math.ceil((w+b.text.length)/2),ch).padEnd(w,ch);return j({left:left,right:right,center:center,width:w});}
function arrayPaginate(b){if(!b.array)return e('array required');var page=b.page||1;var perPage=b.perPage||10;var start=(page-1)*perPage;var items=b.array.slice(start,start+perPage);return j({items:items,page:page,perPage:perPage,totalItems:b.array.length,totalPages:Math.ceil(b.array.length/perPage),hasNext:start+perPage<b.array.length,hasPrev:page>1});}
function jsonKeyRename(b){if(!b.data||!b.rename)return e('data and rename required');var result={};for(var k in b.data){var newKey=b.rename[k]||k;result[newKey]=b.data[k];}return j({result:result});}
function textLineNumbers(b){if(!b.text)return e('text required');var start=b.start||1;var lines=b.text.split('\n');var width=String(start+lines.length-1).length;var numbered=lines.map(function(l,i){return String(start+i).padStart(width,' ')+' | '+l;}).join('\n');return j({result:numbered,lines:lines.length});}
function mathClamp(b){if(b.value===undefined||b.min===undefined||b.max===undefined)return e('value, min, max required');return j({result:Math.min(Math.max(b.value,b.min),b.max),clamped:b.value<b.min||b.value>b.max,original:b.value});}
function mathMap(b){if(b.value===undefined)return e('value, inMin, inMax, outMin, outMax required');var v=b.value,i1=b.inMin||0,i2=b.inMax||1,o1=b.outMin||0,o2=b.outMax||100;var mapped=o1+(v-i1)*(o2-o1)/(i2-i1);return j({result:Math.round(mapped*1e6)/1e6});}
function dateRelativeDescription(b){if(!b.date)return e('date required');var d=new Date(b.date);var now=new Date();var diff=now-d;var abs=Math.abs(diff);var ago=diff>0;if(abs<60000)return j({text:'just now'});if(abs<3600000)return j({text:Math.floor(abs/60000)+' minutes '+(ago?'ago':'from now')});if(abs<86400000)return j({text:Math.floor(abs/3600000)+' hours '+(ago?'ago':'from now')});if(abs<2592000000)return j({text:Math.floor(abs/86400000)+' days '+(ago?'ago':'from now')});if(abs<31536000000)return j({text:Math.floor(abs/2592000000)+' months '+(ago?'ago':'from now')});return j({text:Math.floor(abs/31536000000)+' years '+(ago?'ago':'from now')});}
function stringReverse2(b){if(!b.text)return e('text required');var mode=b.mode||'chars';if(mode==='words')return j({result:b.text.split(' ').reverse().join(' ')});if(mode==='lines')return j({result:b.text.split('\n').reverse().join('\n')});return j({result:[...b.text].reverse().join('')});}
function jsonNullRemove(b){if(!b.data)return e('data required');function clean(obj){if(Array.isArray(obj))return obj.filter(function(v){return v!==null&&v!==undefined;}).map(clean);if(typeof obj==='object'&&obj!==null){var r={};for(var k in obj){if(obj[k]!==null&&obj[k]!==undefined)r[k]=clean(obj[k]);}return r;}return obj;}return j({result:clean(b.data)});}
function arrayRotate(b){if(!b.array)return e('array required');var n=((b.positions||1)%b.array.length+b.array.length)%b.array.length;return j({result:[...b.array.slice(n),...b.array.slice(0,n)]});}
function textCharCount(b){if(!b.text)return e('text required');return j({total:b.text.length,letters:b.text.replace(/[^a-zA-Z]/g,'').length,digits:b.text.replace(/[^0-9]/g,'').length,spaces:b.text.replace(/[^ ]/g,'').length,punctuation:b.text.replace(/[a-zA-Z0-9\s]/g,'').length,lines:b.text.split('\n').length,words:b.text.split(/\s+/).filter(Boolean).length});}
function objectKeys(b){if(!b.data)return e('data required');function getKeys(obj,prefix){var keys=[];for(var k in obj){var p=prefix?prefix+'.'+k:k;keys.push(p);if(typeof obj[k]==='object'&&obj[k]!==null&&!Array.isArray(obj[k]))keys.push(...getKeys(obj[k],p));}return keys;}return j({keys:getKeys(b.data,''),count:Object.keys(b.data).length});}
function textWrapLines(b){if(!b.text)return e('text required');var w=b.width||80;var lines=[];var words=b.text.split(' ');var line='';for(var i=0;i<words.length;i++){if(line.length+words[i].length+1>w){lines.push(line);line=words[i];}else{line=line?line+' '+words[i]:words[i];}}if(line)lines.push(line);return j({result:lines.join('\n'),lines:lines.length});}
function csvAddColumn(b){if(!b.csv||!b.column||!b.values)return e('csv, column, values required');var rows=b.csv.trim().split('\n');rows[0]+=','+b.column;for(var i=1;i<rows.length;i++){rows[i]+=','+(b.values[i-1]||'');}return j({csv:rows.join('\n'),rows:rows.length-1});}
function mathAverage(b){if(!b.numbers)return e('numbers required');var n=b.numbers;var sum=n.reduce(function(s,x){return s+x;},0);return j({mean:Math.round(sum/n.length*1e6)/1e6,median:n.sort(function(a,b2){return a-b2;})[Math.floor(n.length/2)],sum:sum,count:n.length,min:Math.min.apply(null,n),max:Math.max.apply(null,n)});}
function textDedupLines(b){if(!b.text)return e('text required');var lines=b.text.split('\n');var seen=new Set();var unique=lines.filter(function(l){var t=l.trim();if(seen.has(t))return false;seen.add(t);return true;});return j({result:unique.join('\n'),original:lines.length,unique:unique.length,removed:lines.length-unique.length});}
function htmlToJson(b){if(!b.html)return e('html required');var tags=[];var re=/<(\w+)([^>]*)>(.*?)<\/\1>/gs;var m;while((m=re.exec(b.html))!==null){var attrs={};var attrRe=/(\w+)=["']([^"']*)["']/g;var am;while((am=attrRe.exec(m[2]))!==null){attrs[am[1]]=am[2];}tags.push({tag:m[1],attributes:attrs,content:m[3].replace(/<[^>]+>/g,'').trim()});}return j({elements:tags,count:tags.length});}
function colorMix(b){if(!b.colors||!Array.isArray(b.colors))return e('colors (array of hex) required');var r=0,g=0,bl=0;b.colors.forEach(function(c){var h=c.replace('#','');r+=parseInt(h.substr(0,2),16);g+=parseInt(h.substr(2,2),16);bl+=parseInt(h.substr(4,2),16);});var n=b.colors.length;return j({result:'#'+[Math.round(r/n),Math.round(g/n),Math.round(bl/n)].map(function(v){return v.toString(16).padStart(2,'0');}).join(''),inputs:b.colors});}
function textStats2(b){if(!b.text)return e('text required');var t=b.text;var sentences=t.split(/[.!?]+/).filter(function(s){return s.trim();});var paragraphs=t.split(/\n\s*\n/).filter(function(p2){return p2.trim();});var words=t.match(/\b\w+\b/g)||[];return j({characters:t.length,words:words.length,sentences:sentences.length,paragraphs:paragraphs.length,avgWordLength:words.length?Math.round(words.reduce(function(s,w){return s+w.length;},0)/words.length*10)/10:0,avgSentenceLength:sentences.length?Math.round(words.length/sentences.length*10)/10:0,readingTime:Math.ceil(words.length/200)+' min'});}
function jsonTransform(b){if(!b.data||!b.transform)return e('data and transform required');var result=b.data;if(b.transform.pick){var picked={};b.transform.pick.forEach(function(k){if(k in result)picked[k]=result[k];});result=picked;}if(b.transform.omit){b.transform.omit.forEach(function(k){delete result[k];});}if(b.transform.rename){for(var k in b.transform.rename){if(k in result){result[b.transform.rename[k]]=result[k];delete result[k];}}}return j({result:result});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/html-clean':return htmlClean(body);
  case'/api/css-color-to-rgb':return cssColorToRgb(body);
  case'/api/url-enrichment':return urlEnrichment(body);
  case'/api/text-clean-whitespace':return textCleanWhitespace(body);
  case'/api/json-to-markdown-table':return jsonToMarkdownTable(body);
  case'/api/string-pad-multi':return stringPadMulti(body);
  case'/api/array-paginate':return arrayPaginate(body);
  case'/api/json-key-rename':return jsonKeyRename(body);
  case'/api/text-line-numbers':return textLineNumbers(body);
  case'/api/math-clamp':return mathClamp(body);
  case'/api/math-map':return mathMap(body);
  case'/api/date-relative':return dateRelativeDescription(body);
  case'/api/string-reverse-v2':return stringReverse2(body);
  case'/api/json-null-remove':return jsonNullRemove(body);
  case'/api/array-rotate':return arrayRotate(body);
  case'/api/text-char-count':return textCharCount(body);
  case'/api/object-keys':return objectKeys(body);
  case'/api/text-wrap-lines':return textWrapLines(body);
  case'/api/csv-add-column':return csvAddColumn(body);
  case'/api/math-average':return mathAverage(body);
  case'/api/text-dedup-lines':return textDedupLines(body);
  case'/api/html-to-json':return htmlToJson(body);
  case'/api/color-mix':return colorMix(body);
  case'/api/text-full-stats':return textStats2(body);
  case'/api/json-transform':return jsonTransform(body);
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
