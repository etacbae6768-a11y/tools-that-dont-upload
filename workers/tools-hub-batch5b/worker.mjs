// tools-hub-batch5b: 29 more endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// Color utilities
function colorGradient(b){const{color1,color2,steps=5}=b;if(!color1||!color2)return e('color1 and color2 required');
const p=c=>{c=c.replace('#','');return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];};
const c1=p(color1),c2=p(color2);const colors=[];
for(let i=0;i<steps;i++){const t=i/(steps-1);const r=Math.round(c1[0]+(c2[0]-c1[0])*t);const g=Math.round(c1[1]+(c2[1]-c1[1])*t);const bl=Math.round(c1[2]+(c2[2]-c1[2])*t);
colors.push('#'+[r,g,bl].map(x=>x.toString(16).padStart(2,'0')).join(''));}return j({gradient:colors,steps});}
function colorShades(b){const{hex,count=5}=b;if(!hex)return e('hex required');const h=hex.replace('#','');const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),bl=parseInt(h.substr(4,2),16);
const shades=[];for(let i=0;i<count;i++){const f=0.2+0.8*i/(count-1);shades.push('#'+[r,g,bl].map(c=>Math.round(c*f).toString(16).padStart(2,'0')).join(''));}return j({shades});}

// Text formatting
function textColumns(b){const{text,columns=2,separator=' | '}=b;if(!text)return e('text required');const words=text.split(/\s+/);const perCol=Math.ceil(words.length/columns);const cols=[];for(let i=0;i<columns;i++)cols.push(words.slice(i*perCol,(i+1)*perCol).join(' '));return j({result:cols.join(separator),columns:cols});}
function textNumberLines(b){const{text,start=1}=b;if(!text)return e('text required');const lines=text.split('\n');return j({result:lines.map((l,i)=>(start+i)+': '+l).join('\n'),lineCount:lines.length});}
function textRemoveHtml(b){const{text}=b;if(!text)return e('text required');return j({result:text.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim()});}
function textCamelToSnake(b){const{text}=b;if(!text)return e('text required');return j({snake:text.replace(/[A-Z]/g,m=>'_'+m.toLowerCase()).replace(/^_/,''),camel:text.replace(/[-_](.)/g,(m,c)=>c.toUpperCase()),kebab:text.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()).replace(/^-/,''),pascal:text.replace(/[-_](.)/g,(m,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase())});}

// Encoding extras
function unicodeInfo(b){const{text}=b;if(!text)return e('text required');const chars=[];for(const c of text){const cp=c.codePointAt(0);chars.push({char:c,codePoint:cp,hex:'U+'+cp.toString(16).toUpperCase().padStart(4,'0'),name:''});}return j({characters:chars,length:text.length,codePoints:[...text].length});}
function escapeUnescape(b){
  var text=b.text,mode=b.mode||'escape';
  if(!text)return e('text required');
  if(mode==='escape'){
    var r=text.split('').map(function(c){
      if(c==='\\')return'\\\\';if(c==="'")return"\\'";if(c==='"')return'\\"';
      if(c==='\n')return'\\n';if(c==='\r')return'\\r';if(c==='\t')return'\\t';return c;
    }).join('');
    return j({result:r});
  }
  var r2=text.replace(/\\n/g,'\n').replace(/\\r/g,'\r').replace(/\\t/g,'\t');
  return j({result:r2});
}
// Date extras
function dateWeekNumber(b){const{date}=b;if(!date)return e('date required');const d=new Date(date);const jan1=new Date(d.getFullYear(),0,1);const days=Math.floor((d-jan1)/86400000);const week=Math.ceil((days+jan1.getDay()+1)/7);return j({date:d.toISOString().split('T')[0],weekNumber:week,dayOfYear:days+1,dayOfWeek:d.toLocaleDateString('en',{weekday:'long'}),quarter:Math.ceil((d.getMonth()+1)/3),isLeapYear:d.getFullYear()%4===0&&(d.getFullYear()%100!==0||d.getFullYear()%400===0)});}
function dateCountdown(b){const{target}=b;if(!target)return e('target date required');const t=new Date(target),now=new Date();const diff=t-now;if(diff<0)return j({passed:true,message:'Date has passed',agoMs:Math.abs(diff)});const days=Math.floor(diff/86400000);const hours=Math.floor(diff%86400000/3600000);const mins=Math.floor(diff%3600000/60000);return j({target:t.toISOString(),daysLeft:days,hoursLeft:hours,minutesLeft:mins,totalHours:Math.floor(diff/3600000),formatted:days+'d '+hours+'h '+mins+'m'});}

