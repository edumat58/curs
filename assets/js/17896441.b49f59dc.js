"use strict";(self.webpackChunkedumat_58=self.webpackChunkedumat_58||[]).push([[8401],{6098:(e,r,n)=>{n.d(r,{A:()=>C});var a=n(6540),t=n(4164),o=n(1532),i=n(204),s=n(7081),d=n(6239),l=n(4848);const c=o.Ay.div`
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
`,u=o.Ay.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
`,p=o.Ay.button`
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
`,h=o.Ay.h2`
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.25rem;
`,m=o.Ay.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,b=o.Ay.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,f=o.Ay.label`
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
`,g=o.Ay.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`,x=o.Ay.textarea`
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
`,v=o.Ay.button`
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
`,j=o.Ay.div`
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
`,k=(o.Ay.div`
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #bbdefb;
  font-size: 0.875rem;
  line-height: 1.4;
`,({isOpen:e,onClose:r})=>{const[n,t]=(0,a.useState)(""),[o,i]=(0,a.useState)(""),[s,d]=(0,a.useState)(!1),[k,w]=(0,a.useState)(!1),[y,C]=(0,a.useState)("");(0,a.useEffect)((()=>{e&&(t(window.location.href),w(!1),C(""))}),[e]);return e?(0,l.jsx)(c,{onClick:e=>{e.target===e.currentTarget&&r()},children:(0,l.jsxs)(u,{onClick:e=>e.stopPropagation(),children:[(0,l.jsx)(p,{onClick:r,disabled:s,children:"\xd7"}),(0,l.jsx)(h,{children:"Raporteaz\u0103 o eroare \xeen pagin\u0103"}),k&&(0,l.jsx)(j,{className:"success",children:"\u2705 Raportul a fost trimis automat cu succes! Se \xeenchide automat..."}),y&&(0,l.jsxs)(j,{className:"error",children:["\u274c ",y]}),(0,l.jsxs)(m,{onSubmit:async e=>{e.preventDefault(),d(!0),C(""),console.log("DEBUG: Starting email submission to backend");try{const e={pageUrl:n,description:o||"Nu a fost furnizat\u0103 o descriere."};console.log("DEBUG: Request data prepared:",e);const a=await fetch("https://backend-nmxw515k4-deussebyum11724s-projects.vercel.app/send-error-report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),t=await a.json();if(console.log("DEBUG: Backend response:",t),!a.ok||!t.success)throw new Error(t.message||"Backend returned error");console.log("DEBUG: Email sent successfully via nodemailer backend"),w(!0),setTimeout((()=>{r()}),2e3)}catch(y){console.error("DEBUG: Error sending email via backend:",y),C("Eroare la trimiterea email-ului. Verifica\u021bi configura\u021bia backend-ului.")}finally{d(!1),console.log("DEBUG: Submission process completed")}},children:[(0,l.jsxs)(b,{children:[(0,l.jsx)(f,{children:"URL Pagin\u0103"}),(0,l.jsx)(g,{type:"text",value:n,readOnly:!0,style:{backgroundColor:"#f8f9fa",color:"#6c757d"},disabled:s})]}),(0,l.jsxs)(b,{children:[(0,l.jsx)(f,{children:"Descrie problema (op\u021bional)"}),(0,l.jsx)(x,{placeholder:"Descrie\u021bi problema \xeent\xe2lnit\u0103 \xeen aceast\u0103 pagin\u0103...",value:o,onChange:e=>i(e.target.value),disabled:s})]}),(0,l.jsx)(v,{type:"submit",disabled:s||k,children:s?"Se trimite...":k?"Trimis cu succes!":"Trimite raportul automat"})]})]})}):null}),w=o.Ay.div`
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
    
    background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6) border-box;
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
                  linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6) border-box;
    }
    33% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #06b6d4, #8b5cf6, #06b6d4) border-box;
    }
    66% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6) border-box;
    }
    100% {
      background: linear-gradient(45deg, #1a1a1a, #2d2d2d) padding-box,
                  linear-gradient(45deg, #06b6d4, #8b5cf6, #06b6d4) border-box;
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
`,y=({onShowForm:e})=>(0,l.jsx)(w,{children:(0,l.jsxs)("button",{className:"button",onClick:e,children:[(0,l.jsx)("div",{className:"dots_border"}),(0,l.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",className:"sparkle",children:[(0,l.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"}),(0,l.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"}),(0,l.jsx)("path",{className:"path",strokeLinejoin:"round",strokeLinecap:"round",stroke:"black",fill:"black",d:"M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"})]}),(0,l.jsx)("span",{className:"text_button",children:"Raporteaza o eroare in pagina"})]})});function C(){const{metadata:e}=(0,s.u)(),{tags:r}=e,n=r.length>0,[o,c]=(0,a.useState)(!1);return(0,l.jsxs)("footer",{className:(0,t.A)(i.G.docs.docFooter,"docusaurus-mt-lg"),children:[n&&(0,l.jsx)("div",{className:(0,t.A)("row margin-top--sm",i.G.docs.docFooterTagsRow),children:(0,l.jsx)("div",{className:"col",children:(0,l.jsx)(d.A,{tags:r})})}),(0,l.jsxs)("div",{className:(0,t.A)("margin-top--sm",i.G.docs.docFooterEditMetaRow),style:{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"0.75rem",fontWeight:"bold",textAlign:"left",opacity:1,letterSpacing:"0.10em"},children:[(0,l.jsx)("div",{children:"prof. ing. BRI\u0218AN Andrei-Sebastian"}),(0,l.jsx)(y,{onShowForm:()=>c(!0)})]}),(0,l.jsx)(k,{isOpen:o,onClose:()=>c(!1)})]})}},7244:(e,r,n)=>{n.d(r,{A:()=>B});n(6540);var a=n(506),t=n(4164),o=n(539),i=n(204);const s="admonition_Gfwi",d="admonitionHeading_f1Ed",l="admonitionIcon_kpSf",c="admonitionContent_UjKb";var u=n(4848);function p({type:e,className:r,children:n}){return(0,u.jsx)("div",{className:(0,t.A)(i.G.common.admonition,i.G.common.admonitionType(e),s,r),children:n})}function h({icon:e,title:r}){return(0,u.jsxs)("div",{className:d,children:[(0,u.jsx)("span",{className:l,children:e}),r]})}function m({children:e}){return e?(0,u.jsx)("div",{className:c,children:e}):null}function b(e){const{type:r,icon:n,title:a,children:t,className:o}=e;return(0,u.jsxs)(p,{type:r,className:o,children:[(0,u.jsx)(h,{title:a,icon:n}),(0,u.jsx)(m,{children:t})]})}function f(e){}const g={icon:(0,u.jsx)(f,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"cerin\u021b\u01ce"})};function x(e){return(0,u.jsx)(b,{...g,...e,className:(0,t.A)("alert alert--secondary",e.className),children:e.children})}function v(e){return(0,u.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})}const j={icon:(0,u.jsx)(v,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"definitie"})};function k(e){return(0,u.jsx)(b,{...j,...e,className:(0,t.A)("alert alert--success",e.className),children:e.children})}function w(e){return(0,u.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})}const y={icon:(0,u.jsx)(w,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function C(e){return(0,u.jsx)(b,{...y,...e,className:(0,t.A)("alert alert--info",e.className),children:e.children})}function N(e){return(0,u.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}const A={icon:(0,u.jsx)(N,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})};function L(e){return(0,u.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,u.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})}const z={icon:(0,u.jsx)(L,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})};const _={icon:(0,u.jsx)(N,{}),title:(0,u.jsx)(o.A,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})};function S(e){return(0,u.jsx)(b,{..._,...e,className:(0,t.A)("alert alert--warning",e.className),children:e.children})}const T={...{note:x,tip:k,info:C,warning:function(e){return(0,u.jsx)(b,{...A,...e,className:(0,t.A)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,u.jsx)(b,{...z,...e,className:(0,t.A)("alert alert--danger",e.className),children:e.children})},caution:S},...{secondary:e=>(0,u.jsx)(x,{title:"secondary",...e}),important:e=>(0,u.jsx)(C,{title:"important",...e}),def:e=>(0,u.jsx)(k,{title:"def",...e}),caution:S}};function B(e){const r=(0,a.c)(e),n=(t=r.type,T[t]||(console.warn(`No admonition component found for admonition type "${t}". Using Info as fallback.`),T.info));var t;return(0,u.jsx)(n,{...r})}}}]);