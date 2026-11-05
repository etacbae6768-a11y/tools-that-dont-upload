// tools-hub-batch9a: 15 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

function jsonToSchema(b){if(!b.data)return e('data required');function infer(v){if(v===null)return{type:'null'};if(Array.isArray(v))return{type:'array',items:v.length?infer(v[0]):{}};if(typeof v==='object'){var p={},r=[];for(var k in v){p[k]=infer(v[k]);r.push(k);}return{type:'object',properties:p,required:r};}return{type:typeof v};}return j({schema:infer(b.data)});}
function jsonPatch(b){if(!b.original||!b.modified)return e('original and modified required');var ops=[];function diff(o,m,path){for(var k in m){var p2=path+'/'+k;if(!(k in o))ops.push({op:'add',path:p2,value:m[k]});else if(JSON.stringify(o[k])!==JSON.stringify(m[k])){if(typeof m[k]==='object'&&typeof o[k]==='object'&&m[k]&&o[k])diff(o[k],m[k],p2);else ops.push({op:'replace',path:p2,value:m[k]});}}for(var k in o){if(!(k in m))ops.push({op:'remove',path:path+'/'+k});}}diff(b.original,b.modified,'');return j({patch:ops,operations:ops.length});}
function regexGenerate(b){if(!b.examples)return e('examples required');var pats=[];if(b.examples.every(function(x){return/^\d+$/.test(x);}))pats.push('\\d+');if(b.examples.every(function(x){return/^[a-zA-Z]+$/.test(x);}))pats.push('[a-zA-Z]+');if(b.examples.every(function(x){return x.includes('@');}))pats.push('[\\w.+-]+@[\\w.-]+');if(pats.length===0)pats.push('.+');return j({patterns:pats,suggestion:pats[0]});}
function sqlDummy(b){var table=b.table||'users';var rows=Math.min(b.rows||10,50);var names=['Alice','Bob','Charlie','Diana','Eve'];var sql='INSERT INTO '+table+' VALUES\n';var vals=[];for(var i=0;i<rows;i++){vals.push("("+[i+1,"'"+names[i%5]+"'","'"+names[i%5].toLowerCase()+"@test.com'",20+Math.floor(Math.random()*40)].join(",")+")");} return j({sql:sql+vals.join(',\n')+';',rows:rows});}
function dnsRecordInfo(b){var type=(b.type||'A').toUpperCase();var info={A:'Maps domain to IPv4',AAAA:'Maps domain to IPv6',CNAME:'Alias for another domain',MX:'Mail server',TXT:'Text record (SPF/DKIM)',NS:'Name server',SOA:'Start of Authority',SRV:'Service location',PTR:'Reverse lookup',CAA:'CA Authorization'};return j({type:type,description:info[type]||'Unknown type'});}
function jsonToDotenv(b){if(!b.data)return e('data required');var lines=[];function flat(obj,prefix){for(var k in obj){var key=(prefix?prefix+'_':'')+k.toUpperCase();if(typeof obj[k]==='object'&&obj[k]!==null&&!Array.isArray(obj[k]))flat(obj[k],key);else lines.push(key+'='+JSON.stringify(obj[k]));}}flat(b.data,'');return j({dotenv:lines.join('\n'),count:lines.length});}
function markdownToText(b){if(!b.markdown)return e('markdown required');var t=b.markdown.replace(/^#{1,6}\s+/gm,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^[\-*+]\s+/gm,'').replace(/^>\s*/gm,'').trim();return j({text:t});}
async function hashMultiple(b){if(!b.text)return e('text required');var data=new TextEncoder().encode(b.text);var r={};var algos=['SHA-256','SHA-384','SHA-512'];for(var i=0;i<algos.length;i++){var h=await crypto.subtle.digest(algos[i],data);r[algos[i].toLowerCase().replace('-','')]=Array.from(new Uint8Array(h)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}return j(r);}
function uuidBatch(b){var count=Math.min(b.count||10,100);var uuids=[];for(var i=0;i<count;i++)uuids.push(crypto.randomUUID());return j({uuids:uuids,count:count});}
function ipRange(b){if(!b.start||!b.end)return e('start and end required');var s=b.start.split('.').map(Number);var en=b.end.split('.').map(Number);var sn=(s[0]<<24|s[1]<<16|s[2]<<8|s[3])>>>0;var en2=(en[0]<<24|en[1]<<16|en[2]<<8|en[3])>>>0;var count=en2-sn+1;var ips=[];for(var i=0;i<Math.min(count,256);i++){var ip=(sn+i)>>>0;ips.push([(ip>>>24)&255,(ip>>>16)&255,(ip>>>8)&255,ip&255].join('.'));}return j({ips:ips,count:count});}
function colorScheme(b){if(!b.hex)return e('hex required');var h=b.hex.replace('#','');var r2=parseInt(h.substr(0,2),16)/255,g2=parseInt(h.substr(2,2),16)/255,b2=parseInt(h.substr(4,2),16)/255;var max=Math.max(r2,g2,b2),min=Math.min(r2,g2,b2),hue=0,sat=0,lig=(max+min)/2;if(max!==min){var d=max-min;sat=lig>0.5?d/(2-max-min):d/(max+min);if(max===r2)hue=((g2-b2)/d+(g2<b2?6:0))*60;else if(max===g2)hue=((b2-r2)/d+2)*60;else hue=((r2-g2)/d+4)*60;}function h2h(hh,s,l){var a=s*Math.min(l,1-l);var f=function(n){var k=(n+hh/30)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1);};return'#'+[f(0),f(8),f(4)].map(function(v){return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}var scheme=b.scheme||'complementary';var colors=[b.hex];if(scheme==='complementary')colors.push(h2h((hue+180)%360,sat,lig));else if(scheme==='triadic'){colors.push(h2h((hue+120)%360,sat,lig));colors.push(h2h((hue+240)%360,sat,lig));}else if(scheme==='analogous'){colors.push(h2h((hue+30)%360,sat,lig));colors.push(h2h((hue-30+360)%360,sat,lig));}return j({scheme:scheme,colors:colors});}
function cronRandom2(b){var count=Math.min(b.count||5,20);var crons=[];for(var i=0;i<count;i++){crons.push(Math.floor(Math.random()*60)+' '+Math.floor(Math.random()*24)+' * * '+Math.floor(Math.random()*7));}return j({crons:crons});}
function xmlToText(b){if(!b.xml)return e('xml required');return j({text:b.xml.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()});}
function jsonPrettify(b){if(!b.json)return e('json required');try{var p=typeof b.json==='string'?JSON.parse(b.json):b.json;return j({result:JSON.stringify(p,null,b.indent||2)});}catch(err){return e('Invalid JSON');}}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/json-to-schema':return jsonToSchema(body);
  case'/api/json-patch':return jsonPatch(body);
  case'/api/regex-generate':return regexGenerate(body);
  case'/api/sql-dummy':return sqlDummy(body);
  case'/api/dns-record-info':return dnsRecordInfo(body);
  case'/api/json-to-dotenv':return jsonToDotenv(body);
  case'/api/markdown-to-text':return markdownToText(body);
  case'/api/hash-multiple':return hashMultiple(body);
  case'/api/uuid-batch':return uuidBatch(body);
  case'/api/ip-range':return ipRange(body);
  case'/api/color-scheme':return colorScheme(body);
  case'/api/cron-random':return cronRandom2(body);
  case'/api/xml-to-text':return xmlToText(body);
  case'/api/json-prettify':return jsonPrettify(body);
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
