/**
 * Tipos de datos estricto de TypeScript para el formulario de contacto y API (Sprint 7).
 */

export interface ContactFormValues {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  productInterest?: string;
  message: string;
}

export interface ContactApiResponse {
  success: boolean;
  message: string;
}
