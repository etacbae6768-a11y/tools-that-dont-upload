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
// tools-hub-batch3: 30 new API endpoints (120→150)
const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type' };
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json',...CORS}});}
function err(m,s=400){return json({error:m},s);}
async function gb(r){try{return await r.json();}catch{return {};}}

// TEXT
function stringEscape(b){
  const{text,mode='js'}=b;if(!text)return err('text required');
  const modes={
    js:t=>t.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t'),
    json:t=>JSON.stringify(t).slice(1,-1),
    html:t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
    url:t=>encodeURIComponent(t),
    regex:t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),
    unescape_js:t=>t.replace(/\\n/g,'\n').replace(/\\r/g,'\r').replace(/\\t/g,'\t').replace(/\\"/g,'"').replace(/\\'/g,"'").replace(/\\\\/g,'\\'),
    unescape_url:t=>decodeURIComponent(t),
  };
  if(!modes[mode])return err('mode: '+Object.keys(modes).join(', '));
  return json({result:modes[mode](text)});
}
function textDiffWords(b){
  const{text1,text2}=b;if(!text1||!text2)return err('text1 and text2 required');
  const w1=text1.split(/\s+/),w2=text2.split(/\s+/);
  const added=w2.filter(w=>!w1.includes(w));
  const removed=w1.filter(w=>!w2.includes(w));
  const common=w1.filter(w=>w2.includes(w));
  return json({added,removed,common,addedCount:added.length,removedCount:removed.length,commonCount:common.length});
}
function textSimilarity(b){
  const{text1,text2}=b;if(!text1||!text2)return err('text1 and text2 required');
  const s1=new Set(text1.toLowerCase().split(/\s+/)),s2=new Set(text2.toLowerCase().split(/\s+/));
  const intersection=new Set([...s1].filter(x=>s2.has(x)));
  const union=new Set([...s1,...s2]);
  const jaccard=union.size?intersection.size/union.size:0;
  const dice=s1.size+s2.size?2*intersection.size/(s1.size+s2.size):0;
  return json({jaccard:Math.round(jaccard*1000)/1000,dice:Math.round(dice*1000)/1000,commonWords:[...intersection].slice(0,20),text1Words:s1.size,text2Words:s2.size});
}
function punycode(b){
  const{text,mode='encode'}=b;if(!text)return err('text required');
  try{
    if(mode==='encode'){const u=new URL('http://'+text);return json({result:u.hostname,original:text});}
    else{return json({result:text.replace(/xn--[a-z0-9]+/g,m=>{try{return new URL('http://'+m).hostname;}catch{return m;}}),original:text});}
  }catch(e){return err('Invalid domain: '+e.message);}
}
function natoPhonetic(b){
  const{text}=b;if(!text)return err('text required');
  const nato={A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliet',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'Xray',Y:'Yankee',Z:'Zulu','0':'Zero','1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine'};
  const result=text.toUpperCase().split('').map(c=>nato[c]||c).join(' ');
  return json({result,original:text});
}

// ANALYSIS
function mathEval(b){
  const{expression}=b;if(!expression)return err('expression required');
  const safe=expression.replace(/[^0-9+\-*/().%^\s.]/g,'');
  if(safe!==expression.replace(/\s/g,''))return err('Only numbers and +,-,*,/,(),^,% allowed');
  try{
    const tokens=safe.match(/\d+\.?\d*|[+\-*/()^%]/g);
    if(!tokens)return err('Empty expression');
    let pos=0;
    function parseExpr(){let l=parseTerm();while(pos<tokens.length&&(tokens[pos]==='+'||tokens[pos]==='-')){const op=tokens[pos++];const r=parseTerm();l=op==='+'?l+r:l-r;}return l;}
    function parseTerm(){let l=parsePow();while(pos<tokens.length&&(tokens[pos]==='*'||tokens[pos]==='/'||tokens[pos]==='%')){const op=tokens[pos++];const r=parsePow();if(op==='*')l*=r;else if(op==='/')l=r===0?Infinity:l/r;else l%=r;}return l;}
    function parsePow(){let l=parseAtom();while(pos<tokens.length&&tokens[pos]==='^'){pos++;const r=parseAtom();l=Math.pow(l,r);}return l;}
    function parseAtom(){if(tokens[pos]==='('){pos++;const v=parseExpr();pos++;return v;}if(tokens[pos]==='-'){pos++;return -parseAtom();}return parseFloat(tokens[pos++]);}
    const result=parseExpr();
    if(!isFinite(result))return err('Result is not finite');
    return json({result,expression:safe});
  }catch(e){return err('Invalid expression: '+e.message);}
}
function percentage(b){
  const{mode='of',value,total,oldValue,newValue}=b;
  if(mode==='of'){if(value===undefined||total===undefined)return err('value and total required');return json({result:Math.round(value/total*10000)/100,description:`${value} is ${Math.round(value/total*10000)/100}% of ${total}`});}
  if(mode==='change'){if(oldValue===undefined||newValue===undefined)return err('oldValue and newValue required');const ch=((newValue-oldValue)/oldValue)*100;return json({result:Math.round(ch*100)/100,direction:ch>0?'increase':'decrease',description:`${Math.round(Math.abs(ch)*100)/100}% ${ch>0?'increase':'decrease'}`});}
  if(mode==='add'){if(value===undefined||!b.percent)return err('value and percent required');const r=value*(1+b.percent/100);return json({result:Math.round(r*100)/100});}
  return err('mode: of, change, or add');
}
function numberFormat(b){
  const{number,locale='en-US',style='decimal',currency:cur='USD',notation,minimumFractionDigits,maximumFractionDigits}=b;
  if(number===undefined)return err('number required');
  const opts={style};
  if(style==='currency')opts.currency=cur;
  if(notation)opts.notation=notation;
  if(minimumFractionDigits!==undefined)opts.minimumFractionDigits=minimumFractionDigits;
  if(maximumFractionDigits!==undefined)opts.maximumFractionDigits=maximumFractionDigits;
  try{return json({result:new Intl.NumberFormat(locale,opts).format(number),number,locale});}
  catch(e){return err(e.message);}
}
function statistics(b){
  const{numbers}=b;if(!Array.isArray(numbers)||numbers.length<1)return err('numbers (array) required');
  const n=numbers.map(Number).filter(x=>!isNaN(x)).sort((a,b2)=>a-b2);
  const len=n.length,sum=n.reduce((a,b2)=>a+b2,0),mean=sum/len;
  const median=len%2?n[Math.floor(len/2)]:(n[len/2-1]+n[len/2])/2;
  const freq={};n.forEach(x=>freq[x]=(freq[x]||0)+1);
  const maxFreq=Math.max(...Object.values(freq));
  const mode=Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number);
  const variance=n.reduce((s,x)=>s+Math.pow(x-mean,2),0)/len;
  const stddev=Math.sqrt(variance);
  const q1=n[Math.floor(len*0.25)],q3=n[Math.floor(len*0.75)];
  return json({count:len,sum:Math.round(sum*1e6)/1e6,mean:Math.round(mean*1e6)/1e6,median,mode,min:n[0],max:n[len-1],range:n[len-1]-n[0],variance:Math.round(variance*1e6)/1e6,stddev:Math.round(stddev*1e6)/1e6,q1,q3,iqr:q3-q1});
}
function matrixCalc(b){
  const{matrix,operation='transpose',matrix2}=b;
  if(!matrix)return err('matrix (2D array) required');
  if(operation==='transpose'){const r=matrix[0].map((_,i)=>matrix.map(row=>row[i]));return json({result:r});}
  if(operation==='multiply'){
    if(!matrix2)return err('matrix2 required for multiply');
    if(matrix[0].length!==matrix2.length)return err('Matrix dimensions incompatible');
    const r=matrix.map(row=>matrix2[0].map((_,j)=>row.reduce((s,v,k)=>s+v*matrix2[k][j],0)));
    return json({result:r});
  }
  if(operation==='determinant'){
    if(matrix.length!==matrix[0].length)return err('Square matrix required');
    function det(m){if(m.length===1)return m[0][0];if(m.length===2)return m[0][0]*m[1][1]-m[0][1]*m[1][0];return m[0].reduce((s,v,j)=>s+v*Math.pow(-1,j)*det(m.slice(1).map(r=>[...r.slice(0,j),...r.slice(j+1)])),0);}
    return json({result:det(matrix)});
  }
  return err('operation: transpose, multiply, or determinant');
}

