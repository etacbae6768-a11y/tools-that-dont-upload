// tools-hub-batch5a: 25 new endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// UUID versions
function uuidV1(){const now=Date.now();const t=BigInt(now)*10000n+122192928000000000n;const hi=(t>>48n)&0xFFFFn;const mid=(t>>32n)&0xFFFFn;const low=t&0xFFFFFFFFn;const clk=new Uint8Array(2);crypto.getRandomValues(clk);const node=new Uint8Array(6);crypto.getRandomValues(node);node[0]|=1;
const hex=n=>(typeof n==='bigint'?n:BigInt(n)).toString(16);return j({uuid:[hex(low).padStart(8,'0'),hex(mid).padStart(4,'0'),'1'+hex(hi).padStart(3,'0'),(0x80|(clk[0]&0x3f)).toString(16)+clk[1].toString(16).padStart(2,'0'),Array.from(node).map(b=>b.toString(16).padStart(2,'0')).join('')].join('-'),version:1});}

// String utilities
function stringRepeat(b){const{text,count=2,separator=''}=b;if(!text)return e('text required');return j({result:Array(Math.min(count,1000)).fill(text).join(separator)});}
function stringPad(b){const{text,length=10,char=' ',side='right'}=b;if(!text)return e('text required');const r=side==='left'?text.padStart(length,char):side==='both'?text.padStart(Math.ceil((length+text.length)/2),char).padEnd(length,char):text.padEnd(length,char);return j({result:r});}
function stringWrap(b){const{text,width=80}=b;if(!text)return e('text required');const words=text.split(' ');let line='';const lines=[];for(const w of words){if(line.length+w.length+1>width){lines.push(line);line=w;}else{line=line?line+' '+w:w;}}if(line)lines.push(line);return j({result:lines.join('\n'),lines:lines.length});}
function stringMask(b){const{text,start=0,end,char='*'}=b;if(!text)return e('text required');const e2=end||text.length;const masked=text.substring(0,start)+char.repeat(Math.max(0,Math.min(e2,text.length)-start))+text.substring(e2);return j({result:masked});}

// Array/List operations
function arraySort(b){const{array,order='asc',key}=b;if(!Array.isArray(array))return e('array required');const sorted=[...array].sort((a,b2)=>{const va=key?a[key]:a,vb=key?b2[key]:b2;if(typeof va==='string')return order==='desc'?vb.localeCompare(va):va.localeCompare(vb);return order==='desc'?vb-va:va-vb;});return j({result:sorted});}
function arrayUnique(b){const{array}=b;if(!Array.isArray(array))return e('array required');return j({result:[...new Set(array)],removed:array.length-new Set(array).size});}
function arrayShuffle(b){const{array}=b;if(!Array.isArray(array))return e('array required');const a=[...array];for(let i=a.length-1;i>0;i--){const r=Math.floor(Math.random()*(i+1));[a[i],a[r]]=[a[r],a[i]];}return j({result:a});}
function arrayChunk(b){const{array,size=2}=b;if(!Array.isArray(array))return e('array required');const chunks=[];for(let i=0;i<array.length;i+=size)chunks.push(array.slice(i,i+size));return j({result:chunks,chunks:chunks.length});}
function arrayIntersect(b){const{array1,array2}=b;if(!Array.isArray(array1)||!Array.isArray(array2))return e('array1 and array2 required');const s=new Set(array2);return j({intersection:array1.filter(x=>s.has(x)),union:[...new Set([...array1,...array2])],difference:array1.filter(x=>!s.has(x))});}

// Object utilities
function objectPick(b){const{data,keys}=b;if(!data||!Array.isArray(keys))return e('data and keys required');const r={};keys.forEach(k=>{if(k in data)r[k]=data[k]});return j({result:r});}
function objectOmit(b){const{data,keys}=b;if(!data||!Array.isArray(keys))return e('data and keys required');const s=new Set(keys);const r={};Object.entries(data).forEach(([k,v])=>{if(!s.has(k))r[k]=v});return j({result:r});}
function objectInvert(b){const{data}=b;if(!data)return e('data required');return j({result:Object.fromEntries(Object.entries(data).map(([k,v])=>[String(v),k]))});}