// Validation extras
function domainValidate(b){const{domain}=b;if(!domain)return e('domain required');const valid=/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(domain);const tld=domain.split('.').pop();const sub=domain.split('.').length>2;return j({domain,valid,tld,hasSubdomain:sub,length:domain.length,isIDN:/[^a-zA-Z0-9.-]/.test(domain)});}
function hexValidate(b){const{hex}=b;if(!hex)return e('hex required');const clean=hex.replace(/^(0x|#)/,'');const valid=/^[0-9a-fA-F]+$/.test(clean);return j({hex:clean,valid,length:clean.length,decimal:valid?parseInt(clean,16):null,binary:valid?parseInt(clean,16).toString(2):null});}
function jsonCompare(b){const{json1,json2}=b;if(!json1||!json2)return e('json1 and json2 required');try{const a=typeof json1==='string'?JSON.parse(json1):json1;const b2=typeof json2==='string'?JSON.parse(json2):json2;const identical=JSON.stringify(a)===JSON.stringify(b2);const keys1=new Set(Object.keys(a));const keys2=new Set(Object.keys(b2));const added=[...keys2].filter(k=>!keys1.has(k));const removed=[...keys1].filter(k=>!keys2.has(k));const changed=[...keys1].filter(k=>keys2.has(k)&&JSON.stringify(a[k])!==JSON.stringify(b2[k]));return j({identical,added,removed,changed,summary:added.length+' added, '+removed.length+' removed, '+changed.length+' changed'});}catch(err){return e('Invalid JSON');}}

// Generators
function randomColor(b){const{count=1,format='hex'}=b;const colors=[];for(let i=0;i<Math.min(count,50);i++){const r=Math.floor(Math.random()*256),g=Math.floor(Math.random()*256),bl=Math.floor(Math.random()*256);if(format==='rgb')colors.push('rgb('+r+','+g+','+bl+')');else colors.push('#'+[r,g,bl].map(x=>x.toString(16).padStart(2,'0')).join(''));}return j({colors});}
function randomString(b){const{length=10,charset='alphanumeric'}=b;const sets={alpha:'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',alphanumeric:'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',numeric:'0123456789',hex:'0123456789abcdef'};const chars=sets[charset]||sets.alphanumeric;const arr=new Uint32Array(Math.min(length,1000));crypto.getRandomValues(arr);return j({result:Array.from(arr).map(n=>chars[n%chars.length]).join('')});}
function randomNumber(b){const{min=0,max=100,count=1,float=false}=b;const nums=[];for(let i=0;i<Math.min(count,100);i++){if(float)nums.push(Math.round((Math.random()*(max-min)+min)*1e6)/1e6);else nums.push(Math.floor(Math.random()*(max-min+1))+min);}return j({numbers:nums.length===1?nums[0]:nums});}

// Conversion extras
function lengthConvert(b){const{value,from='cm',to='in'}=b;if(value===undefined)return e('value required');const toCm={cm:1,m:100,km:100000,mm:0.1,in:2.54,ft:30.48,yd:91.44,mi:160934.4};if(!toCm[from]||!toCm[to])return e('Units: cm,m,km,mm,in,ft,yd,mi');return j({result:Math.round(value*toCm[from]/toCm[to]*1e6)/1e6,from,to});}
function areaConvert(b){const{value,from='sqm',to='sqft'}=b;if(value===undefined)return e('value required');const toSqm={sqm:1,sqkm:1e6,sqft:0.0929,sqmi:2589988,acre:4046.86,ha:10000,sqin:0.000645,sqyd:0.8361};if(!toSqm[from]||!toSqm[to])return e('Units: sqm,sqkm,sqft,sqmi,acre,ha,sqin,sqyd');return j({result:Math.round(value*toSqm[from]/toSqm[to]*1e6)/1e6,from,to});}
function volumeConvert(b){const{value,from='l',to='gal'}=b;if(value===undefined)return e('value required');const toL={l:1,ml:0.001,cl:0.01,gal:3.78541,qt:0.946353,pt:0.473176,cup:0.236588,floz:0.0295735,tbsp:0.0147868,tsp:0.00492892};if(!toL[from]||!toL[to])return e('Units: l,ml,cl,gal,qt,pt,cup,floz,tbsp,tsp');return j({result:Math.round(value*toL[from]/toL[to]*1e6)/1e6,from,to});}
function speedConvert(b){const{value,from='kmh',to='mph'}=b;if(value===undefined)return e('value required');const toMs={ms:1,kmh:0.277778,mph:0.44704,kn:0.514444,fts:0.3048};if(!toMs[from]||!toMs[to])return e('Units: ms,kmh,mph,kn,fts');return j({result:Math.round(value*toMs[from]/toMs[to]*1e6)/1e6,from,to});}
function pressureConvert(b){const{value,from='atm',to='psi'}=b;if(value===undefined)return e('value required');const toPa={pa:1,kpa:1000,atm:101325,bar:100000,psi:6894.76,mmhg:133.322,inhg:3386.39};if(!toPa[from]||!toPa[to])return e('Units: pa,kpa,atm,bar,psi,mmhg,inhg');return j({result:Math.round(value*toPa[from]/toPa[to]*1e6)/1e6,from,to});}
function energyConvert(b){const{value,from='j',to='cal'}=b;if(value===undefined)return e('value required');const toJ={j:1,kj:1000,cal:4.184,kcal:4184,wh:3600,kwh:3600000,btu:1055.06,ev:1.602e-19};if(!toJ[from]||!toJ[to])return e('Units: j,kj,cal,kcal,wh,kwh,btu,ev');return j({result:Math.round(value*toJ[from]/toJ[to]*1e6)/1e6,from,to});}
function dataConvert(b){const{value,from='mb',to='gb'}=b;if(value===undefined)return e('value required');const toBytes={b:1,kb:1024,mb:1048576,gb:1073741824,tb:1099511627776,pb:1125899906842624,bit:0.125,kbit:128,mbit:131072,gbit:134217728};if(!toBytes[from]||!toBytes[to])return e('Units: b,kb,mb,gb,tb,pb,bit,kbit,mbit,gbit');return j({result:Math.round(value*toBytes[from]/toBytes[to]*1e6)/1e6,from,to});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
const url=new URL(request.url);const p=url.pathname;
const body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/color-gradient':return colorGradient(body);
  case'/api/color-shades':return colorShades(body);
  case'/api/text-columns':return textColumns(body);
  case'/api/text-number-lines':return textNumberLines(body);
  case'/api/text-remove-html':return textRemoveHtml(body);
  case'/api/text-case-convert':return textCamelToSnake(body);
  case'/api/unicode-info':return unicodeInfo(body);
  case'/api/escape-unescape':return escapeUnescape(body);
  case'/api/date-week-number':return dateWeekNumber(body);
  case'/api/date-countdown':return dateCountdown(body);
  case'/api/domain-validate':return domainValidate(body);
  case'/api/hex-validate':return hexValidate(body);
  case'/api/json-compare':return jsonCompare(body);
  case'/api/random-color':return randomColor(body);
  case'/api/random-string':return randomString(body);
  case'/api/random-number':return randomNumber(body);
  case'/api/length-convert':return lengthConvert(body);
  case'/api/area-convert':return areaConvert(body);
  case'/api/volume-convert':return volumeConvert(body);
  case'/api/speed-convert':return speedConvert(body);
  case'/api/pressure-convert':return pressureConvert(body);
  case'/api/energy-convert':return energyConvert(body);
  case'/api/data-convert':return dataConvert(body);
  case'/api/uuid-v1':return uuidV1();
  case'/api/string-repeat':return stringRepeat(body);
  case'/api/string-pad':return stringPad(body);
  case'/api/string-wrap':return stringWrap(body);
  case'/api/string-mask':return stringMask(body);
  case'/api/lorem-korean':return j({error:'Use tools-hub-batch5a'});
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
