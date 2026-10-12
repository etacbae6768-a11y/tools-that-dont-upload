
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key'};
const J=(d,s)=>new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json; charset=utf-8','X-Egress':'none',...C}});
const P=(s,t,d)=>new Response(JSON.stringify({type:'about:blank',title:t,status:s,detail:d}),{status:s,headers:{'Content-Type':'application/problem+json',...C}});
const INI=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const MED=['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const FIN=['','k','k','k','n','n','n','t','l','k','m','l','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function romanize(t,cap){let out='';let prevFinal=-1;for(const ch of t){const c=ch.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3){const i=c-0xAC00;const ini=Math.floor(i/588),med=Math.floor((i%588)/28),fin=i%28;let s=INI[ini];if(ini===5&&prevFinal===8)s='l';out+=s+MED[med]+FIN[fin];prevFinal=fin;}else{out+=ch;prevFinal=-1;}}
 if(cap)out=out.replace(/(^|\s)([a-z])/g,(m,a,b)=>a+b.toUpperCase());return out;}
const DIG=['','일','이','삼','사','오','육','칠','팔','구'];
function group4(n,formal){let s='';const u=['천','백','십',''];const d=String(n).padStart(4,'0');for(let i=0;i<4;i++){const x=+d[i];if(!x)continue;if(x===1&&i<3&&!formal)s+=u[i];else s+=DIG[x]+u[i];}return s;}
function amountWords(n,formal){if(n===0)return '영';const big=['','만','억','조','경'];let parts=[];let i=0;let x=BigInt(n);while(x>0n){const g=Number(x%10000n);if(g)parts.unshift((g===1&&i===1&&!formal)?'만':group4(g,formal)+big[i]);x=x/10000n;i++;}return parts.join(formal?'':' ');}
function josa(word,pair){const p={'은/는':['은','는'],'이/가':['이','가'],'을/를':['을','를'],'과/와':['과','와'],'아/야':['아','야'],'이여/여':['이여','여'],'으로/로':['으로','로']}[pair];if(!p)return null;const last=word.trim().slice(-1);const c=last.charCodeAt(0);let has=false,rieul=false;if(c>=0xAC00&&c<=0xD7A3){const f=(c-0xAC00)%28;has=f>0;rieul=f===8;}else if(/[0-9]/.test(last)){has='013678'.includes(last);rieul='178'.includes(last);}else if(/[a-z]/i.test(last)){has=/[lmnbkpt]$/i.test(last);rieul=/l$/i.test(last);}
 if(pair==='으로/로')return word+(has&&!rieul?p[0]:p[1]);return word+(has?p[0]:p[1]);}
function chosung(t){let o='';for(const ch of t){const c=ch.charCodeAt(0);o+=(c>=0xAC00&&c<=0xD7A3)?CHO[Math.floor((c-0xAC00)/588)]:ch;}return o;}
function bizno(v){const d=String(v).replace(/\D/g,'');if(d.length!==10)return{valid:false,reason:'must be 10 digits'};const w=[1,3,7,1,3,7,1,3,5];let s=0;for(let i=0;i<9;i++)s+=(+d[i])*w[i];s+=Math.floor((+d[8])*5/10);const chk=(10-(s%10))%10;return{valid:chk===+d[9],formatted:d.slice(0,3)+'-'+d.slice(3,5)+'-'+d.slice(5),note:'Checksum only. Does not confirm the business is registered or active.'};}
function mask(t){const found={rrn:0,phone:0,email:0,card:0,account:0};let o=t;
 o=o.replace(/\b(\d{6})[-\s]?([1-8])\d{6}\b/g,(m,a,b)=>{found.rrn++;return a+'-'+b+'******';});
 o=o.replace(/\b(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})\b/g,(m,a,b,c,d)=>{found.card++;return '****-****-****-'+d;});
 o=o.replace(/\b(01[016789])[-.\s]?(\d{3,4})[-.\s]?(\d{4})\b/g,(m,a,b,c)=>{found.phone++;return a+'-'+'*'.repeat(b.length)+'-'+c;});
 o=o.replace(/\b(0\d{1,2})[-.\s](\d{3,4})[-.\s](\d{4})\b/g,(m,a,b,c)=>{found.phone++;return a+'-'+'*'.repeat(b.length)+'-'+c;});
 o=o.replace(/([A-Za-z0-9._%+-]{1,2})([A-Za-z0-9._%+-]*)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,(m,a,b,c)=>{found.email++;return a+'*'.repeat(Math.max(b.length,1))+'@'+c;});
 return{masked:o,found};}
