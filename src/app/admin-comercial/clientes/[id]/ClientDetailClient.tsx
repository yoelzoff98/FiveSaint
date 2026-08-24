"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClientNote, updateClient } from "@/lib/supabase/comercial";
import { 
  Building, Mail, Phone, MapPin, Calendar, Clock, 
  PlusSquare, MessageSquare, FileText, ShoppingBag, Send,
  Eye, Check, X, ArrowRight, HelpCircle, Globe, MessageCircle, Users as UsersIcon, FileEdit
} from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  presupuestado: "Presupuestado",
  negociacion: "En negociación",
  ganado: "Vendido",
  vendido: "Vendido",
  perdido: "Perdido",
  inactivo: "Vendido por distribuidor",
  vendido_distribuidor: "Vendido por distribuidor"
};

const CRM_STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "presupuestado", label: "Presupuestado" },
  { value: "negociacion", label: "En negociación" },
  { value: "ganado", label: "Vendido" },
  { value: "perdido", label: "Perdido" },
  { value: "inactivo", label: "Vendido por distribuidor" }
];

const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 border-blue-200",
  contactado: "bg-purple-50 text-purple-700 border-purple-200",
  presupuestado: "bg-amber-50 text-amber-700 border-amber-200",
  negociacion: "bg-orange-50 text-orange-700 border-orange-200",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  vendido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-rose-50 text-rose-700 border-rose-200",
  inactivo: "bg-teal-50 text-teal-700 border-teal-200",
  vendido_distribuidor: "bg-teal-50 text-teal-700 border-teal-200"
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Sitio Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  recommendation: "Recomendación",
  manual: "Carga Manual",
  other: "Otro"
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case "website":
      return <Globe className="w-4.5 h-4.5 text-blue-500 shrink-0" />;
    case "whatsapp":
      return <MessageCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />;
    case "instagram":
      return (
        <svg className="w-4.5 h-4.5 text-pink-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className="w-4.5 h-4.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      );
    case "recommendation":
      return <UsersIcon className="w-4.5 h-4.5 text-indigo-500 shrink-0" />;
    case "manual":
      return <FileEdit className="w-4.5 h-4.5 text-stone-500 shrink-0" />;
    default:
      return <HelpCircle className="w-4.5 h-4.5 text-stone-400 shrink-0" />;
  }
};

const getNoteTypeConfig = (type: string) => {
  switch (type) {
    case "budget_created":
      return {
        icon: <PlusSquare className="w-4 h-4 text-amber-600" />,
        bgColor: "bg-amber-50/30 border-amber-150",
        label: "Cotización Creada",
        dotColor: "bg-amber-500"
      };
    case "budget_sent":
      return {
        icon: <Send className="w-4 h-4 text-blue-600" />,
        bgColor: "bg-blue-55 border-blue-150",
        label: "Cotización Enviada",
        dotColor: "bg-blue-500"
      };
    case "budget_viewed":
      return {
        icon: <Eye className="w-4 h-4 text-emerald-650" />,
        bgColor: "bg-emerald-50/30 border-emerald-150",
        label: "Presupuesto Visualizado",
        dotColor: "bg-emerald-500"
      };
    case "budget_accepted":
      return {
        icon: <Check className="w-4 h-4 text-emerald-650" />,
        bgColor: "bg-emerald-50/50 border-emerald-250",
        label: "Presupuesto Aceptado",
        dotColor: "bg-emerald-650"
      };
    case "budget_rejected":
      return {
        icon: <X className="w-4 h-4 text-red-650" />,
        bgColor: "bg-red-50/30 border-red-150",
        label: "Presupuesto Rechazado",
        dotColor: "bg-red-500"
      };
    case "order_created":
      return {
        icon: <ShoppingBag className="w-4 h-4 text-stone-900" />,
        bgColor: "bg-stone-50 border-stone-250",
        label: "Pedido Confirmado",
        dotColor: "bg-stone-900"
      };
    case "system":
      return {
        icon: <Clock className="w-4 h-4 text-stone-600" />,
        bgColor: "bg-stone-50 border-stone-200",
        label: "Evento del Sistema",
        dotColor: "bg-stone-500"
      };
    case "manual":
    default:
      return {
        icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
        bgColor: "bg-purple-50/20 border-purple-100",
        label: "Contacto Comercial",
        dotColor: "bg-purple-500"
      };
  }
};

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  source?: string;
  seller_id: string | null;
  sellers: { full_name: string } | null;
}

