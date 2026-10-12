#!/usr/bin/env node
// Tools That Don't Upload — local MCP server (stdio).
// Everything runs on this computer. This server makes no network requests.
'use strict';
if (!globalThis.crypto) globalThis.crypto = require('crypto').webcrypto;
const fs = require('fs');
const path = require('path');
const os = require('os');
const nodeCrypto = require('crypto');
const PDFLib = require('./lib/pdf-lib.min.js');

// ---- Korean + text tools (same code as the hosted API) ----
const KR = (() => {
  const C = {};
  const J = (d, s) => ({ __json: d, status: s || 200 });
  const P = (s, t, d) => ({ __json: { error: d, title: t }, status: s });
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
const ROUTES={
 '/api/ko-romanize':b=>{if(typeof b.text!=='string'||!b.text)return P(400,'Bad Request','Send {"text":"박지훈"}');return J({romanized:romanize(b.text,b.capitalize!==false),system:'Revised Romanization, syllable by syllable (as used for personal names); sound-change rules between syllables are not applied',original:b.text});},
 '/api/ko-amount-words':b=>{const n=Number(String(b.amount??'').replace(/[,\s원]/g,''));if(!Number.isFinite(n)||n<0||!Number.isInteger(n)||n>=1e20)return P(400,'Bad Request','Send {"amount":1234000} (non-negative integer)');return J({amount:n,formal:'일금 '+amountWords(n,true)+'원정',plain:amountWords(n,false)+' 원',hangul:amountWords(n,true)});},
 '/api/ko-josa':b=>{if(typeof b.word!=='string'||!b.word)return P(400,'Bad Request','Send {"word":"사과","pair":"을/를"}');const pair=b.pair||'은/는';const r=josa(b.word,pair);if(r===null)return P(400,'Bad Request','pair must be one of 은/는, 이/가, 을/를, 과/와, 아/야, 이여/여, 으로/로');return J({result:r,word:b.word,pair});},
 '/api/ko-chosung':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"대한민국"}');return J({chosung:chosung(b.text),original:b.text});},
 '/api/kr-business-number':b=>{if(!b.number)return P(400,'Bad Request','Send {"number":"220-81-62517"}');return J({number:String(b.number),...bizno(b.number)});},
 '/api/ko-pii-mask':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"연락처 010-1234-5678"}');return J(mask(b.text));},
 '/api/password-gen':b=>{const r=passwordGen(b||{});if(!r)return P(400,'Bad Request','At least one character set must be enabled');return J(r);},
 '/api/text-case':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"helloWorld","case":"snake"}');const cs=String(b.case||b.to||'').toLowerCase();const r=textCase(b.text,cs);if(r===null)return P(400,'Bad Request','case must be one of upper, lower, title, sentence, camel, pascal, snake, kebab, constant, dot');return J({result:r,case:cs});},
};

  return ROUTES;
})();

