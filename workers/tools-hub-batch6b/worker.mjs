// tools-hub-batch6b: 30 endpoints (275→300+)
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function j(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...C}});}
function e(m,s=400){return j({error:m},s);}
async function gb(r){try{return await r.json();}catch{return{};}}

// Validation
function isbnValidate(b){var isbn=(b.isbn||'').replace(/[-\s]/g,'');if(isbn.length===10){var sum=0;for(var i=0;i<9;i++)sum+=parseInt(isbn[i])*(10-i);var check=isbn[9]==='X'?10:parseInt(isbn[9]);return j({isbn:isbn,valid:(sum+check)%11===0,version:10});}
if(isbn.length===13){var sum=0;for(var i=0;i<12;i++)sum+=parseInt(isbn[i])*(i%2===0?1:3);var check=(10-sum%10)%10;return j({isbn:isbn,valid:check===parseInt(isbn[12]),version:13});}
return e('ISBN must be 10 or 13 digits');}
function macValidate(b){var mac=(b.mac||'').replace(/[^0-9a-fA-F]/g,'');if(mac.length!==12)return j({valid:false,error:'Need 12 hex chars'});return j({valid:true,formatted:mac.match(/.{2}/g).join(':').toUpperCase(),isUnicast:(parseInt(mac[1],16)&1)===0});}
function ipv6Validate(b){if(!b.ip)return e('ip required');var ip=b.ip;var valid=/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip)||/^::$/.test(ip);var expanded=ip;if(ip.includes('::')){var parts=ip.split('::');var left=parts[0]?parts[0].split(':'):[];var right=parts[1]?parts[1].split(':'):[];var fill=8-left.length-right.length;expanded=[...left,...Array(fill).fill('0000'),...right].map(function(p){return p.padStart(4,'0');}).join(':');}return j({ip:ip,valid:valid,expanded:expanded,compressed:ip});}
function colorValidate(b){if(!b.color)return e('color required');var c=b.color;var isHex=/^#?[0-9a-fA-F]{3,8}$/.test(c);var isRgb=/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(c);var isHsl=/^hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/.test(c);return j({color:c,valid:isHex||isRgb||isHsl,format:isHex?'hex':isRgb?'rgb':isHsl?'hsl':'unknown'});}
function semverValidate(b){if(!b.version)return e('version required');var m=b.version.match(/^v?(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/);if(!m)return j({valid:false});return j({valid:true,major:parseInt(m[1]),minor:parseInt(m[2]),patch:parseInt(m[3]),prerelease:m[4]?m[4].substring(1):null,build:m[5]?m[5].substring(1):null});}

// Code Gen
function jsonToRust(b){if(!b.data)return e('data required');var name=b.name||'Root';var lines=['#[derive(Debug, Serialize, Deserialize)]','struct '+name+' {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'i64':'f64'):typeof v==='boolean'?'bool':Array.isArray(v)?'Vec<serde_json::Value>':'serde_json::Value';lines.push('    '+k+': '+t+',');}lines.push('}');return j({rust:lines.join('\n')});}
function jsonToSwift(b){if(!b.data)return e('data required');var name=b.name||'Root';var lines=['struct '+name+': Codable {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'Int':'Double'):typeof v==='boolean'?'Bool':'Any';lines.push('    var '+k+': '+t);}lines.push('}');return j({swift:lines.join('\n')});}
function jsonToKotlin(b){if(!b.data)return e('data required');var name=b.name||'Root';var fields=[];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'Int':'Double'):typeof v==='boolean'?'Boolean':'Any';fields.push('    val '+k+': '+t);}return j({kotlin:'data class '+name+'(\n'+fields.join(',\n')+'\n)'});}
function jsonToJava(b){if(!b.data)return e('data required');var name=b.name||'Root';var lines=['public class '+name+' {'];for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'int':'double'):typeof v==='boolean'?'boolean':'Object';lines.push('    private '+t+' '+k+';');}lines.push('');for(var k in b.data){var cap=k.charAt(0).toUpperCase()+k.slice(1);var v=b.data[k];var t=typeof v==='string'?'String':typeof v==='number'?(Number.isInteger(v)?'int':'double'):typeof v==='boolean'?'boolean':'Object';lines.push('    public '+t+' get'+cap+'() { return this.'+k+'; }');lines.push('    public void set'+cap+'('+t+' '+k+') { this.'+k+' = '+k+'; }');}lines.push('}');return j({java:lines.join('\n')});}
function jsonToCsharp(b){if(!b.data)return e('data required');var name=b.name||'Root';var lines=['public class '+name,'{']; for(var k in b.data){var v=b.data[k];var t=typeof v==='string'?'string':typeof v==='number'?(Number.isInteger(v)?'int':'double'):typeof v==='boolean'?'bool':'object';var cap=k.charAt(0).toUpperCase()+k.slice(1);lines.push('    public '+t+' '+cap+' { get; set; }');}lines.push('}');return j({csharp:lines.join('\n')});}

