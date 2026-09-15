import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const publicDir = path.join(process.cwd(), 'public');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
const referencedImages = new Set();

files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/\/images\/[^"'`]+\.webp/gi) || [];
  matches.forEach(m => referencedImages.add(m));
});

console.log(`Found ${referencedImages.size} unique referenced .webp images in src.`);
let missingCount = 0;

referencedImages.forEach((imgRel) => {
  const fullDiskPath = path.join(publicDir, imgRel.replace(/^\//, '').replace(/\//g, path.sep));
  if (!fs.existsSync(fullDiskPath)) {
    console.error(`❌ Missing file on disk: ${fullDiskPath} (referenced as: ${imgRel})`);
    missingCount++;
  }
});

if (missingCount === 0) {
  console.log('✅ ALL referenced images exist on disk perfectly!');
} else {
  console.error(`⚠️ Total missing: ${missingCount}`);
}
