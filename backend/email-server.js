const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'eduprof.uruguay@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'pboe iwfr bzbi qfqw'
  }
});

// Email sending endpoint
app.post('/send-error-report', async (req, res) => {
  try {
    const { pageUrl, description } = req.body;

    console.log('Received error report:', { pageUrl, description });

    const mailOptions = {
      from: 'eduprof.uruguay@gmail.com',
      to: 'asbri.sebastian@gmail.com',
      subject: `Raporteaza o eroare - ${pageUrl}`,
      text: `
URL pagină: ${pageUrl}

Descriere problemă:
${description || 'Nu a fost furnizată o descriere.'}

---
Raport generat automat din cursurile online
Data: ${new Date().toLocaleString('ro-RO')}
      `.trim()
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);

    res.json({
      success: true,
      message: 'Email trimis cu succes',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la trimiterea email-ului',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Send email endpoint: http://localhost:${PORT}/send-error-report`);
});