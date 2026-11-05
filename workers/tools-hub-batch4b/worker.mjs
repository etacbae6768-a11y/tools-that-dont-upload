// tools-hub-batch4b: 27 endpoints (175→200)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// DATA GENERATION
function fakeData(b){const{type='person',locale='en',count=1}=b;const names=['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Hank','Ivy','Jack','Kate','Leo','Mia','Noah','Olivia'];const lastN=['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore'];const domains=['gmail.com','outlook.com','yahoo.com','example.com'];const results=[];for(let i=0;i<Math.min(count,50);i++){const fn=names[Math.floor(Math.random()*names.length)];const ln=lastN[Math.floor(Math.random()*lastN.length)];const em=fn.toLowerCase()+'.'+ln.toLowerCase()+'@'+domains[Math.floor(Math.random()*domains.length)];const ph='+1-'+Math.floor(Math.random()*900+100)+'-'+Math.floor(Math.random()*900+100)+'-'+Math.floor(Math.random()*9000+1000);results.push({name:fn+' '+ln,email:em,phone:ph,id:crypto.randomUUID()});}return j({data:results,count:results.length});}
function mockJson(b){const{schema}=b;if(!schema)return e('schema required');function gen(s){if(s==='string')return'sample_'+Math.random().toString(36).substr(2,5);if(s==='number')return Math.floor(Math.random()*1000);if(s==='boolean')return Math.random()>0.5;if(s==='email')return'user'+Math.floor(Math.random()*999)+'@example.com';if(s==='date')return new Date(Date.now()-Math.random()*3.15e10).toISOString().split('T')[0];if(s==='uuid')return crypto.randomUUID();if(typeof s==='object'&&!Array.isArray(s)){const r={};for(const[k,v] of Object.entries(s))r[k]=gen(v);return r;}if(Array.isArray(s))return s.map(gen);return s;}return j({result:gen(schema)});}
function testCreditCard(b){const{issuer='visa',count=1}=b;const prefixes={visa:['4'],mastercard:['51','52','53','54','55'],amex:['34','37'],discover:['6011','65']};const pf=prefixes[issuer.toLowerCase()]||prefixes.visa;const results=[];for(let i=0;i<Math.min(count,10);i++){const prefix=pf[Math.floor(Math.random()*pf.length)];const len=issuer.toLowerCase()==='amex'?15:16;let num=prefix;while(num.length<len-1)num+=Math.floor(Math.random()*10);let sum=0;let dbl=true;for(let k=num.length-1;k>=0;k--){let d=parseInt(num[k]);if(dbl){d*=2;if(d>9)d-=9;}sum+=d;dbl=!dbl;}const check=(10-(sum%10))%10;num+=check;results.push(num);}return j({cards:results,issuer,note:'Test numbers only - not real cards'});}
function sampleCsv(b){const{rows=10,columns=['id','name','email','age','city']}=b;const cities=['Seoul','Tokyo','NYC','London','Paris','Berlin','Sydney','Toronto'];const names2=['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Hank'];let csv=columns.join(',')+' \n';for(let i=0;i<Math.min(rows,100);i++){const vals=columns.map(c=>{if(c==='id')return i+1;if(c==='name')return names2[i%names2.length];if(c==='email')return names2[i%names2.length].toLowerCase()+'@test.com';if(c==='age')return 20+Math.floor(Math.random()*40);if(c==='city')return cities[i%cities.length];return'value_'+i;});csv+=vals.join(',')+' \n';}return j({csv:csv.trim(),rows:Math.min(rows,100),columns:columns.length});}
function idGenerator(b){const{type='uuid',count=1}=b;const results=[];for(let i=0;i<Math.min(count,50);i++){if(type==='uuid')results.push(crypto.randomUUID());else if(type==='nanoid'){const a='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';const bytes=crypto.getRandomValues(new Uint8Array(21));results.push(Array.from(bytes).map(b2=>a[b2&63]).join(''));}else if(type==='ulid'){const t=Date.now().toString(36).padStart(10,'0');const r2=Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b2=>'0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b2%32]).join('');results.push((t+r2).toUpperCase());}else if(type==='snowflake'){const ts=BigInt(Date.now()-1288834974657n);results.push(String((ts<<22n)|BigInt(Math.floor(Math.random()*4194304))));}else results.push(crypto.randomUUID());}return j({ids:results,type,count:results.length});}

// CODE GENERATION
function jsonToYamlPretty(b){const{data}=b;if(!data)return e('data required');function toYaml(obj,indent=0){const sp='  '.repeat(indent);let r='';for(const[k,v] of Object.entries(obj)){if(v===null)r+=sp+k+': null\n';else if(typeof v==='object'&&!Array.isArray(v)){r+=sp+k+':\n'+toYaml(v,indent+1);}else if(Array.isArray(v)){r+=sp+k+':\n';v.forEach(item=>{if(typeof item==='object')r+=sp+'  - \n'+toYaml(item,indent+2).replace(/^/gm,'  ');else r+=sp+'  - '+item+'\n';});}else if(typeof v==='string')r+=sp+k+': "'+v+'"\n';else r+=sp+k+': '+v+'\n';}return r;}return j({yaml:toYaml(data)});}
function jsonToXmlPretty(b){const{data,root='root'}=b;if(!data)return e('data required');function toXml(obj,indent=0){const sp='  '.repeat(indent);let r='';for(const[k,v] of Object.entries(obj)){if(v===null)r+=sp+'<'+k+'/>\n';else if(typeof v==='object'&&!Array.isArray(v))r+=sp+'<'+k+'>\n'+toXml(v,indent+1)+sp+'</'+k+'>\n';else if(Array.isArray(v))v.forEach(item=>{if(typeof item==='object')r+=sp+'<'+k+'>\n'+toXml(item,indent+1)+sp+'</'+k+'>\n';else r+=sp+'<'+k+'>'+item+'</'+k+'>\n';});else r+=sp+'<'+k+'>'+v+'</'+k+'>\n';}return r;}return j({xml:'<?xml version="1.0"?>\n<'+root+'>\n'+toXml(data,1)+'</'+root+'>'});}
function jsonToCsvFlat(b){const{data}=b;if(!data)return e('data required');function flatten(obj,prefix=''){const r={};for(const[k,v] of Object.entries(obj)){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))Object.assign(r,flatten(v,key));else r[key]=v;}return r;}const items=Array.isArray(data)?data.map(i=>flatten(i)):[flatten(data)];const keys=[...new Set(items.flatMap(Object.keys))];const csv=[keys.join(','),...items.map(i=>keys.map(k=>JSON.stringify(i[k]??'')).join(','))].join('\n');return j({csv,rows:items.length,columns:keys.length});}
function jsonToForm(b){const{data}=b;if(!data)return e('data required');let html='<form>\n';for(const[k,v] of Object.entries(data)){const type=typeof v==='number'?'number':typeof v==='boolean'?'checkbox':v&&v.includes&&v.includes('@')?'email':'text';html+='  <label>'+k+'</label>\n  <input type="'+type+'" name="'+k+'" value="'+v+'">\n';}html+='  <button type="submit">Submit</button>\n</form>';return j({html});}
function jsonToEnv(b){const{data,prefix=''}=b;if(!data)return e('data required');function flat(obj,pre){const lines=[];for(const[k,v] of Object.entries(obj)){const key=(pre?pre+'_':'')+k.toUpperCase().replace(/[^A-Z0-9]/g,'_');if(v&&typeof v==='object'&&!Array.isArray(v))lines.push(...flat(v,key));else lines.push(key+'='+JSON.stringify(v));}return lines;}return j({env:flat(data,prefix).join('\n')});}

// TEXT ANALYSIS
function sentiment(b){const{text}=b;if(!text)return e('text required');const pos=['good','great','excellent','amazing','wonderful','fantastic','love','happy','best','awesome','perfect','beautiful','brilliant','outstanding','superb','magnificent','delightful','pleasant'];const neg=['bad','terrible','awful','horrible','worst','hate','ugly','poor','disgusting','pathetic','dreadful','atrocious','abysmal','lousy','miserable','wretched'];const words=text.toLowerCase().split(/\W+/);let score=0;const found={positive:[],negative:[]};for(const w of words){if(pos.includes(w)){score++;found.positive.push(w);}if(neg.includes(w)){score--;found.negative.push(w);}}return j({score,sentiment:score>0?'positive':score<0?'negative':'neutral',confidence:Math.min(Math.abs(score)/words.length*10,1),words:found});}
function languageDetect(b){const{text}=b;if(!text)return e('text required');const trigrams={en:['the','and','ing','tion','her','for','tha','ere','ent','ion'],ko:['은 ','는 ','이 ','의 ','에 ','를 ','가 ','한 ','하 ','고 '],ja:['の','に','は','を','た','が','で','て','と','し'],zh:['的','了','在','是','我','不','有','和','就','人'],es:['de ','la ','que','el ','en ','los','del','las','con','una'],fr:['de ','le ','la ','les','des','est','que','une','en ','du ']};let best='unknown',bestScore=0;for(const[lang,tgs] of Object.entries(trigrams)){let score=0;for(const tg of tgs){const re=new RegExp(tg,'gi');const matches=text.match(re);if(matches)score+=matches.length;}if(score>bestScore){bestScore=score;best=lang;}}return j({language:best,confidence:Math.min(bestScore/text.length*10,1),scores:Object.fromEntries(Object.keys(trigrams).map(l=>[l,0]))});}
function keywordExtract(b){const{text,count=10}=b;if(!text)return e('text required');const stops=new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','need','to','of','in','for','on','with','at','by','from','as','into','about','but','not','or','and','if','it','its','this','that','these','those','i','me','my','we','our','you','your','he','him','his','she','her','they','them','their','what','which','who','whom','how','when','where','why','all','each','every','both','few','more','most','other','some','such','no','than','too','very','just','also']);const words=text.toLowerCase().match(/\b[a-z]{3,}\b/g)||[];const freq={};for(const w of words)if(!stops.has(w))freq[w]=(freq[w]||0)+1;const sorted=Object.entries(freq).sort((a,b2)=>b2[1]-a[1]).slice(0,count);const maxFreq=sorted[0]?.[1]||1;return j({keywords:sorted.map(([word,f])=>({word,count:f,score:Math.round(f/maxFreq*100)/100}))});}
function textSummarizeExtractive(b){const{text,sentences:n=3}=b;if(!text)return e('text required');const sents=text.match(/[^.!?]+[.!?]+/g)||[text];const words=text.toLowerCase().match(/\b\w+\b/g)||[];const freq={};words.forEach(w=>freq[w]=(freq[w]||0)+1);const scored=sents.map((s,i)=>{const sw=s.toLowerCase().match(/\b\w+\b/g)||[];const score=sw.reduce((sum,w)=>sum+(freq[w]||0),0)/sw.length;return{sentence:s.trim(),score,index:i};});scored.sort((a,b2)=>b2.score-a.score);const top=scored.slice(0,Math.min(n,sents.length)).sort((a,b2)=>a.index-b2.index);return j({summary:top.map(s=>s.sentence).join(' '),sentences:top,originalSentences:sents.length});}
function textNgrams(b){const{text,n=2}=b;if(!text)return e('text required');const words=text.toLowerCase().match(/\b\w+\b/g)||[];const ngrams={};for(let i=0;i<=words.length-n;i++){const ng=words.slice(i,i+n).join(' ');ngrams[ng]=(ngrams[ng]||0)+1;}const sorted=Object.entries(ngrams).sort((a,b2)=>b2[1]-a[1]).slice(0,30);return j({ngrams:sorted.map(([gram,count])=>({gram,count})),n,total:Object.keys(ngrams).length});}

// VALIDATION
function phoneValidate(b){const{phone}=b;if(!phone)return e('phone required');const clean=phone.replace(/[\s\-().]/g,'');const valid=/^\+?\d{7,15}$/.test(clean);let country='Unknown';if(clean.startsWith('+1')||clean.startsWith('1'))country='US/CA';else if(clean.startsWith('+82')||clean.startsWith('82'))country='KR';else if(clean.startsWith('+81'))country='JP';else if(clean.startsWith('+44'))country='UK';else if(clean.startsWith('+86'))country='CN';return j({valid,phone:clean,country,formatted:clean.length===11?clean.replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3'):clean});}
function urlValidate(b){const{url}=b;if(!url)return e('url required');try{const u=new URL(url);return j({valid:true,protocol:u.protocol,hasSSL:u.protocol==='https:',hostname:u.hostname,hasTLD:u.hostname.includes('.')});}catch{return j({valid:false,error:'Invalid URL format'});}}
function jsonLint(b){const{json:js}=b;if(!js)return e('json (string) required');const str=typeof js==='string'?js:JSON.stringify(js);try{JSON.parse(str);return j({valid:true,size:str.length});}catch(err){const m=err.message.match(/position (\d+)/);const pos=m?parseInt(m[1]):0;const line=str.substring(0,pos).split('\n').length;const col=pos-str.substring(0,pos).lastIndexOf('\n');return j({valid:false,error:err.message,line,column:col,position:pos});}}
function xmlValidate(b){const{xml}=b;if(!xml)return e('xml required');const tags=[];let valid=true,error=null;const re=/<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*(\/?)>/g;let m2;while((m2=re.exec(xml))!==null){const[,closing,tag,selfClose]=m2;if(selfClose)continue;if(closing){if(tags.length===0||tags[tags.length-1]!==tag){valid=false;error='Unexpected closing tag: </'+tag+'>';break;}tags.pop();}else{tags.push(tag);}}if(valid&&tags.length>0){valid=false;error='Unclosed tag: <'+tags[tags.length-1]+'>';}return j({valid,error,unclosedTags:tags});}
function cssValidate(b){const{css}=b;if(!css)return e('css required');const errors=[];let braces=0;for(let i=0;i<css.length;i++){if(css[i]==='{')braces++;if(css[i]==='}')braces--; if(braces<0){errors.push({error:'Unexpected }',position:i});braces=0;}}if(braces>0)errors.push({error:braces+' unclosed {',position:css.length});const rules=(css.match(/[^{}]+\{[^{}]*\}/g)||[]).length;return j({valid:errors.length===0,errors,ruleCount:rules,size:css.length});}

// UTILITY
function bytesFormat(b){const{bytes,decimals=2}=b;if(bytes===undefined)return e('bytes required');const sizes=['B','KB','MB','GB','TB','PB'];const n=Number(bytes);if(n===0)return j({result:'0 B',bytes:0});const i=Math.floor(Math.log(n)/Math.log(1024));return j({result:parseFloat((n/Math.pow(1024,i)).toFixed(decimals))+' '+sizes[i],bytes:n,unit:sizes[i]});}
function durationFormat(b){const{seconds}=b;if(seconds===undefined)return e('seconds required');const s=Number(seconds);const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60);const parts=[];if(d)parts.push(d+'d');if(h)parts.push(h+'h');if(m)parts.push(m+'m');if(sec||parts.length===0)parts.push(sec+'s');return j({formatted:parts.join(' '),days:d,hours:h,minutes:m,seconds:sec,totalSeconds:s});}
function emojiSearch(b){const{query}=b;if(!query)return e('query required');const emojis=[{e:'😀',n:'grinning face',k:'happy smile'},{e:'😂',n:'face with tears of joy',k:'laugh cry lol'},{e:'❤️',n:'red heart',k:'love heart'},{e:'👍',n:'thumbs up',k:'like good ok'},{e:'🔥',n:'fire',k:'hot flame lit'},{e:'⭐',n:'star',k:'favorite best'},{e:'🎉',n:'party popper',k:'celebrate party'},{e:'💡',n:'light bulb',k:'idea think'},{e:'🚀',n:'rocket',k:'launch fast speed'},{e:'✅',n:'check mark',k:'done complete yes'},{e:'❌',n:'cross mark',k:'no wrong delete'},{e:'⚠️',n:'warning',k:'alert caution'},{e:'📧',n:'email',k:'mail letter'},{e:'📱',n:'mobile phone',k:'phone cell'},{e:'💻',n:'laptop',k:'computer work'},{e:'🌍',n:'globe',k:'world earth'},{e:'☀️',n:'sun',k:'sunny bright'},{e:'🌙',n:'moon',k:'night dark'},{e:'🎵',n:'music note',k:'song sound'},{e:'📷',n:'camera',k:'photo picture'},{e:'🎮',n:'game controller',k:'gaming play'},{e:'🍕',n:'pizza',k:'food eat'},{e:'☕',n:'coffee',k:'drink morning'},{e:'🐱',n:'cat',k:'kitty meow'},{e:'🐶',n:'dog',k:'puppy woof'},{e:'🌈',n:'rainbow',k:'colors pride'},{e:'💰',n:'money bag',k:'rich cash'},{e:'🔒',n:'lock',k:'secure private'},{e:'🔑',n:'key',k:'unlock access'},{e:'⏰',n:'alarm clock',k:'time wake'}];const q=query.toLowerCase();const matches=emojis.filter(em=>em.n.includes(q)||em.k.includes(q));return j({results:matches.map(m=>({emoji:m.e,name:m.n})),count:matches.length,query});}

// CONVERSION
function temperature(b){const{value,from='C',to='F'}=b;if(value===undefined)return e('value required');const v=Number(value);let celsius;if(from.toUpperCase()==='C')celsius=v;else if(from.toUpperCase()==='F')celsius=(v-32)*5/9;else celsius=v-273.15;let result;if(to.toUpperCase()==='C')result=celsius;else if(to.toUpperCase()==='F')result=celsius*9/5+32;else result=celsius+273.15;return j({result:Math.round(result*100)/100,from:from.toUpperCase(),to:to.toUpperCase(),allUnits:{celsius:Math.round(celsius*100)/100,fahrenheit:Math.round((celsius*9/5+32)*100)/100,kelvin:Math.round((celsius+273.15)*100)/100}});}
function distance(b){const{value,from='km',to='mi'}=b;if(value===undefined)return e('value required');const toMeters={km:1000,m:1,cm:0.01,mm:0.001,mi:1609.344,yd:0.9144,ft:0.3048,in:0.0254,nm:1852};const fm=toMeters[from.toLowerCase()],tm=toMeters[to.toLowerCase()];if(!fm||!tm)return e('Unknown unit. Use: '+Object.keys(toMeters).join(', '));const meters=value*fm;return j({result:Math.round(meters/tm*1e6)/1e6,from,to});}
function weight(b){const{value,from='kg',to='lb'}=b;if(value===undefined)return e('value required');const toGrams={kg:1000,g:1,mg:0.001,lb:453.592,oz:28.3495,st:6350.29,t:1e6};const fg=toGrams[from.toLowerCase()],tg=toGrams[to.toLowerCase()];if(!fg||!tg)return e('Unknown unit. Use: '+Object.keys(toGrams).join(', '));const grams=value*fg;return j({result:Math.round(grams/tg*1e6)/1e6,from,to});}

const __ttduInner = {async fetch(request){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
  const url=new URL(request.url);const p=url.pathname;
  const body=request.method==='POST'?await gb(request):{};
  switch(p){
    case'/api/fake-data':return fakeData(body);
    case'/api/mock-json':return mockJson(body);
    case'/api/test-credit-card':return testCreditCard(body);
    case'/api/sample-csv':return sampleCsv(body);
    case'/api/id-generator':return idGenerator(body);
    case'/api/json-to-yaml-pretty':return jsonToYamlPretty(body);
    case'/api/json-to-xml-pretty':return jsonToXmlPretty(body);
    case'/api/json-to-csv-flat':return jsonToCsvFlat(body);
    case'/api/json-to-form':return jsonToForm(body);
    case'/api/json-to-env':return jsonToEnv(body);
    case'/api/sentiment':return sentiment(body);
    case'/api/language-detect':return languageDetect(body);
    case'/api/keyword-extract':return keywordExtract(body);
    case'/api/text-summarize-extractive':return textSummarizeExtractive(body);
    case'/api/text-ngrams':return textNgrams(body);
    case'/api/phone-validate':return phoneValidate(body);
    case'/api/url-validate':return urlValidate(body);
    case'/api/json-lint':return jsonLint(body);
    case'/api/xml-validate':return xmlValidate(body);
    case'/api/css-validate':return cssValidate(body);
    case'/api/bytes-format':return bytesFormat(body);
    case'/api/duration-format':return durationFormat(body);
    case'/api/emoji-search':return emojiSearch(body);
    case'/api/temperature':return temperature(body);
    case'/api/distance':return distance(body);
    case'/api/weight':return weight(body);
    case'/api/cron-to-english':return j({error:'Use /api/cron-describe instead'},301);
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
