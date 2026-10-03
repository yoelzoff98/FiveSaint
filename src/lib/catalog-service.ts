import {
  banerasPremiumData,
  banerasData,
  equipamientosData,
  ofertasData,
  spaOpcionalesData,
  spaDataPage1,
  spaDataPage2,
  platosDuchaData,
  columnasDuchaData,
  duchaEscocesaData
} from "../config/price-list-data.ts";

export interface CatalogItemDefinition {
  key: string;
  category: string;
  name: string;
  variantName?: string;
  price: number;
  medidas?: string;
  code?: string;
}

/**
 * Limpia y parsea un string de precio (ej. "$ 3 199 000") a número entero.
 */
export function parsePrice(priceStr?: string): number {
  if (!priceStr) return 0;
  if (priceStr.toLowerCase().includes("oferta")) return 0;
  const clean = priceStr.replace(/[^0-9]/g, "");
  return Number(clean) || 0;
}

/**
 * Retorna todos los productos del catálogo oficial unificado con sus precios.
 * Fuente única de precios tanto para el frontend de presupuestación como para
 * la validación estricta de seguridad en el backend.
 */
export function getOfficialCatalog(): CatalogItemDefinition[] {
  const catalog: CatalogItemDefinition[] = [];

  // 1. Bañeras Premium
  banerasPremiumData.forEach((b, idx) => {
    if (b.confortPrice) {
      catalog.push({
        key: `premium-confort-${idx}`,
        category: "Bañeras Premium",
        name: `Bañera ${b.name} (${b.medidas}) - Confort (16 Jets)`,
        variantName: "Confort",
        price: parsePrice(b.confortPrice),
        medidas: b.medidas,
        code: b.confortCode
      });
    }
    if (b.confortPlusPrice) {
      catalog.push({
        key: `premium-confortplus-${idx}`,
        category: "Bañeras Premium",
        name: `Bañera ${b.name} (${b.medidas}) - Confort Plus (16 Jets + Almohadilla + Digital)`,
        variantName: "Confort Plus",
        price: parsePrice(b.confortPlusPrice),
        medidas: b.medidas,
        code: b.confortPlusCode
      });
    }
  });

  // 2. Bañeras Standard y Cascos
  banerasData.products.forEach((b, idx) => {
    if (b.cascos) {
      catalog.push({
        key: `casco-${idx}`,
        category: "Cascos (Bañeras sin jets)",
        name: `Casco Bañera ${b.name} (${b.medidas})`,
        variantName: "Casco sin equipamiento",
        price: parsePrice(b.cascos),
        medidas: b.medidas,
        code: b.cascosCode
      });
    }
    if (b.jet4) {
      catalog.push({
        key: `b-jet4-${idx}`,
        category: "Bañeras Standard",
        name: `Bañera ${b.name} (${b.medidas}) - 4 Jets`,
        variantName: "4 Jets",
        price: parsePrice(b.jet4),
        medidas: b.medidas,
        code: b.jet4Code
      });
    }
    if (b.jet6) {
      catalog.push({
        key: `b-jet6-${idx}`,
        category: "Bañeras Standard",
        name: `Bañera ${b.name} (${b.medidas}) - 6 Jets`,
        variantName: "6 Jets",
        price: parsePrice(b.jet6),
        medidas: b.medidas,
        code: b.jet6Code
      });
    }
    if (b.jet8) {
      catalog.push({
        key: `b-jet8-${idx}`,
        category: "Bañeras Standard",
        name: `Bañera ${b.name} (${b.medidas}) - 8 Jets`,
        variantName: "8 Jets",
        price: parsePrice(b.jet8),
        medidas: b.medidas,
        code: b.jet8Code
      });
    }
  });

  // 3. Equipamiento Opcional
  equipamientosData.forEach((eq, idx) => {
    catalog.push({
      key: `equip-${idx}-${eq.codigo}`,
      category: "Equipamiento Opcional",
      name: `Equipamiento: ${eq.nombre}`,
      price: parsePrice(eq.precio),
      code: eq.codigo
    });
  });

  // 4. Ofertas Especiales
  ofertasData.forEach((of, idx) => {
    catalog.push({
      key: `oferta-${idx}-${of.code}`,
      category: "Ofertas Especiales",
      name: `Oferta Especial: ${of.name} (${of.medidas})`,
      price: parsePrice(of.precio),
      medidas: of.medidas,
      code: of.code
    });
  });

  // 5. Opcionales Spas / Minipiscinas
  spaOpcionalesData.forEach((op, idx) => {
    catalog.push({
      key: `opc-spa-${idx}-${op.code}`,
      category: "Opcionales Spas / Minipiscinas",
      name: `Opcional Spa: ${op.name}`,
      price: parsePrice(op.price),
      code: op.code
    });
  });

  // 6. Spas y Minipiscinas
  const allSpas = [...spaDataPage1, ...spaDataPage2];
  allSpas.forEach((spa, sIdx) => {
    spa.prices.forEach((p, pIdx) => {
      const colName = spa.columns && spa.columns[pIdx] ? spa.columns[pIdx] : "Estándar";
      catalog.push({
        key: `spa-${sIdx}-${pIdx}-${p.code}`,
        category: "Spas / Hidromasajes",
        name: `Spa ${spa.name} - Versión ${colName}`,
        variantName: colName,
        price: parsePrice(p.price),
        code: p.code
      });
    });
  });

  // 7. Platos de Ducha
  platosDuchaData.forEach((cat, cIdx) => {
    cat.items.forEach((item, iIdx) => {
      catalog.push({
        key: `plato-${cIdx}-${iIdx}-${item.code}`,
        category: "Platos de Ducha",
        name: `Plato Ducha ${cat.title} (${item.largo}x${item.ancho}x${item.altura}cm)`,
        price: parsePrice(item.price),
        code: item.code
      });
    });
  });

  // 8. Columnas de Ducha
  columnasDuchaData.forEach((c, idx) => {
    catalog.push({
      key: `columna-${idx}-${c.code}`,
      category: "Columnas de Ducha",
      name: `Columna ${c.name} - ${c.description}`,
      price: parsePrice(c.price),
      code: c.code
    });
  });

  // 9. Ducha Escocesa
  duchaEscocesaData.models.forEach((d, idx) => {
    catalog.push({
      key: `ducha-escocesa-${idx}`,
      category: "Ducha Escocesa",
      name: `Ducha Escocesa: ${d.name}`,
      price: parsePrice(d.price),
      code: d.code
    });
  });

  return catalog;
}

