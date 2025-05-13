const fs = require('fs');
const path = require('path');

// Obiectul saptamani (doar partea relevantă pentru PDF-uri)
const saptamani = [
  {
    lectii: [
      { pdf: 'c1.pdf' },
      { pdf: 'c2.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c3.pdf' },
      { pdf: 'c4.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c5.pdf' },
      { pdf: 'c6.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c7.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c8.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c9.pdf' },
      { pdf: 'c10.pdf' },
    ],
  },
  {
    lectii: [],
  },
  {
    lectii: [
      { pdf: 'c11.pdf' },
      { pdf: 'c12.pdf' },
    ],
  },
  {
    lectii: [],
  },
  {
    lectii: [
      { pdf: 'c13.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c14.pdf' },
      { pdf: 'c15.pdf' },
      { pdf: 'c16.pdf' },
    ],
  },
  {
    lectii: [
      { pdf: 'c17.pdf' },
      { pdf: 'c18.pdf' },
    ],
  },
];

const pdfPath = path.join(__dirname, 'static', 'c6_pdf');
let toateBune = true;

saptamani.forEach((sapt, idx) => {
  sapt.lectii.forEach((lec) => {
    const file = path.join(pdfPath, lec.pdf);
    if (!fs.existsSync(file)) {
      toateBune = false;
      console.log(`🚨 Lipsă: ${lec.pdf} (Săptămâna ${idx + 1})`);
    }
  });
});

if (toateBune) {
  console.log('✅ Toate PDF-urile există în static/c6/pdf.');
} else {
  console.log('⚠️ Unele PDF-uri lipsesc.');
}
