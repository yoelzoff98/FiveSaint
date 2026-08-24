import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
  console.error('❌ Error: Credenciales no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const BUCKET = 'product-images';
const CATEGORY_ID = '45f9e119-5556-455c-ae18-a98b755cf3bd'; // Platos de Duchas

const commonApplications = [
  'Hogar / Baño principal, secundario o en suite',
  'Hoteles, Hostales y Complejos turísticos',
  'Remodelaciones y reemplazo de bañeras tradicionales',
  'Instalaciones con mamparas de vidrio templado a medida'
];

const commonTechnicalNotes = [
  'Material: Acrílico sanitario blanco termoformado de alta densidad con filtro UV.',
  'Refuerzo inferior: Resina poliéster y fibra de vidrio (PRFV) de alta rigidez.',
  'Altura de perfil: 5 cm (profundidad interna de contención: 3,5 cm).',
  'Compatibilidad de desagüe: Diseñado para sopapa / desagüe oficial Five Saint (Código FSE131).',
  'Instalación: Apto para asentar sobre carpeta autonivelante o empotrar a nivel de cerámico.'
];

const platosData = [
  {
    name: 'Plato de Ducha De Luxe',
    slugKeywords: ['de-luxe', 'deluxe'],
    fallbackSlug: 'plato-ducha-de-luxe',
    shortDescription: 'Plato de ducha ultraslim de acrílico sanitario reforzado con textura antideslizante y diseño de vanguardia.',
    description: 'La línea De Luxe representa la gama más alta en receptáculos de ducha Five Saint. Fabricados en acrílico sanitario blanco de alta densidad reforzado con PRFV, destacan por su diseño extraplano de 5 cm de altura, evacuación rápida de agua y máxima calidez al contacto con los pies.',
    features: [
      'Altura extraplana: 5 cm (profundidad interna: 3,5 cm)',
      'Medidas disponibles: 100x70, 120x70, 130x70, 140x70, 150x70 y 160x70 cm',
      'Acrílico sanitario termoformado virgen inalterable',
      'Refuerzo de resina poliéster y fibra de vidrio (PRFV)',
      'Superficie de textura cálida y antideslizante',
      'Compatible con desagüe oficial Five Saint (Código FSE131)'
    ],
    sourceImage: 'Plato De Luxe.png',
    targetWebp: 'plato-de-luxe.webp',
    sortOrder: 1,
    badge: 'Lujo'
  },
  {
    name: 'Plato de Ducha Rectangular',
    slugKeywords: ['rectangular'],
    fallbackSlug: 'plato-ducha-rectangular',
    shortDescription: 'Plato de ducha rectangular clásico y resistente, disponible en 7 medidas de 90x60 a 160x70 cm.',
    description: 'El receptáculo Rectangular es la solución más versátil y eficiente para reemplazar bañeras por duchas modernas. Su canalización perimetral garantiza un drenaje fluido y constante, manteniendo el baño seco y seguro.',
    features: [
      'Altura: 5 cm (profundidad interna: 3,5 cm)',
      'Medidas disponibles: 90x60, 100x70, 120x70, 130x70, 140x70, 150x70 y 160x70 cm',
      'Fabricación en acrílico sanitario reforzado con PRFV',
      'Resistente al impacto, manchas y productos de limpieza domésticos',
      'Fácil instalación sobre contrapiso o carpeta',
      'Compatible con desagüe oficial (Código FSE131)'
    ],
    sourceImage: 'Plato Rectangular.png',
    targetWebp: 'plato-rectangular.webp',
    sortOrder: 2
  },
  {
    name: 'Plato de Ducha Sena',
    slugKeywords: ['sena'],
    fallbackSlug: 'plato-ducha-sena',
    shortDescription: 'Plato de ducha de líneas minimalistas y perfil estilizado en medidas de 120x70 y 150x70 cm.',
    description: 'El plato de ducha Sena combina un formato limpio y rectangular con una pendiente suave de caída de agua orientada a la sopapa. Ideal para boxes de ducha de vidrio templado en baños modernos.',
    features: [
      'Altura: 5 cm (profundidad interna: 3,5 cm)',
      'Medidas disponibles: 120x70 y 150x70 cm',
      'Acrílico sanitario termoformado de color blanco inalterable',
      'Estructura inferior reforzada para mayor firmeza al pisar',
      'Superficie continua sin porosidades de muy fácil mantenimiento',
      'Compatible con desagüe oficial (Código FSE131)'
    ],
    sourceImage: 'Plato Sena.png',
    targetWebp: 'plato-sena.webp',
    sortOrder: 3
  },
  {
    name: 'Plato de Ducha Cuadrado',
    slugKeywords: ['cuadrado'],
    fallbackSlug: 'plato-ducha-cuadrado',
    shortDescription: 'Plato de ducha simétrico cuadrado ideal para espacios compactos de 70x70 a 90x90 cm.',
    description: 'Diseñado para optimizar metros cuadrados en baños pequeños, el plato de ducha Cuadrado ofrece simetría perfecta y contorno estanco para mamparas cuadradas.',
    features: [
      'Altura: 5 cm (profundidad interna: 3,5 cm)',
      'Medidas disponibles: 70x70, 75x75, 80x80 y 90x90 cm',
      'Casco acrílico sanitario reinforced con resina y fibra de vidrio (PRFV)',
      'Terminación blanco brillante de alta durabilidad',
      'Esquinas de encastre preciso para cerramientos y mamparas',
      'Compatible con desagüe oficial (Código FSE131)'
    ],
    sourceImage: 'Plato Cuadrado.png',
    targetWebp: 'plato-cuadrado.webp',
    sortOrder: 4
  },
  {
    name: 'Plato de Ducha Curvo',
    slugKeywords: ['curvo'],
    fallbackSlug: 'plato-ducha-curvo',
    shortDescription: 'Plato de ducha rinconero con frente curvo de 80x80 y 90x90 cm para aprovechar esquinas.',
    description: 'El plato de ducha Curvo aprovecha de forma inteligente los rincones del baño. Su borde frontal redondeado suaviza la circulación dentro del ambiente y es ideal para combinar con mamparas semicirculares.',
    features: [
      'Altura: 5 cm (profundidad interna: 3,5 cm)',
      'Medidas disponibles: 80x80 y 90x90 cm',
      'Formato rinconero con frente curvo fluído',
      'Acrílico sanitario de gran resistencia al paso del tiempo',
      'Base antideslizante con evacuación central guiada',
      'Compatible con desagüe oficial (Código FSE131)'
    ],
    sourceImage: 'Plato Curvo.png',
    targetWebp: 'plato-curvo.webp',
    sortOrder: 5
  }
];

async function seedPlatosInfo() {
  console.log('🚀 Optimizando imágenes e insertando información de Platos de Ducha en Supabase...');

  const imagesDir = path.join(process.cwd(), 'public', 'images', 'Platos de Ducha');

  // Obtener productos existentes en la categoría
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('category_id', CATEGORY_ID);

  for (const item of platosData) {
    console.log(`\n🚿 Procesando: ${item.name}`);

    // 1. Optimizar imagen PNG a WebP
    const sourcePath = path.join(imagesDir, item.sourceImage);
    const webpPath = path.join(imagesDir, item.targetWebp);

    let imageUrl = '';
    if (fs.existsSync(sourcePath)) {
      const inputBuf = fs.readFileSync(sourcePath);
      const optimizedBuf = await sharp(inputBuf)
        .webp({ quality: 85, alphaQuality: 95, effort: 6 })
        .toBuffer();

      fs.writeFileSync(webpPath, optimizedBuf);
      console.log(`  ✨ Optimizado WebP: ${(inputBuf.length/1024).toFixed(1)} KB ➡️ ${(optimizedBuf.length/1024).toFixed(1)} KB`);

      // Subir a Storage
      const storagePath = `platos-de-ducha/${item.targetWebp}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, optimizedBuf, { contentType: 'image/webp', upsert: true });

      if (uploadError) {
        console.error(`  ⚠️ Error subiendo a Storage:`, uploadError.message);
      } else {
        console.log(`  ☁️ Subido a Storage: ${storagePath}`);
      }

      const { data: pubUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      imageUrl = pubUrl?.publicUrl || `/images/Platos de Ducha/${item.targetWebp}`;
    }

    // Buscar producto existente por slug o palabras clave
    let matchedProd = (dbProducts || []).find(p => 
      item.slugKeywords.some(kw => p.slug.toLowerCase().includes(kw))
    );

    let productId = matchedProd?.id;

    const payload = {
      category_id: CATEGORY_ID,
      name: item.name,
      slug: matchedProd?.slug || item.fallbackSlug,
      short_description: item.shortDescription,
      description: item.description,
      features: item.features,
      applications: commonApplications,
      technical_notes: commonTechnicalNotes,
      badge: item.badge || null,
      is_featured: true,
      is_active: true,
      sort_order: item.sortOrder,
      seo_title: `${item.name} | Platos de Ducha Five Saint`,
      seo_description: item.shortDescription
    };

    if (productId) {
      const { error: updateErr } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId);

      if (updateErr) console.error(`  ❌ Error actualizando producto:`, updateErr.message);
      else console.log(`  ✅ Producto actualizado en BD (ID: ${productId})`);
    } else {
      const { data: newP, error: insertErr } = await supabase
        .from('products')
        .insert([payload])
        .select('id')
        .single();

      if (insertErr) {
        console.error(`  ❌ Error insertando producto:`, insertErr.message);
        continue;
      }
      productId = newP.id;
      console.log(`  ✅ Producto creado en BD (ID: ${productId})`);
    }

    // Actualizar imagen principal en product_images
    if (imageUrl && productId) {
      await supabase.from('product_images').delete().eq('product_id', productId);
      await supabase.from('product_images').insert([
        {
          product_id: productId,
          url: imageUrl,
          alt: `${item.name} Five Saint`,
          sort_order: 0,
          is_cover: true
        }
      ]);
      console.log(`  🖼️ Imagen vinculada en product_images.`);
    }
  }

  // Actualizar cover image de la categoría
  const { data: firstImg } = await supabase
    .from('product_images')
    .select('url')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (firstImg?.url) {
    await supabase
      .from('product_categories')
      .update({ cover_image_url: firstImg.url, cover_image_alt: 'Platos de Ducha Five Saint' })
      .eq('id', CATEGORY_ID);
  }

  console.log('\n🎉 ¡Proceso finalizado! Todos los Platos de Ducha han sido optimizados y cargados a Supabase.');
}

seedPlatosInfo();
