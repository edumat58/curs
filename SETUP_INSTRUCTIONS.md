# 🚀 Instrucțiuni de Configurare pentru Trimiterea Automată de Email-uri

## Opțiunea 1: Formspree.io (Recomandat - mai simplu)

### Avantaje:
- ✅ Setup în 2 minute
- ✅ Gratuit pentru 50 email-uri/lună
- ✅ Nu necesită configurare complexă
- ✅ Funcționează imediat

### Pași:
1. **Creează cont gratuit** pe [Formspree.io](https://formspree.io/)
2. **Creează un nou form** și obține endpoint-ul
3. **Configurează email forwarding**:
   - Reply-to: `eduprof.uruguay@gmail.com`
   - CC: `asbri.sebastian@gmail.com`
4. **Înlocuiește** în `src/components/ErrorReportForm.jsx`:
   ```javascript
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/TU_FORM_ID';
   ```

## Opțiunea 2: EmailJS (pentru funcționalități avansate)

### Pași:
1. **Creează cont** pe [EmailJS.com](https://www.emailjs.com/)
2. **Conectează Gmail service** cu `eduprof.uruguay@gmail.com`
3. **Creează template** pentru email
4. **Configurează cheile** în cod:
   ```javascript
   const YOUR_SERVICE_ID = 'service_xxx';
   const YOUR_TEMPLATE_ID = 'template_xxx';
   const YOUR_PUBLIC_KEY = 'user_xxx';
   ```

## Opțiunea 3: Webhook personalizat

Creează un endpoint simplu pe serverul tău:

```javascript
// Endpoint pentru trimiterea email-ului
app.post('/send-error-report', async (req, res) => {
  const { pageUrl, description } = req.body;
  
  // Configurează nodemailer cu Gmail
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'eduprof.uruguay@gmail.com',
      pass: 'pboe iwfr bzbi qfqw'
    }
  });
  
  // Trimite email
  await transporter.sendMail({
    from: 'eduprof.uruguay@gmail.com',
    to: 'asbri.sebastian@gmail.com',
    subject: `Raporteaza o eroare - ${pageUrl}`,
    text: `URL: ${pageUrl}\nDescriere: ${description}`
  });
});
```

## 🚀 Setup Imediat (fără configurare)

**Pentru testare imediată:**
- Sistemul actual funcționează deja
- Deschide email client cu informații pre-completate
- Trimite manual de la `eduprof.uruguay@gmail.com` către `asbri.sebastian@gmail.com`
- Experiența utilizatorului este optimizată pentru această situație

## 📋 Testarea

După configurare:
1. Rulează `npm run build`
2. Testează pe o pagină de curs
3. Verifică email-urile primite