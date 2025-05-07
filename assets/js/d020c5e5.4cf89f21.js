"use strict";(self.webpackChunkedumat_58=self.webpackChunkedumat_58||[]).push([[1363],{7602:(e,r,i)=>{i.r(r),i.d(r,{assets:()=>c,contentTitle:()=>s,default:()=>u,frontMatter:()=>d,metadata:()=>n,toc:()=>o});const n=JSON.parse('{"id":"c7/10","title":"10 - Calcul literal\xa0\u2013 reducere, dezvoltare, factorizare","description":".","source":"@site/docs/c7/10.md","sourceDirName":"c7","slug":"/c7/10","permalink":"/curs/docs/c7/10","draft":false,"unlisted":false,"editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/c7/10.md","tags":[],"version":"current","sidebarPosition":10,"frontMatter":{"sidebar_position":10,"slug":"/c7/10","description":"."},"sidebar":"tutorialSidebar","previous":{"title":"09 - Ecua\u021bii \u0219i inecua\u021bii \xeen \u2124","permalink":"/curs/docs/c7/09"},"next":{"title":"11","permalink":"/curs/docs/c7/11"}}');var a=i(4848),l=i(8453),t=i(8054);const d={sidebar_position:10,slug:"/c7/10",description:"."},s="10 - Calcul literal\xa0\u2013 reducere, dezvoltare, factorizare",c={},o=[{value:"Expresii algebrice",id:"expresii-algebrice",level:2},{value:"Reducerea unei sume algebrice",id:"reducerea-unei-sume-algebrice",level:3},{value:"Adunarea a dou\u0103 sume algebrice",id:"adunarea-a-dou\u0103-sume-algebrice",level:3},{value:"Sc\u0103derea a dou\u0103 sume algebrice",id:"sc\u0103derea-a-dou\u0103-sume-algebrice",level:3},{value:"\xcenmul\u021birea a dou\u0103 sume algebrice",id:"\xeenmul\u021birea-a-dou\u0103-sume-algebrice",level:3},{value:"REGULI DE SEMN",id:"reguli-de-semn",level:2},{value:"Dezvoltare \u0219i factorizare",id:"dezvoltare-\u0219i-factorizare",level:2},{value:"Caz particular: diferen\u021ba de p\u0103trate",id:"caz-particular-diferen\u021ba-de-p\u0103trate",level:2}];function x(e){const r={a:"a",admonition:"admonition",br:"br",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...(0,l.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.header,{children:(0,a.jsx)(r.h1,{id:"10---calcul-literal-reducere-dezvoltare-factorizare",children:"10 - Calcul literal\xa0\u2013 reducere, dezvoltare, factorizare"})}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h2,{id:"expresii-algebrice",children:"Expresii algebrice"}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Valoarea numeric\u0103 a unei expresii algebrice:"}),"\n\xcentr-o expresie algebric\u0103, unele numere pot fi reprezentate de litere (de aceea o numim ",(0,a.jsx)(r.code,{children:"EXPRESIE LITERAL\u0102"}),");"]}),"\n",(0,a.jsxs)(r.admonition,{title:"Exemple:",type:"note",children:[(0,a.jsx)(t.A,{children:String.raw`
3x + 7, \quad x^2 - 5x + 8, \quad (3x + 3)(2x - 1)
`}),(0,a.jsxs)(r.p,{children:["Acestea sunt expresii algebrice unde litera ",(0,a.jsx)(r.code,{children:"x"})," este o ",(0,a.jsx)(r.code,{children:"variabil\u0103"}),"."]})]}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:["Dac\u0103 \xeei atribuim variabilei ",(0,a.jsx)(r.code,{children:"x"})," un num\u01cer, ob\u021binem ",(0,a.jsx)(r.strong,{children:"valoarea numeric\u0103"})," a expresiei.",(0,a.jsx)(r.br,{}),"\n",(0,a.jsxs)(r.strong,{children:["Dac\u0103 ",(0,a.jsx)(r.code,{children:"x = 10"}),":"]}),"\n",(0,a.jsx)(t.A,{children:String.raw`
3x + 7 = 3 \cdot 10 + 7 = 37
`}),"\n",(0,a.jsx)(t.A,{children:String.raw`
x^2 - 5x + 8 = 10^2 - 5 \cdot 10 + 8 = 58
`}),"\n"]}),"\n"]}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h3,{id:"reducerea-unei-sume-algebrice",children:"Reducerea unei sume algebrice"}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsx)(r.strong,{children:"Fie:"})}),"\n",(0,a.jsx)(t.A,{children:String.raw`\boldsymbol{S = 2x^2 - 4x + 5 + 3x - 2}
`}),"\n",(0,a.jsxs)(r.p,{children:["Putem rescrie aceast\u0103 ",(0,a.jsx)(r.strong,{children:"serie"})," de sume \u0219i sc\u0103deri \xeentr-o singur\u0103 serie de sume astfel:"]}),"\n",(0,a.jsx)(t.A,{children:String.raw`
S = 2x^2 + (-4x) + 5 + 3x + (-2)
`}),"\n",(0,a.jsx)(r.admonition,{title:"Observa\u021bii",type:"note",children:(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.code,{children:"S"})," este o sum\u0103 algebric\u0103 de 5 termeni: ",(0,a.jsx)(t.A,{children:String.raw`+2x^2; -4x; +5; +3x; -2`})]}),"\n",(0,a.jsx)(r.li,{children:"Ordinea termenilor se poate modifica \u0219i putem grupa termenii asemena, ceea ce permite reducerea sumei algebrice."}),"\n"]})}),"\n",(0,a.jsx)(r.p,{children:"Grup\u0103m termenii asemenea \u0219i reducem:"}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
S &= 2x^2 + (-4x) + 5 + 3x + (-2) =  \\[10pt]
&= 2x^2 + (-4x + 3x) + (5 - 2) =  \\[10pt]
&= 2x^2 - x + 3
\end{aligned}
`}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.code,{children:"S"})," a fost redus\u0103 la o sum\u0103 algebric\u0103 de 3 termeni:"]}),"\n",(0,a.jsx)(t.A,{children:String.raw`
+2x^2; -x; +3
`}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h3,{id:"adunarea-a-dou\u0103-sume-algebrice",children:"Adunarea a dou\u0103 sume algebrice"}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsxs)(r.strong,{children:["Fie ",(0,a.jsx)(r.code,{children:"A"})," \u015fi ",(0,a.jsx)(r.code,{children:"B"})," dou\u01ce sume algebrice deja reduse:"]})}),"\n",(0,a.jsx)(t.A,{children:String.raw`\boldsymbol{
A = 2x^2 - x + 7, \quad B = -5x^2 + 4x}
`}),"\n",(0,a.jsx)(r.p,{children:"Prin adunare ob\u021binem:"}),"\n",(0,a.jsx)(t.A,{children:String.raw`
A + B = 2x^2 + (-x) + 7 + (-5x^2) + 4x
`}),"\n",(0,a.jsx)(r.p,{children:"Grup\u0103m termenii asemenea \u0219i reducem:"}),"\n",(0,a.jsx)(t.A,{children:String.raw`\begin{aligned}
&= 2x^2 + (-5x^2) + (-x) + 4x + 7 = \\[10pt]
&= (2x^2 - 5x^2) + (-x + 4x) + 7 = \\[10pt]
&= -3x^2 + 3x + 7
\end{aligned}
`}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h3,{id:"sc\u0103derea-a-dou\u0103-sume-algebrice",children:"Sc\u0103derea a dou\u0103 sume algebrice"}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsxs)(r.strong,{children:["Fie ",(0,a.jsx)(r.code,{children:"A"})," \u015fi ",(0,a.jsx)(r.code,{children:"B"})," dou\u01ce sume algebrice deja reduse:"]})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\boldsymbol{
A = 2x^2 - x + 7, \quad B = -5x^2 + 4x
}
`}),"\n",(0,a.jsx)(r.p,{children:"Pentru a rescrie o sc\u0103dere algebric\u0103, ad\u0103ug\u0103m al doilea termen cu semn schimbat, astfel:"}),"\n",(0,a.jsxs)(r.admonition,{title:"Pentru:",type:"note",children:[(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
&\begin{cases}
&A = 2x^2 - x + 7 \\
&B = -5x^2 + 4x
\end{cases}
\end{aligned}
`}),(0,a.jsx)(t.A,{children:String.raw`
\Rightarrow -B = -(-5x^2 + 4x) = 5x^2 - 4x\\[10pt]
`})]}),"\n",(0,a.jsx)(r.admonition,{title:"Ob\u021binem",type:"info",children:(0,a.jsx)(t.A,{children:String.raw`
\boldsymbol{\Rightarrow A - B = A + (-B)}
`})}),"\n",(0,a.jsxs)(r.p,{children:["Acum putem trata ecua\u021bia folosind proprieta\u021bile ",(0,a.jsx)(r.a,{href:"#adunarea-a-dou%C4%83-sume-algebrice",children:"adun\u01cerii a dou\u01ce sume algebrice"})," \u0219i in final ",(0,a.jsx)(r.a,{href:"#reducerea-unei-sume-algebrice",children:"reducerea unei sume algebrice"})]}),"\n",(0,a.jsx)(r.p,{children:"Prin sc\u0103dere \u0219i reducere:"}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
&A - B = A + (-B) = \color{orangered}2x^2 \color{black}+ \color{olive}(-x)\color{black} +\color{black} 7 + \color{orangered} 5x^2 \color{black} + \color{olive}(-4x) =\\[10pt]
&= (2x^2 + 5x^2) + (-x - 4x) + 7\\[10pt]
&\boldsymbol{= 7x^2 - 5x + 7}\\[10pt]
\end{aligned}
`}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h3,{id:"\xeenmul\u021birea-a-dou\u0103-sume-algebrice",children:"\xcenmul\u021birea a dou\u0103 sume algebrice"}),"\n",(0,a.jsxs)(r.admonition,{title:"De Re\u021binut",type:"danger",children:[(0,a.jsx)(r.h2,{id:"reguli-de-semn",children:"REGULI DE SEMN"}),(0,a.jsx)(t.A,{children:String.raw`
\begin {cases}
(+a)\cdot(+b)=+ab\\
(-a)\cdot(-b)=+ab\\
(+a)\cdot(-b)=-ab\\
(-a)\cdot(+b) = -ab
\end{cases}
`})]}),"\n",(0,a.jsx)(r.p,{children:"Fiecare termen se \xeenmul\u021be\u0219te cu fiecare termen, aplic\xe2nd regulile semnelor. Apoi se reduce suma algebric\u0103 ob\u021binut\u0103."}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsx)(r.strong,{children:"Fie"})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\boldsymbol{
A = 3x + 7,\quad B = -x + 2
}
`}),"\n",(0,a.jsx)(r.p,{children:"Prin \xeenmul\u021bire:"}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
A \cdot B &= (3x + 7)(-x + 2) = \\[10pt]
&= 3x \cdot (-x) + 3x \cdot 2 + 7 \cdot (-x) + 7 \cdot 2 =\\[10pt]
&= -3x^2 + 6x - 7x + 14 =\\[10pt]
&\boldsymbol{= -3x^2 - x + 14}
\end{aligned}
`}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h2,{id:"dezvoltare-\u0219i-factorizare",children:"Dezvoltare \u0219i factorizare"}),"\n",(0,a.jsx)(r.admonition,{title:"Defini\u021bie 1",type:"tip",children:(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Dezvoltarea"})," reprezint\u0103 un produs (\xeenmul\u021bire) \xeenlocuit de o sum\u0103 egal\u0103, pentru toate valorile atribuite literelor."]}),"\n"]})}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsx)(r.strong,{children:"Exemplu:"})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
(2x - 3)(5x + 7) &= 2x\cdot5x + 2x\cdot7 - 3\cdot5x - 3\cdot7 \\
                 &= 10x^2 + 14x - 15x - 21 \\
                 &= 10x^2 - x - 21
\end{aligned}
`}),"\n",(0,a.jsx)(r.admonition,{title:"Defini\u021bie 2",type:"tip",children:(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Factorizarea"})," reprezint\u0103 o sum\u0103 \xeenlocuit\u0103 de un produs egal, pentru toate valorile atribuite literelor."]}),"\n"]})}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsx)(r.strong,{children:"Exemplu 1:"})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
&12x^2 - 15x = 3 \cdot 4x^2 - 3\cdot 5x = \\[10pt] 
&=3(4x^2 - 5x) = 3x(4x - 5)\quad // \text{factorul comun este } 3x
\end{aligned}
`}),"\n",(0,a.jsx)(r.p,{children:(0,a.jsx)(r.strong,{children:"Exemplu 2:"})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
5(y + 2) + x(y + 2) = (y + 2)(5 + x)\quad // \text{factorul comun este } (y + 2)
`}),"\n",(0,a.jsx)(r.hr,{}),"\n",(0,a.jsx)(r.h2,{id:"caz-particular-diferen\u021ba-de-p\u0103trate",children:"Caz particular: diferen\u021ba de p\u0103trate"}),"\n",(0,a.jsxs)(r.admonition,{title:"De Re\u021binut",type:"danger",children:[(0,a.jsxs)(r.p,{children:["Pentru orice ",(0,a.jsx)(r.code,{children:"a,b"}),":"]}),(0,a.jsx)(t.A,{children:String.raw`
\boldsymbol{
(a + b)(a - b) = a^2 - b^2
}
`})]}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:["\n",(0,a.jsxs)(r.p,{children:["Citit\u0103 de la st\xe2nga la dreapta, egalitatea permite urm\u0103toarea ",(0,a.jsx)(r.strong,{children:"dezvoltare"}),":"]}),"\n",(0,a.jsx)(r.admonition,{title:"Exemplu:",type:"note",children:(0,a.jsx)(t.A,{children:String.raw`
(3x - 5)(3x + 5) = ?
`})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
&(3x - 5)(3x + 5) \Rightarrow\begin{cases}a = 3x \\
b = 5
\end{cases}\\[10pt]
\\
&\Rightarrow(3x - 5)(3x + 5)=(3x)^2 - 5^2 = \\[10pt]
&\boldsymbol{9x^2-25}
\end{aligned}
`}),"\n"]}),"\n",(0,a.jsxs)(r.li,{children:["\n",(0,a.jsxs)(r.p,{children:["Citit\u0103 de la dreapta la st\xe2nga, egalitatea permite urm\u0103toarea ",(0,a.jsx)(r.strong,{children:"factorizare"}),":"]}),"\n",(0,a.jsx)(r.admonition,{title:"Exemplu",type:"note",children:(0,a.jsx)(t.A,{children:String.raw`
16 - 49x^2 = ?
`})}),"\n",(0,a.jsx)(t.A,{children:String.raw`
\begin{aligned}
&16 - 49x^2 \Rightarrow
\begin{cases}
a^2 = 16 \Rightarrow\boldsymbol{a = \sqrt{16} = 4} \\
b^2 = 49x^2 \Rightarrow\boldsymbol{b = \sqrt{49\cdot x^2} = \sqrt{49}\cdot \sqrt{x^2} = 7x}
\end{cases}\\[10pt]
\\
&\Rightarrow16-49x^2 = \boldsymbol{(4+7x)\cdot (4-7x)}
\end{aligned}
`}),"\n"]}),"\n"]})]})}function u(e={}){const{wrapper:r}={...(0,l.R)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(x,{...e})}):x(e)}},8054:(e,r,i)=>{i.d(r,{A:()=>s});var n=i(6540),a=i(2130);function l(){return(l=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var i=arguments[r];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n])}return e}).apply(this,arguments)}const t=(0,n.memo)((function(e){var r=e.children,i=e.math,t=e.block,d=e.errorColor,s=e.renderError,c=e.settings,o=e.as,x=function(e,r){if(null==e)return{};var i,n,a={},l=Object.keys(e);for(n=0;n<l.length;n++)r.indexOf(i=l[n])>=0||(a[i]=e[i]);return a}(e,["children","math","block","errorColor","renderError","settings","as"]),u=o||(t?"div":"span"),h=null!=r?r:i,g=(0,n.useState)({innerHtml:""}),m=g[0],j=g[1];return(0,n.useEffect)((function(){try{var e=a.Ay.renderToString(h,l({displayMode:!!t,errorColor:d,throwOnError:!!s},c));j({innerHtml:e})}catch(e){if(!(e instanceof a.Ay.ParseError||e instanceof TypeError))throw e;j(s?{errorElement:s(e)}:{innerHtml:e.message})}}),[t,h,d,s,c]),"errorElement"in m?m.errorElement:n.createElement(u,Object.assign({},x,{dangerouslySetInnerHTML:{__html:m.innerHtml}}))}));var d=i(4848);function s(e){let{children:r}=e;return(0,d.jsx)(t,{block:!0,math:r})}}}]);