// Math
function romanNumeral(b){if(b.number!==undefined){var n=parseInt(b.number);if(n<1||n>3999)return e('Number must be 1-3999');var vals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];var r='';vals.forEach(function(v){while(n>=v[0]){r+=v[1];n-=v[0];}});return j({roman:r,number:parseInt(b.number)});}
if(b.roman){var rom=b.roman.toUpperCase();var map={M:1000,D:500,C:100,L:50,X:10,V:5,I:1};var total=0;for(var i=0;i<rom.length;i++){var cur=map[rom[i]]||0;var next=map[rom[i+1]]||0;if(cur<next)total-=cur;else total+=cur;}return j({number:total,roman:rom});}return e('number or roman required');}
function hexCalc(b){if(!b.expression)return e('expression required (e.g. "FF + 1A")');var expr=b.expression.replace(/0x/gi,'');var parts=expr.match(/[0-9a-fA-F]+|[+\-*/]/g);if(!parts)return e('Invalid expression');var result=parseInt(parts[0],16);for(var i=1;i<parts.length;i+=2){var op=parts[i];var val=parseInt(parts[i+1],16);if(op==='+')result+=val;else if(op==='-')result-=val;else if(op==='*')result*=val;else if(op==='/')result=Math.floor(result/val);}return j({result:'0x'+result.toString(16).toUpperCase(),decimal:result});}
function ratioSimplify(b){if(b.numerator===undefined||b.denominator===undefined)return e('numerator and denominator required');var a=Math.abs(b.numerator),b2=Math.abs(b.denominator);function gcd(x,y){return y===0?x:gcd(y,x%y);}var g=gcd(a,b2);return j({numerator:b.numerator/g,denominator:b.denominator/g,original:b.numerator+'/'+b.denominator,simplified:(b.numerator/g)+'/'+(b.denominator/g),decimal:Math.round(b.numerator/b.denominator*1e6)/1e6});}
function permutation(b){if(b.n===undefined||b.r===undefined)return e('n and r required');var n=parseInt(b.n),r=parseInt(b.r);if(r>n)return e('r cannot be greater than n');function fact(x){var r2=1;for(var i=2;i<=x;i++)r2*=i;return r2;}return j({nPr:fact(n)/fact(n-r),n:n,r:r});}
function combination(b){if(b.n===undefined||b.r===undefined)return e('n and r required');var n=parseInt(b.n),r=parseInt(b.r);if(r>n)return e('r cannot be greater than n');function fact(x){var r2=1;for(var i=2;i<=x;i++)r2*=i;return r2;}return j({nCr:fact(n)/(fact(r)*fact(n-r)),n:n,r:r});}

