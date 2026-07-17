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

// Înlocuiește data veche (markup-ul compact: <span class="nav-update-date">…</span>)
const newDateHtml = `<span class="nav-update-date">${formatDate}</span>`;
configContent = configContent.replace(
  /<span class="nav-update-date">[^<]*<\/span>/,
  newDateHtml
);

fs.writeFileSync(configPath, configContent);
console.log(`✔ Data actualizată în docusaurus.config.js: ${formatDate}`);