function rnd(n){const a=new Uint32Array(1);const lim=Math.floor(0xFFFFFFFF/n)*n;let x;do{crypto.getRandomValues(a);x=a[0];}while(x>=lim);return x%n;}
function passwordGen(b){const len=Math.min(Math.max(parseInt(b.length??16)||16,4),128);const cnt=Math.min(Math.max(parseInt(b.count??1)||1,1),20);
 const sets=[];if(b.lowercase!==false)sets.push('abcdefghijklmnopqrstuvwxyz');if(b.uppercase!==false)sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');if(b.numbers!==false)sets.push('0123456789');if(b.symbols!==false)sets.push('!@#$%^&*()-_=+[]{};:,.?');
 if(!sets.length)return null;const all=sets.join('');const out=[];for(let k=0;k<cnt;k++){const chars=sets.map(s=>s[rnd(s.length)]);while(chars.length<len)chars.push(all[rnd(all.length)]);for(let i=chars.length-1;i>0;i--){const j=rnd(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}out.push(chars.slice(0,len).join(''));}return{passwords:out,length:len,count:cnt,charsets:sets.length};}
function words(t){return String(t).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').split(/[^A-Za-z0-9\u00C0-\uFFFF]+/).filter(Boolean);}
function textCase(t,cs){const w=words(t);const lw=w.map(x=>x.toLowerCase());const cap=x=>x.charAt(0).toUpperCase()+x.slice(1);
 switch(cs){case'upper':return String(t).toUpperCase();case'lower':return String(t).toLowerCase();case'title':return lw.map(cap).join(' ');case'sentence':{const s=lw.join(' ');return cap(s);}
 case'camel':return lw.map((x,i)=>i?cap(x):x).join('');case'pascal':return lw.map(cap).join('');case'snake':return lw.join('_');case'kebab':return lw.join('-');case'constant':return lw.join('_').toUpperCase();case'dot':return lw.join('.');default:return null;}}

// ---- xlsx-read: self-developed XLSX reader (ZIP + DEFLATE via DecompressionStream, minimal XML) ----
function xrB64(s){const bin=atob(String(s).replace(/^data:[^,]*,/,'').replace(/\s+/g,''));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
async function xrInflate(data){const ds=new DecompressionStream('deflate-raw');const w=ds.writable.getWriter();w.write(data);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer());}
async function xrUnzip(u){const dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let eocd=-1;for(let i=u.length-22;i>=Math.max(0,u.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}if(eocd<0)throw new Error('Not a ZIP/XLSX file.');
 const n=dv.getUint16(eocd+10,true);let p=dv.getUint32(eocd+16,true);const files={};const td=new TextDecoder();
 for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error('Corrupt ZIP directory.');const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);const name=td.decode(u.subarray(p+46,p+46+nl));
  files[name]={method,csize,lo};p+=46+nl+el+cl;}
 return {names:Object.keys(files),async read(name){const f=files[name];if(!f)return null;const lnl=dv.getUint16(f.lo+26,true),lel=dv.getUint16(f.lo+28,true);const start=f.lo+30+lnl+lel;const raw=u.subarray(start,start+f.csize);if(f.method===0)return td.decode(raw);if(f.method===8)return td.decode(await xrInflate(raw));throw new Error('Unsupported ZIP compression.');}};}
function xrUnesc(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#x([0-9a-f]+);/gi,(m,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(+d)).replace(/&amp;/g,'&');}
function xrAttr(tag,name){const m=tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'));return m?xrUnesc(m[1]):null;}
function xrTexts(xml){let out='';const re=/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>|<(?:\w+:)?t\s*\/>/g;let m;while((m=re.exec(xml)))out+=m[1]?xrUnesc(m[1]):'';return out;}
function xrColIdx(ref){const l=ref.replace(/\d+/g,'');let n=0;for(const ch of l)n=n*26+(ch.charCodeAt(0)-64);return n-1;}
const XR_DATE_IDS=new Set([14,15,16,17,18,19,20,21,22,45,46,47]);
function xrIsDateFmt(code){if(!code)return false;const c=code.replace(/"[^"]*"/g,'').replace(/\[[^\]]*\]/g,'').replace(/\\./g,'');return /[dmyhs]/i.test(c)&&!/^[#0.,%E+-]*$/i.test(c);}
function xrSerialToISO(v,d1904){const ms=Math.round((v-(d1904?-1462:0)-25569)*86400000);const d=new Date(ms);if(isNaN(d))return null;const iso=d.toISOString();return (v%1===0)?iso.slice(0,10):iso.slice(0,19);}
async function xlsxRead(b){
 if(typeof b.file_base64!=='string'||!b.file_base64)throw new Error('file_base64 is required (the .xlsx or .xls file, base64-encoded).');
 const u=xrB64(b.file_base64);if(u.length>10*1024*1024)throw new Error('File too large (max 10 MB).');
 if(u[0]===0xD0&&u[1]===0xCF&&u[2]===0x11&&u[3]===0xE0)return xlsRead(u,b);
 const z=await xrUnzip(u);const wb=await z.read('xl/workbook.xml');if(!wb)throw new Error('Not an Excel workbook (xl/workbook.xml missing).');
 const d1904=/date1904="(1|true)"/.test(wb);const rels=(await z.read('xl/_rels/workbook.xml.rels'))||'';const relMap={};for(const m of rels.matchAll(/<Relationship\b[^>]*>/g)){const id=xrAttr(m[0],'Id'),t=xrAttr(m[0],'Target');if(id&&t)relMap[id]=t.replace(/^\/?xl\//,'').replace(/^\//,'');}
 const sheets=[...wb.matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)].map(m=>({name:xrAttr(m[0],'name'),rid:xrAttr(m[0],'r:id'),state:xrAttr(m[0],'state')||'visible'}));
 const ssXml=(await z.read('xl/sharedStrings.xml'))||'';const ss=[...ssXml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(m=>xrTexts(m[1]));
 const st=(await z.read('xl/styles.xml'))||'';const fmts={};for(const m of st.matchAll(/<(?:\w+:)?numFmt\b[^>]*>/g))fmts[xrAttr(m[0],'numFmtId')]=xrAttr(m[0],'formatCode');
 const cx=(st.match(/<(?:\w+:)?cellXfs\b[\s\S]*?<\/(?:\w+:)?cellXfs>/)||[''])[0];const xfDate=[...cx.matchAll(/<(?:\w+:)?xf\b[^>]*>/g)].map(m=>{const id=+xrAttr(m[0],'numFmtId')||0;return XR_DATE_IDS.has(id)||xrIsDateFmt(fmts[id]);});
 let want=sheets;if(b.sheet!==undefined&&b.sheet!==null&&b.sheet!==''){const s=typeof b.sheet==='number'?sheets[b.sheet]:sheets.find(x=>x.name===String(b.sheet));if(!s)throw new Error('Sheet not found: '+b.sheet+'. Available: '+sheets.map(x=>x.name).join(', '));want=[s];}
 const maxRows=Math.min(Math.max(parseInt(b.max_rows)||5000,1),20000);const out=[];
 for(const s of want){const target=relMap[s.rid]||'';const xml=(await z.read('xl/'+target))||(await z.read(target));if(!xml){out.push({name:s.name,error:'sheet part missing'});continue;}
  const rows=[];let maxC=0,truncated=false;
  for(const rm of xml.matchAll(/<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g)){const rIdx=(+xrAttr('<r'+rm[1],'r')||rows.length+1)-1;if(rIdx>=maxRows){truncated=true;break;}const row=[];let next=0;
   for(const cm of rm[2].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)){const tag='<c'+cm[1];const ref=xrAttr(tag,'r');const ci=ref?xrColIdx(ref):next;next=ci+1;const t=xrAttr(tag,'t')||'n';const sIdx=+xrAttr(tag,'s')||0;const inner=cm[2]||'';
    const vm=inner.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/);const v=vm?xrUnesc(vm[1]):null;let val=null;
    if(t==='s')val=v===null?null:(ss[+v]??null);else if(t==='inlineStr')val=xrTexts(inner);else if(t==='str')val=v;else if(t==='b')val=v===null?null:v==='1';else if(t==='e')val=v===null?null:{error:v};
    else if(v!==null&&v!==''){const num=Number(v);val=isNaN(num)?v:num;if(typeof val==='number'&&xfDate[sIdx]&&b.dates!=='serial'){const iso=xrSerialToISO(val,d1904);if(iso)val=iso;}}
    if(val!==null){row[ci]=val;if(ci+1>maxC)maxC=ci+1;}}
   while(rows.length<rIdx)rows.push([]);rows[rIdx]=row;}
  const dense=rows.map(r=>{const a=new Array(maxC).fill(null);r.forEach((v,i)=>{if(v!==undefined)a[i]=v;});return a;});
  while(dense.length&&dense[dense.length-1].every(v=>v===null))dense.pop();
  const res={name:s.name,state:s.state,rowCount:dense.length,colCount:maxC,truncated};
  if(b.header){const hr=typeof b.header==='number'&&b.header>=1?b.header-1:0;const hdr=(dense[hr]||[]).map((h,i)=>h===null||h===''?'col'+(i+1):String(h).trim());res.headers=hdr;res.records=dense.slice(hr+1).filter(r=>r.some(v=>v!==null&&v!=='')).map(r=>{const o={};hdr.forEach((h,i)=>o[h]=r[i]??null);return o;});}
  else res.rows=dense;
  out.push(res);}
 return {sheets:out,sheetNames:sheets.map(x=>x.name),date1904:d1904,note:'Formulas are returned as their last saved values. Merged cells keep the value in the top-left cell only.'};}


function md5(bytes){const K=new Uint32Array(64),S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
 for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
 const len=bytes.length,nb=((len+8)>>>6)+1,M=new Uint32Array(nb*16);for(let i=0;i<len;i++)M[i>>2]|=bytes[i]<<((i%4)*8);M[len>>2]|=0x80<<((len%4)*8);M[nb*16-2]=(len*8)>>>0;M[nb*16-1]=Math.floor(len/536870912)>>>0;
 let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
 for(let o=0;o<M.length;o+=16){let A=a0,B=b0,Cc=c0,D=d0;for(let i=0;i<64;i++){let F,g;if(i<16){F=(B&Cc)|(~B&D);g=i;}else if(i<32){F=(D&B)|(~D&Cc);g=(5*i+1)%16;}else if(i<48){F=B^Cc^D;g=(3*i+5)%16;}else{F=Cc^(B|~D);g=(7*i)%16;}
  F=(F+A+K[i]+M[o+g])>>>0;A=D;D=Cc;Cc=B;B=(B+((F<<S[i])|(F>>>(32-S[i]))))>>>0;}a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+Cc)>>>0;d0=(d0+D)>>>0;}
 const out=new Uint8Array(16);[a0,b0,c0,d0].forEach((v,i)=>{out[i*4]=v&255;out[i*4+1]=(v>>>8)&255;out[i*4+2]=(v>>>16)&255;out[i*4+3]=(v>>>24)&255;});return out;}
function rc4(key){const s=new Uint8Array(256);for(let i=0;i<256;i++)s[i]=i;let j=0;for(let i=0;i<256;i++){j=(j+s[i]+key[i%key.length])&255;const t=s[i];s[i]=s[j];s[j]=t;}let i=0;j=0;return n=>{const o=new Uint8Array(n);for(let k=0;k<n;k++){i=(i+1)&255;j=(j+s[i])&255;const t=s[i];s[i]=s[j];s[j]=t;o[k]=s[(s[i]+s[j])&255];}return o;};}
function xlsRc4Key(password,salt){const pw=new Uint8Array(password.length*2);for(let i=0;i<password.length;i++){pw[i*2]=password.charCodeAt(i)&255;pw[i*2+1]=password.charCodeAt(i)>>8;}
 const h0=md5(pw).subarray(0,5);const buf=new Uint8Array(21*16);for(let i=0;i<16;i++){buf.set(h0,i*21);buf.set(salt,i*21+5);}const h1=md5(buf).subarray(0,5);
 return block=>{const b=new Uint8Array(9);b.set(h1,0);b[5]=block&255;b[6]=(block>>>8)&255;b[7]=(block>>>16)&255;b[8]=(block>>>24)&255;return md5(b);};}
function xlsCheckPassword(fp,password){const salt=fp.subarray(6,22),ev=fp.subarray(22,38),evh=fp.subarray(38,54);const keyFor=xlsRc4Key(password,salt);const ks=rc4(keyFor(0))(32);
 const v=new Uint8Array(16),vh=new Uint8Array(16);for(let i=0;i<16;i++){v[i]=ev[i]^ks[i];vh[i]=evh[i]^ks[16+i];}const h=md5(v);return h.every((x,i)=>x===vh[i])?keyFor:null;}


// ---- legacy .xls (BIFF8) reader: CFB container, default-password RC4 decryption, cells/SST/formats. Our own code. ----
function cfbOpen(u){const dv=new DataView(u.buffer,u.byteOffset,u.byteLength);const r16=o=>dv.getUint16(o,true),r32=o=>dv.getUint32(o,true);
 if(r32(0)!==0xE011CFD0||r32(4)!==0xE11AB1A1)return null;const ss=1<<r16(30),nFat=r32(44),dirStart=r32(48),cutoff=r32(56),mfStart=r32(60),difStart=r32(68),nDif=r32(72);
 const so=i=>512+i*ss;const fatSecs=[];for(let i=0;i<109&&fatSecs.length<nFat;i++){const v=r32(76+i*4);if(v<0xFFFFFFFA)fatSecs.push(v);}
 let d=difStart;for(let k=0;k<nDif&&d<0xFFFFFFFA;k++){for(let i=0;i<ss/4-1&&fatSecs.length<nFat;i++){const v=r32(so(d)+i*4);if(v<0xFFFFFFFA)fatSecs.push(v);}d=r32(so(d)+ss-4);}
 const fat=[];for(const f of fatSecs)for(let i=0;i<ss/4;i++)fat.push(r32(so(f)+i*4));
 const readChain=st=>{const parts=[];let c=st,g=0;while(c<0xFFFFFFFA&&g++<1e6){parts.push(u.subarray(so(c),so(c)+ss));c=fat[c];}const out=new Uint8Array(parts.length*ss);parts.forEach((p,i)=>out.set(p,i*ss));return out;};
 const dir=readChain(dirStart);const ents=[];const u16=a=>{let s='';for(let k=0;k+1<a.length;k+=2)s+=String.fromCharCode(a[k]|(a[k+1]<<8));return s;};for(let i=0;i<dir.length/128;i++){const e=dir.subarray(i*128,i*128+128);const nl=e[64]|(e[65]<<8);if(!nl)continue;const edv=new DataView(e.buffer,e.byteOffset,128);ents.push({name:u16(e.subarray(0,nl-2)),type:e[66],start:edv.getUint32(116,true),size:edv.getUint32(120,true)});}
 const root=ents.find(e=>e.type===5);const mini=root?readChain(root.start):new Uint8Array(0);const mfat=[];if(mfStart<0xFFFFFFFA){const m=readChain(mfStart);const mdv=new DataView(m.buffer,m.byteOffset,m.byteLength);for(let i=0;i<m.length/4;i++)mfat.push(mdv.getUint32(i*4,true));}
 const read=name=>{const e=ents.find(x=>x.name===name);if(!e)return null;if(e.size>=cutoff)return readChain(e.start).subarray(0,e.size);const out=new Uint8Array(Math.ceil(e.size/64)*64);let c=e.start,k=0,g=0;while(c<0xFFFFFFFA&&g++<1e6){out.set(mini.subarray(c*64,c*64+64),k*64);k++;c=mfat[c];}return out.subarray(0,e.size);};
 return {names:ents.map(e=>e.name),read};}
const XLS_NOENC=new Set([0x809,0x2F,0x194,0x195,0xE1,0x196,0x138]);
function xlsDecrypt(w,keyFor){const out=new Uint8Array(w);let pos=0,seen=false;const ksAt=(p,n)=>{const res=new Uint8Array(n);let k=0;while(k<n){const blk=Math.floor((p+k)/1024),inb=(p+k)%1024,take=Math.min(n-k,1024-inb);const g=rc4(keyFor(blk));g(inb);res.set(g(take),k);k+=take;}return res;};
 while(pos+4<=w.length){const t=w[pos]|(w[pos+1]<<8),l=w[pos+2]|(w[pos+3]<<8);if(seen&&!XLS_NOENC.has(t)&&l>0){const ks=ksAt(pos+4,l);const skip=t===0x85?4:0;for(let i=skip;i<l;i++)out[pos+4+i]=w[pos+4+i]^ks[i];}if(t===0x2F)seen=true;pos+=4+l;}return out;}
function xlsRecords(w){const recs=[];let pos=0;while(pos+4<=w.length){const t=w[pos]|(w[pos+1]<<8),l=w[pos+2]|(w[pos+3]<<8);recs.push({t,off:pos,data:w.subarray(pos+4,pos+4+l)});pos+=4+l;}return recs;}
function xlsStr(d,o,cch,high){if(high){let s='';for(let i=0;i<cch;i++)s+=String.fromCharCode(d[o+i*2]|(d[o+i*2+1]<<8));return [s,o+cch*2];}let s='';for(let i=0;i<cch;i++)s+=String.fromCharCode(d[o+i]);return [s,o+cch];}
function xlsSST(recs,i){const bufs=[recs[i].data];const bounds=[];let j=i+1;while(j<recs.length&&recs[j].t===0x3C){bounds.push(bufs.reduce((a,b)=>a+b.length,0));bufs.push(recs[j].data);j++;}
 const total=bufs.reduce((a,b)=>a+b.length,0);const d=new Uint8Array(total);let k=0;for(const b of bufs){d.set(b,k);k+=b.length;}const isB=new Set(bounds);
 const dv=new DataView(d.buffer,d.byteOffset,d.byteLength);const n=dv.getUint32(4,true);let o=8;const out=[];
 for(let s=0;s<n&&o<d.length;s++){const cch=dv.getUint16(o,true);let fl=d[o+2];o+=3;let runs=0,ext=0;if(fl&8){runs=dv.getUint16(o,true);o+=2;}if(fl&4){ext=dv.getUint32(o,true);o+=4;}
  let str='';let left=cch;let high=fl&1;while(left>0){let nextB=Infinity;for(const b of bounds)if(b>o){nextB=b;break;}const room=high?Math.floor((nextB-o)/2):nextB-o;const take=Math.min(left,room);const r=xlsStr(d,o,take,high);str+=r[0];o=r[1];left-=take;if(left>0&&isB.has(o)){high=d[o]&1;o+=1;}}
  o+=runs*4+ext;out.push(str);}return out;}
function xlsRK(v){let n;if(v&2)n=v>>2;else{const b=new DataView(new ArrayBuffer(8));b.setUint32(4,v&0xFFFFFFFC,true);b.setUint32(0,0,true);n=b.getFloat64(0,true);}return v&1?n/100:n;}
function xlsRead(u,b){const cf=cfbOpen(u);if(!cf)throw new Error('Not an .xls file.');let w=cf.read('Workbook')||cf.read('Book');if(!w)throw new Error('No Workbook stream found (not an Excel 97-2003 file).');
 let recs=xlsRecords(w);const fpR=recs.find(r=>r.t===0x2F);let decrypted=false;
 if(fpR){const fp=fpR.data;if((fp[0]|(fp[1]<<8))!==1||(fp[2]|(fp[3]<<8))!==1)throw new Error('This .xls uses an encryption type that is not supported. Save it as .xlsx without a password.');
  const pw=typeof b.password==='string'&&b.password?b.password:'VelvetSweatshop';const keyFor=xlsCheckPassword(fp,pw);if(!keyFor)throw new Error('This .xls file is password-protected. Send the password in "password".');w=xlsDecrypt(w,keyFor);recs=xlsRecords(w);decrypted=true;}
 const bof=recs[0];if(!bof||bof.t!==0x809||(bof.data[0]|(bof.data[1]<<8))!==0x600)throw new Error('Only Excel 97-2003 (BIFF8) .xls files are supported.');
 let sst=[],d1904=false;const sheets=[];const fmts={};const xf=[];
 for(let i=0;i<recs.length;i++){const r=recs[i],d=r.data;if(r.t===0x0A&&sheets.length)break;
  if(r.t===0x85){const pos=d[0]|(d[1]<<8)|(d[2]<<16)|(d[3]<<24);const cch=d[6],hi=d[7]&1;sheets.push({name:xlsStr(d,8,cch,hi)[0],pos:pos>>>0,state:['visible','hidden','veryHidden'][d[4]&3]||'visible',type:d[5]});}
  else if(r.t===0xFC)sst=xlsSST(recs,i);else if(r.t===0x22)d1904=(d[0]|(d[1]<<8))===1;
  else if(r.t===0x41E){const id=d[0]|(d[1]<<8);const cch=d[2]|(d[3]<<8);fmts[id]=xlsStr(d,5,cch,d[4]&1)[0];}
  else if(r.t===0xE0){xf.push(d[2]|(d[3]<<8));}}
 const isDate=ix=>{const f=xf[ix];if(f===undefined)return false;return XR_DATE_IDS.has(f)||xrIsDateFmt(fmts[f]);};
 let want=sheets.filter(s=>s.type===0);if(b.sheet!==undefined&&b.sheet!==null&&b.sheet!==''){const s=typeof b.sheet==='number'?want[b.sheet]:want.find(x=>x.name===String(b.sheet));if(!s)throw new Error('Sheet not found: '+b.sheet+'. Available: '+want.map(x=>x.name).join(', '));want=[s];}
 const maxRows=Math.min(Math.max(parseInt(b.max_rows)||5000,1),20000);const out=[];
 for(const s of want){let i=recs.findIndex(r=>r.off===s.pos);if(i<0){out.push({name:s.name,error:'sheet not found in stream'});continue;}const cells=new Map();let maxR=-1,maxC=-1,pendingStr=null;
  const put=(row,col,v)=>{if(row>=maxRows)return;cells.set(row*16384+col,v);if(row>maxR)maxR=row;if(col>maxC)maxC=col;};
  const num=(row,col,ix,v)=>put(row,col,isDate(ix)&&b.dates!=='serial'?(xrSerialToISO(v,d1904)||v):v);
  for(i=i+1;i<recs.length;i++){const r=recs[i],d=r.data;if(r.t===0x0A)break;const dv=new DataView(d.buffer,d.byteOffset,d.byteLength);
   if(r.t===0xFD){put(dv.getUint16(0,true),dv.getUint16(2,true),sst[dv.getUint32(6,true)]??'');}
   else if(r.t===0x203){num(dv.getUint16(0,true),dv.getUint16(2,true),dv.getUint16(4,true),dv.getFloat64(6,true));}
   else if(r.t===0x27E){num(dv.getUint16(0,true),dv.getUint16(2,true),dv.getUint16(4,true),xlsRK(dv.getInt32(6,true)));}
   else if(r.t===0xBD){const row=dv.getUint16(0,true),c0=dv.getUint16(2,true),n=(d.length-6)/6;for(let k=0;k<n;k++)num(row,c0+k,dv.getUint16(4+k*6,true),xlsRK(dv.getInt32(6+k*6,true)));}
   else if(r.t===0x204){const cch=dv.getUint16(6,true);put(dv.getUint16(0,true),dv.getUint16(2,true),xlsStr(d,9,cch,d[8]&1)[0]);}
   else if(r.t===0x205){const row=dv.getUint16(0,true),col=dv.getUint16(2,true);put(row,col,d[7]?{error:d[6]}:!!d[6]);}
   else if(r.t===0x06){const row=dv.getUint16(0,true),col=dv.getUint16(2,true),ix=dv.getUint16(4,true);if(d[12]===0xFF&&d[13]===0xFF){const ty=d[6];if(ty===0)pendingStr=[row,col];else if(ty===1)put(row,col,!!d[8]);else if(ty===2)put(row,col,{error:d[8]});}else num(row,col,ix,dv.getFloat64(6,true));}
   else if(r.t===0x207&&pendingStr){const cch=dv.getUint16(0,true);put(pendingStr[0],pendingStr[1],xlsStr(d,3,cch,d[2]&1)[0]);pendingStr=null;}}
  const dense=[];for(let rr=0;rr<=maxR;rr++){const row=new Array(maxC+1).fill(null);for(let cc=0;cc<=maxC;cc++){const v=cells.get(rr*16384+cc);if(v!==undefined)row[cc]=v;}dense.push(row);}
  while(dense.length&&dense[dense.length-1].every(v=>v===null||v===''))dense.pop();
  const res={name:s.name,state:s.state,rowCount:dense.length,colCount:maxC+1,truncated:maxR>=maxRows-1};
  if(b.header){let hr=0;if(typeof b.header==='number')hr=b.header-1;const hdr=(dense[hr]||[]).map((h,k)=>h===null||h===''?'col'+(k+1):String(h).trim());res.headers=hdr;res.records=dense.slice(hr+1).filter(r=>r.some(v=>v!==null&&v!=='')).map(r=>{const o={};hdr.forEach((h,k)=>o[h]=r[k]??null);return o;});}else res.rows=dense;
  out.push(res);}
 return {format:'xls (BIFF8)',decrypted_with_default_password:decrypted&&!b.password,sheets:out,sheetNames:want.map(x=>x.name),date1904:d1904,note:'Legacy .xls read from the cached cell values. Formulas return their last saved results.'};}


// ---- docx-read: self-developed .docx text/structure reader (uses xrUnzip/xrUnesc from xlsx-read) ----
function dxRunText(xml){let out='';const re=/<w:(t|tab|br|cr|noBreakHyphen|sym)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/w:t>)/g;let m;while((m=re.exec(xml))){if(m[1]==='t')out+=xrUnesc(m[3]||'');else if(m[1]==='tab')out+='\t';else if(m[1]==='br'||m[1]==='cr')out+='\n';else if(m[1]==='noBreakHyphen')out+='-';}return out;}
function dxPara(pxml,styles,numbering){const sm=pxml.match(/<w:pStyle w:val="([^"]+)"/);const sid=sm?sm[1]:null;const sname=sid?(styles[sid]||sid):null;
 let level=null;const hm=(sname||'').match(/^(?:heading|Heading|제목)\s*(\d)$/)||(sid||'').match(/^Heading(\d)$/i);if(hm)level=+hm[1];if(/^Title$/i.test(sname||''))level=0;
 const num=/<w:numPr>/.test(pxml);const ilvl=+(pxml.match(/<w:ilvl w:val="(\d+)"/)||[0,0])[1];const numId=(pxml.match(/<w:numId w:val="(\d+)"/)||[])[1];
 const runs=[...pxml.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>|<w:hyperlink\b[^>]*>([\s\S]*?)<\/w:hyperlink>/g)];let text='';let md='';
 for(const r of runs){const inner=r[1]!==undefined?r[1]:r[2];if(r[2]!==undefined){const t=dxRunText(inner);text+=t;md+=t;continue;}const t=dxRunText(inner);if(!t)continue;text+=t;const b=/<w:b(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(inner),i=/<w:i(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(inner);const core=t.trim();if(!core||(!b&&!i)){md+=t;}else{const mk=(b?'**':'')+(i?'*':'');const lead=t.match(/^\s*/)[0],trail=t.match(/\s*$/)[0];md+=lead+mk+core+mk.split('').reverse().join('')+trail;}}
 return {style:sname,heading:level,list:num?{level:ilvl,ordered:numbering[numId]==='decimal'}:null,text,md};}
async function docxRead(b){if(typeof b.file_base64!=='string'||!b.file_base64)throw new Error('file_base64 is required (the .docx file, base64-encoded).');
 const u=xrB64(b.file_base64);if(u.length>10*1024*1024)throw new Error('File too large (max 10 MB).');
 const z=await xrUnzip(u);const doc=await z.read('word/document.xml');if(!doc)throw new Error('Not a DOCX file (word/document.xml missing). Old .doc files are not supported.');
 const stx=(await z.read('word/styles.xml'))||'';const styles={};for(const m of stx.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>[\s\S]*?<w:name w:val="([^"]+)"/g))styles[m[1]]=m[2];
 const nx=(await z.read('word/numbering.xml'))||'';const absFmt={};for(const m of nx.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g)){const f=(m[2].match(/<w:numFmt w:val="([^"]+)"/)||[])[1];absFmt[m[1]]=f;}
 const numbering={};for(const m of nx.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>[\s\S]*?<w:abstractNumId w:val="(\d+)"/g))numbering[m[1]]=absFmt[m[2]];
 const body=(doc.match(/<w:body>([\s\S]*)<\/w:body>/)||[,''])[1];const blocks=[];const tables=[];const mdOut=[];const textOut=[];
 const re=/<w:tbl>([\s\S]*?)<\/w:tbl>|<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g;let m;
 while((m=re.exec(body))){if(m[1]!==undefined){const rows=[...m[1].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)].map(tr=>[...tr[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map(tc=>[...tc[1].matchAll(/<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g)].map(p=>dxRunText(p[1]||'')).join('\n').trim()));
   tables.push(rows);blocks.push({type:'table',index:tables.length-1,rows});
   if(rows.length){const w=Math.max(...rows.map(r=>r.length));const pad=r=>{const a=r.slice();while(a.length<w)a.push('');return a.map(c=>c.replace(/\|/g,'\\|').replace(/\n/g,' '));};mdOut.push('| '+pad(rows[0]).join(' | ')+' |','| '+new Array(w).fill('---').join(' | ')+' |',...rows.slice(1).map(r=>'| '+pad(r).join(' | ')+' |'),'');}
   textOut.push(rows.map(r=>r.join('\t')).join('\n'));continue;}
  const p=dxPara(m[2]||'',styles,numbering);if(!p.text.trim()&&!p.heading){textOut.push('');continue;}
  blocks.push({type:p.heading!==null?'heading':p.list?'list_item':'paragraph',level:p.heading??(p.list?p.list.level:undefined),style:p.style||undefined,text:p.text});
  textOut.push(p.text);
  if(p.heading!==null)mdOut.push('#'.repeat(Math.max(1,p.heading))+' '+p.text.trim(),'');else if(p.list)mdOut.push('  '.repeat(p.list.level)+(p.list.ordered?'1. ':'- ')+p.md.trim());else mdOut.push(p.md.trim(),'');}
 const core=(await z.read('docProps/core.xml'))||'';const meta={title:xrUnesc((core.match(/<dc:title>([\s\S]*?)<\/dc:title>/)||[,''])[1])||null,creator:xrUnesc((core.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)||[,''])[1])||null,modified:(core.match(/<dcterms:modified[^>]*>([\s\S]*?)<\/dcterms:modified>/)||[,null])[1]};
 const text=textOut.join('\n').replace(/\n{3,}/g,'\n\n').trim();const markdown=mdOut.join('\n').replace(/\n{3,}/g,'\n\n').trim();
 const res={text,markdown,characters:text.replace(/\s/g,'').length,paragraphs:blocks.filter(x=>x.type!=='table').length,tables,meta,note:'Text, headings, lists and tables are extracted. Images, text boxes, footnotes, headers/footers and tracked-change history are not included.'};
 if(b.blocks)res.blocks=blocks;return res;}


