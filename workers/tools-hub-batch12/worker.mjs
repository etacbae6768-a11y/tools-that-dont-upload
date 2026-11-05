// tools-hub-batch12: 30 endpoints (470→500)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}
function textPad(b){if(!b.text)return e('text required');var w=b.width||40;return j({left:b.text.padStart(w,b.char||' '),right:b.text.padEnd(w,b.char||' '),center:b.text.padStart(Math.ceil((w+b.text.length)/2),b.char||' ').padEnd(w,b.char||' ')});}
function textLines(b){if(!b.text)return e('text required');return j({lines:b.text.split('\n'),count:b.text.split('\n').length});}
function textJoin(b){if(!b.lines)return e('lines required');return j({result:b.lines.join(b.separator||'\n')});}
function textWrap2(b){if(!b.text)return e('text required');var w=b.width||80;var words=b.text.split(' ');var lines=[];var line='';for(var i=0;i<words.length;i++){if(line.length+words[i].length+1>w){lines.push(line);line=words[i];}else{line=line?line+' '+words[i]:words[i];}}if(line)lines.push(line);return j({result:lines.join('\n'),lines:lines.length});}
function textUnique(b){if(!b.text)return e('text required');var lines=b.text.split('\n');var u=[...new Set(lines)];return j({result:u.join('\n'),original:lines.length,unique:u.length});}
function jsonKeys2(b){if(!b.data)return e('data required');return j({keys:Object.keys(b.data),count:Object.keys(b.data).length});}
function jsonValues2(b){if(!b.data)return e('data required');return j({values:Object.values(b.data),count:Object.values(b.data).length});}
function jsonType(b){return j({type:b.value===null?'null':Array.isArray(b.value)?'array':typeof b.value});}
function jsonClone(b){if(!b.data)return e('data required');return j({clone:JSON.parse(JSON.stringify(b.data))});}
function jsonEqual(b){if(!b.a||!b.b)return e('a and b required');return j({equal:JSON.stringify(b.a)===JSON.stringify(b.b)});}
function arrSlice(b){if(!b.array)return e('array required');return j({result:b.array.slice(b.start||0,b.end)});}
function arrIncludes(b){if(!b.array)return e('array required');return j({includes:b.array.includes(b.value),index:b.array.indexOf(b.value)});}
function arrJoin(b){if(!b.array)return e('array required');return j({result:b.array.join(b.separator||',')});}
function arrSplit(b){if(!b.text)return e('text required');return j({result:b.text.split(b.separator||',')});}
function arrRange(b){var start=b.start||0;var end=b.end||10;var step=b.step||1;var r=[];for(var i=start;i<end;i+=step)r.push(i);return j({result:r,count:r.length});}
function mathCeil(b){if(b.number===undefined)return e('number required');return j({result:Math.ceil(b.number)});}
function mathFloor(b){if(b.number===undefined)return e('number required');return j({result:Math.floor(b.number)});}
function mathSign(b){if(b.number===undefined)return e('number required');return j({sign:Math.sign(b.number),isPositive:b.number>0,isNegative:b.number<0,isZero:b.number===0});}
function mathClamp2(b){if(b.value===undefined)return e('value required');return j({result:Math.min(Math.max(b.value,b.min||0),b.max||100)});}
function mathRandom2(b){var min=b.min||0;var max=b.max||100;if(b.float)return j({result:Math.random()*(max-min)+min});return j({result:Math.floor(Math.random()*(max-min+1))+min});}
function strStartsWith(b){if(!b.text||!b.prefix)return e('text and prefix required');return j({startsWith:b.text.startsWith(b.prefix)});}
function strEndsWith(b){if(!b.text||!b.suffix)return e('text and suffix required');return j({endsWith:b.text.endsWith(b.suffix)});}
function strCharAt(b){if(!b.text)return e('text required');var i=b.index||0;return j({char:b.text.charAt(i),code:b.text.charCodeAt(i)});}
function strSubstring(b){if(!b.text)return e('text required');return j({result:b.text.substring(b.start||0,b.end)});}
function strSplit2(b){if(!b.text)return e('text required');return j({parts:b.text.split(b.separator||''),count:b.text.split(b.separator||'').length});}
const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/text-pad':return textPad(body);
  case'/api/text-lines':return textLines(body);
  case'/api/text-join':return textJoin(body);
  case'/api/text-wrap-v2':return textWrap2(body);
  case'/api/text-unique':return textUnique(body);
  case'/api/json-keys-v2':return jsonKeys2(body);
  case'/api/json-values-v2':return jsonValues2(body);
  case'/api/json-type':return jsonType(body);
  case'/api/json-clone':return jsonClone(body);
  case'/api/json-equal':return jsonEqual(body);
  case'/api/array-slice':return arrSlice(body);
  case'/api/array-includes':return arrIncludes(body);
  case'/api/array-join':return arrJoin(body);
  case'/api/array-split':return arrSplit(body);
  case'/api/array-range':return arrRange(body);
  case'/api/math-ceil':return mathCeil(body);
  case'/api/math-floor':return mathFloor(body);
  case'/api/math-sign':return mathSign(body);
  case'/api/math-clamp-v2':return mathClamp2(body);
  case'/api/math-random':return mathRandom2(body);
  case'/api/string-starts-with':return strStartsWith(body);
  case'/api/string-ends-with':return strEndsWith(body);
  case'/api/string-char-at':return strCharAt(body);
  case'/api/string-substring':return strSubstring(body);
  case'/api/string-split-v2':return strSplit2(body);
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
