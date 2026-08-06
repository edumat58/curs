"use strict";(self.webpackChunkedumat_58=self.webpackChunkedumat_58||[]).push([[3249,6061,8401],{1304:(e,a,r)=>{r.d(a,{A:()=>oa});var i=r(57),t=r(96540);const n="media_rEkE",s="mediaTitle_Y8X5",l="player_lsHp",c="transcript_dXTK",o="transcriptBody_TQCL",d="figure_GhPV",u="figureImage_Bxa3",h="figureCaption_VCyW",m="figureDescription_Mj1L",p="figureDescriptionBody_D63q",x="audioDescription_tNl8";var g=r(74848);function f({title:e="Transcriere",children:a,defaultOpen:r=!0}){return(0,g.jsxs)("details",{className:c,"data-edupasi-transcript":!0,open:r||void 0,children:[(0,g.jsx)("summary",{children:e}),(0,g.jsx)("div",{className:o,children:a})]})}var b=r(48374),j=r(98584);const v="wrap_TF6J",N="tabel_Gawk",_="cap_BKzF",y="capIntreg_naUg",w="capZecimal_YcI8",k="capCifre_jAhj",$="rang_iUdC",C="rangText_IsQ2",A="bulina_kaFQ",z="capLateral_MjvD",S="capGol_0RPH",L="valoare_a9sB",B="celulaCifra_Tibh",M="celulaVirgula_zTa2",T="celulaFractie_POVf",E="celulaRezultat_zLm5",I="cifra_I0pe",D="virgula_TBGP",R="gol_bJJP",O="randExemplu_dArS",P="tabelDescompunere_YCqW",U="bulaRand_Qx8O",F="bulaStanga_Nxhj",G="bulaDreapta_T4nJ",H="bula_OiDK",V="blocuri_SVnl",Z="virgulaBlocuri_HAsV",W="cifraBlocuri_VeCu",X="alaturi_MVIa",J="celulaPatrate_fB5M",K="patrate_qD83",Q="patrat_rwUI",Y="scara_IJcY",q="cartonas_XhkH",ee="cartonasCifra_dddB",ae="alunecare_Lhnv",re="alunecareCap_pe6r",ie="alunecareCifra_zj2B",te="alunecareEticheta_rldX",ne="operatie_F3pd",se="operatieCap_oQU8",le="operatieGrila_uHDV",ce="banda_i5rx",oe="operatieCifra_lnCo",de="operatieSemn_oXuX",ue="operatieLinie_vlo4",he="operatieEticheta_HX2v",me="operatieRezultat_vn7F",pe="operatii_V5XP",xe="schimb_D0UP",ge="schimbColoana_W_Z4",fe="schimbGrup_Vc7s",be="schimbCartonase_VNhC",je="schimbCartonas_E9CF",ve="schimbEticheta_Xbyz",Ne="schimbSageata_ZbKM",_e="schimbOperatie_rmG4",ye="schimbRegula_GCk5",we="schimbEgalitate_dLXC",ke="gelosia_aeza",$e="japoneza_mJs6",Ce="gelosiaCifraFactor_s_cK",Ae="gelosiaCifra_FRu3",ze="gelosiaRezultat_OPOY",Se="gelosiaCitire_qwDM",Le="inmultire_klPx",Be="inmultireRand_lJ9o",Me="inmultireCelula_Nwa8",Te="inmultireSemn_wmFK",Ee="inmultireLinie_kjlH",Ie={milioane:{eticheta:"Milioane",genitiv:"Milioanelor",valoare:"1 000 000",culoare:"#8a6fae"},sutedemii:{eticheta:"Sute de mii",genitiv:"Sutelor de mii",valoare:"100 000",culoare:"#6d7fb8"},zecidemii:{eticheta:"Zeci de mii",genitiv:"Zecilor de mii",valoare:"10 000",culoare:"#4f8fa8"},mii:{eticheta:"Unit\u0103\u021bi de mii",genitiv:"Unit\u0103\u021bilor de mii",valoare:"1 000",culoare:"#3f8f7e"},sute:{eticheta:"Sute",genitiv:"Sutelor",valoare:"100",culoare:"#b03a2a"},zeci:{eticheta:"Zeci",genitiv:"Zecilor",valoare:"10",culoare:"#5f9cbb"},unitati:{eticheta:"Unit\u0103\u021bi",genitiv:"Unit\u0103\u021bilor",valoare:"1",culoare:"#93a72f"},zecimi:{eticheta:"Zecimi",genitiv:"Zecimilor",valoare:"0,1",culoare:"#86b1b5"},sutimi:{eticheta:"Sutimi",genitiv:"Sutimilor",valoare:"0,01",culoare:"#c5808f"},miimi:{eticheta:"Miimi",genitiv:"Miimilor",valoare:"0,001",culoare:"#a9bd3f"}},De="sute zeci unitati zecimi sutimi miimi";function Re(e){return String(e).trim().split(/\s+/).filter((e=>Ie[e])).map((e=>({cheie:e,...Ie[e]})))}function Oe(e){return null==e?null:Array.isArray(e)?e.map((e=>"_"===e?"":String(e))):String(e).trim().split(/\s+/).map((e=>"_"===e?"":e))}function Pe(e){const a=String(e).split("/");return 2!==a.length?String(e):`\\dfrac{${r=a[0].trim(),String(r).replace(/\B(?=(\d{3})+(?!\d))/g,"\\,")}}{${a[1].trim()}}`;var r}function Ue({culoare:e,marime:a=14}){return(0,g.jsx)("span",{className:A,style:{background:e,width:a,height:a},"aria-hidden":"true"})}function Fe({cate:e,culoare:a}){return e?(0,g.jsx)("span",{className:K,"aria-hidden":"true",children:Array.from({length:e},((e,r)=>(0,g.jsx)("span",{className:Q,style:{background:a}},r)))}):null}function Ge({valoare:e}){return null==e?(0,g.jsx)("span",{className:R,"aria-label":"de completat"}):""===e?null:(0,g.jsx)("span",{className:I,children:e})}function He({cifre:e,ranguri:a=De,valori:r=!0,capete:i=!0,patrate:t=!1,virgulaDupa:n="unitati"}){const s=Re(a),l=Oe(e)||s.map((()=>null)),c=s.findIndex((e=>e.cheie===n))+1,o=c>0&&c<s.length,d=o?c:s.length,u=o?s.length-c:0,h=s.map(((e,a)=>({rang:e,cifra:l[a]??""}))),m=(e,a)=>o?[...e.slice(0,c),a,...e.slice(c)]:e;return(0,g.jsx)("div",{className:v,children:(0,g.jsx)("table",{className:N,children:(0,g.jsxs)("tbody",{children:[i&&(0,g.jsxs)("tr",{children:[(0,g.jsx)("th",{colSpan:d,className:`${_} ${y}`,children:"Partea \xeentreag\u0103"}),o&&(0,g.jsx)("th",{className:S,"aria-hidden":"true"}),u>0&&(0,g.jsx)("th",{colSpan:u,className:`${_} ${w}`,children:"Partea zecimal\u0103"})]}),(0,g.jsx)("tr",{children:m(h.map((({rang:e})=>(0,g.jsxs)("th",{className:$,scope:"col",children:[(0,g.jsx)(Ue,{culoare:e.culoare}),(0,g.jsx)("span",{className:C,children:e.eticheta})]},e.cheie))),(0,g.jsx)("th",{className:S,"aria-hidden":"true"},"virgula"))}),r&&(0,g.jsx)("tr",{children:m(h.map((({rang:e})=>(0,g.jsx)("td",{className:L,children:e.valoare},e.cheie))),(0,g.jsx)("td",{className:M,"aria-hidden":"true"},"virgula"))}),t&&(0,g.jsx)("tr",{children:m(h.map((({rang:e,cifra:a})=>(0,g.jsx)("td",{className:J,children:(0,g.jsx)(Fe,{cate:Number(a)||0,culoare:e.culoare})},e.cheie))),(0,g.jsx)("td",{className:M,"aria-hidden":"true"},"virgula"))}),(0,g.jsx)("tr",{children:m(h.map((({rang:e,cifra:a})=>(0,g.jsx)("td",{className:B,children:(0,g.jsx)(Ge,{valoare:void 0===a?null:a})},e.cheie))),(0,g.jsx)("td",{className:M,children:(0,g.jsx)("span",{className:D,children:","})},"virgula"))})]})})})}function Ve({randuri:e=[],ranguri:a=De,virgulaDupa:r="unitati"}){const i=Re(a),t=i.findIndex((e=>e.cheie===r))+1,n=t>0&&t<i.length,s=(e,a)=>n?[...e.slice(0,t),a,...e.slice(t)]:e,l=e.map((e=>{const[a="",r="",i=""]=String(e).split("|").map((e=>e.trim())),t=a.startsWith("*");return{fractie:t?a.slice(1).trim():a,cifre:r?Oe(r):null,rezultat:i,exemplu:t}}));return(0,g.jsx)("div",{className:v,children:(0,g.jsxs)("table",{className:`${N} ${P}`,children:[(0,g.jsxs)("thead",{children:[(0,g.jsxs)("tr",{children:[(0,g.jsxs)("th",{rowSpan:2,className:z,scope:"col",children:["Frac\u021bia",(0,g.jsx)("br",{}),"zecimal\u0103"]}),(0,g.jsx)("th",{colSpan:i.length+(n?1:0),className:`${_} ${k}`,children:"Cifra..."}),(0,g.jsxs)("th",{rowSpan:2,className:z,scope:"col",children:["Num\u0103rul",(0,g.jsx)("br",{}),"zecimal"]})]}),(0,g.jsx)("tr",{children:s(i.map((e=>(0,g.jsxs)("th",{className:$,scope:"col",children:[(0,g.jsx)(Ue,{culoare:e.culoare}),(0,g.jsx)("span",{className:C,children:e.genitiv})]},e.cheie))),(0,g.jsx)("th",{className:S,"aria-hidden":"true"},"virgula"))})]}),(0,g.jsx)("tbody",{children:l.map(((e,a)=>(0,g.jsxs)("tr",{className:e.exemplu?O:void 0,children:[(0,g.jsx)("td",{className:T,children:(0,g.jsx)(j.A,{children:Pe(e.fractie)})}),s(i.map(((a,r)=>(0,g.jsx)("td",{className:B,children:(0,g.jsx)(Ge,{valoare:e.cifre?e.cifre[r]:""})},a.cheie))),(0,g.jsx)("td",{className:M,children:(0,g.jsx)("span",{className:D,children:","})},"virgula")),(0,g.jsx)("td",{className:E,children:(0,g.jsx)(Ge,{valoare:e.rezultat})})]},a)))})]})})}function Ze({children:e,parte:a,coada:r}){const i="dreapta"===a||"stanga"===r||"dreapta"===r;return(0,g.jsx)("div",{className:`${U} ${i?G:F}`,children:(0,g.jsx)("div",{className:H,children:e})})}function We({cifre:e,ranguri:a=De,virgulaDupa:r="unitati",linii:i=!0,rezolvat:t=!1}){const n=Re(a),s=(Oe(e)||[]).map((e=>Number(e)||0)),l=n.findIndex((e=>e.cheie===r))+1,c=l>0&&l<n.length,o=22,d=e=>34*e+(c&&e>=l?26:0),u=27*Math.max(9,...s)+26,h=d(n.length-1)+o+6,m=u+(t?46:i?22:6),p=t?u+34:u+8,x=n.map(((e,a)=>`${s[a]||0} ${e.eticheta.toLowerCase()}`)).join(", "),f=c?`${s.slice(0,l).join("").replace(/^0+(?=\d)/,"")},${s.slice(l).join("")}`:s.join("").replace(/^0+(?=\d)/,"");return(0,g.jsxs)("svg",{className:V,viewBox:`0 0 ${h} ${m}`,width:h,height:m,role:"img","aria-label":t?`Cantitate desenat\u0103 cu p\u0103tr\u0103\u021bele: ${x}. Num\u0103rul zecimal este ${f}.`:`Cantitate desenat\u0103 cu p\u0103tr\u0103\u021bele: ${x}.`,children:[n.map(((e,a)=>(0,g.jsxs)("g",{children:[Array.from({length:s[a]||0},((r,i)=>(0,g.jsx)("rect",{x:d(a),y:27*i,width:o,height:o,fill:e.culoare,rx:"2"},i))),i&&(0,g.jsx)("line",{x1:d(a),y1:u,x2:d(a)+o,y2:u,stroke:e.culoare,strokeWidth:"3"}),t&&(0,g.jsx)("text",{className:W,x:d(a)+11,y:u+34,textAnchor:"middle",fill:e.culoare,children:s[a]||0})]},e.cheie))),c&&i&&(0,g.jsx)("text",{className:Z,x:d(l)-13-3,y:p,children:","})]})}function Xe({children:e}){return(0,g.jsx)("div",{className:X,children:e})}function Je({children:e}){return(0,g.jsx)("div",{className:pe,children:e})}function Ke({numere:e="1000 100 10 1 0,1 0,01 0,001"}){const a=Object.keys(Ie).indexOf("unitati"),r={};Object.entries(Ie).forEach((([e,a],i)=>{r[a.valoare.replace(/\s/g,"")]={...a,indice:i}}));const i=String(e).trim().split(/\s+/),t=i.map((e=>{const i=r[e.replace(/\s/g,"")];return i?Math.min(i.indice,a):a})),n=Math.min(...t),s=e=>{const a=[];for(const r of e.replace(/\s/g,""))","===r&&a.length?a[a.length-1]+=",":a.push(r);return a};return(0,g.jsx)("div",{className:Y,role:"img","aria-label":`Cartona\u0219e-numere, de la ${i[0]} p\xe2n\u0103 la ${i[i.length-1]}, fiecare cu un rang mai jos.`,children:i.map(((e,a)=>{const i=r[e.replace(/\s/g,"")];return(0,g.jsx)("div",{className:q,style:{marginLeft:2.3*(t[a]-n)+"rem"},children:s(e).map(((e,a)=>(0,g.jsx)("span",{className:ee,style:{color:i?i.culoare:"inherit"},children:e},a)))},e+a)}))})}function Qe({ranguri:e="zeci unitati zecimi sutimi miimi",numar:a="0,8",sageti:r=[{eticheta:"\xd7 10",pasi:1,sens:"stanga"},{eticheta:"\xd7 100",pasi:2,sens:"stanga"},{eticheta:"\xf7 100",pasi:2,sens:"dreapta"}]}){const i=Re(e),t=i.findIndex((e=>"unitati"===e.cheie)),n=108,s=i.length*n,l=124+46*r.length+10,c=e=>e*n+54,o=[];for(const g of String(a).replace(/\s/g,""))","===g&&o.length?o[o.length-1]+=",":o.push(g);const d=Math.max(0,t),u=d*n,h=o.length*n,m=d+o.length-1,p=46,x=`Tabel cu rangurile ${i.map((e=>e.valoare)).join(", ")}; num\u0103rul ${a} a\u0219ezat \xeen tabel, cu s\u0103ge\u021bi care arat\u0103 ${r.map((e=>e.eticheta)).join(", ")}.`;return(0,g.jsx)("div",{className:v,children:(0,g.jsxs)("svg",{viewBox:`0 0 ${s} ${l}`,width:s,height:l,className:ae,role:"img","aria-label":x,children:[i.map(((e,a)=>(0,g.jsxs)("g",{children:[(0,g.jsx)("rect",{x:a*n,y:0,width:n,height:46,fill:e.culoare,opacity:"0.85"}),(0,g.jsx)("text",{x:c(a),y:30,textAnchor:"middle",className:re,children:e.valoare})]},e.cheie))),(0,g.jsx)("rect",{x:0,y:p,width:s,height:l-p,fill:"none",stroke:"#8f8f97"}),i.map(((e,a)=>(0,g.jsx)("line",{x1:a*n,y1:p,x2:a*n,y2:l,stroke:"#8f8f97"},`l${e.cheie}`))),(0,g.jsx)("line",{x1:0,y1:124,x2:s,y2:124,stroke:"#8f8f97"}),(0,g.jsx)("rect",{x:u+6,y:54,width:h-12,height:62,fill:"var(--ifm-background-surface-color, #fff)",stroke:"#8f8f97",rx:"4"}),o.map(((e,a)=>(0,g.jsx)("text",{x:c(d+a),y:97,textAnchor:"middle",className:ie,children:e},a))),r.map(((e,a)=>{const r=124+46*a+23,t="stanga"===e.sens,n=m+(t?-e.pasi:e.pasi),s=c(m),l=c(Math.max(0,Math.min(i.length-1,n))),o=l,d=t?1:-1;return(0,g.jsxs)("g",{children:[(0,g.jsx)("line",{x1:s,y1:r,x2:o+10*d,y2:r,stroke:"currentColor",strokeWidth:"2"}),(0,g.jsx)("path",{d:`M${o} ${r} l${12*d} -6 v12 z`,fill:"currentColor"}),(0,g.jsx)("text",{x:s+(t?16:-16),y:r+6,textAnchor:t?"start":"end",className:te,children:e.eticheta})]},e.eticheta)}))]})})}function Ye({a:e,b:a,semn:r="+",rezultat:i,enunt:n=!1,eticheta:s,ranguri:l="sutedemii zecidemii mii sute zeci unitati zecimi sutimi miimi"}){const c=e=>String(e).replace(",","{,}"),o=e=>{const[a="",r=""]=String(e).trim().split(",");return{intreg:a,zecimal:r}},d=[e,a,i].filter(Boolean).map(o),u=Math.max(...d.map((e=>e.intreg.length))),h=Math.max(...d.map((e=>e.zecimal.length))),m=Object.entries(Ie),p=m.findIndex((([e])=>"unitati"===e)),x=new Set(String(l).trim().split(/\s+/)),f=[];for(let t=0;t<u;t+=1)f.push({tip:"cifra",pozitie:t-(u-1)});f.push({tip:"virgula"});for(let t=0;t<h;t+=1)f.push({tip:"cifra",pozitie:t+1});const j=(e,a)=>{if(!e)return"";const{intreg:r,zecimal:i}=o(e);if("virgula"===a.tip)return",";if(a.pozitie<=0){const e=r.length-1+a.pozitie;return e>=0?r[e]:""}return i[a.pozitie-1]||""},v=[{cheie:"a",numar:e,semn:""},{cheie:"b",numar:a,semn:r},{cheie:"r",numar:i,semn:"",rezultat:!0}];return(0,g.jsxs)("div",{className:ne,role:"img","aria-label":`${e} ${"+"===r?"plus":"minus"} ${a}${i?` egal ${i}`:""}`,children:[(s||n)&&(0,g.jsxs)("div",{className:se,children:[s&&(0,g.jsxs)("span",{className:he,children:[s,")"]}),n&&(0,g.jsx)(b.A,{math:`${c(e)} ${"-"===r?"-":"+"} ${c(a)}`})]}),(0,g.jsxs)("div",{className:le,style:{gridTemplateColumns:`1.4rem ${f.map((e=>"virgula"===e.tip?"0.7rem":"1.6rem")).join(" ")}`,gridTemplateRows:"repeat(3, auto)"},children:[f.map(((e,a)=>{const r="cifra"===e.tip?(e=>{const a=m[p+e];return a&&x.has(a[0])?a[1]:null})(e.pozitie):null;return(0,g.jsx)("span",{className:ce,style:{gridColumn:a+2,background:r?r.culoare:"transparent"}},`banda${a}`)})),v.map(((e,a)=>(0,g.jsxs)(t.Fragment,{children:[(0,g.jsx)("span",{className:de,style:{gridRow:a+1,gridColumn:1},children:e.semn}),f.map(((r,i)=>(0,g.jsx)("span",{className:`${oe} ${e.rezultat?me:""}`,style:{gridRow:a+1,gridColumn:i+2},children:j(e.numar,r)},`${e.cheie}${i}`)))]},e.cheie))),(0,g.jsx)("span",{className:ue,style:{gridRow:2,gridColumn:`1 / ${f.length+2}`}})]})]})}function qe({cate:e=6,din:a,catre:r,operatie:i="\xd7 10",regula:t}){const n=Object.keys(Ie),s=a=>{const r=(e=>n.indexOf("unitati")-n.indexOf(e))(a),i=String(e);if(r>=0)return i+"0".repeat(r);const t=-r;return i.length<=t?`0,${"0".repeat(t-i.length)}${i}`:`${i.slice(0,i.length-t)},${i.slice(i.length-t)}`},l=Ie[a],c=Ie[r];if(!l||!c)return null;const o=(a,r)=>(0,g.jsxs)("span",{className:fe,children:[(0,g.jsx)("span",{className:be,children:Array.from({length:e},((e,r)=>(0,g.jsx)("span",{className:je,style:{background:a.culoare},children:a.valoare},r)))}),(0,g.jsxs)("span",{className:ve,children:[e," ",a.eticheta.toLowerCase()]})]});return(0,g.jsxs)("div",{className:xe,role:"img","aria-label":`${e} ${l.eticheta.toLowerCase()} ${i} fac ${e} ${c.eticheta.toLowerCase()}: ${s(a)} ${i} = ${s(r)}`,children:[(0,g.jsxs)("div",{className:ge,children:[o(c),(0,g.jsxs)("span",{className:Ne,children:[(0,g.jsxs)("svg",{width:"18",height:"42",viewBox:"0 0 18 42","aria-hidden":"true",children:[(0,g.jsx)("line",{x1:"9",y1:"42",x2:"9",y2:"14",stroke:"currentColor",strokeWidth:"2"}),(0,g.jsx)("path",{d:"M9 0 L2 14 L16 14 Z",fill:"currentColor"})]}),(0,g.jsx)("span",{className:_e,children:i})]}),o(l)]}),t&&(0,g.jsx)("div",{className:ye,children:t}),(0,g.jsxs)("div",{className:we,children:[s(a)," ",i.replace("\xd7","\xd7").replace("\xf7","\xf7")," = ",s(r)]})]})}function ea(e){return String(e).replace(/\D/g,"").split("").map(Number)}function aa({a:e="987",b:a="987"}){const r=ea(e),i=ea(a),t=r.length,n=i.length,s=62,l=40+t*s+34,c=30+n*s+44,o=new Array(t+n).fill(0);for(let m=0;m<t;m+=1)for(let e=0;e<n;e+=1){const a=r[m]*i[e],s=t-1-m+(n-1-e);o[s]+=a%10,o[s+1]+=Math.floor(a/10)}let d=0;const u=o.map((e=>{const a=e+d;return d=Math.floor(a/10),a%10}));for(;d>0;)u.push(d%10),d=Math.floor(d/10);const h=u.slice().reverse().join("").replace(/^0+(?=\d)/,"").replace(/\B(?=(\d{3})+(?!\d))/g," ");return(0,g.jsxs)("div",{className:v,children:[(0,g.jsxs)("svg",{viewBox:`0 0 ${l} ${c}`,width:l,height:c,className:ke,role:"img","aria-label":`\xcenmul\u021bire per gelosia: ${e} ori ${a} egal ${h}.`,children:[r.map(((e,a)=>(0,g.jsx)("text",{x:40+a*s+31,y:21,textAnchor:"middle",className:Ce,children:e},`a${a}`))),i.map(((e,a)=>(0,g.jsx)("text",{x:40+t*s+12,y:30+a*s+31+6,className:Ce,children:e},`b${a}`))),r.map(((e,a)=>i.map(((r,i)=>{const t=e*r,n=40+a*s,l=30+i*s;return(0,g.jsxs)("g",{children:[(0,g.jsx)("rect",{x:n,y:l,width:s,height:s,fill:"none",stroke:"#8f8f97"}),(0,g.jsx)("line",{x1:n+s,y1:l,x2:n,y2:l+s,stroke:"#8f8f97"}),(0,g.jsx)("text",{x:n+.3*s,y:l+23.56,textAnchor:"middle",className:Ae,children:Math.floor(t/10)}),(0,g.jsx)("text",{x:n+44.64,y:l+53.32,textAnchor:"middle",className:Ae,children:t%10})]},`c${a}${i}`)})))),u.map(((e,a)=>{const r=u.length-1-a,i=r<n,t=i?21:40+(r-n)*s+31,l=i?30+r*s+31+8:30+n*s+32;return(0,g.jsx)("text",{x:t,y:l,textAnchor:"middle",className:ze,children:e},`r${a}`)}))]}),(0,g.jsxs)("div",{className:Se,children:["Se cite\u0219te ",e," \xd7 ",a," = ",h,"."]})]})}function ra({a:e="41",b:a="23"}){const r=ea(e),i=ea(a),t=["#b03a2a","#5f9cbb","#93a72f","#8a6fae"],n=e=>{const a=[];let r=0;return e.forEach(((e,i)=>{const t=[];for(let a=0;a<e;a+=1)t.push(r),r+=13;a.push(t),r+=30})),a},s=n(r),l=n(i),c=s.flat(),o=l.flat(),d=Math.max(...c,0),u=Math.max(...o,0),h=40,m=d+u+80,p=d+u+80,x=(e,a)=>({x:h+(a-e+d)/1,y:h+(e+a)/1}),f=[];s.forEach(((e,a)=>l.forEach(((t,n)=>{const s=[];e.forEach((e=>t.forEach((a=>s.push(x(e,a)))))),f.push({i:a,j:n,rang:a+n,cate:r[a]*i[n],puncte:s})}))));const b={};f.forEach((e=>{b[e.rang]=(b[e.rang]||0)+e.cate}));const j=r.length-1+(i.length-1),N=Object.keys(b).map(Number).sort(((e,a)=>a-e)),_=e=>10**(j-e),y=N.reduce(((e,a)=>e+b[a]*_(a)),0),w=(e,a,r)=>{if("a"===r){const a=x(e,Math.min(...o)-20),r=x(e,Math.max(...o)+20);return{x1:a.x,y1:a.y,x2:r.x,y2:r.y}}const i=x(Math.min(...c)-20,a),t=x(Math.max(...c)+20,a);return{x1:i.x,y1:i.y,x2:t.x,y2:t.y}},k=N.map((e=>`${b[e]} \xd7 ${_(e)}`)).join(" + ");return(0,g.jsxs)("div",{className:v,children:[(0,g.jsxs)("svg",{viewBox:`0 0 ${m} ${p}`,width:m,height:p,className:$e,role:"img","aria-label":`\xcenmul\u021bire japonez\u0103: ${e} ori ${a}, grupurile de intersec\u021bii dau ${y}.`,children:[s.map(((e,a)=>e.map(((e,r)=>{const i=w(e,null,"a");return(0,g.jsx)("line",{...i,stroke:t[a%t.length],strokeWidth:"1.6"},`a${a}${r}`)})))),l.map(((e,a)=>e.map(((e,r)=>{const i=w(null,e,"b");return(0,g.jsx)("line",{...i,stroke:t[(a+2)%t.length],strokeWidth:"1.6",strokeDasharray:"4 3"},`b${a}${r}`)})))),f.map((e=>e.puncte.map(((a,r)=>(0,g.jsx)("circle",{cx:a.x,cy:a.y,r:"3.4",fill:"#1c1a16"},`p${e.i}${e.j}${r}`)))))]}),(0,g.jsxs)("div",{className:Se,children:["Se cite\u0219te ",e," \xd7 ",a," = ",k," = ",y,"."]})]})}function ia({a:e,b:a,rezolvat:r=!1,eticheta:i}){const t=e=>(String(e).split(",")[1]||"").length,n=e=>String(e).replace(",","").replace(/\s/g,""),s=n(e),l=n(a),c=l.split("").map(Number).slice().reverse().map(((e,a)=>String(BigInt(s)*BigInt(e)*BigInt(10)**BigInt(a)))),o=(BigInt(s)*BigInt(l)).toString(),d=t(e)+t(a),u=0===d?o:`${o.slice(0,-d)||"0"},${o.slice(-d).padStart(d,"0")}`,h=[{semn:"",text:String(e)},{semn:"\xd7",text:String(a)},{linie:!0},...c.map(((e,a)=>({semn:a===c.length-1&&c.length>1?"+":"",text:e,ascuns:!r}))),{linie:!0},{semn:"=",text:u,ascuns:!r,rezultat:!0}],m=Math.max(...h.filter((e=>e.text)).map((e=>e.text.length)));return(0,g.jsxs)("div",{className:ne,children:[i&&(0,g.jsxs)("div",{className:se,children:[(0,g.jsxs)("span",{className:he,children:[i,")"]}),(0,g.jsx)(b.A,{math:`${String(e).replace(",","{,}")} \\times ${String(a).replace(",","{,}")}`})]}),(0,g.jsx)("div",{className:Le,role:"img","aria-label":`${e} ori ${a}${r?` egal ${u}`:""}, a\u0219ezate \xeen coloane`,children:h.map(((e,a)=>{if(e.linie)return(0,g.jsx)("span",{className:Ee},a);const r=(e.text||"").padStart(m," ").split("");return(0,g.jsxs)("div",{className:Be,children:[(0,g.jsx)("span",{className:Te,children:e.semn}),r.map(((a,r)=>(0,g.jsx)("span",{className:Me,children:e.ascuns?" "===a?"":(0,g.jsx)("span",{className:R}):" "===a?"":a},r)))]},a)}))})]})}var ta=r(40797),na=r(29030),sa=r(19524);function la(e){return String(e).trim().replace(/^\/+/,"").replace(/^docs\//,"").replace(/^parinti\//,"").replace(/\.mdx?$/,"")}function ca({resursa:e,cale:a}){const r=(0,na.Ay)(a);return(0,g.jsxs)("a",{href:r,target:"_blank",rel:"noopener noreferrer",children:["\u201e",e,'"']})}const oa={...i.A,EduPasiFigure:function({src:e,alt:a="",caption:r,description:i,audioDescriptionSrc:n,decorative:s=!1,defaultDescriptionOpen:l=!1,children:c}){const o=`edupasi-figure-description-${t.useId().replace(/:/g,"")}`,f=i||c||a;return(0,g.jsxs)("figure",{className:d,"data-edupasi-figure":!0,children:[(0,g.jsx)("img",{src:e,alt:s?"":a,"aria-describedby":s?void 0:o,"data-edupasi-decorative":s?"true":void 0,className:u}),r?(0,g.jsx)("figcaption",{className:h,children:r}):null,s?null:(0,g.jsxs)("details",{className:m,"data-edupasi-visual-description":!0,open:l||void 0,children:[(0,g.jsx)("summary",{children:"Descrierea imaginii"}),(0,g.jsxs)("div",{className:p,children:[(0,g.jsx)("p",{id:o,"data-edupasi-description-text":!0,children:f||(0,g.jsxs)(g.Fragment,{children:["Imaginea nu are \xeenc\u0103 o descriere. Completeaz\u0103 proprietatea"," ",(0,g.jsx)("code",{children:"description"})," ","\xeen lec\u021bia MDX."]})}),n?(0,g.jsx)("audio",{controls:!0,preload:"metadata",src:n,className:x,"aria-label":"Descriere audio a imaginii",children:"Browserul t\u0103u nu poate reda descrierea audio."}):null]})]})]})},EduPasiMedia:function({type:e="video",src:a,title:r,captionsSrc:i,captionsLabel:t="Rom\xe2n\u0103",poster:c,transcript:o,children:d}){const u="audio"===e;return(0,g.jsxs)("figure",{className:n,children:[r?(0,g.jsx)("figcaption",{className:s,children:r}):null,u?(0,g.jsx)("audio",{controls:!0,preload:"metadata",src:a,className:l,children:"Browserul t\u0103u nu poate reda acest fi\u0219ier audio."}):(0,g.jsxs)("video",{controls:!0,preload:"metadata",src:a,poster:c,className:l,children:[i?(0,g.jsx)("track",{kind:"captions",src:i,srcLang:"ro",label:t,default:!0}):null,"Browserul t\u0103u nu poate reda acest fi\u0219ier video."]}),o||d?(0,g.jsx)(f,{children:o||d}):null]})},EduPasiTranscript:f,TabelPozitional:He,TabelDescompunere:Ve,Bula:Ze,Blocuri:We,Alaturi:Xe,Operatii:Je,CartonaseNumere:Ke,TabelAlunecare:Qe,OperatieAsezata:Ye,InmultireAsezata:ia,SchimbRang:qe,Gelosia:aa,InmultireJaponeza:ra,ResurseParinti:function({fisier:e,fisiere:a,titlu:r}){const{siteConfig:i}=(0,ta.A)(),n=i.customFields&&i.customFields.resurseParinti||{},s=String(e||a||"").split(/[\s,]+/).filter(Boolean).map(la);if(0===s.length)return null;const l=s.map((e=>({k:e,date:n[e]}))),c=l.filter((e=>!e.date)).map((e=>e.k));return c.length&&"undefined"!=typeof console&&console.warn(`[ResurseParinti] nu exist\u0103 docs/parinti/${c.join(".mdx, docs/parinti/")}.mdx. Dac\u0103 fi\u0219ierul e nou, reporne\u0219te serverul de dev \u2014 catalogul se cite\u0219te la pornire.`),(0,g.jsx)(sa.A,{type:"soft",title:r||"ghidul p\u0103rintelui",children:(0,g.jsxs)("p",{children:["Resurse recomandate pentru p\u0103rin\u021bi sau pentru lucru asistat:"," ",(0,g.jsx)("b",{children:l.map(((e,a)=>(0,g.jsxs)(t.Fragment,{children:[a>0&&", ",e.date?(0,g.jsx)(ca,{resursa:e.date.titlu,cale:e.date.cale}):(0,g.jsxs)("em",{children:["docs/parinti/",e.k,".mdx (resurs\u0103 neg\u0103sit\u0103)"]})]},e.k)))})]})})}}},19524:(e,a,r)=>{r.d(a,{A:()=>T});r(96540);var i=r(60506),t=r(34164),n=r(50539),s=r(204);const l="admonition_Gfwi",c="admonitionHeading_f1Ed",o="admonitionIcon_kpSf",d="admonitionContent_UjKb";var u=r(74848);function h({type:e,className:a,children:r}){return(0,u.jsx)("div",{className:(0,t.A)(s.G.common.admonition,s.G.common.admonitionType(e),l,a),children:r})}function m({icon:e,title:a}){return(0,u.jsxs)("div",{className:c,children:[(0,u.jsx)("span",{className:o,children:e}),a]})}function p({children:e}){return e?(0,u.jsx)("div",{className:d,children:e}):null}function x(e){const{type:a,icon:r,title:i,children:t,className:n}=e;return(0,u.jsxs)(h,{type:a,className:n,children:[(0,u.jsx)(m,{title:i,icon:r}),(0,u.jsx)(p,{children:t})]})}function g(e){}const f={icon:(0,u.jsx)(g,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"cerin\u021b\u01ce"})};function b(e){return(0,u.jsx)(x,{...f,...e,className:(0,t.A)("alert alert--secondary",e.className),children:e.children})}function j(e){return(0,u.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})}const v={icon:(0,u.jsx)(j,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"definitie"})};function N(e){return(0,u.jsx)(x,{...v,...e,className:(0,t.A)("alert alert--success",e.className),children:e.children})}function _(e){return(0,u.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})}const y={icon:(0,u.jsx)(_,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function w(e){return(0,u.jsx)(x,{...y,...e,className:(0,t.A)("alert alert--info",e.className),children:e.children})}function k(e){return(0,u.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}const $={icon:(0,u.jsx)(k,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})};function C(e){return(0,u.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})}const A={icon:(0,u.jsx)(C,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})};const z={icon:(0,u.jsx)(k,{}),title:(0,u.jsx)(n.A,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})};function S(e){return(0,u.jsx)(x,{...z,...e,className:(0,t.A)("alert alert--warning",e.className),children:e.children})}function L(e){return(0,u.jsxs)("svg",{viewBox:"0 0 24 24",...e,children:[(0,u.jsx)("path",{transform:"translate(6.6 0.4) scale(0.45)",d:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"}),(0,u.jsx)("path",{d:"M4 13.2 A8 8 0 0 0 20 13.2 L17.3 13.2 A5.3 5.3 0 0 1 6.7 13.2 Z"})]})}const B={icon:(0,u.jsx)(L,{}),title:"recomandare"};const M={...{note:b,tip:N,info:w,warning:function(e){return(0,u.jsx)(x,{...$,...e,className:(0,t.A)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,u.jsx)(x,{...A,...e,className:(0,t.A)("alert alert--danger",e.className),children:e.children})},caution:S,soft:function(e){return(0,u.jsx)(x,{...B,...e,className:(0,t.A)("alert","admonition-soft",e.className),children:e.children})}},...{secondary:e=>(0,u.jsx)(b,{title:"secondary",...e}),important:e=>(0,u.jsx)(w,{title:"important",...e}),def:e=>(0,u.jsx)(N,{title:"def",...e}),caution:S}};function T(e){const a=(0,i.c)(e),r=(t=a.type,M[t]||(console.warn(`No admonition component found for admonition type "${t}". Using Info as fallback.`),M.info));var t;return(0,u.jsx)(r,{...a})}},20245:(e,a,r)=>{r.d(a,{A:()=>h});r(96540);var i=r(34164),t=r(204),n=r(93751),s=r(56289),l=r(29030),c=r(50539);const o={breadcrumbsContainer:"breadcrumbsContainer_Alpn"};var d=r(74848);function u(){const e=(0,l.Ay)("/");return(0,d.jsx)("li",{className:"breadcrumbs__item",children:(0,d.jsx)(s.A,{"aria-label":(0,c.T)({id:"theme.docs.breadcrumbs.home",message:"Home page",description:"The ARIA label for the home page in the breadcrumbs"}),className:"breadcrumbs__link",href:e,children:(0,d.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{verticalAlign:"middle",display:"inline-block"},"aria-hidden":"true",children:[(0,d.jsx)("path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}),(0,d.jsx)("path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"})]})})})}function h(){const e=(0,n.OF)();return e?(0,d.jsx)("nav",{className:(0,i.A)(t.G.docs.docBreadcrumbs,o.breadcrumbsContainer),"aria-label":(0,c.T)({id:"theme.docs.breadcrumbs.navAriaLabel",message:"Breadcrumbs",description:"The ARIA label for the breadcrumbs"}),children:(0,d.jsxs)("ul",{className:"breadcrumbs",children:[(0,d.jsx)(u,{}),e.map(((a,r)=>{const t=r===e.length-1,n="category"===a.type&&a.linkUnlisted?void 0:a.href;return(0,d.jsx)("li",{className:(0,i.A)("breadcrumbs__item",{"breadcrumbs__item--active":t}),children:t?(0,d.jsx)("span",{className:"breadcrumbs__link",children:a.label}):n?(0,d.jsx)(s.A,{className:"breadcrumbs__link",href:n,children:a.label}):(0,d.jsx)("span",{className:"breadcrumbs__link",children:a.label})},r)}))]})}):null}},54344:(e,a,r)=>{r.d(a,{A:()=>z});var i=r(96540),t=r(34164),n=r(21532),s=r(204),l=r(17081),c=r(56239),o=r(74848);const d=n.Ay.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`,u=n.Ay.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
`,h=n.Ay.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #000;
  }
`,m=n.Ay.h2`
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.25rem;
`,p=n.Ay.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,x=n.Ay.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,g=n.Ay.label`
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
`,f=n.Ay.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`,b=n.Ay.textarea`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`,j=n.Ay.button`
  background: linear-gradient(45deg, #8b5cf6, #06b6d4);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${e=>e.disabled?"not-allowed":"pointer"};
  opacity: ${e=>e.disabled?.7:1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: ${e=>e.disabled?"none":"translateY(-2px)"};
    box-shadow: ${e=>e.disabled?"none":"0 5px 15px rgba(139, 92, 246, 0.3)"};
  }
  
  &:active {
    transform: ${e=>e.disabled?"none":"translateY(0)"};
  }
`,v=n.Ay.div`
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-weight: 500;
  text-align: center;
  
  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
`,N=(n.Ay.div`
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #bbdefb;
  font-size: 0.875rem;
  line-height: 1.4;
`,({isOpen:e,onClose:a})=>{const[r,t]=(0,i.useState)(""),[n,s]=(0,i.useState)(""),[l,c]=(0,i.useState)(!1),[N,_]=(0,i.useState)(!1),[y,w]=(0,i.useState)("");(0,i.useEffect)((()=>{e&&(t(window.location.href),_(!1),w(""))}),[e]);return e?(0,o.jsx)(d,{onClick:e=>{e.target===e.currentTarget&&a()},children:(0,o.jsxs)(u,{onClick:e=>e.stopPropagation(),children:[(0,o.jsx)(h,{onClick:a,disabled:l,children:"\xd7"}),(0,o.jsx)(m,{children:"Raporteaz\u0103 o eroare \xeen curs"}),N&&(0,o.jsx)(v,{className:"success",children:"Raportul a fost trimis automat cu succes! Se \xeenchide automat..."}),y&&(0,o.jsxs)(v,{className:"error",children:["\u274c ",y]}),(0,o.jsxs)(p,{onSubmit:async e=>{e.preventDefault(),c(!0),w(""),console.log("DEBUG: Starting email submission to backend");try{const e={pageUrl:r,description:n||"Nu a fost furnizat\u0103 o descriere."};console.log("DEBUG: Request data prepared:",e);const i=await fetch("https://backend-deussebyum11724s-projects.vercel.app/send-error-report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),t=await i.json();if(console.log("DEBUG: Backend response:",t),!i.ok||!t.success)throw new Error(t.message||"Backend returned error");console.log("DEBUG: Email sent successfully via nodemailer backend"),_(!0),setTimeout((()=>{a()}),2e3)}catch(y){console.error("DEBUG: Error sending email via backend:",y),w("Eroare la trimiterea email-ului. Verifica\u021bi configura\u021bia backend-ului.")}finally{c(!1),console.log("DEBUG: Submission process completed")}},children:[(0,o.jsxs)(x,{children:[(0,o.jsx)(g,{children:"URL Pagin\u0103"}),(0,o.jsx)(f,{type:"text",value:r,readOnly:!0,style:{backgroundColor:"#f8f9fa",color:"#6c757d"},disabled:l})]}),(0,o.jsxs)(x,{children:[(0,o.jsx)(g,{children:"Descrie problema (op\u021bional)"}),(0,o.jsx)(b,{placeholder:"Descrie\u021bi problema \xeent\xe2lnit\u0103 \xeen aceast\u0103 pagin\u0103...",value:n,onChange:e=>s(e.target.value),disabled:l})]}),(0,o.jsx)(j,{type:"submit",disabled:l||N,children:l?"Se trimite...":N?"Trimis cu succes!":"Trimite raportul automat"})]})]})}):null});var _=r(56289),y=r(56347),w=r(61934);const k={bar:"bar_TK02",inner:"inner_Z8PD",navBtn:"navBtn_CT2l",cuprinsBtn:"cuprinsBtn_FQ9d",navRight:"navRight_JpQb",disabled:"disabled_BALc",arrow:"arrow_KpsS",btnTitle:"btnTitle_TKvp",btnShort:"btnShort_L7lM",layersIcon:"layersIcon_rurV"};function $({prev:e,next:a}){const r=(0,y.zy)(),[t,n]=i.useState((()=>!!w.A.canUseDOM&&"true"===localStorage.getItem("hideUI"))),[s,l]=i.useState(!1),c=i.useRef(null);if(i.useEffect((()=>{l(!0);const e=()=>n("true"===localStorage.getItem("hideUI"));return window.addEventListener("storage",e),window.addEventListener("uiToggle",e),()=>{window.removeEventListener("storage",e),window.removeEventListener("uiToggle",e)}}),[]),i.useEffect((()=>{const e=document.documentElement,a=c.current;if(!s||t||!a)return void e.style.setProperty("--lessonbar-height","0px");const r=()=>{const r=Math.round(a.getBoundingClientRect().height);e.style.setProperty("--lessonbar-height",`${r}px`)};r();const i=new ResizeObserver(r);return i.observe(a),window.addEventListener("resize",r),()=>{i.disconnect(),window.removeEventListener("resize",r)}}),[s,t]),!s||t)return null;const d=function(e){if(/\/docs\/edupasi(\/|$)/.test(e))return{label:"Hub EduPASI",href:"/curs/edupasi"};const a=e.match(/\/docs\/c([5-8])(\/|$)/);return a?{label:"Cuprins",href:`/curs/docs/category/${{5:"curs-v",6:"curs-vi",7:"curs-vii",8:"curs-viii"}[a[1]]}`}:null}(r.pathname);return(0,o.jsx)("nav",{ref:c,className:k.bar,"aria-label":"Navigare \xeentre lec\u021bii",children:(0,o.jsxs)("div",{className:k.inner,children:[e?(0,o.jsxs)(_.A,{className:k.navBtn,to:e.permalink,"aria-label":`Lec\u021bia anterioar\u0103: ${e.title}`,children:[(0,o.jsx)("span",{"aria-hidden":!0,className:k.arrow,children:"\u2190"}),(0,o.jsx)("span",{className:k.btnTitle,children:e.title}),(0,o.jsx)("span",{className:k.btnShort,children:"\xcenapoi"})]}):(0,o.jsxs)("span",{className:`${k.navBtn} ${k.disabled}`,"aria-hidden":!0,children:[(0,o.jsx)("span",{className:k.arrow,children:"\u2190"}),(0,o.jsx)("span",{className:k.btnTitle,children:"Prima lec\u021bie"}),(0,o.jsx)("span",{className:k.btnShort,children:"\xcenapoi"})]}),d?(0,o.jsxs)(_.A,{className:k.cuprinsBtn,to:d.href,onClick:e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent("edupasi:open-toc"))},children:[(0,o.jsx)("span",{"aria-hidden":!0,className:k.layersIcon,children:(0,o.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("polygon",{points:"12 2 2 7 12 12 22 7 12 2"}),(0,o.jsx)("polyline",{points:"2 17 12 22 22 17"}),(0,o.jsx)("polyline",{points:"2 12 12 17 22 12"})]})}),(0,o.jsx)("span",{children:"Cuprins"})]}):null,a?(0,o.jsxs)(_.A,{className:`${k.navBtn} ${k.navRight}`,to:a.permalink,"aria-label":`Lec\u021bia urm\u0103toare: ${a.title}`,children:[(0,o.jsx)("span",{className:k.btnTitle,children:a.title}),(0,o.jsx)("span",{className:k.btnShort,children:"\xcenainte"}),(0,o.jsx)("span",{"aria-hidden":!0,className:k.arrow,children:"\u2192"})]}):(0,o.jsxs)("span",{className:`${k.navBtn} ${k.navRight} ${k.disabled}`,"aria-hidden":!0,children:[(0,o.jsx)("span",{className:k.btnTitle,children:"Ultima lec\u021bie"}),(0,o.jsx)("span",{className:k.btnShort,children:"\xcenainte"}),(0,o.jsx)("span",{className:k.arrow,children:"\u2192"})]})]})})}const C=n.Ay.div`
  display: inline-flex;
  align-items: center;
  margin-left: 1rem;

  .button {
    --black-700: hsla(0 0% 12% / 1);
    --border_radius: 12px;
    --transtion: 0.3s ease-in-out;
    --offset: 2px;

    cursor: pointer;
    position: relative;

    display: flex;
    align-items: center;
    gap: 0.375rem;

    transform-origin: center;

    padding: 0.5rem 1rem;
    background-color: transparent;

    border: 2px solid transparent;
    border-radius: var(--border_radius);
    transform: scale(calc(1 + (var(--active, 0) * 0.1)));

    transition: transform var(--transtion);
    
    background: linear-gradient(45deg, #14171a, #1c2024) padding-box,
                linear-gradient(45deg, #e8590c, #c2540a, #e8590c) border-box;
    animation: borderGradient 3s linear infinite;
  }

  .button::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    height: 100%;
    background-color: var(--black-700);

    border-radius: calc(var(--border_radius) - 2px);
    box-shadow: inset 0 0.5px hsl(0, 0%, 100%), inset 0 -1px 2px 0 hsl(0, 0%, 0%),
      0px 4px 10px -4px hsla(0 0% 0% / calc(1 - var(--active, 0))),
      0 0 0 calc(var(--active, 0) * 0.375rem) hsl(260 97% 50% / 0.75);

    transition: all var(--transtion);
    z-index: 0;
  }

  .button::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    height: 100%;
    background-color: hsla(260 97% 61% / 0.75);
    background-image: radial-gradient(
        at 51% 89%,
        hsla(266, 45%, 74%, 1) 0px,
        transparent 50%
      ),
      radial-gradient(at 100% 100%, hsla(266, 36%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 22% 91%, hsla(266, 36%, 60%, 1) 0px, transparent 50%);
    background-position: top;

    opacity: var(--active, 0);
    border-radius: calc(var(--border_radius) - 2px);
    transition: opacity var(--transtion);
    z-index: 2;
  }

  @keyframes borderGradient {
    0% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #e8590c, #c2540a, #e8590c) border-box;
    }
    33% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #c2540a, #e8590c, #c2540a) border-box;
    }
    66% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #e8590c, #c2540a, #e8590c) border-box;
    }
    100% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #c2540a, #e8590c, #c2540a) border-box;
    }
  }

  .button:is(:hover, :focus-visible) {
    --active: 1;
  }
  .button:active {
    transform: scale(1);
  }

  .button .dots_border {
    --size_border: calc(100% + 2px);

    overflow: hidden;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: var(--size_border);
    height: var(--size_border);
    background-color: transparent;

    border-radius: var(--border_radius);
    z-index: -10;
  }

  .button .dots_border::before {
    content: "";
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    transform-origin: left;
    transform: rotate(0deg);

    width: 100%;
    height: 2rem;
    background-color: white;

    mask: linear-gradient(transparent 0%, white 120%);
    animation: rotate 2s linear infinite;
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .button .sparkle {
    position: relative;
    z-index: 10;

    width: 1.25rem;
    height: 1.25rem;
  }

  .button .sparkle .path {
    fill: currentColor;
    stroke: currentColor;

    transform-origin: center;

    color: hsl(0, 0%, 100%);
  }

  .button:is(:hover, :focus) .sparkle .path {
    animation: path 1.5s linear 0.5s infinite;
  }

  .button .sparkle .path:nth-child(1) {
    --scale_path_1: 1.2;
  }
  .button .sparkle .path:nth-child(2) {
    --scale_path_2: 1.2;
  }
  .button .sparkle .path:nth-child(3) {
    --scale_path_3: 1.2;
  }

  @keyframes path {
    0%,
    34%,
    71%,
    100% {
      transform: scale(1);
    }
    17% {
      transform: scale(var(--scale_path_1, 1));
    }
    49% {
      transform: scale(var(--scale_path_2, 1));
    }
    83% {
      transform: scale(var(--scale_path_3, 1));
    }
  }

  .button .text_button {
    position: relative;
    z-index: 10;

    background-image: linear-gradient(
      90deg,
      hsla(0 0% 100% / 1) 0%,
      hsla(0 0% 100% / var(--active, 0)) 120%
    );
    background-clip: text;

    font-size: 0.875rem;
    font-weight: 500;
    color: transparent;
    white-space: nowrap;
  }
`,A=({onShowForm:e})=>{const[a,r]=i.useState((()=>!!w.A.canUseDOM&&"true"===localStorage.getItem("hideUI")));return i.useEffect((()=>{const e=()=>{r("true"===localStorage.getItem("hideUI"))};return window.addEventListener("storage",e),window.addEventListener("uiToggle",e),()=>{window.removeEventListener("storage",e),window.removeEventListener("uiToggle",e)}}),[]),a?null:(0,o.jsx)(C,{children:(0,o.jsxs)("button",{className:"button",onClick:e,children:[(0,o.jsx)("div",{className:"dots_border"}),(0,o.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",className:"sparkle",children:[(0,o.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"}),(0,o.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"}),(0,o.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"})]}),(0,o.jsxs)("span",{className:"text_button",children:["Raporteaz\u0103 o eroare ",(0,o.jsx)("br",{})," \xeen curs"]})]})})};function z(){const{metadata:e}=(0,l.u)(),{tags:a}=e,r=a.length>0,[n,d]=(0,i.useState)(!1);return(0,o.jsxs)("footer",{className:(0,t.A)(s.G.docs.docFooter,"docusaurus-mt-lg"),children:[r&&(0,o.jsx)("div",{className:(0,t.A)("row margin-top--sm",s.G.docs.docFooterTagsRow),children:(0,o.jsx)("div",{className:"col",children:(0,o.jsx)(c.A,{tags:a})})}),(0,o.jsxs)("div",{className:(0,t.A)("margin-top--sm",s.G.docs.docFooterEditMetaRow),style:{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"0.75rem",fontWeight:"bold",textAlign:"left",opacity:1,letterSpacing:"0.10em"},children:[(0,o.jsx)("div",{children:"prof. ing. BRI\u0218AN Andrei-Sebastian"}),(0,o.jsx)(A,{onShowForm:()=>d(!0)})]}),(0,o.jsx)(N,{isOpen:n,onClose:()=>d(!1)}),(0,o.jsx)($,{prev:e.previous,next:e.next})]})}},98584:(e,a,r)=>{r.d(a,{A:()=>n});r(96540);var i=r(48374),t=r(74848);function n({children:e}){return(0,t.jsx)(i.A,{block:!0,math:e})}}}]);