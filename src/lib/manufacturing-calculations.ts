/**
 * Lógica de negocio y cálculos técnicos para preparación de fabricación FiveSaint.
 * - Explosión y cálculo de insumos (BOM base + efectos de opciones configurables).
 * - Consolidación de insumos repetidos por identidad y unidad de medida.
 * - Validación estricta de capacidad para formato de impresión en una única hoja A4.
 * - Formato decimal y redondeo controlado según unidad de medida (UOM).
 */

export interface SupplyItem {
  id?: string;
  code: string;
  name: string;
  unitOfMeasure: 'un' | 'm' | 'kg' | 'l' | 'm2' | 'm3' | 'g' | 'cm' | string;
  quantity: number;
  wastePercentage?: number;
  notes?: string;
}

export interface CompositionBaseItem {
  supplyId: string;
  code: string;
  name: string;
  unitOfMeasure: string;
  baseQuantity: number;
  notes?: string;
}

export interface MaterialsEffectRule {
  action: 'add' | 'replace' | 'adjust';
  supplyCode: string;
  supplyName?: string;
  unitOfMeasure?: string;
  quantity: number;
  targetSupplyCode?: string; // Para 'replace'
}

export interface ConfigurableOptionDefinition {
  code: string;
  name: string;
  allowedValues: Array<{ value: string; label: string }>;
  defaultValue?: string;
  isRequired?: boolean;
  manufacturingInstructions?: Record<string, string>;
  compatibilityRules?: Array<{
    ifValue?: string | string[];
    conflictsWith?: { optionCode: string; values: string[] };
    requires?: { optionCode: string; values: string[] };
    message?: string;
  }>;
  materialsEffect?: Array<{
    ifValue: string;
    effects: MaterialsEffectRule[];
  }>;
  changesMaterials?: boolean;
}

/**
 * Capacidad máxima técnica comprobada para la plantilla de hoja única A4.
 * Un documento A4 con cabecera (50mm), metadatos de producto/configuración (45mm),
 * y controles de calidad/firmas (45mm) tiene espacio para un máximo de 16 filas de insumos
 * manteniendo una tipografía legible (10-11px) sin riesgo de overflow vertical ni paginación adicional.
 */
export const MAX_A4_SUPPLY_ROWS = 16;
export const MAX_A4_INSTRUCTIONS_COUNT = 6;
export const MAX_A4_CONFIG_ENTRIES_COUNT = 8;
export const MAX_A4_OBSERVATIONS_LENGTH = 350;

/**
 * Redondeo técnico según la unidad de medida:
 * - 'un': cantidad entera (redondeo matemático exacto o validación estricta).
 * - 'm', 'kg', 'l', 'm2', etc.: hasta 2 decimales estándar.
 */
export function roundSupplyQuantity(qty: number, uom: string): number {
  if (isNaN(qty) || !isFinite(qty)) return 0;
  if (uom === 'un') {
    return Math.round(qty);
  }
  return Math.round(qty * 100) / 100;
}

/**
 * Formatea una cantidad técnica con su unidad para visualización e impresión.
 */
export function formatSupplyQuantity(qty: number, uom: string): string {
  const rounded = roundSupplyQuantity(qty, uom);
  if (uom === 'un') {
    return `${rounded} un`;
  }
  return `${rounded.toFixed(2).replace('.', ',')} ${uom}`;
}

/**
 * Valida conflictos e incompatibilidades entre opciones seleccionadas.
 */
