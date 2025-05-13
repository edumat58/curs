const fs = require('fs');
const path = require('path');

const now = new Date();
const formatDate = now.toLocaleString('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const configPath = path.resolve(__dirname, 'docusaurus.config.js');
let configContent = fs.readFileSync(configPath, 'utf-8');

// Înlocuiește linia cu data veche (caută `Ultima actualizare:`)
const newDateHtml = `<span style="font-size: 0.9rem; opacity: 0.7;">Ultima actualizare: ${formatDate}</span>`;
configContent = configContent.replace(
  /<span style="[^"]*">Ultima actualizare: .*?<\/span>/,
  newDateHtml
);

fs.writeFileSync(configPath, configContent);
console.log(`✔ Data actualizată în docusaurus.config.js: ${formatDate}`);
