import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina nombres de clases condicionales de Tailwind CSS de forma segura,
 * resolviendo conflictos entre clases redundantes o superpuestas.
 * 
 * @param inputs - Lista de nombres de clases, objetos condicionales o arreglos.
 * @returns Cadena de texto depurada con las clases combinadas.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
