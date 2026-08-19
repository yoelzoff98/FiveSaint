import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Script de Optimización Masiva de Imágenes en Supabase Storage
 * 
 * Descarga imágenes pesadas (PNG/JPG de 8-9 MB) del bucket 'product-images',
 * las comprime y convierte a formato WebP optimizado (~100-200 KB) sin perder transparencia ni calidad,
 * y reemplaza/actualiza automáticamente los archivos y enlaces en la base de datos de Supabase.
 */

// Cargar variables de entorno desde .env.local o .env
let envLocal = '';
try {
  envLocal = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  try {
    envLocal = fs.readFileSync('.env', 'utf8');
  } catch (err) {}
}

const envVars = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Error: Se requieren NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const BUCKET = 'product-images';

async function getAllBucketFiles(folderPath = '') {
  let allFiles = [];
  const { data: items, error } = await supabase.storage.from(BUCKET).list(folderPath, { limit: 200 });

  if (error || !items) return [];

  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;

    // Si no tiene id/metadata de archivo, es una carpeta -> explorar recursivamente
    if (!item.id && !item.metadata) {
      const subFiles = await getAllBucketFiles(fullPath);
      allFiles = allFiles.concat(subFiles);
    } else {
      allFiles.push({ ...item, path: fullPath });
    }
  }

  return allFiles;
}

async function optimizeAllImages() {
  console.log('🚀 Iniciando optimización masiva de imágenes en Supabase Storage...');

  const files = await getAllBucketFiles('');

  if (files.length === 0) {
    console.log(`ℹ️ No se encontraron imágenes para optimizar en el bucket '${BUCKET}'.`);
    return;
  }

  console.log(`📸 Encontrados ${files.length} archivos en el bucket '${BUCKET}'. Procesando...`);

  let count = 0;
  for (const file of files) {
    // Solo procesar archivos de imagen (png, jpg, jpeg)
    const ext = path.extname(file.name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      continue;
    }

    count++;
    const fileSizeMB = file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) : 'Desconocido';
    console.log(`\n⏳ Procesando [${count}]: ${file.path} (${fileSizeMB} MB)`);

    try {
      // 1. Descargar buffer original
      const { data: fileData, error: downloadError } = await supabase.storage.from(BUCKET).download(file.path);
      if (downloadError || !fileData) {
        console.error(`  ❌ Error descargando ${file.path}:`, downloadError?.message);
        continue;
      }

      const inputBuffer = Buffer.from(await fileData.arrayBuffer());

      // 2. Comprimir con sharp manteniendo la transparencia completa
      const optimizedBuffer = await sharp(inputBuffer)
        .webp({ quality: 84, alphaQuality: 95, effort: 6 })
        .toBuffer();

      const originalSize = inputBuffer.length;
      const newSize = optimizedBuffer.length;
      const reduction = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

      console.log(`  ✨ Comprimido: ${(originalSize / 1024 / 1024).toFixed(2)} MB ➡️ ${(newSize / 1024).toFixed(1)} KB (Ahorro: ${reduction}%)`);

      // 3. Definir nombre de destino .webp
      const dirName = path.dirname(file.path);
      const baseName = path.basename(file.name, ext);
      const webpPath = dirName && dirName !== '.' ? `${dirName}/${baseName}.webp` : `${baseName}.webp`;

      // 4. Subir versión WebP optimizada
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(webpPath, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

      if (uploadError) {
        console.error(`  ❌ Error subiendo ${webpPath}:`, uploadError.message);
        continue;
      }

      // Obtener URL pública de la nueva imagen optimizada
      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(webpPath);
      const newUrl = publicUrlData.publicUrl;

      // 5. Actualizar la tabla de imágenes y productos en la Base de Datos
      const { data: updatedImages } = await supabase
        .from('product_images')
        .select('id, url')
        .ilike('url', `%${baseName}%`);

      if (updatedImages && updatedImages.length > 0) {
        for (const imgRecord of updatedImages) {
          await supabase
            .from('product_images')
            .update({ url: newUrl })
            .eq('id', imgRecord.id);
          console.log(`  🔄 Actualizada URL en BD (product_images): ${baseName} ➡️ ${webpPath}`);
        }
      }

      console.log(`  ✅ ${webpPath} optimizado y registrado con éxito.`);

    } catch (err) {
      console.error(`  ❌ Excepción procesando ${file.path}:`, err.message || err);
    }
  }

  console.log('\n🎉 ¡Proceso de optimización de imágenes completado!');
}

optimizeAllImages();
