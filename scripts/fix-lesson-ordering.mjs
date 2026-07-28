import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

const targetDirs = ['c5', 'c6', 'c7', 'c8'];

let totalUpdated = 0;

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      const fileName = entry.name;
      const baseName = path.parse(fileName).name;

      let targetPos = null;

      if (baseName === 'organigrama' || baseName === '00' || baseName === 'clasa_a_5_A') {
        targetPos = 0;
      } else {
        const numMatch = baseName.match(/^(\d+)/);
        if (numMatch) {
          targetPos = parseInt(numMatch[1], 10);
        }
      }

      if (targetPos !== null) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Check if file has frontmatter with sidebar_position
        if (content.startsWith('---')) {
          const frontmatterEnd = content.indexOf('---', 3);
          if (frontmatterEnd !== -1) {
            let frontmatter = content.substring(0, frontmatterEnd + 3);
            let rest = content.substring(frontmatterEnd + 3);

            if (/sidebar_position:\s*["']?(-?\d+)["']?/.test(frontmatter)) {
              const updatedFrontmatter = frontmatter.replace(
                /sidebar_position:\s*["']?(-?\d+)["']?/,
                `sidebar_position: ${targetPos}`
              );
              if (updatedFrontmatter !== frontmatter) {
                fs.writeFileSync(fullPath, updatedFrontmatter + rest, 'utf8');
                console.log(`Updated ${path.relative(projectRoot, fullPath)} -> sidebar_position: ${targetPos}`);
                totalUpdated++;
              }
            } else {
              // Add sidebar_position to frontmatter
              const lines = frontmatter.split('\n');
              lines.splice(1, 0, `sidebar_position: ${targetPos}`);
              const updatedFrontmatter = lines.join('\n');
              fs.writeFileSync(fullPath, updatedFrontmatter + rest, 'utf8');
              console.log(`Added to ${path.relative(projectRoot, fullPath)} -> sidebar_position: ${targetPos}`);
              totalUpdated++;
            }
          }
        }
      }
    }
  }
}

for (const targetDir of targetDirs) {
  const targetPath = path.join(docsDir, targetDir);
  if (fs.existsSync(targetPath)) {
    processDirectory(targetPath);
  }
}

console.log(`\nFinished updating ${totalUpdated} files.`);
