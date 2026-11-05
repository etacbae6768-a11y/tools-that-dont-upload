// tools-hub-batch4a: 25 endpoints (150→175)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

function regexExtract(b){const{text,pattern,flags='g'}=b;if(!text||!pattern)return e('text and pattern required');try{const re=new RegExp(pattern,flags);const m=[...text.matchAll(re)].map(x=>({match:x[0],index:x.index,groups:x.groups||null}));return j({matches:m,count:m.length});}catch(err){return e('Invalid regex: '+err.message);}}
function regexReplace(b){const{text,pattern,replacement='',flags='g'}=b;if(!text||!pattern)return e('text and pattern required');try{return j({result:text.replace(new RegExp(pattern,flags),replacement)});}catch(err){return e('Invalid regex: '+err.message);}}
function globMatch(b){const{filename,pattern}=b;if(!filename||!pattern)return e('filename and pattern required');const re=new RegExp('^'+pattern.replace(/\./g,'\\.').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');return j({match:re.test(filename),filename,pattern});}
function semverCompare(b){const{v1,v2}=b;if(!v1||!v2)return e('v1 and v2 required');const p=v=>v.replace(/^v/,'').split('.').map(Number);const a=p(v1),b2=p(v2);let cmp=0;for(let i=0;i<3;i++){if((a[i]||0)>(b2[i]||0)){cmp=1;break;}if((a[i]||0)<(b2[i]||0)){cmp=-1;break;}}return j({v1,v2,comparison:cmp,result:cmp>0?v1+' > '+v2:cmp<0?v1+' < '+v2:v1+' = '+v2,newer:cmp>0?v1:cmp<0?v2:'equal'});}

function morseCode(b){const{text,mode='encode'}=b;if(!text)return e('text required');const m={'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','?':'..--..','!':'-.-.--','.':'.-.-.-',',':'--..--'};if(mode==='encode'){return j({result:text.toUpperCase().split('').map(c=>c===' '?'/':m[c]||c).join(' ')});}else{const rm=Object.fromEntries(Object.entries(m).map(([k,v])=>[v,k]));return j({result:text.split(' ').map(c=>c==='/'?' ':rm[c]||c).join('')});}}
function binaryText(b){const{text,mode='encode'}=b;if(!text)return e('text required');if(mode==='encode')return j({result:text.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ')});return j({result:text.split(' ').map(b2=>String.fromCharCode(parseInt(b2,2))).join('')});}
function rot13(b){if(!b.text)return e('text required');return j({result:b.text.replace(/[a-zA-Z]/g,c=>{const base=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-base+13)%26+base);})});}
function caesarCipher(b){const{text,shift=3,mode='encrypt'}=b;if(!text)return e('text required');const s=mode==='decrypt'?26-(shift%26):shift%26;return j({result:text.replace(/[a-zA-Z]/g,c=>{const base=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-base+s)%26+base);}),shift:s,mode});}
function hexText(b){const{text,mode='encode'}=b;if(!text)return e('text required');if(mode==='encode')return j({result:text.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')});return j({result:text.split(' ').map(h=>String.fromCharCode(parseInt(h,16))).join('')});}

function colorBlend(b){
  var color1=b.color1,color2=b.color2,ratio=b.ratio||0.5;
  if(!color1||!color2)return e('color1 and color2 required');
  function parseHex(c){c=c.replace('#','');return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];}
  var c1=parseHex(color1),c2=parseHex(color2);
  var r=Math.round(c1[0]+(c2[0]-c1[0])*ratio);
  var g=Math.round(c1[1]+(c2[1]-c1[1])*ratio);
  var bl=Math.round(c1[2]+(c2[2]-c1[2])*ratio);
  return j({result:'#'+[r,g,bl].map(function(x){return x.toString(16).padStart(2,'0');}).join(''),color1:color1,color2:color2,ratio:ratio});
}
function colorContrast(b){const{foreground,background}=b;if(!foreground||!background)return e('foreground and background required');const lum=c=>{c=c.replace('#','');const r=parseInt(c.substr(0,2),16)/255,g=parseInt(c.substr(2,2),16)/255,bl=parseInt(c.substr(4,2),16)/255;const[rs,gs,bs]=[r,g,bl].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*rs+0.7152*gs+0.0722*bs;};const l1=lum(foreground),l2=lum(background);const ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);return j({ratio:Math.round(ratio*100)/100,AA:ratio>=4.5,AALarge:ratio>=3,AAA:ratio>=7,AAALarge:ratio>=4.5,foreground,background});}
function colorName(b){
  var hex=b.hex;if(!hex)return e('hex required');
  var h=hex.replace('#','').toLowerCase();
  var colors={ff0000:'Red','00ff00':'Lime','0000ff':'Blue',ffff00:'Yellow',ff00ff:'Magenta','00ffff':'Cyan',ffffff:'White','000000':'Black',808080:'Gray',ffa500:'Orange',ffc0cb:'Pink',a52a2a:'Brown',ff6347:'Tomato','4169e1':'RoyalBlue',dc143c:'Crimson',ff4500:'OrangeRed'};
  function parseC(c){return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];}
  var t=parseC(h);var best='Unknown',bestDist=Infinity;
  for(var ch in colors){var c2=parseC(ch);var d=Math.sqrt(Math.pow(t[0]-c2[0],2)+Math.pow(t[1]-c2[1],2)+Math.pow(t[2]-c2[2],2));if(d<bestDist){bestDist=d;best=colors[ch];}}
  return j({hex:'#'+h,nearestName:best,distance:Math.round(bestDist)});
}
function colorRandom(b){const{count=1,hue,saturation}=b;const results=[];for(let i=0;i<Math.min(count,20);i++){const h2=hue!==undefined?hue:Math.floor(Math.random()*360);const s=saturation!==undefined?saturation:50+Math.floor(Math.random()*50);const l=40+Math.floor(Math.random()*30);const hsl2rgb=(h,s2,l2)=>{s2/=100;l2/=100;const a=s2*Math.min(l2,1-l2);const f=n=>{const k=(n+h/30)%12;return l2-a*Math.max(Math.min(k-3,9-k,1),-1);};return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];};const[r,g,bl]=hsl2rgb(h2,s,l);const hex='#'+[r,g,bl].map(x=>x.toString(16).padStart(2,'0')).join('');results.push({hex,rgb:`rgb(${r},${g},${bl})`,hsl:`hsl(${h2},${s}%,${l}%)`});}return j({colors:results});}

