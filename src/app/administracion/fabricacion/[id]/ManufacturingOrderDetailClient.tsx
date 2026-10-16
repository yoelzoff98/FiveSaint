"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Printer, Copy, FileText, Check, X, AlertTriangle, ArrowLeft
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { ManufacturingOrderPrintPdf } from "@/components/pdf/ManufacturingOrderPrintPdf";
import { reviseManufacturingOrderAction } from "@/lib/supabase/manufacturing";

interface ManufacturingOrderDetailClientProps {
  initialOrder: any;
}

export function ManufacturingOrderDetailClient({ initialOrder }: ManufacturingOrderDetailClientProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<any>(initialOrder);

  // Modal de revisión
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onBeforePrint: async () => {
      const sheet = printRef.current;
      if (!sheet) throw new Error("No se encontró la orden para imprimir.");
      await document.fonts.ready;
      const bounds = sheet.getBoundingClientRect();
      const overflow = Array.from(sheet.querySelectorAll("*" )).some(node => {
        const box = node.getBoundingClientRect();
        return box.bottom > bounds.bottom + 1 || box.right > bounds.right + 1;
      });
      const blocks = Array.from(sheet.children).map(node => node.getBoundingClientRect());
      const overlaps = blocks.some((block, index) => index > 0 && block.top < blocks[index - 1].bottom - 1);
      if (overlaps || overflow || sheet.scrollHeight > sheet.clientHeight + 1) {
        setError("La orden excede una hoja A4. Revisá los textos antes de imprimir.");
        throw new Error("Contenido A4 excedido: impresión bloqueada sin recortar.");
      }
    },
    documentTitle: `Orden-Fabricacion-${order.order_number}`,
  });

  const handleReviseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim()) {
      setError("Debe justificar el motivo de la revisión.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await reviseManufacturingOrderAction({
        manufacturingOrderId: order.id,
        reason: revisionReason,
        notes: revisionNotes
      });
      setShowRevisionModal(false);
      setSuccess(`Nueva revisión ${res.orderNumber} emitida correctamente.`);
      router.push(`/administracion/fabricacion/${res.newManufacturingOrderId}`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Control Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-stone-900 text-white font-mono font-bold text-sm px-3 py-1 rounded">
            {order.order_number}
          </div>
          <Badge className="bg-amber-50 text-amber-800 border-amber-300 capitalize text-xs">
            {order.status}
          </Badge>
          <span className="text-xs text-stone-500">
            {order.quantity} {order.quantity === 1 ? 'unidad' : 'unidades'} | BOM v{order.bom_version || 1}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevisionModal(true)}
            className="text-xs border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Generar Revisión Trazable</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handlePrint()}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Exportar Hoja A4 Única</span>
          </Button>
        </div>
      </div>

      {/* Contenedor Vista Previa A4 */}
      <div className="flex justify-center bg-stone-200/70 p-6 rounded-2xl border border-stone-300 overflow-x-auto">
        <div className="shadow-2xl rounded-sm">
          <ManufacturingOrderPrintPdf ref={printRef} order={order} />
        </div>
      </div>

      {/* Modal de Revisión */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Generar Revisión de Orden de Fabricación
                </h2>
                <p className="text-xs text-stone-500">
                  Orden previa: <strong>{order.order_number}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviseSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Esta acción marcará la orden actual como superada y emitirá la versión R{(order.revision_number || 1) + 1} de forma trazable sin sobrescribir el registro original.
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Motivo Justificado de la Corrección *
                </label>
                <textarea
                  required
                  rows={3}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Ej: Cambio de orientación de motor acordado con fábrica / Ajuste de jets..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nuevas Observaciones de Planta (Opcional)
                </label>
                <input
                  type="text"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevisionModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {loading ? "Generando..." : "Emitir Revisión"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
