import { Product } from "@/types/product";

/**
 * Base de datos estática de productos para el catálogo de Five Saint (Sprint 4).
 * Contiene exactamente 14 productos realistas distribuidos en las 7 categorías principales de la empresa.
 * Se evitan códigos de fábrica exactos y marcas comerciales para mantener la universalidad institucional.
 */
export const products: Product[] = [
  // CATEGORÍA 1: Bañeras (baneras)
  {
    id: "banera-classic",
    name: "Bañera Classic",
    slug: "banera-classic",
    categoryId: "baneras",
    categoryName: "Bañeras",
    shortDescription: "Bañera anatómica de acrílico sanitario reforzado con curvatura de apoyo lumbar.",
    description: "La bañera Classic ofrece un diseño ergonómico de líneas tradicionales optimizado para proporcionar el relax diario ideal.",
    features: [
      "Acrílico sanitario de alta densidad",
      "Terminación brillante y antideslizante",
      "Aislamiento térmico prolongado",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/banera-classic",
    badge: "Más Vendida"
  },
  {
    id: "banera-oval",
    name: "Bañera Oval",
    slug: "banera-oval",
    categoryId: "baneras",
    categoryName: "Bañeras",
    shortDescription: "Bañera exenta (freestanding) de diseño elíptico minimalista, perfecta para baños centrales.",
    description: "Con su presencia escultural, la bañera exenta Oval se convierte en la pieza central de cualquier baño contemporáneo de lujo.",
    features: [
      "Instalación exenta (Freestanding)",
      "Líneas curvas orgánicas",
      "Fácil limpieza y mantenimiento",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/banera-oval",
    badge: "Diseño Exclusivo"
  },
  {
    id: "banera-minimal",
    name: "Bañera Minimal",
    slug: "banera-minimal",
    categoryId: "baneras",
    categoryName: "Bañeras",
    shortDescription: "Bañera rectangular de líneas puras y rectas, ideal para ambientes contemporáneos.",
    description: "Diseñada bajo la filosofía de 'menos es más', la línea Minimal brinda ángulos rectos sofisticados y amplio espacio interior.",
    features: [
      "Estructura autoportante reforzada",
      "Esquinas de precisión rectangulares",
      "Apta para empotrar o revestir",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/banera-minimal"
  },

  // CATEGORÍA 2: Hidromasajes (hidromasajes)
  {
    id: "hidromasaje-premium",
    name: "Hidromasaje Premium",
    slug: "hidromasaje-premium",
    categoryId: "hidromasajes",
    categoryName: "Hidromasajes",
    shortDescription: "Sistema avanzado de hidroterapia con 8 jets direccionales de caudal regulable.",
    description: "Equipada con lo último en ingeniería de relax, el hidromasaje Premium combina caudal e inyección de aire para masajes cervicales y lumbares profundos.",
    features: [
      "8 jets orientables de alto caudal",
      "Encendido neumático de seguridad",
      "Motor autodrenante certificado",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/hidromasaje-premium",
    badge: "Lujo"
  },
  {
    id: "hidromasaje-compact",
    name: "Hidromasaje Compact",
    slug: "hidromasaje-compact",
    categoryId: "hidromasajes",
    categoryName: "Hidromasajes",
    shortDescription: "Hidromasaje optimizado de 6 jets para baños de dimensiones reducidas.",
    description: "La línea Compact permite disfrutar del relax y los beneficios terapéuticos del hidromasaje tradicional sin sacrificar espacio de circulación.",
    features: [
      "6 jets de inyección localizada",
      "Diseño ergonómico eficiente",
      "Uso residencial o comercial",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/hidromasaje-compact"
  },
  {
    id: "hidromasaje-familiar",
    name: "Hidromasaje Familiar",
    slug: "hidromasaje-familiar",
    categoryId: "hidromasajes",
    categoryName: "Hidromasajes",
    shortDescription: "Bañera de hidromasaje extra amplia de dos plazas de descanso enfrentadas.",
    description: "Diseñada especialmente para compartir momentos únicos de relax, la línea Familiar destaca por sus dimensiones simétricas y jets independientes.",
    features: [
      "Doble cabezal de descanso",
      "Sistemas de jets simétricos",
      "Estructura perimetral metálica",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/hidromasaje-familiar",
    badge: "Doble Plaza"
  },

  // CATEGORÍA 3: Spas (spas)
  {
    id: "spa-familiar",
    name: "Spa Familiar",
    slug: "spa-familiar",
    categoryId: "spas",
    categoryName: "Spas",
    shortDescription: "Minipiscina de relax equipada para 4 a 5 personas con sistemas digitales integrados.",
    description: "El Spa Familiar de Five Saint transforma cualquier rincón de tu jardín o terraza en un spa de lujo privado con hidrogrupos climatizados.",
    features: [
      "Climatizador digital inteligente",
      "16 jets de masajes combinados",
      "Cromoterapia LED y ozonizador",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/spa-familiar",
    badge: "Exterior / Interior"
  },
  {
    id: "spa-relax",
    name: "Spa Relax",
    slug: "spa-relax",
    categoryId: "spas",
    categoryName: "Spas",
    shortDescription: "Minipiscina compacta de hidroterapia con tumbonas de inmersión total.",
    description: "Enfocado en la recuperación muscular y relax mental, el modelo Spa Relax introduce camillas anatómicas de jets intensivos circulares.",
    features: [
      "Tumbona ergonómica de relax",
      "Bomba de presión independiente",
      "Consumo eléctrico optimizado",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/spa-relax",
    badge: "Premium"
  },

  // CATEGORÍA 4: Platos de ducha (platos-de-ducha)
  {
    id: "plato-ducha-slim",
    name: "Plato de Ducha Slim",
    slug: "plato-ducha-slim",
    categoryId: "platos-de-ducha",
    categoryName: "Platos de ducha",
    shortDescription: "Receptáculo plano de ducha ultra-delgado antideslizante con textura mineral.",
    description: "Slim redefine el acceso a tu ducha diaria mediante una superficie minimalista antideslizante instalable a nivel del piso.",
    features: [
      "Altura ultra plana (Slim design)",
      "Texturizado antideslizante higiénico",
      "Fácil desagote rápido de agua",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/plato-ducha-slim",
    badge: "Ultra Plano"
  },
  {
    id: "plato-ducha-antideslizante",
    name: "Plato de Ducha Antideslizante",
    slug: "plato-ducha-antideslizante",
    categoryId: "platos-de-ducha",
    categoryName: "Platos de ducha",
    shortDescription: "Plato de ducha de acrílico reforzado texturado de alta seguridad.",
    description: "Combina rigidez estructural de alto impacto y un patrón texturado especial que incrementa el agarre y la tracción al ducharse.",
    features: [
      "Tratamiento texturado de tracción",
      "Resistencia mecánica reforzada",
      "Uso residencial u hotelero",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/plato-ducha-antideslizante"
  },

  // CATEGORÍA 5: Columnas (columnas)
  {
    id: "columna-hydro",
    name: "Columna Hydro",
    slug: "columna-hydro",
    categoryId: "columnas",
    categoryName: "Columnas",
    shortDescription: "Columna de ducha vertical estilizada con jets lumbares de hidromasaje.",
    description: "Una solución compacta y de diseño vanguardista en acero inoxidable que renueva por completo tu grifería tradicional de ducha.",
    features: [
      "Acero inoxidable antihuella",
      "Jets integrados lumbares/cervicales",
      "Rociador superior de efecto lluvia",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/columna-hydro",
    badge: "Fácil Instalación"
  },
  {
    id: "columna-termal",
    name: "Columna Termal",
    slug: "columna-termal",
    categoryId: "columnas",
    categoryName: "Columnas",
    shortDescription: "Columna vertical con grifería termostática de precisión y duchador anticalcáreo.",
    description: "Brinda control absoluto de temperatura y caudal de agua constantes, evitando variaciones térmicas bruscas en tus baños.",
    features: [
      "Grifería termostática alemana",
      "Duchador de mano anticalcáreo",
      "Diseño contemporáneo minimalista",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/columna-termal"
  },

  // CATEGORÍA 6: Saunas (saunas)
  {
    id: "sauna-compact",
    name: "Sauna Compact",
    slug: "sauna-compact",
    categoryId: "saunas",
    categoryName: "Saunas",
    shortDescription: "Cabina de calor seco de madera de primera calidad para 2 a 3 personas.",
    description: "Fabricada bajo estrictas tolerancias térmicas en madera noble seleccionada, el sauna dry Compact promueve la desintoxicación y relajación absolutas en el hogar.",
    features: [
      "Maderas de pino hemlock seleccionadas",
      "Calefactor eléctrico con piedras",
      "Termostato analógico de precisión",
      "Consulta por medidas disponibles"
    ],
    href: "/productos/sauna-compact",
    badge: "Maderas Selectas"
  },

  // CATEGORÍA 7: Ducha Escocesa (ducha-escocesa)
  {
    id: "ducha-escocesa",
    name: "Ducha Escocesa Five Saint",
    slug: "ducha-escocesa",
    categoryId: "ducha-escocesa",
    categoryName: "Ducha Escocesa",
    shortDescription: "Sistema integral de estimulación hidráulica vertical a alta presión en acero inoxidable.",
    description: "La Ducha Escocesa Five Saint combina barrales de acero inoxidable pulido de alta densidad, 6 duchas punzantes direccionables y duchon superior de alta presión. Disponible en versión de recirculación con receptáculo (100x75x32 cm) y bomba air-switch, o en versión exterior/embutir.",
    features: [
      "2 Barrales de acero inoxidable pulido Ø 1 1/4\"",
      "6 Duchas punzantes direccionables con regulador",
      "Duchón superior orientable de alta presión",
      "Opción de recirculación con receptáculo (100 x 75 x 32 cm)",
      "Bomba de recirculación con encendido neumático Air Switch",
      "Presurización recomendada hasta 1,5 kg"
    ],
    href: "/productos/ducha-escocesa",
    badge: "Hidroterapia Premium"
  }
];
export default products;
