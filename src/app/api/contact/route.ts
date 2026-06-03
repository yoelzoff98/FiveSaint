import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormSchema } from "@/lib/validations/contact";
import type { ContactApiResponse } from "@/types/contact";

// Claves de configuración por entorno
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@fivesaint.com";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "Five Saint <onboarding@resend.dev>";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * API Route para el envío del formulario de contacto (Sprint 7).
 * Valida los datos en el servidor con Zod y despacha el correo mediante Resend,
 * con fallback seguro en modo desarrollo si no se dispone de credenciales.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar los datos de entrada con el esquema Zod en el servidor
    const validationResult = contactFormSchema.safeParse(body);
    if (!validationResult.success) {
      // Retornar error de validación 400 estructurado
      const errorMessages = validationResult.error.issues.map(err => err.message).join(", ");
      return NextResponse.json<ContactApiResponse>(
        {
          success: false,
          message: `Datos inválidos: ${errorMessages}`,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, company, productInterest, message } = validationResult.data;

    // 2. Comprobar si se configuran variables de entorno para Resend
    if (!RESEND_API_KEY) {
      if (IS_DEV) {
        // En desarrollo local, simulamos éxito y logueamos la consulta por consola
        console.log("==================================================");
        console.log("📩 NUEVA CONSULTA DE CONTACTO (SIMULADOR DESARROLLO)");
        console.log(`👤 Nombre: ${name}`);
        console.log(`✉️ Email: ${email}`);
        console.log(`📞 Teléfono: ${phone || "No especificado"}`);
        console.log(`🏢 Empresa: ${company || "No especificada"}`);
        console.log(`📦 Interés: ${productInterest || "Asesoramiento General"}`);
        console.log(`💬 Mensaje: ${message}`);
        console.log("==================================================");

        return NextResponse.json<ContactApiResponse>({
          success: true,
          message: "Consulta recibida correctamente en modo desarrollo.",
        });
      } else {
        // En producción, la falta de API Key es crítica
        console.error("Error crítico: Falta configurar la variable de entorno RESEND_API_KEY en producción.");
        return NextResponse.json<ContactApiResponse>(
          {
            success: false,
            message: "No pudimos enviar tu consulta por un error de configuración del servidor. Intentá nuevamente más tarde.",
          },
          { status: 500 }
        );
      }
    }

    // 3. Despachar correo real mediante Resend
    const resend = new Resend(RESEND_API_KEY);

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #0e6475; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-weight: 300; letter-spacing: 0.05em; text-transform: uppercase;">
          Nueva Consulta - Five Saint
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 150px;">Nombre:</td>
            <td style="padding: 8px 0; color: #4b5563;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 8px 0; color: #4b5563;">
              <a href="mailto:${email}" style="color: #0e6475; text-decoration: none;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Teléfono:</td>
            <td style="padding: 8px 0; color: #4b5563;">${phone || "No especificado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Empresa / Proyecto:</td>
            <td style="padding: 8px 0; color: #4b5563;">${company || "No especificada"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Producto de Interés:</td>
            <td style="padding: 8px 0; color: #4b5563;">${productInterest || "Asesoramiento General"}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px; border-left: 4px solid #0e6475;">
          <h4 style="margin-top: 0; color: #374151; margin-bottom: 5px;">Mensaje:</h4>
          <p style="margin: 0; color: #4b5563; line-height: 1.5; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center;">
          Este correo fue generado automáticamente desde el sitio web institucional de Five Saint.
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      subject: "Nueva consulta desde el sitio web Five Saint",
      html: emailHtml,
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json<ContactApiResponse>(
        {
          success: false,
          message: "No pudimos despachar tu correo a través de Resend.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json<ContactApiResponse>({
      success: true,
      message: "Consulta enviada correctamente.",
    });

  } catch (error: unknown) {
    console.error("Unexpected error in API contact route:", error);
    return NextResponse.json<ContactApiResponse>(
      {
        success: false,
        message: "Ocurrió un error inesperado al procesar tu consulta.",
      },
      { status: 500 }
    );
  }
}
