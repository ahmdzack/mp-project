import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist', 'assets');

console.log('🔍 Scanning for localhost references in build files...');

// Check if dist/assets exists
if (!fs.existsSync(distDir)) {
  console.log('⚠️  dist/assets directory not found');
  process.exit(0);
}

// Read all JS files in dist/assets
const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));

let replacementCount = 0;

files.forEach(file => {
  const filePath = path.join(distDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count occurrences
  const matches = content.match(/localhost:5000/g);
  if (matches) {
    console.log(`⚠️  Found ${matches.length} localhost references in ${file}`);
    
    // Replace ALL occurrences
    content = content.replace(
      /http:\/\/localhost:5000/g,
      'https://mp-project-production.up.railway.app'
    );
    
    content = content.replace(
      /localhost:5000/g,
      'mp-project-production.up.railway.app'
    );
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    replacementCount += matches.length;
    console.log(`✅ Replaced ${matches.length} occurrences in ${file}`);
  }
});

if (replacementCount === 0) {
  console.log('✅ No localhost references found - build is clean!');
} else {
  console.log(`\n🎯 Total replacements: ${replacementCount}`);
}
