import {z} from "zod";
import {ClientCategorySchema} from "@/lib/client-categories";

export const AdminClientUpdateSchema=z.object({
 name:z.string().trim().min(1,"El nombre del cliente es obligatorio.").max(200).optional(),
 company_name:z.string().trim().max(200).optional(),
 category:ClientCategorySchema.optional(),
 email:z.string().trim().max(254).pipe(z.union([z.email("El correo electrónico no es válido."),z.literal("")])).optional(),
 phone:z.string().trim().max(100).optional(),
 address:z.string().trim().max(500).optional(),
 notes:z.string().trim().max(20000).optional(),
 status:z.string().max(50).optional(),
 source:z.string().max(50).optional(),
 seller_id:z.string().uuid().optional(),
}).strict();