// ---- kr-tax-invoice-parse: self-developed parser for the NTS standard e-tax invoice XML ----
function tiUnesc(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#x([0-9a-f]+);/gi,(m,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(+d)).replace(/&amp;/g,'&');}
function tiParse(xml){xml=xml.replace(/^\uFEFF/,'').replace(/<\?[\s\S]*?\?>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<!DOCTYPE[\s\S]*?>/gi,'');
 if(/<!ENTITY/i.test(xml))throw new Error('XML entities are not allowed.');
 xml=xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,(m,c)=>c.replace(/&/g,'&amp;').replace(/</g,'&lt;'));
 const root={name:'#root',children:[],text:''};const stack=[root];const re=/<(\/?)([A-Za-z_][\w.\-]*:)?([A-Za-z_][\w.\-]*)([^>]*?)(\/?)>|([^<]+)/g;let m,count=0;
 while((m=re.exec(xml))){if(++count>200000)throw new Error('XML too large.');if(m[6]!==undefined){const t=m[6];if(t.trim())stack[stack.length-1].text+=tiUnesc(t);continue;}
  const close=m[1]==='/',name=m[3],self=m[5]==='/';
  if(close){if(stack.length>1&&stack[stack.length-1].name===name)stack.pop();continue;}
  const node={name,children:[],text:''};stack[stack.length-1].children.push(node);if(!self)stack.push(node);}
 return root;}
