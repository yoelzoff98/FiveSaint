import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. Cargar variables de entorno de .env.local
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
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const BUCKET = 'product-images';

// 2. Definición de productos de Columnas de Ducha (datos oficiales)
const CATEGORY_ID = '34fd60af-8778-4db1-9b95-802d0c53703a'; // Columnas de Ducha

const columnasData = [
  {
    code: 'FSCOCD',
    name: 'Columna Dijon',
    slug: 'columna-dijon',
    shortDescription: 'Columna de ducha corta con duchón superior de alta cobertura.',
    description: 'La columna de ducha Dijon combina un diseño compacto de formato corto con duchón superior de gran caudal y jets orientables de hidromasaje vertical. Fabricada en acero inoxidable con acabado cepillado de alta durabilidad.',
    features: [
      'Corta con duchón superior',
      'Cuerpo en acero inoxidable sanitario',
      'Jets de hidromasaje orientables',
      'Duchador de mano anticalcáreo con manguera flexible',
      'Comando selector de funciones integrado'
    ],
    price: '$ 1.769.000',
    imageFile: 'Dijon.png',
    sortOrder: 1
  },
  {
    code: 'FSCOC',
    name: 'Columna Burdeos',
    slug: 'columna-burdeos',
    shortDescription: 'Columna de ducha corta sobria y elegante para espacios reducidos.',
    description: 'La columna de ducha Burdeos presenta un formato corto ideal para maximizar el espacio sin renunciar al confort de una experiencia de ducha revitalizante. Cuenta con sistema de rociadores e hidromasaje vertical.',
    features: [
      'Formato corto compacto',
      'Estructura de acero inoxidable pulido',
      'Jets de inyección localizada para masaje muscular',
      'Duchador manual independiente',
      'Válvula monocomando de suave accionamiento'
    ],
    price: '$ 1.769.000',
    imageFile: 'Burdeos.png',
    sortOrder: 2
  },
  {
    code: 'FSCOLD',
    name: 'Columna Paris',
    slug: 'columna-paris',
    shortDescription: 'Columna de ducha larga con duchón integrado de máximo confort.',
    description: 'La columna de ducha Paris destaca por su imponente perfil de formato largo y duchón superior envolvente. Equipada con paneles de microjets de hidroterapia para una relajación profunda en todo el cuerpo.',
    features: [
      'Formato largo con duchón superior integrado',
      'Diseño escultural en acero inoxidable',
      'Múltiples zonas de jets hidroterapéuticos',
      'Duchador de mano de alto rendimiento',
      'Superficie de fácil limpieza resistente a la calcificación'
    ],
    price: '$ 1.844.000',
    imageFile: 'Paris.png',
    sortOrder: 3
  },
  {
    code: 'FSCOL',
    name: 'Columna Marsella',
    slug: 'columna-marsella',
    shortDescription: 'Columna de ducha larga de diseño estilizado y múltiple salida de agua.',
    description: 'La columna de ducha Marsella ofrece una presencia refinada de formato largo con amplia superficie de rociadores e inyectores horizontales. Perfecta para renovar cualquier espacio de baño moderno.',
    features: [
      'Formato largo estilizado',
      'Cuerpo en acero inoxidable de calidad superior',
      'Jets cervicales y lumbares de distribución uniforme',
      'Duchador de mano ergonómico',
      'Instalación sencilla de colgar'
    ],
    price: '$ 1.844.000',
    imageFile: 'Marsella.png',
    sortOrder: 4
  }
];

