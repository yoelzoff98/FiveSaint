import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
const CATEGORY_ID = '6ef758e9-45ca-42dc-a3ef-e93306a8773b'; // Bañeras

const commonApplications = [
  'Hogar / Baño principal',
  'Hotelería de categoría y Suites',
  'Complejos turísticos y Cabañas',
  'Centros de estética, Spa y Relax'
];

const commonTechnicalNotes = [
  'Casco: Acrílico sanitario blanco termoformado de alta densidad con filtro UV.',
  'Refuerzo: Resina poliéster y fibra de vidrio de alta densidad (PRFV).',
  'Motor: Bomba de recirculación auto-cebante y auto-drenante con protector térmico de seguridad.',
  'Encendido: Sistema neumático Air-Switch mediante pulsador en el ala seguro contra humedad.',
  'Comandos: Regulador de aire para ajuste de intensidad de hidromasaje.',
  'Accesorios incluidos: Sopapa y desborde metálico con trampa de agua.'
];

const banerasInfoData = [
  {
    slug: 'quadra',
    shortDescription: 'Bañera cuadrada de amplio espacio de 150x150 cm con sistema hidroterapéutico.',
    description: 'La bañera Quadra combina líneas rectangulares y amplio volumen interior en un formato de 150x150 cm. Diseñada para un confort compartido o individual de máxima libertad.',
    features: [
      'Medidas: 150 cm x 150 cm',
      'Casco de acrílico sanitario blanco de alta calidad termoformado',
      'Reforzado con fibra de vidrio y resinas poliéster (PRFV)',
      'Bomba de recirculación autodrenante con protector térmico',
      'Encendido neumático air switch seguro y hermético',
      'Jets orientables de caudal regulable individual'
    ]
  },
  {
    slug: 'veneto',
    shortDescription: 'Bañera curva rectangular de 184x100 cm de líneas suaves y ergonómicas.',
    description: 'El modelo Veneto ofrece una superficie elíptica y amplia curvatura lumbar en 184x100 cm. Su diseño ergonómico envuelve el cuerpo permitiendo una inmersión completa y revitalizante.',
    features: [
      'Medidas: 184 cm x 100 cm',
      'Acrílico sanitario de alto brillo inalterable con filtro UV',
      'Estructura autoportante reforzada',
      'Jets cervicales y lumbares orientables',
      'Encendido por pulsador neumático en el ala',
      'Disponible en versión Casco, 4, 6 u 8 jets'
    ]
  },
  {
    slug: 'modena',
    shortDescription: 'Bañera doble rectangular de 200x144 cm de gran dimensión y lujo.',
    description: 'Con un tamaño generoso de 200x144 cm, la bañera Modena es el centro de atención para baños de lujo y suites. Permite alojar holgadamente a dos personas con zonas de hidromasaje independientes.',
    features: [
      'Medidas: 200 cm x 144 cm',
      'Gran dimensión para uso doble confortable',
      'Acrílico de alta densidad termoformado y reforzado',
      'Sistema de jets de alto caudal en ambos respaldos',
      'Motor autodrenante silenciado'
    ]
  },
  {
    slug: 'parma',
    shortDescription: 'Bañera anatómica de 180x80 cm con apoyo lumbar optimizado.',
    description: 'La bañera Parma de 180x80 cm proporciona una experiencia anatómica clásica con curvatura diseñada para el descanso completo de la columna y hombros.',
    features: [
      'Medidas: 180 cm x 80 cm',
      'Perfil anatómico con soporte lumbar integrado',
      'Opción de 4, 6 u 8 jets de hidromasaje',
      'Pulsador neumático air-switch de suave accionamiento',
      'Refuerzo PRFV de alta resistencia estructural'
    ]
  },
  {
    slug: 'romana',
    shortDescription: 'Bañera clásica versátil disponible en múltiples medidas (150x70 hasta 180x150 cm).',
    description: 'La línea Romana es el clásico por excelencia de Five Saint. Su diseño atemporal de bordes suaves y fondo amplio se adapta a todo proyecto de baño residencial u hotelero.',
    features: [
      'Medidas disponibles: 150x70, 160x75, 170x80, 180x90, 180x120, 180x150 cm',
      'Superficie cálida al tacto y de fácil limpieza',
      'Múltiples opciones de jets e hidromasaje',
      'Bomba autodrenante de seguridad',
      'Casco acrílico sanitario reforzado'
    ]
  },
  {
    slug: 'perla',
    shortDescription: 'Bañera ergonómica de contorno suavizado disponible en 4 medidas.',
    description: 'La bañera Perla combina una silueta envolvente con esquinas sutilmente redondeadas. Disponible en formatos individuales y dobles para adaptarse a cada ambiente.',
    features: [
      'Medidas: 140x77, 165x90, 190x90, 180x120 cm',
      'Acrílico sanitario de alto brillo inalterable',
      'Jets orientables de masaje profundo',
      'Encendido neumático ultra seguro',
      'Diseño elíptico suave'
    ]
  },
  {
    slug: 'lady',
    shortDescription: 'Bañera compacta y elegante de 150x70, 160x70 o 170x70 cm.',
    description: 'Diseñada para baños contemporáneos que requieren optimizar la circulación, la línea Lady maximiza la profundidad interna conservando un exterior compacto.',
    features: [
      'Medidas: 150x70, 160x70, 170x70 cm',
      'Diseño compacto de alta eficiencia de espacio',
      'Jets de inyección rápida de agua y aire',
      'Aislamiento térmico prolongado'
    ]
  },
  {
    slug: 'quarzo',
    shortDescription: 'Bañera de diseño contemporáneo de 170x83 cm de profundidad superior.',
    description: 'El modelo Quarzo destaca por su perfil sobrio de 170x83 cm con paredes laterales verticales que amplían la capacidad de agua para un baño de inmersión reconstituyente.',
    features: [
      'Medidas: 170 cm x 83 cm',
      'Mayor profundidad útil de agua',
      'Acrílico sanitario virgen termoformado',
      'Opciones de equipamiento de hidromasaje'
    ]
  },
  {
    slug: 'yaquelin',
    shortDescription: 'Bañera amplia de 165x120 o 181x91 cm con posabrazos ergonómicos.',
    description: 'Con un ancho amplio y molduras anatómicas integradas para brazos, la bañera Yaquelin está pensada para sesiones prolongadas de relajación hidroterapéutica.',
    features: [
      'Medidas: 165x120 cm y 181x91 cm',
      'Posabrazos anatómicos moldeados en casco',
      'Superficie antideslizante',
      'Hidromasaje de alto flujo de agua'
    ]
  },
  {
    slug: 'valeria',
    shortDescription: 'Bañera ultracompacta de 140x70 cm perfecta para espacios pequeños.',
    description: 'Ideal para renovaciones de baños donde el espacio es prioritario, Valeria en 140x70 cm ofrece todo el confort de una bañera completa en dimensiones reducidas.',
    features: [
      'Medidas: 140 cm x 70 cm',
      'Formato ultracompacto de fácil ubicación',
      'Construcción en acrílico reforzado PRFV',
      'Opción con hidromasaje de 4 o 6 jets'
    ]
  },
  {
    slug: 'joya',
    shortDescription: 'Bañera confortable en medidas de 150x75 y 160x75 cm.',
    description: 'Su interior biselado y sus dimensiones de 150x75 o 160x75 cm hacen de la bañera Joya una opción equilibrada para el baño diario con opción de sistema hidroterapéutico.',
    features: [
      'Medidas: 150x75 cm y 160x75 cm',
      'Interior confortable biselado',
      'Material lavable inalterable',
      'Motor de recirculación autodrenante'
    ]
  },
  {
    slug: 'agustar',
    shortDescription: 'Bañera doble de 180x150 cm con respaldo simétrico.',
    description: 'La bañera Agustar ofrece un formato rectangular simétrico de 180x150 cm con dos zonas de descanso enfrentadas, ideal para parejas o spas residenciales.',
    features: [
      'Medidas: 180 cm x 150 cm',
      'Doble respaldo simétrico enfrentado',
      'Jets distribuídos para dos usuarios simultáneos',
      'Acrílico reforzado con estructura metálica'
    ]
  },
  {
    slug: 'martina-cfe',
    shortDescription: 'Bañera autoportante de 180x120 cm equipada con faldón/frente y estructura metálica.',
    description: 'El modelo Martina CFE incluye estructura metálica autoportante y frente perimetral decorativo, facilitando una instalación limpia sin necesidad de amurar o revestir.',
    features: [
      'Medidas: 180 cm x 120 cm',
      'Incluye frente exterior decorativo y estructura metálica',
      'Instalación autoportante simplificada',
      'Sistema hidroterapéutico completo'
    ]
  },
  {
    slug: 'martina-sf',
    shortDescription: 'Bañera para empotrar de 180x120 cm sin faldón.',
    description: 'Versión para empotrar o revestir de la bañera Martina de 180x120 cm, diseñada para integrarse con porcelanatos o maderas a medida.',
    features: [
      'Medidas: 180 cm x 120 cm',
      'Diseñada para empotrar y revestir',
      'Casco de acrílico sanitario reforzado',
      'Zonas de masajes ajustables'
    ]
  },
  {
    slug: 'unica',
    shortDescription: 'Bañera exenta/doble de 180x150 cm de presencia vanguardista.',
    description: 'Su formato plano y estilizado de 180x150 cm brinda un toque contemporáneo único al cuarto de baño, con espacio amplio e inyectores hidroterapéuticos.',
    features: [
      'Medidas: 180 cm x 150 cm',
      'Diseño vanguardista de líneas puras',
      'Acrílico sanitario de textura sedosa al tacto',
      'Jets de hidromasaje perimetrales'
    ]
  },
  {
    slug: 'laguna',
    shortDescription: 'Bañera elíptica de 180x106 cm de contornos orgánicos.',
    description: 'La bañera Laguna en 180x106 cm evoca las formas de la naturaleza con bordes suaves que facilitan el acceso y brindan un relax visual y físico.',
    features: [
      'Medidas: 180 cm x 106 cm',
      'Contornos elípticos orgánicos',
      'Jets regulables orientables',
      'Material de fácil conservación y brillo permanente'
    ]
  },
  {
    slug: 'circular',
    shortDescription: 'Bañera redonda de 150 cm de diámetro para ambientes exclusivos.',
    description: 'Pieza escultural de 150 cm de diámetro. Su formato circular genera una experiencia envolvente de hidroterapia con distribución perimetral de jets.',
    features: [
      'Medidas: 150 cm de diámetro',
      'Diseño circular de lujo',
      'Jets distribuidos perimetralmente',
      'Pulsador y comandos en borde superior'
    ]
  },
  {
    slug: 'esquinera-curvo',
    shortDescription: 'Bañera de rincón de 140x140 cm con faldón curvo.',
    description: 'Aprovecha de forma inteligente los rincones del baño con sus 140x140 cm y frente curvo suave, combinando accesibilidad y estética fluida.',
    features: [
      'Medidas: 140 cm x 140 cm',
      'Formato rinconero con frente curvo',
      'Aprovechamiento eficiente de esquina',
      'Hidromasaje con regulador de aire'
    ]
  },
  {
    slug: 'esquinero-recto',
    shortDescription: 'Bañera de rincón de 150x150 cm con frente recto geométrico.',
    description: 'Con líneas rectas y puras de 150x150 cm, este modelo rinconero aporta un estilo arquitectónico moderno al cuarto de baño.',
    features: [
      'Medidas: 150 cm x 150 cm',
      'Formato rinconero de frente recto',
      'Líneas geométricas modernas',
      'Jets orientables de alto rendimiento'
    ]
  }
];

async function seedBanerasInfo() {
  console.log('🚀 Actualizando información de Bañeras con Hidro en Supabase...');

  for (const item of banerasInfoData) {
    console.log(`\n🛁 Actualizando: ${item.slug}`);

    const payload = {
      short_description: item.shortDescription,
      description: item.description,
      features: item.features,
      applications: commonApplications,
      technical_notes: commonTechnicalNotes,
      is_active: true,
      seo_title: `${item.slug.toUpperCase()} | Bañeras e Hidromasajes Five Saint`,
      seo_description: item.shortDescription
    };

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('category_id', CATEGORY_ID)
      .eq('slug', item.slug)
      .select('id, name');

    if (error) {
      console.error(`  ❌ Error actualizando ${item.slug}:`, error.message);
    } else if (!data || data.length === 0) {
      console.warn(`  ⚠️ No se encontró producto con slug: ${item.slug}`);
    } else {
      console.log(`  ✅ Producto '${data[0].name}' (ID: ${data[0].id}) actualizado con éxito.`);
    }
  }

  console.log('\n🎉 ¡Proceso finalizado! Toda la información de las Bañeras con Hidro ha sido cargada.');
}

seedBanerasInfo();