function tiKid(n,name){return n?n.children.find(c=>c.name===name):undefined;}
function tiKids(n,name){return n?n.children.filter(c=>c.name===name):[];}
function tiPath(n,...p){let c=n;for(const x of p){c=tiKid(c,x);if(!c)return null;}return c.text.trim()||null;}
function tiFind(n,name){if(!n)return null;if(n.name===name)return n;for(const c of n.children){const r=tiFind(c,name);if(r)return r;}return null;}
function tiNum(s){if(s===null||s===undefined||s==='')return null;const v=Number(String(s).replace(/,/g,''));return isNaN(v)?null:v;}
function tiDate(s){if(!s)return null;const d=String(s).replace(/\D/g,'');return d.length>=8?d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8):s;}
function tiBizOk(n){const d=String(n||'').replace(/\D/g,'').split('').map(Number);if(d.length!==10)return null;const w=[1,3,7,1,3,7,1,3,5];let s=0;for(let i=0;i<9;i++)s+=d[i]*w[i];s+=Math.floor(d[8]*5/10);return (10-s%10)%10===d[9];}
function tiFmtBiz(n){const d=String(n||'').replace(/\D/g,'');return d.length===10?d.slice(0,3)+'-'+d.slice(3,5)+'-'+d.slice(5):(n||null);}
function tiParty(p){if(!p)return null;const id=tiPath(p,'ID');return {business_number:tiFmtBiz(id),business_number_checksum_ok:tiBizOk(id),branch_id:tiPath(p,'SpecifiedOrganization','TaxRegistrationID'),name:tiPath(p,'NameText'),representative:tiPath(p,'SpecifiedPerson','NameText'),business_type:tiPath(p,'TypeCode'),business_item:tiPath(p,'ClassificationCode'),address:tiPath(p,'SpecifiedAddress','LineOneText'),email:tiPath(p,'DefinedContact','URICommunication')||tiPath(p,'PrimaryDefinedContact','URICommunication'),contact_name:tiPath(p,'DefinedContact','PersonNameText'),phone:tiPath(p,'DefinedContact','TelephoneCommunication')};}
const TI_KIND={'01':'세금계산서','02':'수정세금계산서','03':'계산서','04':'수정계산서'};
const TI_SUB={'01':'일반','02':'영세율','03':'위수탁','04':'수입','05':'영세율위수탁','06':'수입납부유예'};
const TI_PAY={'10':'현금','20':'수표','30':'어음','40':'외상미수금'};
function taxInvoiceParse(b){
 if(typeof b.xml!=='string'||!b.xml.trim())throw new Error('xml is required (the e-tax invoice XML file content as text).');
 if(b.xml.length>2*1024*1024)throw new Error('XML too large (max 2 MB).');
 const root=tiParse(b.xml);const ti=tiFind(root,'TaxInvoice');if(!ti)throw new Error('Not a Korean standard e-tax invoice: <TaxInvoice> element not found.');
 const doc=tiKid(ti,'TaxInvoiceDocument'),set=tiKid(ti,'TaxInvoiceTradeSettlement'),ex=tiKid(ti,'ExchangedDocument');
 const type=tiPath(doc,'TypeCode')||'';const sum=tiKid(set,'SpecifiedMonetarySummation');
 const items=tiKids(ti,'TaxInvoiceTradeLineItem').map(li=>({seq:tiNum(tiPath(li,'SequenceNumeric')),date:tiDate(tiPath(li,'PurchaseExpiryDateTime')),name:tiPath(li,'NameText'),spec:tiPath(li,'InformationText'),quantity:tiNum(tiPath(li,'ChargeableUnitQuantity')),unit_price:tiNum(tiPath(li,'UnitPrice','UnitAmount')),supply_amount:tiNum(tiPath(li,'InvoiceAmount')),tax_amount:tiNum(tiPath(li,'TotalTax','CalculatedAmount')),note:tiPath(li,'DescriptionText')}));
 const totals={supply_amount:tiNum(tiPath(sum,'ChargeTotalAmount')),tax_amount:tiNum(tiPath(sum,'TaxTotalAmount')),total_amount:tiNum(tiPath(sum,'GrandTotalAmount'))};
 const payments=tiKids(set,'SpecifiedPaymentMeans').map(p=>({type:TI_PAY[tiPath(p,'TypeCode')]||tiPath(p,'TypeCode'),amount:tiNum(tiPath(p,'PaidAmount'))}));
 const checks=[];const lineSupply=items.reduce((a,x)=>a+(x.supply_amount||0),0),lineTax=items.reduce((a,x)=>a+(x.tax_amount||0),0);
 if(totals.supply_amount!==null)checks.push({check:'line supply amounts = total supply amount',ok:lineSupply===totals.supply_amount,lines:lineSupply,total:totals.supply_amount});
 if(totals.tax_amount!==null&&items.some(x=>x.tax_amount!==null))checks.push({check:'line tax amounts = total tax amount',ok:lineTax===totals.tax_amount,lines:lineTax,total:totals.tax_amount});
 if(totals.total_amount!==null&&totals.supply_amount!==null)checks.push({check:'supply + tax = total',ok:totals.supply_amount+(totals.tax_amount||0)===totals.total_amount});
 items.forEach(x=>{if(x.quantity!==null&&x.unit_price!==null&&x.supply_amount!==null){const exp=x.quantity*x.unit_price;if(Math.abs(exp-x.supply_amount)>1)checks.push({check:'item '+(x.seq||'?')+': quantity × unit price = supply amount',ok:false,expected:exp,actual:x.supply_amount});}});
 const supplier=tiParty(tiKid(set,'InvoicerParty')),buyer=tiParty(tiKid(set,'InvoiceeParty')),broker=tiParty(tiKid(set,'BrokerParty'));
 if(supplier&&supplier.business_number_checksum_ok===false)checks.push({check:'supplier business number checksum',ok:false});
 if(buyer&&buyer.business_number_checksum_ok===false)checks.push({check:'buyer business number checksum',ok:false});
 const first=items[0];
 const ledger_row={작성일자:tiDate(tiPath(doc,'IssueDateTime')),승인번호:tiPath(doc,'IssueID'),공급자_사업자번호:supplier&&supplier.business_number,공급자_상호:supplier&&supplier.name,품목:first?(first.name||'')+(items.length>1?' 외 '+(items.length-1)+'건':''):null,공급가액:totals.supply_amount,세액:totals.tax_amount,합계:totals.total_amount};
 return {kind:TI_KIND[type.slice(0,2)]||null,subtype:TI_SUB[type.slice(2,4)]||null,type_code:type||null,approval_number:tiPath(doc,'IssueID'),issue_date:tiDate(tiPath(doc,'IssueDateTime')),purpose:({'01':'영수','02':'청구'})[tiPath(doc,'PurposeCode')]||tiPath(doc,'PurposeCode'),note:tiPath(doc,'DescriptionText'),amendment_code:tiPath(doc,'AmendmentStatusCode'),original_approval_number:tiPath(doc,'OriginalIssueID'),transmitted_at:tiPath(ex,'IssueDateTime'),supplier,buyer,broker,items,totals,payments,checks,all_checks_passed:checks.every(c=>c.ok),ledger_row,signature_present:!!tiFind(ti,'Signature'),
  note_on_validity:'Parsed from the XML content only. The digital signature is not verified and this does not confirm the invoice was reported to the NTS; check HomeTax for that.'};}


