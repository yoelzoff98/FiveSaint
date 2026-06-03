import { z } from "zod";

/**
 * Esquema de validación robusto con Zod para el formulario de contacto (Sprint 7).
 * Mensajes de error personalizados en español para asegurar una excelente UX en el cliente y el servidor.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido." })
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .max(80, { message: "El nombre no puede superar los 80 caracteres." }),
  email: z
    .string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "El email debe ser válido." })
    .max(120, { message: "El email no puede superar los 120 caracteres." }),
  phone: z
    .string()
    .max(40, { message: "El teléfono no puede superar los 40 caracteres." })
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(100, { message: "El nombre de la empresa no puede superar los 100 caracteres." })
    .optional()
    .or(z.literal("")),
  productInterest: z
    .string()
    .max(100, { message: "El producto de interés no puede superar los 100 caracteres." })
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(1, { message: "El mensaje es requerido." })
    .min(10, { message: "El mensaje debe tener al menos 10 caracteres." })
    .max(1000, { message: "El mensaje no puede superar los 1000 caracteres." }),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
