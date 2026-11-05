// --- ttdu safe outbound fetch (manual redirects, per-hop validation) ---
const __ttduOrigFetch = globalThis.fetch.bind(globalThis);
function __ttduBadHost(h){h=(h||'').toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');if(!h)return 'empty host';if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.lan')||h.endsWith('.home.arpa'))return 'local hostname';if(h.includes(':'))return 'IP literal not allowed';if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h))return 'IP literal not allowed';if(/^(0x[0-9a-f]+|\d+)$/i.test(h))return 'IP literal not allowed';if(!h.includes('.'))return 'single-label host not allowed';return null;}
function __ttduCheckUrl(u){if(u.protocol!=='http:'&&u.protocol!=='https:')return 'only http/https allowed';if(u.port&&u.port!=='80'&&u.port!=='443')return 'only ports 80/443 allowed';if(u.username||u.password)return 'credentials in url not allowed';return __ttduBadHost(u.hostname);}
const __TTDU_SENSITIVE=/^(authorization|cookie|proxy-authorization|x-api-key|x-internal-token|x-client-ip)$/i;
async function __ttduSafeFetch(input,init){
  if(typeof input!=='string'&&!(input instanceof URL))return __ttduOrigFetch(input,init);
  init=Object.assign({},init||{});const wantManual=init.redirect==='manual';const MAX=5;
  let url=new URL(String(input));let method=(init.method||'GET').toUpperCase();let body=init.body;
  let headers=new Headers(init.headers||{});for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);
  for(let hop=0;;hop++){
    const bad=__ttduCheckUrl(url);if(bad)throw new Error((hop?'Redirect target rejected: ':'Target rejected: ')+bad);
    const r=await __ttduOrigFetch(url.toString(),Object.assign({},init,{method,headers,body,redirect:'manual'}));
    if(wantManual||![301,302,303,307,308].includes(r.status))return r;
    const loc=r.headers.get('location');if(!loc)return r;
    if(hop+1>MAX)throw new Error('Too many redirects (max '+MAX+')');
    const next=new URL(loc,url);
    if(next.origin!==url.origin){for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);}
    if(r.status===303||((r.status===301||r.status===302)&&method==='POST')){method='GET';body=undefined;headers.delete('content-type');headers.delete('content-length');}
    url=next;
  }
}
const fetch=__ttduSafeFetch;
// --- end safe fetch ---
// tools-hub-batch8a: 25 endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// Finance
function taxCalc(b){var{amount,rate}=b;if(!amount||!rate)return e('amount and rate required');var tax=amount*rate/100;return j({amount:amount,rate:rate,tax:Math.round(tax*100)/100,total:Math.round((amount+tax)*100)/100});}
function loanCalc(b){var{principal,rate,years}=b;if(!principal||!rate||!years)return e('principal, rate, years required');var r=rate/100/12;var n=years*12;var pmt=principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);return j({monthlyPayment:Math.round(pmt*100)/100,totalPayment:Math.round(pmt*n*100)/100,totalInterest:Math.round((pmt*n-principal)*100)/100,principal:principal,rate:rate,years:years});}
function roiCalc(b){var{investment,returnAmount}=b;if(!investment||!returnAmount)return e('investment and returnAmount required');var profit=returnAmount-investment;var roi=profit/investment*100;return j({roi:Math.round(roi*100)/100,profit:Math.round(profit*100)/100,investment:investment,returnAmount:returnAmount});}
function marginCalc(b){var{cost,price}=b;if(!cost||!price)return e('cost and price required');var profit=price-cost;var margin=profit/price*100;var markup=profit/cost*100;return j({profit:Math.round(profit*100)/100,margin:Math.round(margin*100)/100,markup:Math.round(markup*100)/100,cost:cost,price:price});}
function invoiceGen(b){var{from,to,items,currency,number}=b;if(!items)return e('items required [{description,quantity,price}]');var subtotal=items.reduce(function(s,i){return s+i.quantity*i.price;},0);var tax=subtotal*(b.taxRate||0)/100;return j({invoice:{number:number||'INV-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString().split('T')[0],from:from||{},to:to||{},items:items,subtotal:Math.round(subtotal*100)/100,tax:Math.round(tax*100)/100,total:Math.round((subtotal+tax)*100)/100,currency:currency||'USD'}});}

// SEO
function metaScore(b){if(!b.url&&!b.html)return e('url or html required');var html=b.html||'';var score=0;var checks={};checks.title=/<title>[^<]{10,60}<\/title>/i.test(html);if(checks.title)score+=20;checks.description=/meta[^>]*description[^>]*content="[^"]{50,160}"/i.test(html);if(checks.description)score+=20;checks.h1=/<h1/i.test(html);if(checks.h1)score+=15;checks.canonical=/rel=.canonical/i.test(html);if(checks.canonical)score+=10;checks.ogTitle=/og:title/i.test(html);if(checks.ogTitle)score+=10;checks.viewport=/viewport/i.test(html);if(checks.viewport)score+=10;checks.charset=/charset/i.test(html);if(checks.charset)score+=5;checks.lang=/html[^>]*lang=/i.test(html);if(checks.lang)score+=5;checks.altTags=true;score+=5;return j({score:score,maxScore:100,grade:score>=80?'A':score>=60?'B':score>=40?'C':'D',checks:checks});}
function keywordDensity(b){if(!b.text||!b.keyword)return e('text and keyword required');var words=b.text.toLowerCase().split(/\s+/);var kw=b.keyword.toLowerCase();var count=words.filter(function(w){return w.includes(kw);}).length;var density=count/words.length*100;return j({keyword:kw,count:count,totalWords:words.length,density:Math.round(density*100)/100,ideal:density>=1&&density<=3,recommendation:density<1?'Too low - add more':density>3?'Too high - reduce':'Good density'});}
function readabilityScore(b){if(!b.text)return e('text required');var words=b.text.match(/\b\w+\b/g)||[];var sents=b.text.split(/[.!?]+/).filter(function(s){return s.trim();});var sylls=0;words.forEach(function(w){w=w.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');var m=w.match(/[aeiouy]{1,2}/g);sylls+=m?m.length:1;});var asl=words.length/Math.max(sents.length,1);var asw=sylls/Math.max(words.length,1);var flesch=206.835-1.015*asl-84.6*asw;var fog=0.4*(asl+100*(words.filter(function(w){return w.length>6;}).length/Math.max(words.length,1)));return j({flesch:Math.round(flesch*10)/10,gunningFog:Math.round(fog*10)/10,gradeLevel:Math.round(Math.max(0,0.39*asl+11.8*asw-15.59)*10)/10,words:words.length,sentences:sents.length,avgWordsPerSentence:Math.round(asl*10)/10});}
function titleGenerator(b){if(!b.keyword)return e('keyword required');var kw=b.keyword;var templates=['How to '+kw+' in 2026: Complete Guide',''+kw+': Everything You Need to Know','Top 10 '+kw+' Tips for Beginners','The Ultimate Guide to '+kw,''+kw+' vs Alternatives: Which is Best?','Why '+kw+' Matters (And How to Start)',''+kw+' Made Simple: Step-by-Step','Best '+kw+' Tools and Resources'];return j({titles:templates,keyword:kw});}
function metaDescription(b){if(!b.title&&!b.keyword)return e('title or keyword required');var kw=b.keyword||b.title;var templates=['Learn about '+kw+'. Free guide with tips, examples, and best practices. No signup required.','Discover '+kw+' tools and techniques. Complete resource for beginners and experts. Start free today.',''+kw+' explained simply. Step-by-step instructions, examples, and FAQs. Updated for 2026.'];return j({descriptions:templates,keyword:kw,lengths:templates.map(function(t){return t.length;})});}

// Image/CSS
function gradientCss(b){var{color1,color2,direction}=b;if(!color1||!color2)return e('color1 and color2 required');var dir=direction||'to right';return j({css:'background: linear-gradient('+dir+', '+color1+', '+color2+');',fallback:'background: '+color1+';',tailwind:'bg-gradient-to-r from-['+color1+'] to-['+color2+']'});}
function shadowCss(b){var x=b.x||0,y=b.y||4,blur=b.blur||12,spread=b.spread||0,color=b.color||'rgba(0,0,0,0.15)';return j({css:'box-shadow: '+x+'px '+y+'px '+blur+'px '+spread+'px '+color+';',multiple:'box-shadow: '+x+'px '+y+'px '+blur+'px '+spread+'px '+color+', 0 0 '+(blur*2)+'px '+color+';'});}
function aspectRatio(b){var{width,height}=b;if(!width||!height)return e('width and height required');function gcd(a,b2){return b2===0?a:gcd(b2,a%b2);}var g=gcd(width,height);return j({ratio:(width/g)+':'+(height/g),decimal:Math.round(width/height*1000)/1000,width:width,height:height,isPortrait:height>width,isLandscape:width>height,isSquare:width===height});}

// Dev Tools
function curlParse(b){if(!b.curl)return e('curl command required');var cmd=b.curl;var method=(cmd.match(/-X\s+(\w+)/)||['','GET'])[1];var url=(cmd.match(/https?:\/\/[^\s'"]+/)||[''])[0];var headers={};var hm=cmd.matchAll(/-H\s+['"](.*?)['"]/g);for(var m of hm){var parts=m[1].split(':');if(parts.length>=2)headers[parts[0].trim()]=parts.slice(1).join(':').trim();}var dataMatch=cmd.match(/-d\s+['"](.*?)['"]/);var data=dataMatch?dataMatch[1]:null;return j({method:method,url:url,headers:headers,data:data,headerCount:Object.keys(headers).length});}
function httpAuthBasic(b){if(!b.username||!b.password)return e('username and password required');var encoded=btoa(b.username+':'+b.password);return j({header:'Authorization: Basic '+encoded,encoded:encoded,username:b.username});}
function httpAuthBearer(b){if(!b.token)return e('token required');return j({header:'Authorization: Bearer '+b.token,token:b.token});}
async function webhookTest(b){if(!b.url)return e('url required');try{var payload=b.payload||{test:true,timestamp:Date.now()};var r=await fetch(b.url,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'ToolsHub-Webhook/1.0'},body:JSON.stringify(payload)});return j({url:b.url,status:r.status,statusText:r.statusText,success:r.status>=200&&r.status<300,responseHeaders:Object.fromEntries([...r.headers].slice(0,10))});}catch(err){return j({url:b.url,success:false,error:err.message});}}

// Encoding
function base58(b){if(!b.text)return e('text required');var alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';if(b.mode==='decode'){var result=0n;for(var i=0;i<b.text.length;i++){result=result*58n+BigInt(alphabet.indexOf(b.text[i]));}var hex=result.toString(16);if(hex.length%2)hex='0'+hex;var bytes=hex.match(/.{2}/g).map(function(h){return parseInt(h,16);});return j({result:String.fromCharCode.apply(null,bytes)});}
var bytes2=[];for(var i=0;i<b.text.length;i++)bytes2.push(b.text.charCodeAt(i));var num=BigInt('0x'+bytes2.map(function(b2){return b2.toString(16).padStart(2,'0');}).join(''));var encoded='';while(num>0n){encoded=alphabet[Number(num%58n)]+encoded;num=num/58n;}return j({result:encoded});}
function htmlToMarkdown(b){if(!b.html)return e('html required');var md=b.html.replace(/<h1[^>]*>(.*?)<\/h1>/gi,'# $1\n').replace(/<h2[^>]*>(.*?)<\/h2>/gi,'## $1\n').replace(/<h3[^>]*>(.*?)<\/h3>/gi,'### $1\n').replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**').replace(/<b[^>]*>(.*?)<\/b>/gi,'**$1**').replace(/<em[^>]*>(.*?)<\/em>/gi,'*$1*').replace(/<i[^>]*>(.*?)<\/i>/gi,'*$1*').replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,'[$2]($1)').replace(/<code[^>]*>(.*?)<\/code>/gi,'`$1`').replace(/<li[^>]*>(.*?)<\/li>/gi,'- $1\n').replace(/<br\s*\/?>/gi,'\n').replace(/<p[^>]*>(.*?)<\/p>/gi,'$1\n\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim();return j({markdown:md});}
function csvToMarkdown(b){if(!b.csv)return e('csv required');var rows=b.csv.trim().split('\n').map(function(r){return r.split(',').map(function(c){return c.trim();});});var md='| '+rows[0].join(' | ')+' |\n';md+='| '+rows[0].map(function(){return '---';}).join(' | ')+' |\n';for(var i=1;i<rows.length;i++){md+='| '+rows[i].join(' | ')+' |\n';}return j({markdown:md.trim(),rows:rows.length,columns:rows[0].length});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/tax-calc':return taxCalc(body);
  case'/api/loan-calc':return loanCalc(body);
  case'/api/roi-calc':return roiCalc(body);
  case'/api/margin-calc':return marginCalc(body);
  case'/api/invoice-generate':return invoiceGen(body);
  case'/api/meta-score':return metaScore(body);
  case'/api/keyword-density':return keywordDensity(body);
  case'/api/readability-score':return readabilityScore(body);
  case'/api/title-generator':return titleGenerator(body);
  case'/api/meta-description':return metaDescription(body);
  case'/api/gradient-css':return gradientCss(body);
  case'/api/shadow-css':return shadowCss(body);
  case'/api/aspect-ratio':return aspectRatio(body);
  case'/api/curl-parse':return curlParse(body);
  case'/api/http-auth-basic':return httpAuthBasic(body);
  case'/api/http-auth-bearer':return httpAuthBearer(body);
  case'/api/webhook-test':return webhookTest(body);
  case'/api/base58':return base58(body);
  case'/api/html-to-markdown':return htmlToMarkdown(body);
  case'/api/csv-to-markdown':return csvToMarkdown(body);
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