// ---- kr-holidays / kr-business-days: Korean public holidays (관공서의 공휴일) ----
// Sources: 우주항공청 「2026년 월력요항」(2025-06-30), 「2027년 월력요항」(2026-06-29); 공휴일에 관한 법률 개정(2026, 노동절·제헌절 공휴일 지정);
// 2025 temporary holidays: 2025-01-27 (임시공휴일), 2025-06-03 (제21대 대통령선거). Data updated 2026-10-12.
const KR_HOL={
2025:[['2025-01-01','신정'],['2025-01-27','임시공휴일'],['2025-01-28','설날 연휴'],['2025-01-29','설날'],['2025-01-30','설날 연휴'],['2025-03-01','3·1절'],['2025-03-03','대체공휴일(3·1절)'],['2025-05-05','어린이날'],['2025-05-05','부처님오신날'],['2025-05-06','대체공휴일(어린이날·부처님오신날)'],['2025-06-03','제21대 대통령선거'],['2025-06-06','현충일'],['2025-08-15','광복절'],['2025-10-03','개천절'],['2025-10-05','추석 연휴'],['2025-10-06','추석'],['2025-10-07','추석 연휴'],['2025-10-08','대체공휴일(추석)'],['2025-10-09','한글날'],['2025-12-25','기독탄신일']],
2026:[['2026-01-01','신정'],['2026-02-16','설날 연휴'],['2026-02-17','설날'],['2026-02-18','설날 연휴'],['2026-03-01','3·1절'],['2026-03-02','대체공휴일(3·1절)'],['2026-05-01','노동절'],['2026-05-05','어린이날'],['2026-05-24','부처님오신날'],['2026-05-25','대체공휴일(부처님오신날)'],['2026-06-03','제9회 전국동시지방선거'],['2026-06-06','현충일'],['2026-07-17','제헌절'],['2026-08-15','광복절'],['2026-08-17','대체공휴일(광복절)'],['2026-09-24','추석 연휴'],['2026-09-25','추석'],['2026-09-26','추석 연휴'],['2026-10-03','개천절'],['2026-10-05','대체공휴일(개천절)'],['2026-10-09','한글날'],['2026-12-25','기독탄신일']],
2027:[['2027-01-01','신정'],['2027-02-06','설날 연휴'],['2027-02-07','설날'],['2027-02-08','설날 연휴'],['2027-02-09','대체공휴일(설날)'],['2027-03-01','3·1절'],['2027-05-01','노동절'],['2027-05-03','대체공휴일(노동절)'],['2027-05-05','어린이날'],['2027-05-13','부처님오신날'],['2027-06-06','현충일'],['2027-07-17','제헌절'],['2027-07-19','대체공휴일(제헌절)'],['2027-08-15','광복절'],['2027-08-16','대체공휴일(광복절)'],['2027-09-14','추석 연휴'],['2027-09-15','추석'],['2027-09-16','추석 연휴'],['2027-10-03','개천절'],['2027-10-04','대체공휴일(개천절)'],['2027-10-09','한글날'],['2027-10-11','대체공휴일(한글날)'],['2027-12-25','기독탄신일'],['2027-12-27','대체공휴일(기독탄신일)']]};
const KR_HOL_NOTE='Public holidays for government offices (관공서의 공휴일) from the official 월력요항 and current law, as of 2026-10-12. Sundays are not listed. Temporary holidays declared later are not included until we update. Private employers follow the Labor Standards Act; check your company rules.';
function krDow(iso){return ['일','월','화','수','목','금','토'][new Date(iso+'T00:00:00Z').getUTCDay()];}
function krHolidays(b){const y=parseInt(b.year)||new Date().getUTCFullYear();const L=KR_HOL[y];if(!L)return {error:'Holiday data is available for '+Object.keys(KR_HOL).join(', ')+'.',status:400};
 const map={};L.forEach(([d,n])=>{(map[d]=map[d]||[]).push(n);});const list=Object.keys(map).sort().map(d=>({date:d,weekday:krDow(d),names:map[d]}));
 return {year:y,count:list.length,holidays:list,note:KR_HOL_NOTE};}
