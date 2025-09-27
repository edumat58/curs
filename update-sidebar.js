const fs = require('fs');
const path = require('path');

const dirs = ['docs/c5/modul-1', 'docs/c6/modul-1', 'docs/c7/modul-1', 'docs/c8/modul-1'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir)
    .filter(f => f.match(/^\d+\.(md|mdx)$/))
    .sort((a, b) => {
      const numA = parseInt(a.split('.')[0]);
      const numB = parseInt(b.split('.')[0]);
      return numB - numA; // descending order
    });

  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const newPos = index + 1;
    content = content.replace(/sidebar_position: \d+/, `sidebar_position: ${newPos}`);
    fs.writeFileSync(filePath, content);
  });
});

console.log('Sidebar positions updated.');