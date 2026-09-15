import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Remove temp-images directory if it exists
const tempImagesDir = path.join(PUBLIC_DIR, 'temp-images');
if (fs.existsSync(tempImagesDir)) {
  console.log('🗑️ Removing public/temp-images directory...');
  fs.rmSync(tempImagesDir, { recursive: true, force: true });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function convertAllImages() {
  const allFiles = getAllFiles(PUBLIC_DIR);
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.png', '.jpg'];
  
  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let processedCount = 0;

  console.log(`📁 Scanning public directory...`);

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Process only PNG, JPG, JPEG (skip SVG, PDF, AI, WEBP)
    if (!imageExtensions.includes(ext)) {
      continue;
    }

    // Skip if it's already a .webp
    if (ext === '.webp') {
      continue;
    }

    const fileStat = fs.statSync(filePath);
    const origSize = fileStat.size;
    totalOriginalSize += origSize;

    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const targetWebpPath = path.join(dirName, `${baseName}.webp`);

    try {
      const inputBuffer = fs.readFileSync(filePath);
      
      const imagePipeline = sharp(inputBuffer);
      const metadata = await imagePipeline.metadata();

      let pipeline = sharp(inputBuffer);
      if (metadata.width > 1920 || metadata.height > 1920) {
        pipeline = pipeline.resize({
          width: 1920,
          height: 1920,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      const webpBuffer = await pipeline
        .webp({
          quality: 82,
          alphaQuality: 90,
          effort: 6
        })
        .toBuffer();

      fs.writeFileSync(targetWebpPath, webpBuffer);
      const newSize = webpBuffer.length;
      totalNewSize += newSize;
      processedCount++;

      console.log(`✅ [${processedCount}] Converted: ${path.relative(PUBLIC_DIR, filePath)}`);
      console.log(`   ${(origSize / 1024 / 1024).toFixed(2)} MB ➡️ ${(newSize / 1024).toFixed(1)} KB (-${(((origSize - newSize) / origSize) * 100).toFixed(1)}%)`);

      // Delete original image file
      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(`❌ Error converting ${filePath}:`, err.message);
    }
  }

  console.log('\n======================================');
  console.log(`🎉 Optimization Complete!`);
  console.log(`Total files converted: ${processedCount}`);
  console.log(`Original total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`New total size: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total space saved: ${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB (-${(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1)}%)`);
  console.log('======================================\n');
}

convertAllImages();