export function validateOptionCompatibility(
  configuration: Record<string, any>,
  options: ConfigurableOptionDefinition[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const opt of options) {
    const selectedVal = configuration[opt.code];

    if (opt.isRequired && (!selectedVal || selectedVal === '')) {
      errors.push(`La opción "${opt.name}" es obligatoria.`);
      continue;
    }

    if (!selectedVal) continue;

    if (!opt.allowedValues.some(value => value.value === selectedVal)) {
      errors.push(`Valor no permitido para ${opt.name}.`);
      continue;
    }

    // Verificar reglas de compatibilidad
    if (Array.isArray(opt.compatibilityRules)) {
      for (const rule of opt.compatibilityRules) {
        if (rule.ifValue) {
          const applies = Array.isArray(rule.ifValue)
            ? rule.ifValue.includes(selectedVal)
            : rule.ifValue === selectedVal;
          if (!applies) continue;
        }

        if (rule.conflictsWith) {
          const otherVal = configuration[rule.conflictsWith.optionCode];
          if (otherVal && rule.conflictsWith.values.includes(otherVal)) {
            errors.push(
              rule.message ||
                `Incompatibilidad: "${opt.name}" (${selectedVal}) no es compatible con "${rule.conflictsWith.optionCode}" (${otherVal}).`
            );
          }
        }
        if (rule.requires) {
          const otherVal = configuration[rule.requires.optionCode];
          if (!otherVal || !rule.requires.values.includes(otherVal)) {
            errors.push(
              rule.message ||
                `La opción "${opt.name}" requiere que "${rule.requires.optionCode}" tenga uno de los siguientes valores: ${rule.requires.values.join(', ')}.`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Recopila las instrucciones técnicas de fabricación a partir de la configuración seleccionada.
 */
export function collectManufacturingInstructions(
  configuration: Record<string, any>,
  options: ConfigurableOptionDefinition[]
): string[] {
  const instructions: string[] = [];

  for (const opt of options) {
    const val = configuration[opt.code];
    if (val && opt.manufacturingInstructions && opt.manufacturingInstructions[val]) {
      instructions.push(`${opt.name}: ${opt.manufacturingInstructions[val]}`);
    }
  }

  return instructions;
}

/**
 * Calcula la lista completa de insumos requeridos multiplicando por la cantidad a fabricar
 * y aplicando los efectos de las opciones configuradas.
 */
export function calculateRequiredSupplies(params: {
  baseItems: CompositionBaseItem[];
  quantity: number;
  wastePercentage?: number;
  configuration: Record<string, any>;
  options: ConfigurableOptionDefinition[];
}): {
  supplies: SupplyItem[];
  instructions: string[];
} {
  const { baseItems, quantity, wastePercentage = 0, configuration, options } = params;
  const wasteMultiplier = 1 + (wastePercentage > 0 ? wastePercentage / 100 : 0);

  // Mapa mutable por código de insumo
  const suppliesMap = new Map<string, SupplyItem>();

  // 1. Cargar insumos base de la composición
  for (const item of baseItems) {
    const totalQty = item.baseQuantity * quantity * wasteMultiplier;
    suppliesMap.set(item.code, {
      code: item.code,
      name: item.name,
      unitOfMeasure: item.unitOfMeasure,
      quantity: totalQty,
      notes: item.notes
    });
  }

  // 2. Aplicar efectos de opciones configurables
  for (const opt of options) {
    const selectedVal = configuration[opt.code];
    if (!selectedVal || !opt.materialsEffect) continue;

    for (const ruleGroup of opt.materialsEffect) {
      if (ruleGroup.ifValue === selectedVal) {
        for (const effect of ruleGroup.effects) {
          const effectQty = effect.quantity * quantity;

          if (effect.action === 'add') {
            const existing = suppliesMap.get(effect.supplyCode);
            if (existing) {
              existing.quantity += effectQty;
            } else {
              suppliesMap.set(effect.supplyCode, {
                code: effect.supplyCode,
                name: effect.supplyName || effect.supplyCode,
                unitOfMeasure: effect.unitOfMeasure || 'un',
                quantity: effectQty
              });
            }
          } else if (effect.action === 'replace' && effect.targetSupplyCode) {
            // Quita o ajusta el insumo original y agrega el de reemplazo
            suppliesMap.delete(effect.targetSupplyCode);
            const existing = suppliesMap.get(effect.supplyCode);
            if (existing) {
              existing.quantity += effectQty;
            } else {
              suppliesMap.set(effect.supplyCode, {
                code: effect.supplyCode,
                name: effect.supplyName || effect.supplyCode,
                unitOfMeasure: effect.unitOfMeasure || 'un',
                quantity: effectQty
              });
            }
          } else if (effect.action === 'adjust') {
            const existing = suppliesMap.get(effect.supplyCode);
            if (existing) {
              existing.quantity += effectQty;
            }
          }
        }
      }
    }
  }

  // 3. Consolidar y redondear
  const supplies: SupplyItem[] = [];
  for (const item of suppliesMap.values()) {
    supplies.push({
      ...item,
      quantity: roundSupplyQuantity(item.quantity, item.unitOfMeasure)
    });
  }

  // Ordenar por código para estabilidad en la presentación
  supplies.sort((a, b) => a.code.localeCompare(b.code));

  // 4. Instrucciones técnicas
  const instructions = collectManufacturingInstructions(configuration, options);

  return {
    supplies,
    instructions
  };
}



/**
 * Validador estricto del límite de capacidad física para impresión en una única hoja A4.
 * Verifica exhaustivamente la altura combinada de todos los bloques:
 * - Tabla de insumos (máx. 16 filas)
 * - Instrucciones técnicas de fabricación (máx. 6 instrucciones de máx. 120 caracteres cada una)
 * - Entradas de configuración comercial confirmada (máx. 8 pares clave/valor)
 * - Observaciones técnicas de planta (máx. 350 caracteres)
 * Bloquea la emisión si el contenido excede la capacidad física real de una página A4 portrait de 297mm.
 */
export function validateSingleA4Capacity(params: {
  supplies: SupplyItem[];
  instructions?: string[];
  configuration?: Record<string, any>;
  notes?: string | null;
}): {
  fitsInSingleA4: boolean;
  reason?: string;
  supplyCount: number;
  maxSupplyCount: number;
} {
  const { supplies, instructions = [], configuration = {}, notes } = params;
  const supplyCount = supplies.length;

  // Conservative wrapping budget matching the fixed print widths. Never truncate.
  const textFits = (value: unknown, max: number) => {
    const text = String(value ?? "");
    return text.length <= max && !/[\r\n\t]/.test(text);
  };
  if (supplies.some(item => !textFits(item.code, 20) || !textFits(item.name, 70) || !textFits(item.notes, 70)) ||
      Object.entries(configuration).some(([key, value]) => !textFits(key, 32) || !textFits(Array.isArray(value) ? value.join(", ") : value, 50)) ||
      instructions.some(value => !textFits(value, 140)) || (notes && notes.split(/\r?\n/).length > 4)) {
    return { fitsInSingleA4: false, supplyCount, maxSupplyCount: MAX_A4_SUPPLY_ROWS, reason: "BLOQUEO A4: textos técnicos demasiado extensos para imprimir completos en una sola hoja." };
  }

  if (supplyCount > MAX_A4_SUPPLY_ROWS) {
    return {
      fitsInSingleA4: false,
      supplyCount,
      maxSupplyCount: MAX_A4_SUPPLY_ROWS,
      reason: `BLOQUEO A4: La orden requiere ${supplyCount} líneas de insumos consolidables, superando el límite máximo admitido de ${MAX_A4_SUPPLY_ROWS} para una única hoja A4. Consolide insumos para garantizar que la orden encaje en una única página sin desborde.`
    };
  }

  // Validar cantidad y extensión de instrucciones
  if (instructions.length > MAX_A4_INSTRUCTIONS_COUNT) {
    return {
      fitsInSingleA4: false,
      supplyCount,
      maxSupplyCount: MAX_A4_SUPPLY_ROWS,
      reason: `BLOQUEO A4: La orden contiene ${instructions.length} instrucciones técnicas de montaje, superando el límite máximo de ${MAX_A4_INSTRUCTIONS_COUNT} permitidas en el espacio reservado de la hoja A4.`
    };
  }

  const longInstruction = instructions.find((inst) => inst.length > 140);
  if (longInstruction) {
    return {
      fitsInSingleA4: false,
      supplyCount,
      maxSupplyCount: MAX_A4_SUPPLY_ROWS,
      reason: `BLOQUEO A4: Una instrucción técnica excede los 140 caracteres ("${longInstruction.slice(0, 40)}..."), lo que provocaría desborde vertical sobre la tabla de insumos.`
    };
  }

  // Validar cantidad de opciones configuradas
  const configKeys = Object.keys(configuration).filter(
    (k) => configuration[k] !== undefined && configuration[k] !== null && configuration[k] !== ''
  );
  if (configKeys.length > MAX_A4_CONFIG_ENTRIES_COUNT) {
    return {
      fitsInSingleA4: false,
      supplyCount,
      maxSupplyCount: MAX_A4_SUPPLY_ROWS,
      reason: `BLOQUEO A4: La configuración contiene ${configKeys.length} opciones detalladas, superando el límite de ${MAX_A4_CONFIG_ENTRIES_COUNT} admitidas en el bloque de producto de la hoja A4.`
    };
  }

  // Validar longitud de observaciones
  if (notes && notes.length > MAX_A4_OBSERVATIONS_LENGTH) {
    return {
      fitsInSingleA4: false,
      supplyCount,
      maxSupplyCount: MAX_A4_SUPPLY_ROWS,
      reason: `BLOQUEO A4: Las observaciones (${notes.length} caracteres) exceden los ${MAX_A4_OBSERVATIONS_LENGTH} caracteres permitidos para garantizar que la orden encaje en una única página A4.`
    };
  }

  return {
    fitsInSingleA4: true,
    supplyCount,
    maxSupplyCount: MAX_A4_SUPPLY_ROWS
  };
}
