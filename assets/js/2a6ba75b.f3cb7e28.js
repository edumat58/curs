"use strict";(self.webpackChunkedumat_58=self.webpackChunkedumat_58||[]).push([[8061],{8054:(e,r,i)=>{i.d(r,{A:()=>o});var a=i(6540),n=i(2130);function t(){return(t=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var i=arguments[r];for(var a in i)Object.prototype.hasOwnProperty.call(i,a)&&(e[a]=i[a])}return e}).apply(this,arguments)}const d=(0,a.memo)((function(e){var r=e.children,i=e.math,d=e.block,l=e.errorColor,o=e.renderError,c=e.settings,s=e.as,u=function(e,r){if(null==e)return{};var i,a,n={},t=Object.keys(e);for(a=0;a<t.length;a++)r.indexOf(i=t[a])>=0||(n[i]=e[i]);return n}(e,["children","math","block","errorColor","renderError","settings","as"]),p=s||(d?"div":"span"),m=null!=r?r:i,x=(0,a.useState)({innerHtml:""}),h=x[0],g=x[1];return(0,a.useEffect)((function(){try{var e=n.Ay.renderToString(m,t({displayMode:!!d,errorColor:l,throwOnError:!!o},c));g({innerHtml:e})}catch(e){if(!(e instanceof n.Ay.ParseError||e instanceof TypeError))throw e;g(o?{errorElement:o(e)}:{innerHtml:e.message})}}),[d,m,l,o,c]),"errorElement"in h?h.errorElement:a.createElement(p,Object.assign({},u,{dangerouslySetInnerHTML:{__html:h.innerHtml}}))}));var l=i(4848);function o({children:e}){return(0,l.jsx)(d,{block:!0,math:e})}},9980:(e,r,i)=>{i.r(r),i.d(r,{assets:()=>c,contentTitle:()=>o,default:()=>p,frontMatter:()=>l,metadata:()=>a,toc:()=>s});const a=JSON.parse('{"id":"c6/02","title":"02 - Intervale, compara\u021bii \u0219i aproxim\u0103ri","description":"","source":"@site/docs/c6/02.md","sourceDirName":"c6","slug":"/c6/02","permalink":"/curs/docs/c6/02","draft":false,"unlisted":false,"editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/c6/02.md","tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2,"slug":"/c6/02","description":""},"sidebar":"tutorialSidebar","previous":{"title":"01 - Mul\u021bimi de numere","permalink":"/curs/docs/c6/01"},"next":{"title":"03 - Propor\u021bii \u0219i procente","permalink":"/curs/docs/c6/03"}}');var n=i(4848),t=i(8453),d=i(8054);const l={sidebar_position:2,slug:"/c6/02",description:""},o="02 - Intervale, compara\u021bii \u0219i aproxim\u0103ri",c={},s=[{value:"Tipuri de intervale",id:"tipuri-de-intervale",level:2},{value:"Citirea intervalelor",id:"citirea-intervalelor",level:3},{value:"Simboluri de compara\u021bie",id:"simboluri-de-compara\u021bie",level:2},{value:"Intervale \u0219i compara\u021bii combinate",id:"intervale-\u0219i-compara\u021bii-combinate",level:2},{value:"Aproxim\u0103ri",id:"aproxim\u0103ri",level:2},{value:"Descompunerea unui num\u0103r zecimal",id:"descompunerea-unui-num\u0103r-zecimal",level:3}];function u(e){const r={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",hr:"hr",p:"p",pre:"pre",strong:"strong",...(0,t.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.header,{children:(0,n.jsx)(r.h1,{id:"02---intervale-compara\u021bii-\u0219i-aproxim\u0103ri",children:"02 - Intervale, compara\u021bii \u0219i aproxim\u0103ri"})}),"\n",(0,n.jsx)(r.admonition,{title:"Recomandare",type:"tip",children:(0,n.jsx)(r.p,{children:(0,n.jsxs)(r.strong,{children:["A se parcurge \xeen paralel cu ",(0,n.jsx)(r.a,{href:"/curs/docs/c7/02",children:"CLASA VII - CURS 02"})," pentru o mai bun\u0103 \xeen\u021belegere a propriet\u0103\u021bilor numerice."]})})}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h2,{id:"tipuri-de-intervale",children:"Tipuri de intervale"}),"\n",(0,n.jsx)(r.admonition,{title:"Important",type:"info",children:(0,n.jsx)(d.A,{children:String.raw`
\begin{aligned}
& \text{1.}\quad [a,b] \quad \text{- interval închis}\\[6pt]
& \text{2.}\quad (a,b) \quad \text{- interval deschis}\\[6pt]
& \text{3.}\quad [a,b) \quad \text{- interval închis la stânga, deschis la dreapta}\\[6pt]
& \text{4.}\quad (a,b] \quad \text{- interval deschis la stânga, închis la dreapta}
\end{aligned}
`})}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h3,{id:"citirea-intervalelor",children:"Citirea intervalelor"}),"\n",(0,n.jsx)(d.A,{children:String.raw`
\begin{aligned}
& [a,b] \quad \text{de la a (inclusiv) până la b (inclusiv)}\\[6pt]
& [a,b) \quad \text{de la a (inclusiv) până la b (fără)}\\[6pt]
& (a,b) \quad \text{de la a (fără) până la b (fără)}
\end{aligned}
`}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h2,{id:"simboluri-de-compara\u021bie",children:"Simboluri de compara\u021bie"}),"\n",(0,n.jsx)(r.admonition,{title:"Important",type:"info",children:(0,n.jsx)(d.A,{children:String.raw`
\begin{aligned}
& < \quad \text{mai mic}\\[6pt]
& > \quad \text{mai mare}\\[6pt]
& \leq \quad \text{mai mic sau egal}\\[6pt]
& \geq \quad \text{mai mare sau egal}
\end{aligned}
`})}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h2,{id:"intervale-\u0219i-compara\u021bii-combinate",children:"Intervale \u0219i compara\u021bii combinate"}),"\n",(0,n.jsxs)(r.admonition,{title:"Leg\u0103tura dintre inegalit\u0103\u021bi \u0219i intervale",type:"note",children:[(0,n.jsx)(r.p,{children:"Exemplu: Avem un num\u0103r (x) cuprins \xeentre (a) \u0219i (b):"}),(0,n.jsx)(d.A,{children:String.raw`
\begin{aligned}
& \text{1.}\quad a \leq x \leq b \quad \Leftrightarrow \quad x \in [a,b]\\[6pt]
& \text{2.}\quad a \leq x < b \quad \Leftrightarrow \quad x \in [a,b)\\[6pt]
& \text{3.}\quad a < x \leq b \quad \Leftrightarrow \quad x \in (a,b]\\[6pt]
& \text{4.}\quad a < x < b \quad \Leftrightarrow \quad x \in (a,b)
\end{aligned}
`}),(0,n.jsx)(r.p,{children:"Alte cazuri frecvente:"}),(0,n.jsx)(d.A,{children:String.raw`
\begin{aligned}
& \text{5.}\quad x \geq a \quad \Leftrightarrow \quad x \in [a,+\infty)\\[6pt]
& \text{6.}\quad x > a \quad \Leftrightarrow \quad x \in (a,+\infty)\\[6pt]
& \text{7.}\quad x \leq b \quad \Leftrightarrow \quad x \in (-\infty,b]\\[6pt]
& \text{8.}\quad x < b \quad \Leftrightarrow \quad x \in (-\infty,b)
\end{aligned}
`})]}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h2,{id:"aproxim\u0103ri",children:"Aproxim\u0103ri"}),"\n",(0,n.jsxs)(r.admonition,{title:"Inferioare \u0219i superioare",type:"info",children:[(0,n.jsxs)(r.p,{children:["Dac\u0103 avem num\u0103rul : ",(0,n.jsx)(r.code,{children:"5,73"})]}),(0,n.jsxs)(r.p,{children:["Aproximare superioar\u0103: ",(0,n.jsx)(r.code,{children:"6"})," (partea \xeentreag\u0103 urm\u0103toare)"]}),(0,n.jsxs)(r.p,{children:["Aproximare inferioar\u0103: ",(0,n.jsx)(r.code,{children:"5"})," (partea \xeentreag\u0103 anterioar\u0103)"]})]}),"\n",(0,n.jsx)(r.hr,{}),"\n",(0,n.jsx)(r.h3,{id:"descompunerea-unui-num\u0103r-zecimal",children:"Descompunerea unui num\u0103r zecimal"}),"\n",(0,n.jsx)(d.A,{children:String.raw`
5{,}73 = \text{parte întreagă } (5) \quad + \quad \text{parte fracționară } (0{,}73)
`}),"\n",(0,n.jsx)(r.p,{children:"Reprezentare vizual\u0103:"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{children:"5,73\n\u2191  \u2191_______________\n5                0,73\n(parte \xeentreag\u0103) (parte frac\u021bionar\u0103)\n"})}),"\n",(0,n.jsx)(r.hr,{})]})}function p(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}}}]);