function dateFormat(b){const{date,format='YYYY-MM-DD'}=b;if(!date)return e('date required');const d=new Date(date);if(isNaN(d))return e('Invalid date');const pad=n=>String(n).padStart(2,'0');const r=format.replace('YYYY',d.getFullYear()).replace('MM',pad(d.getMonth()+1)).replace('DD',pad(d.getDate())).replace('HH',pad(d.getHours())).replace('mm',pad(d.getMinutes())).replace('ss',pad(d.getSeconds())).replace('ddd',d.toLocaleDateString('en',{weekday:'short'})).replace('dddd',d.toLocaleDateString('en',{weekday:'long'}));return j({result:r,iso:d.toISOString()});}
function dateRange(b){const{start,end,step='day'}=b;if(!start||!end)return e('start and end required');const s=new Date(start),en=new Date(end);if(isNaN(s)||isNaN(en))return e('Invalid dates');const dates=[];let cur=new Date(s);const inc={day:1,week:7,month:0}[step]||1;while(cur<=en&&dates.length<366){dates.push(cur.toISOString().split('T')[0]);if(step==='month'){cur.setMonth(cur.getMonth()+1);}else{cur.setDate(cur.getDate()+inc);}}return j({dates,count:dates.length});}
function businessDays(b){const{start,end}=b;if(!start||!end)return e('start and end required');const s=new Date(start),en=new Date(end);let count=0,cur=new Date(s);while(cur<=en){const dow=cur.getDay();if(dow!==0&&dow!==6)count++;cur.setDate(cur.getDate()+1);}return j({businessDays:count,totalDays:Math.ceil((en-s)/86400000)+1,start,end});}
function ageCalc(b){const{birthdate}=b;if(!birthdate)return e('birthdate required');const bd=new Date(birthdate),now=new Date();if(isNaN(bd))return e('Invalid date');let years=now.getFullYear()-bd.getFullYear();let months=now.getMonth()-bd.getMonth();let days=now.getDate()-bd.getDate();if(days<0){months--;days+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}if(months<0){years--;months+=12;}const totalDays=Math.floor((now-bd)/86400000);return j({years,months,days,totalDays,nextBirthday:new Date(now.getFullYear()+(new Date(now.getFullYear(),bd.getMonth(),bd.getDate())<now?1:0),bd.getMonth(),bd.getDate()).toISOString().split('T')[0]});}
function holidayCheck(b){const{date,country='US'}=b;if(!date)return e('date required');const d=new Date(date);const m=d.getMonth()+1,day=d.getDate();const holidays={US:{[1+'/1']:'New Year',[ 7+'/4']:'Independence Day',[12+'/25']:'Christmas',[11+'/11']:'Veterans Day',[6+'/19']:'Juneteenth'},KR:{[1+'/1']:'New Year',[3+'/1']:'Independence Movement',[5+'/5']:'Children\'s Day',[6+'/6']:'Memorial Day',[8+'/15']:'Liberation Day',[10+'/3']:'National Foundation',[10+'/9']:'Hangul Day',[12+'/25']:'Christmas'},JP:{[1+'/1']:'New Year',[2+'/11']:'National Foundation',[2+'/23']:'Emperor Birthday',[4+'/29']:'Showa Day',[5+'/3']:'Constitution Day',[5+'/4']:'Greenery Day',[5+'/5']:'Children\'s Day',[7+'/18']:'Marine Day',[11+'/3']:'Culture Day',[11+'/23']:'Labor Thanksgiving'}};const ch=(holidays[country.toUpperCase()]||holidays.US);const key=m+'/'+day;return j({date:d.toISOString().split('T')[0],isHoliday:!!ch[key],holiday:ch[key]||null,country:country.toUpperCase(),dayOfWeek:d.toLocaleDateString('en',{weekday:'long'})});}