// ---- Document generation (same code as the hosted API) ----
const DOCS = (() => {
  const enc=new TextEncoder();
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){const parts=[];const central=[];let off=0;
 for(const [name,content] of files){const nb=enc.encode(name);const data=typeof content==='string'?enc.encode(content):content;const crc=crc32(data);
  const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,nb.length,true);lh.setUint16(28,0,true);
  parts.push(new Uint8Array(lh.buffer),nb,data);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
  central.push(new Uint8Array(ch.buffer),nb);off+=30+nb.length+data.length;}
 const cs=central.reduce((a,b)=>a+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 const all=[...parts,...central,new Uint8Array(e.buffer)];const tot=all.reduce((a,b)=>a+b.length,0);const out=new Uint8Array(tot);let p=0;for(const a of all){out.set(a,p);p+=a.length;}return out;}
const X=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
const DIG=['','일','이','삼','사','오','육','칠','팔','구'];
function g4(n){let s='';const u=['천','백','십',''];const d=String(n).padStart(4,'0');for(let i=0;i<4;i++){const x=+d[i];if(x)s+=DIG[x]+u[i];}return s;}
function won(n){if(!n)return '영';const big=['','만','억','조'];let r=[];let i=0;while(n>0){const g=n%10000;if(g)r.unshift(g4(g)+big[i]);n=Math.floor(n/10000);i++;}return r.join('');}
const fmt=n=>Number(n).toLocaleString('ko-KR');
// ---------- XLSX ----------
function col(i){let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
function xlsx(title,rows,widths,merges){
 const sheetRows=rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>{if(v===null||v===undefined||v==='')return '';const ref=col(ci)+(ri+1);let s=0;let val=v;if(typeof v==='object'){s=v.s||0;val=v.v;}
   if(typeof val==='number')return '<c r="'+ref+'" s="'+(s||2)+'"><v>'+val+'</v></c>';return '<c r="'+ref+'" t="inlineStr" s="'+s+'"><is><t xml:space="preserve">'+X(val)+'</t></is></c>';}).join('')+'</row>').join('');
 const cols='<cols>'+widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols>';
 const mg=merges&&merges.length?'<mergeCells count="'+merges.length+'">'+merges.map(m=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>':'';
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+cols+'<sheetData>'+sheetRows+'</sheetData>'+mg+'<pageSetup paperSize="9" orientation="portrait"/></worksheet>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="3"><font><sz val="10"/><name val="맑은 고딕"/></font><font><b/><sz val="18"/><name val="맑은 고딕"/></font><font><b/><sz val="10"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf fontId="0" borderId="0"/><xf fontId="1" applyFont="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf fontId="0" borderId="1" numFmtId="164" applyBorder="1" applyNumberFormat="1"/><xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf fontId="0" borderId="1" applyBorder="1"/></cellXfs></styleSheet>';
 return zip([
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+X(title).slice(0,31)+'" sheetId="1" r:id="rId1"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/worksheets/sheet1.xml',sheet],['xl/styles.xml',styles]]);}
// ---------- DOCX ----------
function para(text,o){o=o||{};const rp='<w:rPr><w:rFonts w:ascii="Malgun Gothic" w:eastAsia="맑은 고딕" w:hAnsi="Malgun Gothic"/>'+(o.b?'<w:b/>':'')+'<w:sz w:val="'+(o.sz||21)+'"/></w:rPr>';const pp='<w:pPr>'+(o.center?'<w:jc w:val="center"/>':o.right?'<w:jc w:val="right"/>':'')+'<w:spacing w:after="'+(o.after??120)+'"/></w:pPr>';
 return '<w:p>'+pp+String(text).split('\n').map((t,i)=>(i?'<w:r><w:br/></w:r>':'')+'<w:r>'+rp+'<w:t xml:space="preserve">'+X(t)+'</w:t></w:r>').join('')+'</w:p>';}