// Network
function portInfo(b){var port=parseInt(b.port);if(!port)return e('port required');var ports={20:'FTP Data',21:'FTP Control',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',67:'DHCP Server',68:'DHCP Client',80:'HTTP',110:'POP3',119:'NNTP',123:'NTP',143:'IMAP',161:'SNMP',194:'IRC',443:'HTTPS',465:'SMTPS',514:'Syslog',587:'SMTP Submission',993:'IMAPS',995:'POP3S',1080:'SOCKS',1433:'MSSQL',1521:'Oracle',2049:'NFS',3306:'MySQL',3389:'RDP',5432:'PostgreSQL',5672:'RabbitMQ',6379:'Redis',8080:'HTTP Alt',8443:'HTTPS Alt',9200:'Elasticsearch',27017:'MongoDB'};return j({port:port,service:ports[port]||'Unknown',isWellKnown:port<1024,isRegistered:port>=1024&&port<49152,isDynamic:port>=49152});}
function subnetList(b){if(!b.cidr)return e('cidr required');var m=b.cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);if(!m)return e('Invalid CIDR');var ip=m[1].split('.').map(Number);var prefix=parseInt(m[2]);var newPrefix=Math.min(prefix+2,30);var count=Math.pow(2,newPrefix-prefix);var subnets=[];var ipNum=(ip[0]<<24|ip[1]<<16|ip[2]<<8|ip[3])>>>0;var mask=(~0<<(32-prefix))>>>0;var net=(ipNum&mask)>>>0;var step=Math.pow(2,32-newPrefix);for(var i=0;i<Math.min(count,16);i++){var sn=(net+i*step)>>>0;subnets.push([(sn>>>24)&255,(sn>>>16)&255,(sn>>>8)&255,sn&255].join('.')+'/'+newPrefix);}return j({subnets:subnets,count:subnets.length,originalCidr:b.cidr,subnetSize:'/'+newPrefix});}

// Time
function timeZones(b){var zones=['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Shanghai','Asia/Tokyo','Asia/Seoul','Australia/Sydney','Pacific/Auckland','Africa/Cairo','Africa/Lagos'];var now=new Date();var result=zones.map(function(tz){try{return{timezone:tz,time:now.toLocaleString('en-US',{timeZone:tz,hour12:false}),offset:now.toLocaleString('en-US',{timeZone:tz,timeZoneName:'short'}).split(' ').pop()};}catch(e2){return{timezone:tz,error:'Invalid'};}});return j({timezones:result,count:result.length});}
function timeDiff(b){if(!b.time1||!b.time2)return e('time1 and time2 required');var t1=new Date(b.time1),t2=new Date(b.time2);var diff=Math.abs(t2-t1);var days=Math.floor(diff/86400000);var hours=Math.floor(diff%86400000/3600000);var mins=Math.floor(diff%3600000/60000);var secs=Math.floor(diff%60000/1000);return j({difference:{days:days,hours:hours,minutes:mins,seconds:secs},totalMs:diff,formatted:days+'d '+hours+'h '+mins+'m '+secs+'s',earlier:t1<t2?b.time1:b.time2});}
function relativeTime(b){if(!b.timestamp&&!b.date)return e('timestamp or date required');var d=b.timestamp?new Date(parseInt(b.timestamp)*1000):new Date(b.date);var diff=Date.now()-d.getTime();var abs=Math.abs(diff);var ago=diff>0;var units=[[31536000000,'year'],[2592000000,'month'],[604800000,'week'],[86400000,'day'],[3600000,'hour'],[60000,'minute'],[1000,'second']];for(var i=0;i<units.length;i++){var count=Math.floor(abs/units[i][0]);if(count>=1)return j({relative:count+' '+units[i][1]+(count>1?'s':'')+' '+(ago?'ago':'from now'),value:count,unit:units[i][1]});}return j({relative:'just now'});}
function workHours(b){if(!b.start||!b.end)return e('start and end required');var s=new Date(b.start),en=new Date(b.end);var startH=b.startHour||9,endH=b.endHour||17;var hours=0;var cur=new Date(s);while(cur<en){var dow=cur.getDay();if(dow!==0&&dow!==6){var h=cur.getHours();if(h>=startH&&h<endH)hours++;}cur.setHours(cur.getHours()+1);}return j({workHours:hours,startDate:b.start,endDate:b.end,workDay:startH+':00-'+endH+':00'});}

// Generator
function excerpt(b){if(!b.text)return e('text required');var len=b.length||150;var text=b.text.replace(/\s+/g,' ').trim();if(text.length<=len)return j({excerpt:text,truncated:false});var cut=text.substring(0,len);var lastSpace=cut.lastIndexOf(' ');if(lastSpace>len*0.5)cut=cut.substring(0,lastSpace);return j({excerpt:cut+'...',truncated:true,originalLength:text.length});}
function hashtagGenerate(b){if(!b.text)return e('text required');var stops=new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','to','of','in','for','on','with','at','by','from','as','and','or','but','not','if','it','this','that']);var words=b.text.toLowerCase().match(/[a-z]{3,}/g)||[];var freq={};words.forEach(function(w){if(!stops.has(w))freq[w]=(freq[w]||0)+1;});var sorted=Object.entries(freq).sort(function(a,b2){return b2[1]-a[1];}).slice(0,b.count||10);return j({hashtags:sorted.map(function(x){return'#'+x[0];}),words:sorted.map(function(x){return{word:x[0],count:x[1]};})});}
function usernameGenerate(b){var count=Math.min(b.count||5,20);var adjs=['cool','fast','smart','dark','wild','epic','mega','neo','cyber','pixel','quantum','turbo','ultra','hyper'];var nouns=['wolf','hawk','fox','bear','lion','tiger','ninja','wizard','coder','hacker','pilot','rider','sage','knight'];var results=[];for(var i=0;i<count;i++){var a=adjs[Math.floor(Math.random()*adjs.length)];var n=nouns[Math.floor(Math.random()*nouns.length)];var num=Math.floor(Math.random()*999);results.push(a+n+num);}return j({usernames:results});}
function avatarSvg(b){var text=(b.text||'?').substring(0,2).toUpperCase();var size=b.size||100;var bg=b.color||'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'"><rect width="'+size+'" height="'+size+'" rx="'+(size/5)+'" fill="'+bg+'"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="'+(size*0.4)+'" fill="white" font-weight="bold">'+text+'</text></svg>';return new Response(svg,{headers:{'Content-Type':'image/svg+xml',...C}});}

const __ttduInner = {async fetch(request){
if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
var url=new URL(request.url);var p=url.pathname;
var body=request.method==='POST'?await gb(request):{};
switch(p){
  case'/api/isbn-validate':return isbnValidate(body);
  case'/api/mac-validate':return macValidate(body);
  case'/api/ipv6-validate':return ipv6Validate(body);
  case'/api/color-validate':return colorValidate(body);
  case'/api/semver-validate':return semverValidate(body);
  case'/api/json-to-rust':return jsonToRust(body);
  case'/api/json-to-swift':return jsonToSwift(body);
  case'/api/json-to-kotlin':return jsonToKotlin(body);
  case'/api/json-to-java':return jsonToJava(body);
  case'/api/json-to-csharp':return jsonToCsharp(body);
  case'/api/roman-numeral':return romanNumeral(body);
  case'/api/hex-calc':return hexCalc(body);
  case'/api/ratio-simplify':return ratioSimplify(body);
  case'/api/permutation':return permutation(body);
  case'/api/combination':return combination(body);
  case'/api/port-info':return portInfo(body);
  case'/api/subnet-list':return subnetList(body);
  case'/api/time-zones':return timeZones(body);
  case'/api/time-diff':return timeDiff(body);
  case'/api/relative-time':return relativeTime(body);
  case'/api/work-hours':return workHours(body);
  case'/api/excerpt':return excerpt(body);
  case'/api/hashtag-generate':return hashtagGenerate(body);
  case'/api/username-generate':return usernameGenerate(body);
  case'/api/avatar-svg':return avatarSvg(body);
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
