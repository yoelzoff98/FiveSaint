"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClientNote } from "@/lib/supabase/comercial";
import { 
  Building, Mail, Phone, MapPin, Calendar, Clock, 
  PlusSquare, MessageSquare, FileText, ShoppingBag, Send 
} from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  seller_id: string | null;
  sellers: { full_name: string } | null;
}

interface ClientNote {
  id: string;
  content: string;
  contacted_at: string;
  next_contact_date: string | null;
  seller_id: string | null;
  sellers: { full_name: string } | null;
  created_at: string;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  created_at: string;
}

interface ClientDetailClientProps {
  client: Client;
}

export function ClientDetailClient({ client }: ClientDetailClientProps) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Form State para Notas
  const [content, setContent] = useState("");
  const [contactedAt, setContactedAt] = useState("");
  const [nextContactDate, setNextContactDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Inicializar contactedAt con la hora local actual
  useEffect(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setContactedAt(localISOTime);
  }, []);

  const fetchData = async () => {
    const supabase = createSupabaseBrowserClient();

    // 1. Cargar Notas
    const { data: notesData } = await supabase
      .from("client_notes")
      .select("*, sellers(full_name)")
      .eq("client_id", client.id)
      .order("contacted_at", { ascending: false });

    if (notesData) setNotes(notesData);

    // 2. Cargar Presupuestos
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("id, budget_number, status, total_amount, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (budgetsData) setBudgets(budgetsData);

    // 3. Cargar Pedidos
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (ordersData) setOrders(ordersData);
  };

  useEffect(() => {
    fetchData();
  }, [client.id]);

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setNoteError(null);

    try {
      await createClientNote({
        client_id: client.id,
        content: content.trim(),
        contacted_at: new Date(contactedAt).toISOString(),
        next_contact_date: nextContactDate ? new Date(nextContactDate).toISOString() : undefined
      });

      setContent("");
      setNextContactDate("");
      
      // Reiniciar fecha contacto a la hora actual
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
      setContactedAt(localISOTime);

      // Recargar
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setNoteError(err.message || "Error al guardar anotación.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Información del Cliente */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">{client.name}</h2>
              {client.company_name && (
                <p className="text-stone-500 text-sm flex items-center gap-1 mt-1">
                  <Building className="w-4 h-4 text-stone-400" />
                  {client.company_name}
                </p>
              )}
            </div>
            <Badge className={client.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-stone-100 text-stone-600 border-stone-300"}>
              {client.status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <hr className="border-stone-100 my-4" />

          <div className="flex flex-col gap-3.5 text-sm text-stone-700">
            {client.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                <a href={`mailto:${client.email}`} className="hover:text-accent-deep underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-stone-400 shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4.5 h-4.5 text-stone-400 shrink-0" />
              <span>Vendedor: {client.sellers?.full_name || "Administrador"}</span>
            </div>
          </div>

          {client.notes && (
            <>
              <hr className="border-stone-100 my-4" />
              <div>
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Notas internas</h4>
                <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-md italic">
                  "{client.notes}"
                </p>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button variant="primary" asChild className="w-full cursor-pointer">
              <Link href={`/admin-comercial/presupuestos/nuevo?clientId=${client.id}`} className="flex items-center justify-center gap-2">
                <PlusSquare className="w-4 h-4" />
                Crear Presupuesto
              </Link>
            </Button>
          </div>
        </Card>

        {/* Historial Comercial */}
        <Card className="p-6 border-stone-200 bg-white">
          <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-500" />
            Historial Comercial
          </h3>

          <div className="flex flex-col gap-5">
            {/* Presupuestos */}
            <div>
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Presupuestos</h4>
              {budgets.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No hay presupuestos emitidos.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {budgets.map(b => (
                    <Link 
                      key={b.id}
                      href={`/admin-comercial/presupuestos/${b.id}`}
                      className="flex justify-between items-center p-2 rounded-md hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all text-xs"
                    >
                      <span className="font-medium text-stone-700">Presupuesto #{b.budget_number}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{formatCurrency(b.total_amount)}</span>
                        <Badge className={`px-1.5 py-0.5 text-[10px] ${
                          b.status === "converted" ? "bg-green-50 text-green-700 border-green-200" :
                          b.status === "sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-stone-100 text-stone-600 border-stone-300"
                        }`}>
                          {b.status === "converted" ? "Confirmado" : b.status === "sent" ? "Enviado" : b.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pedidos */}
            <div>
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Pedidos</h4>
              {orders.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No hay pedidos registrados.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {orders.map(o => (
                    <Link 
                      key={o.id}
                      href={`/admin-comercial/pedidos/${o.id}`}
                      className="flex justify-between items-center p-2 rounded-md hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all text-xs"
                    >
                      <span className="font-medium text-stone-700">Pedido #{o.order_number}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{formatCurrency(o.total_amount)}</span>
                        <Badge className={`px-1.5 py-0.5 text-[10px] ${
                          o.status === "delivered" ? "bg-green-50 text-green-700 border-green-200" :
                          o.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {o.status === "delivered" ? "Entregado" : o.status === "processing" ? "Procesando" : "Pendiente"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Columna Derecha: Seguimiento y Nueva Nota */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Formulario Nota */}
        <Card className="p-6 border-stone-200 bg-white">
          <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-stone-500" />
            Nueva Anotación de Seguimiento
          </h3>

          {noteError && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4">
              {noteError}
            </div>
          )}

          <form onSubmit={handleSubmitNote} className="flex flex-col gap-4">
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detallá el contacto con el cliente: ¿Qué hablaron? ¿Qué le enviaste?"
              className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  Fecha de Contacto
                </label>
                <input
                  type="datetime-local"
                  required
                  value={contactedAt}
                  onChange={(e) => setContactedAt(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-xs bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  Volver a Contactar (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={nextContactDate}
                  onChange={(e) => setNextContactDate(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" />
                {loading ? "Guardando..." : "Registrar Contacto"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Timeline Notas */}
        <Card className="p-6 border-stone-200 bg-white">
          <h3 className="font-bold text-stone-900 mb-6">Línea de Tiempo de Contactos</h3>
          
          {notes.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm italic">
              No hay anotaciones registradas para este cliente.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-stone-150 flex flex-col gap-6">
              {notes.map((note) => {
                const date = new Date(note.contacted_at);
                const nextDate = note.next_contact_date ? new Date(note.next_contact_date) : null;
                
                return (
                  <div key={note.id} className="relative">
                    {/* Punto indicador */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-accent-deep" />
                    
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-2xs">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <span className="text-xs font-semibold text-stone-500">
                          Contacto: {date.toLocaleDateString("es-AR")} {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-xs font-semibold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full">
                          Reg.: {note.sellers?.full_name || "Admin"}
                        </span>
                      </div>
                      
                      <p className="text-stone-800 text-sm whitespace-pre-line leading-relaxed font-normal">
                        {note.content}
                      </p>

                      {nextDate && (
                        <div className="mt-3 pt-3 border-t border-stone-200 flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/50 p-2 rounded-md">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>
                            Próximo contacto programado para: {nextDate.toLocaleDateString("es-AR")} {nextDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
