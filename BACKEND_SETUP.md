# 🚀 Backend Setup pentru Trimiterea Email-urilor cu Nodemailer

## Fișiere create:
- `email-server.js` - Serverul Express cu nodemailer
- `backend-package.json` - Dependencies pentru backend

## Instalare și rulare:

### 1. Instalează dependencies pentru backend:
```bash
npm install express nodemailer cors nodemon --save
```
Sau dacă folosești fișierul separat:
```bash
cp backend-package.json package.json
npm install
```

### 2. Configurează Gmail App Password:
1. Accesează [Google Account Settings](https://myaccount.google.com/)
2. **Security** → **2-Step Verification** → **App passwords**
3. Generează parola pentru app și înlocuiește în `email-server.js`:
   ```javascript
   pass: 'parola_app_generată' // Înlocuiește cu parola reală
   ```

### 3. Rulează serverul:
```bash
node email-server.js
```
Sau pentru development:
```bash
npm run dev
```

### 4. Testează endpoint-ul:
```bash
curl -X POST http://localhost:3001/send-error-report \
  -H "Content-Type: application/json" \
  -d '{"pageUrl":"https://example.com","description":"Test error"}'
```

## Deploy pentru GitHub Pages + Backend

**Frontend (GitHub Pages):** Funcționează automat cu `npm run deploy`

**Backend:** Trebuie deploy separat deoarece GitHub Pages nu suportă server-side code

### Opțiune 1: Vercel (recomandat pentru backend)
```bash
# Instalează Vercel CLI
npm install -g vercel

# Deploy backend (din directorul proiectului)
vercel --prod

# Adaugă variabilele de mediu în dashboard-ul Vercel:
# GMAIL_USER=eduprof.uruguay@gmail.com
# GMAIL_APP_PASSWORD=pboe iwfr bzbi qfqw
```
Actualizează `EMAIL_BACKEND_URL` în `src/components/ErrorReportForm.jsx` cu URL-ul Vercel (ex: `https://your-project.vercel.app/send-error-report`).

### Opțiune 2: Railway
```bash
npm install -g @railway/cli
railway login
railway deploy
```

### Opțiune 3: Render
- Conectează repository-ul GitHub
- Selectează "Node" ca runtime
- Adaugă variabilele de mediu: `GMAIL_USER` și `GMAIL_APP_PASSWORD`

### Opțiune 2: Heroku
```bash
npm install -g heroku
heroku create
git push heroku main
```

### Opțiune 3: Server propriu
Deploy fișierul `email-server.js` pe orice server Node.js.

## Configurare în producție:

1. **Schimbă URL-ul backend-ului** în `src/components/ErrorReportForm.jsx`:
   ```javascript
   const EMAIL_BACKEND_URL = 'https://your-backend-url.com/send-error-report';
   ```

2. **Setează variabile de mediu** pentru producție:
   ```javascript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: process.env.GMAIL_USER,
       pass: process.env.GMAIL_APP_PASSWORD
     }
   });
   ```

3. **Rulează build și deploy** pentru frontend:
   ```bash
   npm run build
   npm run deploy
   ```

## Testare finală:
1. Deschide site-ul
2. Apasă "Raportează o eroare"
3. Verifică că email-ul ajunge la asbri.sebastian@gmail.com