function krIsHoliday(iso){const y=+iso.slice(0,4);const L=KR_HOL[y];if(!L)return null;return L.some(([d])=>d===iso);}
function krBusinessDays(b){const s=String(b.start||''),e=String(b.end||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!/^\d{4}-\d{2}-\d{2}$/.test(e))return {error:'start and end are required as YYYY-MM-DD.',status:400};
 let a=new Date(s+'T00:00:00Z'),z=new Date(e+'T00:00:00Z');if(isNaN(a)||isNaN(z))return {error:'Invalid date.',status:400};if(a>z)[a,z]=[z,a];
 if((z-a)/86400000>3660)return {error:'Range too long (max 10 years).',status:400};
 const sat=b.include_saturday===true;let days=0,weekend=0,hol=0;const holidays=[];const missing=new Set();
 for(let d=new Date(a);d<=z;d.setUTCDate(d.getUTCDate()+1)){const iso=d.toISOString().slice(0,10);const g=d.getUTCDay();const isWeekend=g===0||(g===6&&!sat);const h=krIsHoliday(iso);if(h===null)missing.add(iso.slice(0,4));
  if(isWeekend){weekend++;continue;}if(h){hol++;holidays.push(iso);continue;}days++;}
 if(missing.size)return {error:'Holiday data is not available for '+[...missing].join(', ')+'. Available: '+Object.keys(KR_HOL).join(', ')+'.',status:400};
 return {start:a.toISOString().slice(0,10),end:z.toISOString().slice(0,10),business_days:days,weekend_days:weekend,holidays_on_weekdays:hol,holiday_dates:holidays,calendar_days:Math.round((z-a)/86400000)+1,note:KR_HOL_NOTE};}