/**
 * Valida si un precio propuesto corresponde exactamente a la lista oficial.
 * Soporta búsqueda por clave estable (itemKey) y por nombre normalizado.
 */
export function verifyOfficialPrice(
  productName: string,
  price: number,
  itemKey?: string,
  variantName?: string
): { isOfficial: boolean; officialPrice?: number; matchedBy?: string } {
  const catalog = getOfficialCatalog();

  // 1. Coincidencia por identificador estable (itemKey)
  if (itemKey) {
    const matchByKey = catalog.find(item => item.key === itemKey);
    if (matchByKey) {
      return {
        isOfficial: matchByKey.price === price,
        officialPrice: matchByKey.price,
        matchedBy: "key"
      };
    }
  }

  // 2. Coincidencia por nombre y variante
  const normName = productName.trim().toLowerCase();
  const normVar = variantName ? variantName.trim().toLowerCase() : null;

  const match = catalog.find(item => {
    const itemNormName = item.name.trim().toLowerCase();
    if (normVar && item.variantName) {
      return itemNormName === normName && item.variantName.trim().toLowerCase() === normVar;
    }
    return itemNormName === normName;
  });

  if (match) {
    return {
      isOfficial: match.price === price,
      officialPrice: match.price,
      matchedBy: "name"
    };
  }

  return { isOfficial: false };
}
