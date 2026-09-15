import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(SRC_DIR);
let updatedFilesCount = 0;

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace image extensions in /images/ paths (supporting paths with spaces)
  content = content.replace(/\/images\/([^"'`]+\.(png|jpg|jpeg|JPG|PNG|JPEG))/gi, (match) => {
    return match.replace(/\.(png|jpg|jpeg|JPG|PNG|JPEG)$/i, '.webp');
  });

  // Special cases if any: e.g. romana.png, logo.png
  content = content.replace(/romana\.(png|jpg)/gi, 'romana.webp');
  content = content.replace(/logo\.(png|jpg)/gi, 'logo.webp');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔄 Updated references in: ${path.relative(SRC_DIR, filePath)}`);
    updatedFilesCount++;
  }
});

console.log(`\n✨ Finished updating code references in ${updatedFilesCount} files.`);