const ROUTES={
 '/api/kr-holidays':b=>{const r=krHolidays(b);return r.error?P(r.status||400,'Bad Request',r.error):J(r);},
 '/api/kr-business-days':b=>{const r=krBusinessDays(b);return r.error?P(r.status||400,'Bad Request',r.error):J(r);},
 '/api/kr-tax-invoice-parse':b=>{try{return J(taxInvoiceParse(b));}catch(e){return P(400,'Bad Request',e.message);}},
 '/api/docx-read':async b=>{try{return J(await docxRead(b));}catch(e){return P(400,'Bad Request',e.message);}},
 '/api/xlsx-read':async b=>{try{return J(await xlsxRead(b));}catch(e){return P(400,'Bad Request',e.message);}},
 '/api/ko-romanize':b=>{if(typeof b.text!=='string'||!b.text)return P(400,'Bad Request','Send {"text":"박지훈"}');return J({romanized:romanize(b.text,b.capitalize!==false),system:'Revised Romanization, syllable by syllable (as used for personal names); sound-change rules between syllables are not applied',original:b.text});},
 '/api/ko-amount-words':b=>{const n=Number(String(b.amount??'').replace(/[,\s원]/g,''));if(!Number.isFinite(n)||n<0||!Number.isInteger(n)||n>=1e20)return P(400,'Bad Request','Send {"amount":1234000} (non-negative integer)');return J({amount:n,formal:'일금 '+amountWords(n,true)+'원정',plain:amountWords(n,false)+' 원',hangul:amountWords(n,true)});},
 '/api/ko-josa':b=>{if(typeof b.word!=='string'||!b.word)return P(400,'Bad Request','Send {"word":"사과","pair":"을/를"}');const pair=b.pair||'은/는';const r=josa(b.word,pair);if(r===null)return P(400,'Bad Request','pair must be one of 은/는, 이/가, 을/를, 과/와, 아/야, 이여/여, 으로/로');return J({result:r,word:b.word,pair});},
 '/api/ko-chosung':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"대한민국"}');return J({chosung:chosung(b.text),original:b.text});},
 '/api/kr-business-number':b=>{if(!b.number)return P(400,'Bad Request','Send {"number":"220-81-62517"}');return J({number:String(b.number),...bizno(b.number)});},
 '/api/ko-pii-mask':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"연락처 010-1234-5678"}');return J(mask(b.text));},
 '/api/password-gen':b=>{const r=passwordGen(b||{});if(!r)return P(400,'Bad Request','At least one character set must be enabled');return J(r);},
 '/api/text-case':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"helloWorld","case":"snake"}');const cs=String(b.case||b.to||'').toLowerCase();const r=textCase(b.text,cs);if(r===null)return P(400,'Bad Request','case must be one of upper, lower, title, sentence, camel, pascal, snake, kebab, constant, dot');return J({result:r,case:cs});},
};
export default{async fetch(req){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:C});const u=new URL(req.url);const h=ROUTES[u.pathname];if(!h)return P(404,'Not Found','Unknown endpoint');
 if(req.method!=='GET'&&req.method!=='POST')return P(405,'Method Not Allowed','Use GET or POST');let b={};if(req.method==='POST'){const t=await req.text();if(t.trim()){try{b=JSON.parse(t);}catch(e){return P(400,'Bad Request','Request body is not valid JSON.');}}}else{u.searchParams.forEach((v,k)=>b[k]=v);}
 if(b===null||typeof b!=='object'||Array.isArray(b))return P(400,'Bad Request','Body must be a JSON object');try{return h(b);}catch(e){return P(400,'Bad Request','Could not process input');}}};