// WEB
async function lighthouseScore(b){
  const{url}=b;if(!url)return err('url required');
  try{
    const start=Date.now();const r=await fetch(url,{headers:{'User-Agent':'ToolsHubBot/1.0'}});
    const ttfb=Date.now()-start;const html=await r.text();const size=html.length;
    const hasViewport=html.includes('viewport');const hasCharset=html.includes('charset');
    const hasTitle=/<title>/i.test(html);const hasDescription=/meta.*description/i.test(html);
    const hasH1=/<h1/i.test(html);const imgCount=(html.match(/<img/gi)||[]).length;
    const scriptCount=(html.match(/<script/gi)||[]).length;
    const cssLinks=(html.match(/<link[^>]*stylesheet/gi)||[]).length;
    const score=Math.min(100,Math.max(0,100-Math.floor(ttfb/50)-(size>500000?20:size>100000?10:0)+(hasViewport?5:0)+(hasTitle?5:0)+(hasDescription?5:0)+(hasH1?5:0)));
    return json({url,ttfb,htmlSize:size,score,checks:{viewport:hasViewport,charset:hasCharset,title:hasTitle,metaDescription:hasDescription,h1Tag:hasH1},assets:{images:imgCount,scripts:scriptCount,cssLinks},status:r.status,headers:Object.fromEntries([...r.headers].slice(0,10))});
  }catch(e){return err('Failed: '+e.message);}
}
async function favicon(b){
  const{url}=b;if(!url)return err('url required');
  try{
    const r=await fetch(url,{headers:{'User-Agent':'ToolsHubBot/1.0'}});const html=await r.text();
    const iconMatch=html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)||html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    const u=new URL(url);const faviconUrl=iconMatch?new URL(iconMatch[1],url).href:`${u.protocol}//${u.hostname}/favicon.ico`;
    return json({url,faviconUrl,source:iconMatch?'html':'default'});
  }catch(e){return err('Failed: '+e.message);}
}
async function techDetect(b){
  const{url}=b;if(!url)return err('url required');
  try{
    const r=await fetch(url,{headers:{'User-Agent':'ToolsHubBot/1.0'}});const html=await r.text();
    const techs=[];const h=Object.fromEntries([...r.headers]);
    if(h.server)techs.push({name:h.server,category:'Server'});
    if(h['x-powered-by'])techs.push({name:h['x-powered-by'],category:'Framework'});
    if(html.includes('wp-content'))techs.push({name:'WordPress',category:'CMS'});
    if(html.includes('shopify'))techs.push({name:'Shopify',category:'E-commerce'});
    if(html.includes('react'))techs.push({name:'React',category:'JS Framework'});
    if(html.includes('vue'))techs.push({name:'Vue.js',category:'JS Framework'});
    if(html.includes('angular'))techs.push({name:'Angular',category:'JS Framework'});
    if(html.includes('next'))techs.push({name:'Next.js',category:'Framework'});
    if(html.includes('tailwind'))techs.push({name:'Tailwind CSS',category:'CSS'});
    if(html.includes('bootstrap'))techs.push({name:'Bootstrap',category:'CSS'});
    if(html.includes('jquery'))techs.push({name:'jQuery',category:'JS Library'});
    if(html.includes('gtag')||html.includes('google-analytics'))techs.push({name:'Google Analytics',category:'Analytics'});
    if(html.includes('cloudflare'))techs.push({name:'Cloudflare',category:'CDN'});
    if(h['cf-ray'])techs.push({name:'Cloudflare CDN',category:'CDN'});
    return json({url,technologies:techs,count:techs.length});
  }catch(e){return err('Failed: '+e.message);}
}
async function canonicalUrl(b){
  const{url}=b;if(!url)return err('url required');
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'User-Agent':'ToolsHubBot/1.0'}});
    const html=await r.text();
    const canonical=html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    return json({originalUrl:url,finalUrl:r.url,canonical:canonical||r.url,redirected:r.redirected,redirectCount:r.redirected?1:0});
  }catch(e){return err('Failed: '+e.message);}
}
async function domainAge(b){
  const{domain}=b;if(!domain)return err('domain required');
  try{
    const tld=domain.split('.').pop();
    const rdapUrl=tld==='com'||tld==='net'?`https://rdap.verisign.com/${tld}/v1/domain/${domain}`:`https://rdap.org/domain/${domain}`;
    const r=await fetch(rdapUrl);if(!r.ok)return err('Domain not found');
    const d=await r.json();
    const regDate=d.events?.find(e=>e.eventAction==='registration')?.eventDate;
    const expDate=d.events?.find(e=>e.eventAction==='expiration')?.eventDate;
    const ageDays=regDate?Math.floor((Date.now()-new Date(regDate).getTime())/86400000):null;
    return json({domain,registeredDate:regDate||null,expirationDate:expDate||null,ageDays,ageYears:ageDays?Math.round(ageDays/365*10)/10:null});
  }catch(e){return err('Failed: '+e.message);}
}