async function seedColumnas() {
  console.log('🚀 Procesando e insertando Columnas de Ducha en Supabase...');

  const imagesDir = path.join(process.cwd(), 'public', 'images', 'Columnas de Ducha');

  for (const item of columnasData) {
    console.log(`\n📦 Procesando: ${item.name} (${item.code})`);

    const sourceImagePath = path.join(imagesDir, item.imageFile);
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`  ❌ No existe la imagen origen: ${sourceImagePath}`);
      continue;
    }

    // 1. Optimizar imagen a WebP ligero conservando calidad y transparencia
    const baseName = path.basename(item.imageFile, path.extname(item.imageFile)).toLowerCase();
    const webpFileName = `${baseName}.webp`;
    const webpLocalPath = path.join(imagesDir, webpFileName);

    const inputBuffer = fs.readFileSync(sourceImagePath);
    const optimizedBuffer = await sharp(inputBuffer)
      .webp({ quality: 85, alphaQuality: 95, effort: 6 })
      .toBuffer();

    // Guardar copia local .webp en public/images/Columnas de Ducha/
    fs.writeFileSync(webpLocalPath, optimizedBuffer);

    const origMB = (inputBuffer.length / 1024).toFixed(1);
    const newKB = (optimizedBuffer.length / 1024).toFixed(1);
    console.log(`  ✨ Optimizado WebP local: ${origMB} KB ➡️ ${newKB} KB`);

    // 2. Subir imagen WebP a Supabase Storage
    const storagePath = `columnas-de-ducha/${webpFileName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error(`  ⚠️ Error subiendo a Storage (${storagePath}):`, uploadError.message);
    } else {
      console.log(`  ☁️ Subido a Storage: ${storagePath}`);
    }

    // URL pública en Storage (o fallback a URL estática local)
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const imageUrl = publicUrlData?.publicUrl || `/images/Columnas de Ducha/${webpFileName}`;

    // Actualizar imagen de portada de la categoría si aún no tiene una
    await supabase
      .from('product_categories')
      .update({
        cover_image_url: imageUrl,
        cover_image_alt: 'Columnas de Ducha Five Saint'
      })
      .eq('id', CATEGORY_ID)
      .is('cover_image_url', null);

    // 3. Insertar / Actualizar producto en la tabla 'products'
    const { data: existingProd } = await supabase
      .from('products')
      .select('id')
      .eq('slug', item.slug)
      .maybeSingle();

    let productId = existingProd?.id;

    const productPayload = {
      category_id: CATEGORY_ID,
      name: item.name,
      slug: item.slug,
      short_description: item.shortDescription,
      description: item.description,
      features: item.features,
      applications: ['Hogar', 'Hotelería', 'Espacios de Salud y Relax'],
      technical_notes: [`Código oficial: ${item.code}`, `Precio oficial: ${item.price}`],
      badge: item.sortOrder === 1 ? 'Más Vendida' : null,
      is_featured: true,
      is_active: true,
      sort_order: item.sortOrder,
      seo_title: `${item.name} | Columnas de Ducha Five Saint`,
      seo_description: item.shortDescription
    };

    if (productId) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', productId);
      if (updateError) console.error(`  ❌ Error actualizando producto:`, updateError.message);
      else console.log(`  🔄 Producto actualizado en BD (ID: ${productId})`);
    } else {
      const { data: newProd, error: insertError } = await supabase
        .from('products')
        .insert([productPayload])
        .select('id')
        .single();
      if (insertError) {
        console.error(`  ❌ Error insertando producto:`, insertError.message);
        continue;
      }
      productId = newProd.id;
      console.log(`  ✅ Producto insertado en BD (ID: ${productId})`);
    }

    // 4. Limpiar imágenes anteriores e insertar imagen en 'product_images'
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    const { error: imgInsertError } = await supabase
      .from('product_images')
      .insert([
        {
          product_id: productId,
          url: imageUrl,
          alt: `${item.name} Five Saint`,
          sort_order: 0,
          is_cover: true
        }
      ]);

    if (imgInsertError) {
      console.error(`  ❌ Error insertando imagen en DB:`, imgInsertError.message);
    } else {
      console.log(`  🖼️ Imagen vinculada a DB con éxito.`);
    }

    // 5. Insertar / Actualizar variante por defecto en 'product_variants'
    const { data: existingVariant } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();

    const variantPayload = {
      product_id: productId,
      name: `${item.name} Estándar`,
      slug: `${item.slug}-estandar`,
      short_description: item.shortDescription,
      description: item.description,
      size_label: item.description.includes('larga') ? 'Formato Largo' : 'Formato Corto',
      capacity_label: '1 persona',
      features: item.features,
      equipment: ['Jets orientables', 'Duchador manual', 'Selector monocomando'],
      technical_notes: [`Código: ${item.code}`, `Precio: ${item.price}`],
      is_active: true,
      is_default: true,
      sort_order: 0
    };

    if (existingVariant) {
      await supabase
        .from('product_variants')
        .update(variantPayload)
        .eq('id', existingVariant.id);
      console.log(`  📌 Variante actualizada.`);
    } else {
      await supabase
        .from('product_variants')
        .insert([variantPayload]);
      console.log(`  📌 Variante creada.`);
    }
  }

  console.log('\n🎉 ¡Proceso finalizado con éxito! Todos los productos de Columnas de Ducha fueron subidos y optimizados.');
}

seedColumnas();
