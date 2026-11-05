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
// tools-hub-batch7b: 34 endpoints (325→350+)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// Calendar
function calendarMonth(b){var{year,month}=b;if(!year||!month)return e('year and month required');var first=new Date(year,month-1,1);var last=new Date(year,month,0);var weeks=[];var week=Array(first.getDay()).fill(null);for(var d=1;d<=last.getDate();d++){week.push(d);if(week.length===7){weeks.push(week);week=[];}}if(week.length>0){while(week.length<7)week.push(null);weeks.push(week);}return j({year:year,month:month,monthName:first.toLocaleString('en',{month:'long'}),weeks:weeks,daysInMonth:last.getDate(),startDay:first.getDay()});}
function dateAdd(b){if(!b.date)return e('date required');var d=new Date(b.date);if(b.days)d.setDate(d.getDate()+b.days);if(b.months)d.setMonth(d.getMonth()+b.months);if(b.years)d.setFullYear(d.getFullYear()+b.years);if(b.hours)d.setHours(d.getHours()+b.hours);return j({result:d.toISOString().split('T')[0],iso:d.toISOString(),dayOfWeek:d.toLocaleDateString('en',{weekday:'long'})});}
function dateParse(b){if(!b.text)return e('text required');var d=new Date(b.text);if(isNaN(d))return j({parsed:false,error:'Could not parse'});return j({parsed:true,iso:d.toISOString(),date:d.toISOString().split('T')[0],time:d.toTimeString().split(' ')[0],timestamp:Math.floor(d.getTime()/1000),dayOfWeek:d.toLocaleDateString('en',{weekday:'long'})});}
function unixNow(){var now=Date.now();return j({unix:Math.floor(now/1000),unixMs:now,iso:new Date(now).toISOString(),utc:new Date(now).toUTCString()});}
function isoWeek(b){if(!b.date)return e('date required');var d=new Date(b.date);var jan1=new Date(d.getFullYear(),0,1);var days=Math.floor((d-jan1)/86400000);var week=Math.ceil((days+jan1.getDay()+1)/7);return j({date:d.toISOString().split('T')[0],isoWeek:week,isoYear:d.getFullYear(),dayOfWeek:d.getDay(),dayName:d.toLocaleDateString('en',{weekday:'long'})});}