// DATA
function csvToExcel(b){
  const{csv,sheetName='Sheet1'}=b;if(!csv)return err('csv required');
  const rows=csv.split('\n').map(r=>r.split(','));
  let xml='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="'+sheetName+'"><Table>';
  for(const row of rows){xml+='<Row>';for(const cell of row){const v=cell.trim().replace(/"/g,'');xml+='<Cell><Data ss:Type="'+(isNaN(v)?'String':'Number')+'">'+v+'</Data></Cell>';}xml+='</Row>';}
  xml+='</Table></Worksheet></Workbook>';
  return json({xml,rows:rows.length,columns:rows[0]?.length||0});
}
function jsonToTable(b){
  const{data}=b;if(!Array.isArray(data)||data.length<1)return err('data (array of objects) required');
  const keys=Object.keys(data[0]);
  let html='<table><thead><tr>'+keys.map(k=>`<th>${k}</th>`).join('')+'</tr></thead><tbody>';
  for(const row of data){html+='<tr>'+keys.map(k=>`<td>${row[k]??''}</td>`).join('')+'</tr>';}
  html+='</tbody></table>';
  return json({html,rows:data.length,columns:keys.length});
}
function jsonSortKeys(b){
  const{data}=b;if(!data||typeof data!=='object')return err('data (object) required');
  function sortObj(o){if(Array.isArray(o))return o.map(sortObj);if(o&&typeof o==='object'){const s={};Object.keys(o).sort().forEach(k=>{s[k]=sortObj(o[k]);});return s;}return o;}
  return json({result:sortObj(data)});
}
function jsonMinify(b){
  const{json:j}=b;if(!j)return err('json required');
  try{const p=typeof j==='string'?JSON.parse(j):j;const m=JSON.stringify(p);return json({result:m,originalSize:typeof j==='string'?j.length:JSON.stringify(j,null,2).length,minifiedSize:m.length});}
  catch(e){return err('Invalid JSON: '+e.message);}
}
function baseConvert(b){
  const{value,from=10,to=16}=b;if(value===undefined)return err('value required');
  try{const num=parseInt(String(value),from);if(isNaN(num))return err('Invalid value for base '+from);
  return json({result:num.toString(to).toUpperCase(),decimal:num,binary:num.toString(2),octal:num.toString(8),hex:num.toString(16).toUpperCase(),base36:num.toString(36)});}
  catch(e){return err(e.message);}
}

// CODE
function cronDescribe(b){
  const{cron}=b;if(!cron)return err('cron expression required');
  const p=cron.trim().split(/\s+/);if(p.length<5)return err('Need 5 fields');
  const[min,hr,dom,mon,dow]=p;
  const parts=[];
  if(min==='0'&&hr==='*')parts.push('Every hour at minute 0');
  else if(min==='*'&&hr==='*')parts.push('Every minute');
  else if(min!=='*'&&hr!=='*')parts.push(`At ${hr.padStart(2,'0')}:${min.padStart(2,'0')}`);
  else if(min!=='*')parts.push(`At minute ${min}`);
  else parts.push(`Every minute of hour ${hr}`);
  const dows=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  if(dow!=='*'){const ds=dow.split(',').map(d=>d.includes('-')?`${dows[d.split('-')[0]]}-${dows[d.split('-')[1]]}`:dows[d]||d);parts.push('on '+ds.join(', '));}
  if(dom!=='*')parts.push('on day '+dom);
  const mons=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(mon!=='*')parts.push('in '+mon.split(',').map(m=>mons[m]||m).join(', '));
  return json({cron,description:parts.join(' '),fields:{minute:min,hour:hr,dayOfMonth:dom,month:mon,dayOfWeek:dow}});
}
function jwtCreate(b){
  const{payload={},header={}}=b;
  const h={alg:'none',typ:'JWT',...header};
  const toB64=o=>btoa(JSON.stringify(o)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const token=toB64(h)+'.'+toB64(payload)+'.';
  return json({token,header:h,payload,note:'Unsigned JWT - for testing only'});
}
function jsonToGo(b){
  const{data,name='Root'}=b;if(!data)return err('data required');
  function toGo(obj,n){
    let lines=[`type ${n} struct {`];
    for(const[k,v] of Object.entries(obj)){
      const fn=k.charAt(0).toUpperCase()+k.slice(1);
      let t='interface{}';
      if(typeof v==='string')t='string';else if(typeof v==='number')t=Number.isInteger(v)?'int':'float64';
      else if(typeof v==='boolean')t='bool';else if(Array.isArray(v))t=v.length>0?'[]'+typeof v[0]:'[]interface{}';
      else if(v&&typeof v==='object'){t=fn;toGo(v,fn);}
      lines.push(`  ${fn} ${t} \`json:"${k}"\``);
    }
    lines.push('}');return lines.join('\n');
  }
  return json({go:toGo(data,name)});
}
function jsonToPython(b){
  const{data,name='Root'}=b;if(!data)return err('data required');
  let lines=['from dataclasses import dataclass','from typing import Optional, List','',`@dataclass`,`class ${name}:`];
  for(const[k,v] of Object.entries(data)){
    let t='str';if(typeof v==='number')t=Number.isInteger(v)?'int':'float';
    else if(typeof v==='boolean')t='bool';else if(v===null)t='Optional[str]';
    else if(Array.isArray(v))t=`List[${v.length?typeof v[0]:'str'}]`;
    lines.push(`    ${k}: ${t}`);
  }
  return json({python:lines.join('\n')});
}
function httpMethodInfo(b){
  const{method}=b;if(!method)return err('method required');
  const info={GET:{safe:true,idempotent:true,cacheable:true,body:'No',description:'Retrieve a resource'},POST:{safe:false,idempotent:false,cacheable:false,body:'Yes',description:'Create a resource or trigger action'},PUT:{safe:false,idempotent:true,cacheable:false,body:'Yes',description:'Replace a resource entirely'},PATCH:{safe:false,idempotent:false,cacheable:false,body:'Yes',description:'Partially update a resource'},DELETE:{safe:false,idempotent:true,cacheable:false,body:'May',description:'Remove a resource'},HEAD:{safe:true,idempotent:true,cacheable:true,body:'No',description:'Like GET but headers only'},OPTIONS:{safe:true,idempotent:true,cacheable:false,body:'No',description:'Describe communication options'}};
  const m=method.toUpperCase();const i=info[m];if(!i)return err('Unknown method. Known: '+Object.keys(info).join(', '));
  return json({method:m,...i});
}

// SECURITY
function passwordStrength(b){
  const{password}=b;if(!password)return err('password required');
  let score=0;const len=password.length;
  if(len>=8)score+=1;if(len>=12)score+=1;if(len>=16)score+=1;
  if(/[a-z]/.test(password)&&/[A-Z]/.test(password))score+=1;
  if(/\d/.test(password))score+=1;if(/[^a-zA-Z0-9]/.test(password))score+=1;
  if(!/(.)(\1{2,})/.test(password))score+=1;
  const charsetSize=(/[a-z]/.test(password)?26:0)+(/[A-Z]/.test(password)?26:0)+(/\d/.test(password)?10:0)+(/[^a-zA-Z0-9]/.test(password)?32:0);
  const entropy=Math.round(len*Math.log2(charsetSize||1)*10)/10;
  const levels=['Very Weak','Weak','Fair','Good','Strong','Very Strong'];
  return json({score:Math.min(score,5),maxScore:5,level:levels[Math.min(score,5)],length:len,entropy,hasLower:/[a-z]/.test(password),hasUpper:/[A-Z]/.test(password),hasDigit:/\d/.test(password),hasSpecial:/[^a-zA-Z0-9]/.test(password),hasRepeat:/(.)(\1{2,})/.test(password)});
}
function hashIdentify(b){
  const{hash}=b;if(!hash)return err('hash required');
  const candidates=[];const h=hash.trim();const len=h.length;
  if(len===32&&/^[a-f0-9]+$/i.test(h))candidates.push('MD5');
  if(len===40&&/^[a-f0-9]+$/i.test(h))candidates.push('SHA-1');
  if(len===64&&/^[a-f0-9]+$/i.test(h))candidates.push('SHA-256');
  if(len===96&&/^[a-f0-9]+$/i.test(h))candidates.push('SHA-384');
  if(len===128&&/^[a-f0-9]+$/i.test(h))candidates.push('SHA-512');
  if(h.startsWith('$2'))candidates.push('bcrypt');
  if(h.startsWith('$5$'))candidates.push('SHA-256 crypt');
  if(h.startsWith('$6$'))candidates.push('SHA-512 crypt');
  if(h.startsWith('$argon2'))candidates.push('Argon2');
  if(h.startsWith('pbkdf2'))candidates.push('PBKDF2');
  if(candidates.length===0)candidates.push('Unknown');
  return json({hash:h.substring(0,20)+'...',length:len,candidates,mostLikely:candidates[0]});
}
function dataMasking(b){
  const{text,type='auto'}=b;if(!text)return err('text required');
  let result=text;
  if(type==='email'||type==='auto')result=result.replace(/([a-zA-Z0-9._+-]+)@([a-zA-Z0-9.-]+)/g,(m,u,d)=>u[0]+'***@'+d);
  if(type==='phone'||type==='auto')result=result.replace(/(\d{2,4})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g,'$1-****-$3');
  if(type==='card'||type==='auto')result=result.replace(/(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})/g,'$1-****-****-$4');
  if(type==='ssn'||type==='auto')result=result.replace(/(\d{3})[-.\s]?(\d{2})[-.\s]?(\d{4})/g,'***-**-$3');
  return json({result,type,masked:result!==text});
}

// UTILITY
function timezoneConvert(b){
  const{time,from='UTC',to='Asia/Seoul'}=b;
  if(!time)return err('time required (ISO format)');
  try{
    const d=new Date(time);if(isNaN(d))return err('Invalid date');
    const fromTime=d.toLocaleString('en-US',{timeZone:from,hour12:false});
    const toTime=d.toLocaleString('en-US',{timeZone:to,hour12:false});
    return json({from:{timezone:from,time:fromTime},to:{timezone:to,time:toTime},utc:d.toISOString()});
  }catch(e){return err(e.message);}
}
function countryInfo(b){
  const{code}=b;if(!code)return err('code (ISO 3166-1 alpha-2) required');
  const countries={US:{name:'United States',capital:'Washington D.C.',currency:'USD',phone:'+1',continent:'North America'},GB:{name:'United Kingdom',capital:'London',currency:'GBP',phone:'+44',continent:'Europe'},JP:{name:'Japan',capital:'Tokyo',currency:'JPY',phone:'+81',continent:'Asia'},KR:{name:'South Korea',capital:'Seoul',currency:'KRW',phone:'+82',continent:'Asia'},CN:{name:'China',capital:'Beijing',currency:'CNY',phone:'+86',continent:'Asia'},DE:{name:'Germany',capital:'Berlin',currency:'EUR',phone:'+49',continent:'Europe'},FR:{name:'France',capital:'Paris',currency:'EUR',phone:'+33',continent:'Europe'},CA:{name:'Canada',capital:'Ottawa',currency:'CAD',phone:'+1',continent:'North America'},AU:{name:'Australia',capital:'Canberra',currency:'AUD',phone:'+61',continent:'Oceania'},BR:{name:'Brazil',capital:'Brasilia',currency:'BRL',phone:'+55',continent:'South America'},IN:{name:'India',capital:'New Delhi',currency:'INR',phone:'+91',continent:'Asia'},MX:{name:'Mexico',capital:'Mexico City',currency:'MXN',phone:'+52',continent:'North America'},IT:{name:'Italy',capital:'Rome',currency:'EUR',phone:'+39',continent:'Europe'},ES:{name:'Spain',capital:'Madrid',currency:'EUR',phone:'+34',continent:'Europe'},NL:{name:'Netherlands',capital:'Amsterdam',currency:'EUR',phone:'+31',continent:'Europe'},SE:{name:'Sweden',capital:'Stockholm',currency:'SEK',phone:'+46',continent:'Europe'},SG:{name:'Singapore',capital:'Singapore',currency:'SGD',phone:'+65',continent:'Asia'},TW:{name:'Taiwan',capital:'Taipei',currency:'TWD',phone:'+886',continent:'Asia'},TH:{name:'Thailand',capital:'Bangkok',currency:'THB',phone:'+66',continent:'Asia'},VN:{name:'Vietnam',capital:'Hanoi',currency:'VND',phone:'+84',continent:'Asia'}};
  const c=countries[code.toUpperCase()];if(!c)return err('Unknown code. Known: '+Object.keys(countries).join(', '));
  return json({code:code.toUpperCase(),...c});
}

const __ttduInner = {async fetch(request){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
  const url=new URL(request.url);const p=url.pathname;
  const body=request.method==='POST'?await gb(request):{};
  switch(p){
    case'/api/string-escape':return stringEscape(body);
    case'/api/text-diff-words':return textDiffWords(body);
    case'/api/text-similarity':return textSimilarity(body);
    case'/api/punycode':return punycode(body);
    case'/api/nato-phonetic':return natoPhonetic(body);
    case'/api/math-eval':return mathEval(body);
    case'/api/percentage':return percentage(body);
    case'/api/number-format':return numberFormat(body);
    case'/api/statistics':return statistics(body);
    case'/api/matrix-calc':return matrixCalc(body);
    case'/api/lighthouse-score':return lighthouseScore(body);
    case'/api/favicon':return favicon(body);
    case'/api/tech-detect':return techDetect(body);
    case'/api/canonical-url':return canonicalUrl(body);
    case'/api/domain-age':return domainAge(body);
    case'/api/csv-to-excel':return csvToExcel(body);
    case'/api/json-to-table':return jsonToTable(body);
    case'/api/json-sort-keys':return jsonSortKeys(body);
    case'/api/json-minify':return jsonMinify(body);
    case'/api/base-convert':return baseConvert(body);
    case'/api/cron-describe':return cronDescribe(body);
    case'/api/jwt-create':return jwtCreate(body);
    case'/api/json-to-go':return jsonToGo(body);
    case'/api/json-to-python':return jsonToPython(body);
    case'/api/http-method-info':return httpMethodInfo(body);
    case'/api/password-strength':return passwordStrength(body);
    case'/api/hash-identify':return hashIdentify(body);
    case'/api/data-masking':return dataMasking(body);
    case'/api/timezone-convert':return timezoneConvert(body);
    case'/api/country-info':return countryInfo(body);
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