function table(rows){const b='<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>'<w:'+s+' w:val="single" w:sz="4" w:color="000000"/>').join('')+'</w:tblBorders>';
 return '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>'+b+'</w:tblPr>'+rows.map(r=>'<w:tr>'+r.map((c,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+(i===0?1400:3600)+'" w:type="dxa"/>'+(i===0?'<w:shd w:val="clear" w:fill="EFEFEF"/>':'')+'</w:tcPr>'+para(c,{b:i===0,after:40})+'</w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';}
function docx(body){const doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1200" w:bottom="1440" w:left="1200"/></w:sectPr></w:body></w:document>';
 return zip([['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
  ['word/document.xml',doc]]);}
// ---------- templates ----------
function needItems(b){if(!Array.isArray(b.items)||!b.items.length)throw new Error('items must be a non-empty array of {name, qty, unit_price}');return b.items.map((it,i)=>{const q=Number(it.qty??it.quantity??1),u=Number(it.unit_price??it.price??0);if(!it.name||!Number.isFinite(q)||!Number.isFinite(u))throw new Error('item '+(i+1)+' needs name, qty, unit_price');const amt=Math.round(q*u);return{name:String(it.name),spec:String(it.spec||''),qty:q,unit:u,amt,note:String(it.note||'')};});}
function totals(items,b){const supply=items.reduce((a,x)=>a+x.amt,0);const vatIncluded=b.vat==='included';const vat=b.vat==='none'?0:vatIncluded?Math.round(supply-supply/1.1):Math.round(supply*0.1);const s=vatIncluded?supply-vat:supply;return{supply:s,vat,total:s+vat};}
function party(o){o=o||{};return [o.name||'',o.business_number?'사업자번호 '+o.business_number:'',o.representative?'대표 '+o.representative:'',o.address||'',o.phone||''].filter(Boolean).join(' / ');}
function quoteRows(kind,b){const items=needItems(b);const t=totals(items,b);const H={s:3};
 const rows=[[{v:kind,s:1}],[],['작성일',b.date||new Date().toISOString().slice(0,10)],[kind==='견적서'?'수신':'공급받는자',party(b.to)],['공급자',party(b.from)],[],
  ['합계금액 (부가세 '+(b.vat==='none'?'없음':'포함')+')','일금 '+won(t.total)+'원정 (₩'+fmt(t.total)+')'],[],
  [{v:'No',s:3},{v:'품목',s:3},{v:'규격',s:3},{v:'수량',s:3},{v:'단가',s:3},{v:'금액',s:3},{v:'비고',s:3}]];
 items.forEach((x,i)=>rows.push([{v:i+1,s:4},{v:x.name,s:4},{v:x.spec,s:4},{v:x.qty,s:2},{v:x.unit,s:2},{v:x.amt,s:2},{v:x.note,s:4}]));
 rows.push([],['','','','','공급가액',{v:t.supply,s:2}],['','','','','부가세',{v:t.vat,s:2}],['','','','','합계',{v:t.total,s:2}]);
 if(b.memo)rows.push([],['비고',String(b.memo)]);if(kind==='견적서')rows.push([],['유효기간',b.valid_until||'발행일로부터 30일']);
 return{rows,t};}
const ROUTES={
 '/api/kr-quote':b=>{const{rows,t}=quoteRows('견적서',b);return{bytes:xlsx('견적서',rows,[8,26,14,8,12,14,16],['A1:G1']),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',name:'quote.xlsx',meta:t};},
 '/api/kr-transaction-statement':b=>{const{rows,t}=quoteRows('거래명세서',b);return{bytes:xlsx('거래명세서',rows,[8,26,14,8,12,14,16],['A1:G1']),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',name:'transaction-statement.xlsx',meta:t};},
 '/api/kr-loan-agreement':b=>{const a=Number(b.amount);if(!b.lender||!b.borrower||!Number.isFinite(a)||a<=0)throw new Error('lender, borrower and amount are required');const L=b.lender,B=b.borrower;
  const body=para('차 용 증',{b:true,sz:40,center:true,after:300})+para('금 일금 '+won(a)+'원정 (₩'+fmt(a)+')',{b:true,sz:24,center:true,after:300})+
   para('위 금액을 아래 조건으로 차용하였음을 확인합니다.',{after:200})+
   table([['차용일',b.loan_date||''],['변제기일',b.due_date||''],['이자',b.interest_rate!=null?('연 '+b.interest_rate+'%'):'무이자'],['이자 지급일',b.interest_day||'-'],['변제 방법',b.repayment||'채권자 지정 계좌로 송금'],['특약',b.special_terms||'-']])+
   para('',{after:200})+para('1. 채무자는 변제기일까지 원금(및 약정 이자)을 채권자에게 지급한다.\n2. 변제기일까지 변제하지 아니한 때에는 지연 기간에 대하여 법정 이율 범위 내에서 지연손해금을 지급한다.\n3. 이 증서에 관한 분쟁은 채권자 주소지 관할 법원으로 한다.',{after:300})+
   para(b.date||new Date().toISOString().slice(0,10),{center:true,after:300})+
   table([['채권자',[L.name,L.birth||L.id_hint||'',L.address||'',L.phone||''].filter(Boolean).join(' / ')+'   (인)'],['채무자',[B.name,B.birth||B.id_hint||'',B.address||'',B.phone||''].filter(Boolean).join(' / ')+'   (인)']])+
   para('',{after:100})+para('※ 일반 서식 예시이며 법률 자문이 아닙니다. 중요한 거래는 전문가와 확인하세요.',{sz:16});
  return{bytes:docx(body),type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',name:'loan-agreement.docx',meta:{amount:a}};},
 '/api/kr-employment-contract':b=>{const E=b.employer||{},W=b.employee||{};if(!E.name||!W.name||!b.start_date||!b.wage)throw new Error('employer.name, employee.name, start_date and wage are required');
  const body=para('표준근로계약서',{b:true,sz:36,center:true,after:300})+
   para((E.name)+' (이하 "사업주"라 함)과(와) '+W.name+' (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.',{after:200})+
   table([['1. 근로계약기간',b.start_date+' 부터 '+(b.end_date?b.end_date+' 까지':'(기간의 정함이 없음)')],['2. 근무 장소',b.workplace||''],['3. 업무의 내용',b.job||''],['4. 소정근로시간',(b.work_start||'09:00')+' ~ '+(b.work_end||'18:00')+' (휴게시간 '+(b.break||'12:00 ~ 13:00')+')'],['5. 근무일/휴일','매주 '+(b.workdays||'5')+'일 근무, 주휴일 매주 '+(b.weekly_holiday||'일요일')],
    ['6. 임금',(b.wage_type||'월급')+' '+fmt(Number(b.wage))+'원'+(b.bonus?(' / 상여금 '+b.bonus):'')+(b.allowances?(' / 제수당 '+b.allowances):'')],['  임금지급일','매월 '+(b.pay_day||'10')+'일 (휴일의 경우 전일 지급)'],['  지급방법',b.pay_method||'근로자 명의 예금통장에 입금'],
    ['7. 연차유급휴가','근로기준법에서 정하는 바에 따라 부여함'],['8. 사회보험 적용',b.insurance||'고용보험, 산재보험, 국민연금, 건강보험'],['9. 근로계약서 교부','사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자의 교부요구와 관계없이 근로자에게 교부함'],['10. 기타','이 계약에 정함이 없는 사항은 근로기준법령에 의함']])+
   para('',{after:200})+para(b.date||new Date().toISOString().slice(0,10),{center:true,after:300})+
   table([['사업주','사업체명: '+E.name+(E.phone?' / 전화: '+E.phone:'')+'\n주소: '+(E.address||'')+'\n대표자: '+(E.representative||'')+'   (서명)'],['근로자','성명: '+W.name+(W.phone?' / 연락처: '+W.phone:'')+'\n주소: '+(W.address||'')+'   (서명)']])+
   para('',{after:100})+para('※ 고용노동부 표준근로계약서 항목을 따른 서식입니다. 법률 자문이 아니며, 최저임금·근로시간 등 법정 기준 준수 여부는 직접 확인하세요.',{sz:16});
  return{bytes:docx(body),type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',name:'employment-contract.docx',meta:{}};},
};

  return ROUTES;
})();

function home(p) { return p && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p; }
function outPath(p, def) {
  const o = home(p) || path.join(os.homedir(), 'Downloads', def);
  fs.mkdirSync(path.dirname(o), { recursive: true });
  return o;
}
const loadPdf = (f) => PDFLib.PDFDocument.load(fs.readFileSync(home(f)), { ignoreEncryption: true });

const TOOLS = [];
function tool(name, title, description, props, required, fn, ro) {
  TOOLS.push({
    name, title, description,
    inputSchema: { type: 'object', properties: props, required },
    annotations: { title, readOnlyHint: !!ro, destructiveHint: false, idempotentHint: !!ro, openWorldHint: false },
    fn,
  });
}
const S = (d) => ({ type: 'string', description: d });
const N = (d) => ({ type: 'number', description: d });
const kr = (route) => async (a) => { const r = KR[route](a); if (r.status >= 400) throw new Error(r.__json.error); return r.__json; };

tool('ko_romanize', 'Romanize Korean', 'Romanize Korean text (Revised Romanization, syllable by syllable, as used for personal names).', { text: S('Korean text'), capitalize: { type: 'boolean' } }, ['text'], kr('/api/ko-romanize'), true);
tool('ko_amount_words', 'Amount in Korean words', 'Write an amount in Korean words, e.g. 1234000 -> 일금 일백이십삼만사천원정.', { amount: N('Non-negative integer amount in won') }, ['amount'], kr('/api/ko-amount-words'), true);
tool('ko_josa', 'Korean particle', 'Attach the correct particle (은/는, 이/가, 을/를, 과/와, 으로/로 ...).', { word: S('Word'), pair: S('Particle pair, e.g. 을/를') }, ['word'], kr('/api/ko-josa'), true);
tool('ko_chosung', 'Korean initial consonants', 'Extract initial consonants (초성).', { text: S('Korean text') }, ['text'], kr('/api/ko-chosung'), true);
tool('kr_business_number', 'Korean business number check', 'Validate a Korean business registration number checksum (does not confirm registration).', { number: S('e.g. 220-81-62517') }, ['number'], kr('/api/kr-business-number'), true);
tool('ko_pii_mask', 'Mask Korean personal data', 'Mask resident registration numbers, phone numbers, emails and card numbers in text.', { text: S('Text') }, ['text'], kr('/api/ko-pii-mask'), true);
tool('text_case', 'Convert text case', 'Convert case: upper, lower, title, sentence, camel, pascal, snake, kebab, constant, dot.', { text: S('Text'), case: S('Target case') }, ['text', 'case'], kr('/api/text-case'), true);
tool('password_gen', 'Generate passwords', 'Generate random passwords locally.', { length: N('4-128, default 16'), count: N('1-20'), symbols: { type: 'boolean' } }, [], kr('/api/password-gen'), false);

tool('hash', 'Hash text or file', 'Hash text or a local file with sha256 (default), sha1, sha512 or md5.', { text: S('Text to hash'), file: S('Path to a local file'), algorithm: S('sha256 | sha1 | sha512 | md5') }, [], async (a) => {
  const alg = (a.algorithm || 'sha256').toLowerCase().replace('-', '');
  if (!['sha256', 'sha1', 'sha512', 'md5'].includes(alg)) throw new Error('unsupported algorithm');
  const h = nodeCrypto.createHash(alg);
  if (a.file) h.update(fs.readFileSync(home(a.file)));
  else if (typeof a.text === 'string') h.update(a.text);
  else throw new Error('text or file required');
  return { algorithm: alg, hash: h.digest('hex') };
}, true);
tool('base64', 'Base64 encode/decode', 'Encode or decode Base64 (UTF-8).', { text: S('Input'), mode: S('encode | decode') }, ['text'], async (a) => ({
  result: (a.mode || 'encode') === 'decode' ? Buffer.from(a.text, 'base64').toString('utf8') : Buffer.from(a.text, 'utf8').toString('base64'),
}), true);
tool('uuid', 'Generate UUIDs', 'Generate random UUID v4 values.', { count: N('1-100') }, [], async (a) => ({
  uuids: Array.from({ length: Math.min(Math.max(a.count || 1, 1), 100) }, () => nodeCrypto.randomUUID()),
}), false);
tool('json_format', 'Format or validate JSON', 'Pretty-print or minify JSON and report syntax errors.', { json: S('JSON text'), indent: N('Spaces, 0 = minify') }, ['json'], async (a) => {
  try { const o = JSON.parse(a.json); return { valid: true, formatted: JSON.stringify(o, null, a.indent === 0 ? undefined : (a.indent || 2)) }; }
  catch (e) { return { valid: false, error: e.message }; }
}, true);

tool('pdf_merge', 'Merge PDFs', 'Merge local PDF files into one. Files never leave this computer.', { files: { type: 'array', items: { type: 'string' }, description: 'Paths of PDFs in order' }, output: S('Output path (default ~/Downloads/merged.pdf)') }, ['files'], async (a) => {
  const out = await PDFLib.PDFDocument.create();
  for (const f of a.files) { const src = await loadPdf(f); (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p)); }
  const o = outPath(a.output, 'merged.pdf'); fs.writeFileSync(o, await out.save());
  return { output: o, pages: out.getPageCount() };
});
tool('pdf_info', 'PDF info', 'Page count and metadata of a local PDF.', { file: S('PDF path') }, ['file'], async (a) => {
  const d = await loadPdf(a.file);
  return { pages: d.getPageCount(), title: d.getTitle() || null, author: d.getAuthor() || null, producer: d.getProducer() || null };
}, true);
tool('pdf_extract_pages', 'Extract PDF pages', 'Save selected pages of a local PDF as a new PDF (e.g. "1-3,5").', { file: S('PDF path'), pages: S('Pages, e.g. 1-3,5'), output: S('Output path') }, ['file', 'pages'], async (a) => {
  const src = await loadPdf(a.file); const n = src.getPageCount(); const idx = [];
  for (const part of String(a.pages).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/); if (!m) throw new Error('bad pages value');
    const s = +m[1], e = +(m[2] || m[1]);
    for (let i = s; i <= e; i++) { if (i < 1 || i > n) throw new Error('page ' + i + ' out of range 1-' + n); idx.push(i - 1); }
  }
  const out = await PDFLib.PDFDocument.create(); (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
  const o = outPath(a.output, 'extracted.pdf'); fs.writeFileSync(o, await out.save());
  return { output: o, pages: idx.length };
});
tool('pdf_rotate', 'Rotate PDF', 'Rotate all pages of a local PDF by 90/180/270 degrees.', { file: S('PDF path'), angle: N('90, 180 or 270'), output: S('Output path') }, ['file'], async (a) => {
  const d = await loadPdf(a.file); const ang = [90, 180, 270].includes(+a.angle) ? +a.angle : 90;
  d.getPages().forEach((p) => p.setRotation(PDFLib.degrees((p.getRotation().angle + ang) % 360)));
  const o = outPath(a.output, 'rotated.pdf'); fs.writeFileSync(o, await d.save());
  return { output: o, angle: ang };
});

const docTool = (name, route, title, desc, ext, props, req) => tool(name, title, desc + ' Saves the file locally and returns its path.',
  { ...props, output: S('Output path (default ~/Downloads/' + name + '.' + ext + ')') }, req, async (a) => {
    const r = DOCS[route](a); const o = outPath(a.output, name + '.' + ext); fs.writeFileSync(o, Buffer.from(r.bytes));
    return { output: o, totals: r.meta };
  });
const party = { type: 'object', properties: { name: S('상호/이름'), business_number: S('사업자번호'), representative: S('대표자'), address: S('주소'), phone: S('전화') } };
const items = { type: 'array', items: { type: 'object', properties: { name: S('품목'), spec: S('규격'), qty: N('수량'), unit_price: N('단가'), note: S('비고') }, required: ['name', 'qty', 'unit_price'] } };
docTool('kr_quote', '/api/kr-quote', '견적서 (XLSX)', 'Create a Korean quotation (견적서) with VAT and amount in words.', 'xlsx', { from: party, to: party, date: S('YYYY-MM-DD'), items, vat: S('separate | included | none'), memo: S('비고'), valid_until: S('유효기간') }, ['items']);
docTool('kr_transaction_statement', '/api/kr-transaction-statement', '거래명세서 (XLSX)', 'Create a Korean transaction statement (거래명세서).', 'xlsx', { from: party, to: party, date: S('YYYY-MM-DD'), items, vat: S('separate | included | none') }, ['items']);
docTool('kr_loan_agreement', '/api/kr-loan-agreement', '차용증 (DOCX)', 'Create a Korean IOU / loan agreement (차용증). General template, not legal advice.', 'docx', { lender: party, borrower: party, amount: N('금액'), loan_date: S('차용일'), due_date: S('변제기일'), interest_rate: N('연 이자율 %'), repayment: S('변제 방법'), special_terms: S('특약') }, ['lender', 'borrower', 'amount']);
docTool('kr_employment_contract', '/api/kr-employment-contract', '표준근로계약서 (DOCX)', 'Create a Korean standard employment contract (표준근로계약서). General template, not legal advice.', 'docx', { employer: party, employee: party, start_date: S('시작일'), end_date: S('종료일'), workplace: S('근무장소'), job: S('업무'), wage: N('임금'), wage_type: S('월급/시급'), pay_day: N('지급일') }, ['employer', 'employee', 'start_date', 'wage']);

// ---- stdio JSON-RPC ----
const send = (m) => process.stdout.write(JSON.stringify(m) + '\n');
const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: VERSIONS.includes(params && params.protocolVersion) ? params.protocolVersion : VERSIONS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'tools-that-dont-upload-local', title: "Tools That Don't Upload (local)", version: '1.0.0' }, instructions: 'All tools run on this computer. Nothing is uploaded. File tools take local paths and save results to ~/Downloads by default.' } });
  if (typeof method === 'string' && method.startsWith('notifications/')) return;
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS.map(({ fn, ...t }) => t) } });
  if (method === 'tools/call') {
    const t = TOOLS.find((x) => x.name === (params && params.name));
    if (!t) return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Unknown tool: ' + (params && params.name) }], isError: true } });
    try { const r = await t.fn((params && params.arguments) || {}); return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r, isError: false } }); }
    catch (e) { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true } }); }
  }
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => {
  buf += d; let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
    handle(m).catch((e) => send({ jsonrpc: '2.0', id: m.id === undefined ? null : m.id, error: { code: -32603, message: e.message } }));
  }
});