// Math helpers
function gcd(b){const{a,b:b2}=b;if(a===undefined||b2===undefined)return e('a and b required');function calc(x,y){return y===0?x:calc(y,x%y);}const r=calc(Math.abs(a),Math.abs(b2));return j({gcd:r,lcm:Math.abs(a*b2)/r});}
function fibonacci(b){const{n=10}=b;const fib=[0,1];for(let i=2;i<Math.min(n,100);i++)fib.push(fib[i-1]+fib[i-2]);return j({sequence:fib.slice(0,n),count:Math.min(n,100)});}
function isPrime(b){const{number}=b;if(!number)return e('number required');const n=parseInt(number);if(n<2)return j({number:n,isPrime:false});for(let i=2;i<=Math.sqrt(n);i++){if(n%i===0)return j({number:n,isPrime:false,smallestFactor:i});}return j({number:n,isPrime:true});}
function primeFactors(b){const{number}=b;if(!number)return e('number required');let n=Math.abs(parseInt(number));const factors=[];for(let i=2;i<=Math.sqrt(n);i++){while(n%i===0){factors.push(i);n/=i;}}if(n>1)factors.push(n);return j({number:parseInt(b.number),factors,unique:[...new Set(factors)]});}

// Network helpers  
function ipToBinary(b){const{ip}=b;if(!ip)return e('ip required');const parts=ip.split('.');if(parts.length!==4)return e('Invalid IPv4');const bins=parts.map(p=>parseInt(p).toString(2).padStart(8,'0'));return j({ip,binary:bins.join('.'),decimal:parts.reduce((sum,p,i)=>sum+parseInt(p)*Math.pow(256,3-i),0),hex:'0x'+parts.map(p=>parseInt(p).toString(16).padStart(2,'0')).join('')});}
function macFormat(b){const{mac}=b;if(!mac)return e('mac required');const clean=mac.replace(/[^0-9a-fA-F]/g,'');if(clean.length!==12)return e('Invalid MAC (need 12 hex chars)');return j({colon:clean.match(/.{2}/g).join(':').toUpperCase(),dash:clean.match(/.{2}/g).join('-').toUpperCase(),dot:clean.match(/.{4}/g).join('.').toLowerCase(),bare:clean.toUpperCase(),isUnicast:(parseInt(clean[1],16)&1)===0,isLocal:(parseInt(clean[1],16)&2)!==0});}

// Text generation
function loremKorean(b){const{paragraphs=1}=b;const sentences=['인공지능 기술이 빠르게 발전하고 있습니다.','클라우드 컴퓨팅은 현대 인프라의 핵심입니다.','데이터 분석을 통해 의미 있는 인사이트를 얻을 수 있습니다.','보안은 모든 시스템의 기본 요소입니다.','사용자 경험 디자인은 제품의 성공을 좌우합니다.','오픈소스 소프트웨어가 혁신을 이끌고 있습니다.','모바일 기기의 보급이 디지털 전환을 가속화합니다.','자동화 도구는 업무 효율성을 크게 향상시킵니다.','프라이버시 보호는 디지털 시대의 필수 과제입니다.','지속 가능한 기술 발전이 미래를 결정합니다.'];
const result=[];for(let i=0;i<Math.min(paragraphs,10);i++){const count=3+Math.floor(Math.random()*4);const para=Array.from({length:count},()=>sentences[Math.floor(Math.random()*sentences.length)]).join(' ');result.push(para);}return j({text:result.join('\n\n'),paragraphs:result.length});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
const url=new URL(request.url);const p=url.pathname;
const body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/uuid-v1':return uuidV1();
  case'/api/string-repeat':return stringRepeat(body);
  case'/api/string-pad':return stringPad(body);
  case'/api/string-wrap':return stringWrap(body);
  case'/api/string-mask':return stringMask(body);
  case'/api/array-sort':return arraySort(body);
  case'/api/array-unique':return arrayUnique(body);
  case'/api/array-shuffle':return arrayShuffle(body);
  case'/api/array-chunk':return arrayChunk(body);
  case'/api/array-intersect':return arrayIntersect(body);
  case'/api/object-pick':return objectPick(body);
  case'/api/object-omit':return objectOmit(body);
  case'/api/object-invert':return objectInvert(body);
  case'/api/gcd':return gcd(body);
  case'/api/fibonacci':return fibonacci(body);
  case'/api/is-prime':return isPrime(body);
  case'/api/prime-factors':return primeFactors(body);
  case'/api/ip-to-binary':return ipToBinary(body);
  case'/api/mac-format':return macFormat(body);
  case'/api/lorem-korean':return loremKorean(body);
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