function ipValidate(b){const{ip}=b;if(!ip)return e('ip required');const v4=/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)&&ip.split('.').every(n=>parseInt(n)>=0&&parseInt(n)<=255);const v6=/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)||/^(([0-9a-fA-F]{1,4}:)*:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})$/.test(ip);const priv=v4&&(ip.startsWith('10.')||ip.startsWith('192.168.')||/^172\.(1[6-9]|2\d|3[01])/.test(ip)||ip.startsWith('127.'));return j({ip,valid:v4||v6,version:v4?4:v6?6:null,isPrivate:!!priv,isLoopback:ip==='127.0.0.1'||ip==='::1'});}
function urlParse(b){const{url}=b;if(!url)return e('url required');try{const u=new URL(url);return j({protocol:u.protocol.replace(':',''),hostname:u.hostname,port:u.port||null,pathname:u.pathname,search:u.search,hash:u.hash,origin:u.origin,searchParams:Object.fromEntries(u.searchParams)});}catch(err){return e('Invalid URL');}}
function emailParse(b){const{email}=b;if(!email)return e('email required');const m=email.match(/^([^@]+)@(.+)$/);if(!m)return e('Invalid email format');const[,local,domain]=m;return j({email,local,domain,tld:domain.split('.').pop(),isGmail:domain==='gmail.com',isOutlook:/outlook|hotmail|live/.test(domain),isDisposable:/tempmail|guerrilla|mailinator|yopmail/.test(domain)});}
function headersParse(b){const{raw}=b;if(!raw)return e('raw (header string) required');const headers={};for(const line of raw.split('\n')){const idx=line.indexOf(':');if(idx>0)headers[line.substring(0,idx).trim().toLowerCase()]=line.substring(idx+1).trim();}return j({headers,count:Object.keys(headers).length});}
function cookieParse(b){const{cookie}=b;if(!cookie)return e('cookie (Set-Cookie string) required');const parts=cookie.split(';').map(p=>p.trim());const[nameVal,...attrs]=parts;const[name,value]=(nameVal||'').split('=');const result={name,value:decodeURIComponent(value||''),attributes:{}};for(const a of attrs){const[k,v]=(a+'=').split('=');result.attributes[k.trim().toLowerCase()]=v.trim()||true;}return j(result);}

const __ttduInner = {async fetch(request){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
  const url=new URL(request.url);const p=url.pathname;
  const body=request.method==='POST'?await gb(request):{};
  switch(p){
    case'/api/regex-extract':return regexExtract(body);
    case'/api/regex-replace':return regexReplace(body);
    case'/api/glob-match':return globMatch(body);
    case'/api/semver-compare':return semverCompare(body);
    case'/api/morse-code':return morseCode(body);
    case'/api/binary-text':return binaryText(body);
    case'/api/rot13':return rot13(body);
    case'/api/caesar-cipher':return caesarCipher(body);
    case'/api/hex-text':return hexText(body);
    case'/api/color-blend':return colorBlend(body);
    case'/api/color-contrast':return colorContrast(body);
    case'/api/color-name':return colorName(body);
    case'/api/color-random':return colorRandom(body);
    case'/api/date-format':return dateFormat(body);
    case'/api/date-range':return dateRange(body);
    case'/api/business-days':return businessDays(body);
    case'/api/age-calc':return ageCalc(body);
    case'/api/holiday-check':return holidayCheck(body);
    case'/api/ip-validate':return ipValidate(body);
    case'/api/url-parse':return urlParse(body);
    case'/api/email-parse':return emailParse(body);
    case'/api/headers-parse':return headersParse(body);
    case'/api/cookie-parse':return cookieParse(body);
    default:return new Response('Not Found',{status:404});
  }
}};

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
