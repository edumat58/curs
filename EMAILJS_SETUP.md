# EmailJS Setup Guide

## Pasul 1: Crearea contului EmailJS
1. Accesează [EmailJS.com](https://www.emailjs.com/)
2. Creează un cont gratuit
3. Verifică email-ul de confirmare

## Pasul 2: Configurarea serviciului Gmail
1. Du-te la **Email Services** → **Gmail** → **Add New Service**
2. Conectează contul **eduprof.uruguay@gmail.com**
3. Autorizează accesul pentru EmailJS

## Pasul 3: Crearea template-ului de email
1. Du-te la **Email Templates** → **Create New Template**
2. Configurează:
   - **To Email**: `{{to_email}}`
   - **From Email**: `{{from_email}}`
   - **Subject**: `{{subject}}`
   - **Content**: 
```
URL pagină: {{page_url}}

Descriere problemă:
{{user_description}}

---
Raport generat automat din cursurile online
Data: {{report_date}}
```

## Pasul 4: Obținerea cheilor de configurare
Din dashboard-ul EmailJS:
1. **Service ID** - pentru Gmail service (ex: `service_gmail`)
2. **Template ID** - pentru template-ul creat (ex: `template_error_report`)
3. **Public Key** - din Settings → General (ex: `abc123def456`)

## Pasul 5: Actualizarea codului
Înlocuiește în `src/components/ErrorReportForm.jsx`:
```javascript
const EMAILJS_SERVICE_ID = 'service_gmail'; // Înlocuiește cu ID-ul real
const EMAILJS_TEMPLATE_ID = 'template_error_report'; // Înlocuiește cu ID-ul real
const EMAILJS_PUBLIC_KEY = 'your_public_key_here'; // Înlocuiește cu cheia reală
```

## ⚠️ Important pentru acest proiect
- **From Email** în template: `eduprof.uruguay@gmail.com`
- **To Email** în template: `asbri.sebastian@gmail.com`
- Asigură-te că Gmail service este conectat cu `eduprof.uruguay@gmail.com`

## Pasul 6: Testarea
1. Salvează fișierele
2. Rulează `npm run build`
3. Testează funcționalitatea

## Alternative: Folosirea Formspree.io (mai simplu)
1. Creează cont pe [Formspree.io](https://formspree.io/)
2. Obține un form endpoint
3. Înlocuiește funcția de trimitere email cu fetch către endpoint