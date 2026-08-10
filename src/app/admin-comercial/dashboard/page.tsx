import { requireCommercialUser, getClients, getBudgets, getOrders } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, FileText, ShoppingBag, DollarSign, PlusSquare, Receipt, ArrowRight } from "lucide-react";
import { SellerDashboard } from "./SellerDashboard";

export default async function DashboardPage() {
  const ctx = await requireCommercialUser();

  // Cargar datos del usuario conectado (filtrado automáticamente por la lib)
  const [clients, budgets, orders] = await Promise.all([
    getClients().catch(() => []),
    getBudgets().catch(() => []),
    getOrders().catch(() => [])
  ]);

  // Cálculos de estadísticas
  const totalClients = clients.length;
  const totalBudgets = budgets.length;
  const pendingBudgets = budgets.filter(b => b.status === "draft" || b.status === "sent").length;
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "processing").length;
  
  const salesTotal = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const formattedSalesTotal = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(salesTotal);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">
            ¡Hola, {ctx.profileName}!
          </h1>
          <p className="text-stone-500">
            {ctx.isAdmin 
              ? "Resumen de ventas y seguimiento de toda la empresa." 
              : "Tu resumen de cartera de clientes, cotizaciones y pedidos."}
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
            <div>
              <p className="text-sm text-stone-500 font-medium">Clientes en Cartera</p>
              <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalClients}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
            <div>
              <p className="text-sm text-stone-500 font-medium">Presupuestos Emitidos</p>
              <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalBudgets}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{pendingBudgets} pendientes de cierre</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
            <div>
              <p className="text-sm text-stone-500 font-medium">Pedidos Confirmados</p>
              <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalOrders}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{pendingOrders} en producción/proceso</p>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
            <div>
              <p className="text-sm text-stone-500 font-medium">Volumen Facturado</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-950 mt-1 truncate max-w-[170px]" title={formattedSalesTotal}>
                {formattedSalesTotal}
              </h3>
              <p className="text-xs text-stone-400 mt-1">Excluye pedidos cancelados</p>
            </div>
            <div className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Contenido Dinámico según Rol */}
        {!ctx.isAdmin ? (
          <div className="mt-2">
            <SellerDashboard 
              clients={clients as any} 
              budgets={budgets as any} 
              profileName={ctx.profileName || "Vendedor"} 
            />
          </div>
        ) : (
          <>
            {/* Accesos rápidos (Solo Admin) */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Acciones Comerciales Rápidas</h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" asChild className="cursor-pointer">
                  <Link href="/admin-comercial/presupuestos/nuevo" className="flex items-center gap-2">
                    <PlusSquare className="w-4 h-4" />
                    Crear Nuevo Presupuesto
                  </Link>
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link href="/admin-comercial/clientes" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Registrar / Gestionar Clientes
                  </Link>
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link href="/admin-comercial/lista-de-precios" className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Consultar Lista de Precios
                  </Link>
                </Button>
              </div>
            </div>

            {/* Breve guía de flujo (Solo Admin) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">1</div>
                <h3 className="font-bold text-stone-900">Registrar Cliente</h3>
                <p className="text-sm text-stone-500 mt-2">
                  Ingresá al cliente en tu cartera comercial para llevar el registro de sus contactos, consultas y anotaciones.
                </p>
              </div>
              <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">2</div>
                <h3 className="font-bold text-stone-900">Armar Presupuesto</h3>
                <p className="text-sm text-stone-500 mt-2">
                  Cotizá bañeras, equipamiento opcional y spas. Podés exportar el presupuesto en PDF para enviárselo directamente al cliente.
                </p>
              </div>
              <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">3</div>
                <h3 className="font-bold text-stone-900">Confirmar Pedido</h3>
                <p className="text-sm text-stone-500 mt-2">
                  Cuando el cliente confirme el presupuesto, convertilo en Pedido. Podés realizar conversiones parciales si decide fabricar solo algunos productos.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </CommercialShell>
  );
}