// Code gen
function jsonToGraphql(b){if(!b.data)return e('data required');var lines=['type Root {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'Int':'Float'):typeof v==='boolean'?'Boolean':Array.isArray(v)?'[String]':'JSON';lines.push('  '+k+': '+t);}lines.push('}');return j({graphql:lines.join('\n')});}
function jsonToSqlCreate(b){if(!b.data)return e('data required');var name=b.table||'my_table';var cols=[];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'VARCHAR(255)':typeof v==='number'?(Number.isInteger(v)?'INTEGER':'DECIMAL(10,2)'):typeof v==='boolean'?'BOOLEAN':'TEXT';cols.push('  '+k+' '+t);}return j({sql:'CREATE TABLE '+name+' (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+cols.join(',\n')+'\n);'});}
function jsonToSqlInsert(b){if(!b.data)return e('data required');var name=b.table||'my_table';var items=Array.isArray(b.data)?b.data:[b.data];var keys=Object.keys(items[0]);var values=items.map(function(item){return'('+keys.map(function(k){var v=item[k];return typeof v==='string'?"'"+v.replace(/'/g,"''")+"'":v===null?'NULL':v;}).join(', ')+')'});return j({sql:'INSERT INTO '+name+' ('+keys.join(', ')+') VALUES\n'+values.join(',\n')+';'});}
function apiMock(b){var{schema,count}=b;if(!schema)return e('schema required');var cnt=Math.min(count||3,20);var results=[];for(var i=0;i<cnt;i++){var item={};for(var k in schema){var type=schema[k];if(type==='id')item[k]=i+1;else if(type==='string')item[k]='sample_'+Math.random().toString(36).substr(2,6);else if(type==='number')item[k]=Math.floor(Math.random()*1000);else if(type==='boolean')item[k]=Math.random()>0.5;else if(type==='email')item[k]='user'+i+'@example.com';else if(type==='date')item[k]=new Date(Date.now()-Math.random()*3.15e10).toISOString().split('T')[0];else if(type==='uuid')item[k]=crypto.randomUUID();else item[k]=type;}results.push(item);}return j({data:results,count:cnt});}

// Network
function robotsGenerate(b){var{sitemap,disallow,allow,crawlDelay}=b;var lines=['User-agent: *'];if(allow)allow.forEach(function(p){lines.push('Allow: '+p);});if(disallow)disallow.forEach(function(p){lines.push('Disallow: '+p);});if(crawlDelay)lines.push('Crawl-delay: '+crawlDelay);if(sitemap)lines.push('\nSitemap: '+sitemap);return j({robotsTxt:lines.join('\n')});}
function sitemapGenerate(b){if(!b.urls||!Array.isArray(b.urls))return e('urls (array) required');var today=new Date().toISOString().split('T')[0];var xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';b.urls.forEach(function(u){var url=typeof u==='string'?u:u.url;var lastmod=(typeof u==='object'&&u.lastmod)||today;var priority=(typeof u==='object'&&u.priority)||'0.8';xml+='  <url>\n    <loc>'+url+'</loc>\n    <lastmod>'+lastmod+'</lastmod>\n    <priority>'+priority+'</priority>\n  </url>\n';});xml+='</urlset>';return j({xml:xml,urls:b.urls.length});}
function metaGenerate(b){var{title,description,url,image,type}=b;if(!title)return e('title required');var tags=[];tags.push('<title>'+title+'</title>');if(description)tags.push('<meta name="description" content="'+description+'">');tags.push('<meta property="og:title" content="'+title+'">');if(description)tags.push('<meta property="og:description" content="'+description+'">');if(url)tags.push('<meta property="og:url" content="'+url+'">');if(image)tags.push('<meta property="og:image" content="'+image+'">');tags.push('<meta property="og:type" content="'+(type||'website')+'">');tags.push('<meta name="twitter:card" content="summary_large_image">');tags.push('<meta name="twitter:title" content="'+title+'">');if(description)tags.push('<meta name="twitter:description" content="'+description+'">');return j({html:tags.join('\n'),tags:tags.length});}
async function corsTest(b){if(!b.url)return e('url required');try{var r=await fetch(b.url,{method:'OPTIONS',headers:{'Origin':'https://example.com','Access-Control-Request-Method':'POST'}});var acao=r.headers.get('access-control-allow-origin');var acam=r.headers.get('access-control-allow-methods');var acah=r.headers.get('access-control-allow-headers');return j({url:b.url,corsEnabled:!!acao,allowOrigin:acao,allowMethods:acam,allowHeaders:acah,status:r.status});}catch(err){return e('Failed: '+err.message);}}

// Math
function binaryCalc(b){if(!b.expression)return e('expression required');var expr=b.expression.replace(/0b/g,'');var parts=expr.match(/[01]+|[+\-*/]/g);if(!parts)return e('Invalid');var result=parseInt(parts[0],2);for(var i=1;i<parts.length;i+=2){var op=parts[i];var val=parseInt(parts[i+1],2);if(op==='+')result+=val;else if(op==='-')result-=val;else if(op==='*')result*=val;else if(op==='/')result=Math.floor(result/val);}return j({result:'0b'+result.toString(2),decimal:result,hex:'0x'+result.toString(16).toUpperCase()});}
function angleConvert(b){if(b.value===undefined)return e('value required');var from=b.from||'deg';var to=b.to||'rad';var deg;if(from==='deg')deg=b.value;else if(from==='rad')deg=b.value*180/Math.PI;else deg=b.value*0.9;var result;if(to==='deg')result=deg;else if(to==='rad')result=deg*Math.PI/180;else result=deg/0.9;return j({result:Math.round(result*1e6)/1e6,from:from,to:to,allUnits:{degrees:Math.round(deg*1e4)/1e4,radians:Math.round(deg*Math.PI/180*1e6)/1e6,gradians:Math.round(deg/0.9*1e4)/1e4}});}
function bmiCalc(b){if(!b.weight||!b.height)return e('weight (kg) and height (cm) required');var h=b.height/100;var bmi=b.weight/(h*h);var cat=bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese';return j({bmi:Math.round(bmi*10)/10,category:cat,weight:b.weight,height:b.height,idealWeight:{min:Math.round(18.5*h*h*10)/10,max:Math.round(24.9*h*h*10)/10}});}
function compoundInterest(b){var{principal,rate,years,compounds}=b;if(!principal||!rate||!years)return e('principal, rate (%), and years required');var n=compounds||12;var r=rate/100;var amount=principal*Math.pow(1+r/n,n*years);var interest=amount-principal;return j({finalAmount:Math.round(amount*100)/100,interestEarned:Math.round(interest*100)/100,principal:principal,rate:rate,years:years,compoundsPerYear:n});}

// Format
function numberToWords(b){if(b.number===undefined)return e('number required');var n=parseInt(b.number);if(n===0)return j({words:'zero'});var ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];var tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];function convert(num){if(num<20)return ones[num];if(num<100)return tens[Math.floor(num/10)]+(num%10?' '+ones[num%10]:'');if(num<1000)return ones[Math.floor(num/100)]+' hundred'+(num%100?' and '+convert(num%100):'');if(num<1000000)return convert(Math.floor(num/1000))+' thousand'+(num%1000?', '+convert(num%1000):'');if(num<1000000000)return convert(Math.floor(num/1000000))+' million'+(num%1000000?', '+convert(num%1000000):'');return convert(Math.floor(num/1000000000))+' billion'+(num%1000000000?', '+convert(num%1000000000):'');}return j({words:(n<0?'minus ':'')+convert(Math.abs(n)),number:n});}
function markdownToc(b){if(!b.markdown)return e('markdown required');var lines=b.markdown.split('\n');var toc=[];lines.forEach(function(l){var m=l.match(/^(#{1,6})\s+(.+)/);if(m){var level=m[1].length;var text=m[2];var slug=text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');toc.push({level:level,text:text,slug:slug,link:'- '.repeat(1)+'['+text+'](#'+slug+')'});}});var indent=toc.map(function(t){return '  '.repeat(t.level-1)+'- ['+t.text+'](#'+t.slug+')';}).join('\n');return j({toc:indent,headings:toc.length});}

// Utility
function uuidParse(b){if(!b.uuid)return e('uuid required');var u=b.uuid.replace(/-/g,'');if(u.length!==32)return e('Invalid UUID');var version=parseInt(u[12],16);var variant=parseInt(u[16],16);var variantName=variant>=8&&variant<=0xb?'RFC 4122':variant>=0xc?'Microsoft':'NCS';return j({uuid:b.uuid,version:version,variant:variantName,isNil:u==='0'.repeat(32)});}
function cronValidate(b){if(!b.cron)return e('cron required');var parts=b.cron.trim().split(/\s+/);var valid=parts.length===5||parts.length===6;var fields=['minute','hour','day of month','month','day of week'];var errors=[];if(parts.length<5)errors.push('Need at least 5 fields');return j({valid:valid&&errors.length===0,fields:parts.length,errors:errors,parsed:parts.length>=5?{minute:parts[0],hour:parts[1],dayOfMonth:parts[2],month:parts[3],dayOfWeek:parts[4]}:null});}
function phoneFormat(b){if(!b.phone)return e('phone required');var clean=b.phone.replace(/[^0-9+]/g,'');var country=b.country||'US';var formats={US:function(p){p=p.replace(/^\+?1/,'');return'+1 ('+p.substr(0,3)+') '+p.substr(3,3)+'-'+p.substr(6);},KR:function(p){p=p.replace(/^\+?82/,'0');return'+82 '+p.substr(1,2)+'-'+p.substr(3,4)+'-'+p.substr(7);},JP:function(p){p=p.replace(/^\+?81/,'0');return'+81 '+p.substr(1,2)+'-'+p.substr(3,4)+'-'+p.substr(7);}};var fn=formats[country.toUpperCase()];return j({formatted:fn?fn(clean):clean,country:country.toUpperCase(),digits:clean.replace(/[^0-9]/g,'').length});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/calendar-month':return calendarMonth(body);
  case'/api/date-add':return dateAdd(body);
  case'/api/date-parse':return dateParse(body);
  case'/api/unix-now':return unixNow();
  case'/api/iso-week':return isoWeek(body);
  case'/api/json-to-graphql':return jsonToGraphql(body);
  case'/api/json-to-sql-create':return jsonToSqlCreate(body);
  case'/api/json-to-sql-insert':return jsonToSqlInsert(body);
  case'/api/api-mock':return apiMock(body);
  case'/api/robots-generate':return robotsGenerate(body);
  case'/api/sitemap-generate':return sitemapGenerate(body);
  case'/api/meta-generate':return metaGenerate(body);
  case'/api/cors-test':return corsTest(body);
  case'/api/binary-calc':return binaryCalc(body);
  case'/api/angle-convert':return angleConvert(body);
  case'/api/bmi-calc':return bmiCalc(body);
  case'/api/compound-interest':return compoundInterest(body);
  case'/api/number-to-words':return numberToWords(body);
  case'/api/markdown-toc':return markdownToc(body);
  case'/api/uuid-parse':return uuidParse(body);
  case'/api/cron-validate':return cronValidate(body);
  case'/api/phone-format':return phoneFormat(body);
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