interface ClientNote {
  id: string;
  content: string;
  contacted_at: string;
  next_contact_date: string | null;
  note_type: string;
  budget_id: string | null;
  order_id: string | null;
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
  const router = useRouter();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // CRM status state
  const [currentStatus, setCurrentStatus] = useState(client.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Timeline filter state
  const [filterType, setFilterType] = useState<"all" | "manual" | "system">("all");

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

  useEffect(() => {
    setCurrentStatus(client.status);
  }, [client.status]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await updateClient(client.id, {
        name: client.name,
        company_name: client.company_name || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        address: client.address || undefined,
        notes: client.notes || undefined,
        source: client.source || undefined,
        status: newStatus
      });
      setCurrentStatus(newStatus);
      router.refresh();
    } catch (err) {
      console.error("Error al actualizar estado del cliente:", err);
      alert("Error al actualizar el estado del cliente.");
    } finally {
      setUpdatingStatus(false);
    }
  };

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
          <div className="flex justify-between items-start mb-4 gap-2">
            <div>
              <h2 className="text-xl font-bold text-stone-900">{client.name}</h2>
              {client.company_name && (
                <p className="text-stone-500 text-sm flex items-center gap-1 mt-1">
                  <Building className="w-4 h-4 text-stone-400" />
                  {client.company_name}
                </p>
              )}
            </div>
            <Badge className={STATUS_COLORS[currentStatus] || "bg-stone-100 text-stone-600 border-stone-300 shrink-0 text-center"}>
              {STATUS_LABELS[currentStatus] || currentStatus}
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
              {getSourceIcon(client.source || "manual")}
              <span className="font-semibold text-stone-700">Origen: {SOURCE_LABELS[client.source || "manual"] || client.source}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4.5 h-4.5 text-stone-400 shrink-0" />
              <span>Vendedor: {client.sellers?.full_name || "Administrador"}</span>
            </div>
          </div>

          {/* Cambio Rápido de Estado */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Embudo de Ventas (CRM)</label>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-xs bg-white cursor-pointer font-semibold transition-all disabled:opacity-60"
            >
              {CRM_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h3 className="font-bold text-stone-900">Historial CRM & Seguimiento</h3>
            <div className="flex bg-stone-100 p-1 rounded-lg text-xs font-bold shrink-0">
              <button 
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filterType === "all" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-850"}`}
              >
                Todos
              </button>
              <button 
                type="button"
                onClick={() => setFilterType("manual")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filterType === "manual" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-850"}`}
              >
                Vendedor
              </button>
              <button 
                type="button"
                onClick={() => setFilterType("system")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filterType === "system" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-850"}`}
              >
                Sistema
              </button>
            </div>
          </div>
          
          {(() => {
            const filteredNotes = notes.filter((n) => {
              if (filterType === "all") return true;
              if (filterType === "manual") return (n.note_type || "manual") === "manual";
              return (n.note_type || "manual") !== "manual";
            });

            if (filteredNotes.length === 0) {
              return (
                <div className="text-center py-8 text-stone-400 text-sm italic">
                  No hay anotaciones registradas en este filtro.
                </div>
              );
            }

            return (
              <div className="relative pl-6 border-l-2 border-stone-150 flex flex-col gap-6">
                {filteredNotes.map((note) => {
                  const date = new Date(note.contacted_at);
                  const nextDate = note.next_contact_date ? new Date(note.next_contact_date) : null;
                  const typeConfig = getNoteTypeConfig(note.note_type || "manual");
                  
                  return (
                    <div key={note.id} className="relative">
                      {/* Punto indicador */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${typeConfig.dotColor}`} />
                      
                      <div className={`border rounded-lg p-4 shadow-2xs transition-all ${typeConfig.bgColor}`}>
                        <div className="flex justify-between items-start gap-4 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {typeConfig.icon}
                            <span className="text-xs font-bold text-stone-800">
                              {typeConfig.label}
                            </span>
                            <span className="text-[10px] font-semibold text-stone-400">
                              • {date.toLocaleDateString("es-AR")} {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-stone-500 bg-white/70 border border-stone-200 px-2 py-0.5 rounded-full shadow-3xs">
                            Reg.: {note.sellers?.full_name || "Admin"}
                          </span>
                        </div>
                        
                        <p className="text-stone-800 text-sm whitespace-pre-line leading-relaxed font-normal">
                          {note.content}
                        </p>

                        {note.budget_id && (
                          <div className="mt-3 flex items-center">
                            <Link 
                              href={`/admin-comercial/presupuestos/${note.budget_id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 hover:text-accent-deep bg-white border border-stone-250 py-1 px-3 rounded-md hover:bg-stone-50 transition-colors shadow-3xs"
                            >
                              <span>Ver Presupuesto</span>
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </Link>
                          </div>
                        )}

                        {note.order_id && (
                          <div className="mt-3 flex items-center">
                            <Link 
                              href={`/admin-comercial/pedidos/${note.order_id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 hover:text-accent-deep bg-white border border-stone-250 py-1 px-3 rounded-md hover:bg-stone-50 transition-colors shadow-3xs"
                            >
                              <span>Ver Pedido de Fábrica</span>
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </Link>
                          </div>
                        )}

                        {nextDate && (
                          <div className="mt-3 pt-3 border-t border-stone-200/65 flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/50 p-2.5 rounded-md">
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
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
