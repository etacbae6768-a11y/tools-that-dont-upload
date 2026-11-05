// tools-hub-batch11: 30 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function hexEnc(b){if(!b.text)return e('text required');return j({result:b.text.split('').map(function(c){return c.charCodeAt(0).toString(16).padStart(2,'0');}).join(' ')});}
function hexDec(b){if(!b.hex)return e('hex required');return j({result:b.hex.split(' ').map(function(h){return String.fromCharCode(parseInt(h,16));}).join('')});}
function binEnc(b){if(!b.text)return e('text required');return j({result:b.text.split('').map(function(c){return c.charCodeAt(0).toString(2).padStart(8,'0');}).join(' ')});}
function binDec(b){if(!b.binary)return e('binary required');return j({result:b.binary.split(' ').map(function(x){return String.fromCharCode(parseInt(x,2));}).join('')});}
function isWkend(b){if(!b.date)return e('date required');var d=new Date(b.date).getDay();return j({isWeekend:d===0||d===6,day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]});}
function daysMonth(b){if(!b.year||!b.month)return e('year and month required');return j({days:new Date(b.year,b.month,0).getDate()});}
function isLeap(b){if(!b.year)return e('year required');var y=b.year;return j({isLeapYear:y%4===0&&(y%100!==0||y%400===0)});}
function quarter(b){if(!b.date)return e('date required');var m=new Date(b.date).getMonth()+1;return j({quarter:'Q'+Math.ceil(m/3)});}
function dayYear(b){if(!b.date)return e('date required');var d=new Date(b.date);var jan1=new Date(d.getFullYear(),0,0);return j({dayOfYear:Math.floor((d-jan1)/86400000)});}
function mAbs(b){if(b.number===undefined)return e('number required');return j({result:Math.abs(b.number)});}
function mSqrt(b){if(b.number===undefined)return e('number required');return j({result:Math.sqrt(b.number)});}
function mRound(b){if(b.number===undefined)return e('number required');return j({floor:Math.floor(b.number),ceil:Math.ceil(b.number),round:Math.round(b.number)});}
function mMinMax(b){if(!b.numbers)return e('numbers required');return j({min:Math.min.apply(null,b.numbers),max:Math.max.apply(null,b.numbers)});}
function mSum(b){if(!b.numbers)return e('numbers required');var s=b.numbers.reduce(function(a,x){return a+x;},0);return j({sum:s,average:s/b.numbers.length});}
function arrRev(b){if(!b.array)return e('array required');return j({result:[...b.array].reverse()});}
function arrFirst(b){if(!b.array)return e('array required');return j({result:b.array.slice(0,b.count||1)});}
function arrLast(b){if(!b.array)return e('array required');return j({result:b.array.slice(-(b.count||1))});}
function arrCount(b){if(!b.array)return e('array required');var f={};b.array.forEach(function(x){f[String(x)]=(f[String(x)]||0)+1;});return j({frequencies:f,unique:Object.keys(f).length});}
function arrCompact(b){if(!b.array)return e('array required');return j({result:b.array.filter(function(x){return x!==null&&x!==undefined&&x!=='';})});}
function objMerge2(b){if(!b.objects)return e('objects required');var r={};b.objects.forEach(function(o){Object.assign(r,o);});return j({result:r});}
function objEntries(b){if(!b.data)return e('data required');return j({entries:Object.entries(b.data),keys:Object.keys(b.data),values:Object.values(b.data)});}
function objHas(b){if(!b.data||!b.key)return e('data and key required');return j({has:b.key in b.data,value:b.data[b.key]});}
function isJson2(b){if(!b.text)return e('text required');try{JSON.parse(b.text);return j({valid:true});}catch(err){return j({valid:false,error:err.message});}}
function isNum(b){if(b.value===undefined)return e('value required');return j({isNumber:typeof b.value==='number',isInteger:Number.isInteger(b.value)});}
function strContains(b){if(!b.text||!b.search)return e('text and search required');return j({contains:b.text.includes(b.search),index:b.text.indexOf(b.search)});}
const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/hex-encode':return hexEnc(body);
  case'/api/hex-decode':return hexDec(body);
  case'/api/binary-encode':return binEnc(body);
  case'/api/binary-decode':return binDec(body);
  case'/api/is-weekend':return isWkend(body);
  case'/api/days-in-month':return daysMonth(body);
  case'/api/is-leap-year':return isLeap(body);
  case'/api/quarter-from-date':return quarter(body);
  case'/api/day-of-year':return dayYear(body);
  case'/api/math-abs':return mAbs(body);
  case'/api/math-sqrt':return mSqrt(body);
  case'/api/math-round-v2':return mRound(body);
  case'/api/math-min-max':return mMinMax(body);
  case'/api/math-sum':return mSum(body);
  case'/api/array-reverse':return arrRev(body);
  case'/api/array-first':return arrFirst(body);
  case'/api/array-last':return arrLast(body);
  case'/api/array-count':return arrCount(body);
  case'/api/array-compact':return arrCompact(body);
  case'/api/object-merge-v2':return objMerge2(body);
  case'/api/object-entries':return objEntries(body);
  case'/api/object-has':return objHas(body);
  case'/api/is-json':return isJson2(body);
  case'/api/is-number':return isNum(body);
  case'/api/string-contains':return strContains(body);
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
