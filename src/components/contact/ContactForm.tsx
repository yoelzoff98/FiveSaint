"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { contactFormSchema, type ContactFormInput } from "@/lib/validations/contact";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ContactApiResponse } from "@/types/contact";

// Opciones disponibles para el selector de productos de interés
const PRODUCT_INTEREST_OPTIONS = [
  { value: "Bañeras", label: "Bañeras" },
  { value: "Hidromasajes", label: "Hidromasajes" },
  { value: "Spas", label: "Spas" },
  { value: "Platos de ducha", label: "Platos de ducha" },
  { value: "Columnas", label: "Columnas" },
  { value: "Saunas", label: "Saunas" },
  { value: "Duchas escocesas", label: "Duchas escocesas" },
  { value: "Asesoramiento general", label: "Asesoramiento general" }
];

export function ContactForm() {
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [apiMessage, setApiMessage] = React.useState<string>("");

  // Inicializar React Hook Form con la validación de Zod
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      productInterest: "Asesoramiento general",
      message: ""
    }
  });

  // Efecto cliente seguro para capturar referencias de producto en URL (e.g. ?ref=spas)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref")?.toLowerCase() || params.get("product")?.toLowerCase();
      
      if (ref) {
        if (ref.includes("banera") || ref.includes("bañera")) {
          setValue("productInterest", "Bañeras");
        } else if (ref.includes("hidro")) {
          setValue("productInterest", "Hidromasajes");
        } else if (ref.includes("spa")) {
          setValue("productInterest", "Spas");
        } else if (ref.includes("plato") || ref.includes("ducha")) {
          setValue("productInterest", "Platos de ducha");
        } else if (ref.includes("columna")) {
          setValue("productInterest", "Columnas");
        } else if (ref.includes("sauna")) {
          setValue("productInterest", "Saunas");
        } else if (ref.includes("escocesa")) {
          setValue("productInterest", "Duchas escocesas");
        }
      }
    }
  }, [setValue]);

  // Handler de Envío del Formulario
  const onSubmit = async (data: ContactFormInput) => {
    setSubmissionStatus("submitting");
    setApiMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result: ContactApiResponse = await response.json();

      if (response.ok && result.success) {
        setSubmissionStatus("success");
        setApiMessage("Tu consulta fue enviada correctamente. Nos pondremos en contacto a la brevedad.");
        reset(); // Limpiar el formulario
      } else {
        setSubmissionStatus("error");
        setApiMessage(result.message || "No pudimos enviar tu consulta. Intentá nuevamente o contactanos por otro medio.");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmissionStatus("error");
      setApiMessage("No pudimos enviar tu consulta. Intentá nuevamente o contactanos por otro medio.");
    }
  };

  return (
    <Card className="bg-white border-stone-200 shadow-sm p-6 sm:p-8 w-full text-left">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        
        {/* Banner de Feedback de Éxito / Error */}
        {submissionStatus === "success" && (
          <div 
            className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm p-4 text-sm"
            role="alert"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">¡Consulta recibida!</span>
              <span className="font-light">{apiMessage}</span>
            </div>
          </div>
        )}

        {submissionStatus === "error" && (
          <div 
            className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm p-4 text-sm"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Hubo un problema</span>
              <span className="font-light">{apiMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Campo 1: Nombre y Apellido */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Nombre y apellido <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ej: Yoel Ziman"
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-sm outline-hidden transition-all duration-200 placeholder-stone-400 text-stone-900 ${
                errors.name
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-stone-200 focus:border-accent-deep focus:ring-1 focus:ring-accent-deep"
              }`}
              aria-required="true"
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            {errors.name && (
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Campo 2: Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Ej: yoel@ejemplo.com"
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-sm outline-hidden transition-all duration-200 placeholder-stone-400 text-stone-900 ${
                errors.email
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-stone-200 focus:border-accent-deep focus:ring-1 focus:ring-accent-deep"
              }`}
              aria-required="true"
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            {errors.email && (
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Campo 3: Teléfono */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Teléfono / WhatsApp <span className="text-stone-400 font-light">(Opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="Ej: +54 9 11 1234-5678"
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-sm outline-hidden transition-all duration-200 placeholder-stone-400 text-stone-900 ${
                errors.phone
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-stone-200 focus:border-accent-deep focus:ring-1 focus:ring-accent-deep"
              }`}
              aria-invalid={errors.phone ? "true" : "false"}
              {...register("phone")}
            />
            {errors.phone && (
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Campo 4: Empresa / Proyecto */}
          <div className="flex flex-col gap-2">
            <label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Empresa / Proyecto <span className="text-stone-400 font-light">(Opcional)</span>
            </label>
            <input
              id="company"
              type="text"
              placeholder="Ej: Hotel / Constructora"
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-sm outline-hidden transition-all duration-200 placeholder-stone-400 text-stone-900 ${
                errors.company
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-stone-200 focus:border-accent-deep focus:ring-1 focus:ring-accent-deep"
              }`}
              aria-invalid={errors.company ? "true" : "false"}
              {...register("company")}
            />
            {errors.company && (
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.company.message}
              </span>
            )}
          </div>
        </div>

        {/* Campo 5: Producto de Interés (Select) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="productInterest" className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Producto de interés
          </label>
          <div className="relative">
            <select
              id="productInterest"
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-sm outline-hidden focus:border-accent-deep focus:ring-1 focus:ring-accent-deep transition-all text-stone-950 appearance-none cursor-pointer"
              {...register("productInterest")}
            >
              {PRODUCT_INTEREST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Flecha decorativa del select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          {errors.productInterest && (
            <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
              {errors.productInterest.message}
            </span>
          )}
        </div>

        {/* Campo 6: Mensaje */}
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Mensaje / Consulta <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder="Contanos brevemente sobre tu obra, medidas deseadas y consultas del producto..."
            className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-sm outline-hidden transition-all duration-200 placeholder-stone-400 text-stone-900 resize-y min-h-[100px] ${
              errors.message
                ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                : "border-stone-200 focus:border-accent-deep focus:ring-1 focus:ring-accent-deep"
            }`}
            aria-required="true"
            aria-invalid={errors.message ? "true" : "false"}
            {...register("message")}
          />
          {errors.message && (
            <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
              {errors.message.message}
            </span>
          )}
        </div>

        {/* Botón de Envío */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold group cursor-pointer flex items-center justify-center gap-2"
            disabled={submissionStatus === "submitting"}
          >
            {submissionStatus === "submitting" ? (
              <>
                <span>Enviando...</span>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </>
            ) : (
              <>
                <span>Enviar consulta</span>
                <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>

      </form>
    </Card>
  );
}

export default ContactForm;
