"use client";

import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { updateDistributorDiscountAction } from "./actions";

interface DistributorDiscountEditorProps {
  distributorId: string;
  initialDiscount: number;
  isAdmin: boolean;
}

export function DistributorDiscountEditor({
  distributorId,
  initialDiscount,
  isAdmin,
}: DistributorDiscountEditorProps) {
  const [discount, setDiscount] = useState(initialDiscount);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(initialDiscount.toString());
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="bg-accent-deep text-white px-6 py-4 rounded-xl shadow-md flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
        <span className="text-xs uppercase tracking-widest font-semibold opacity-90">Descuento Asignado</span>
        <div className="text-3xl font-black mt-0.5 flex items-center gap-1">
          {discount}% <span className="text-sm font-normal opacity-80">OFF</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const num = parseFloat(inputVal);
    if (isNaN(num) || num < 0 || num > 100) {
      alert("Ingresá un número válido entre 0 y 100");
      return;
    }

    setLoading(true);
    try {
      await updateDistributorDiscountAction(distributorId, num);
      setDiscount(num);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Error al actualizar descuento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-accent-deep text-white px-6 py-4 rounded-xl shadow-md flex flex-col items-center justify-center shrink-0 w-full md:w-auto relative group">
      <span className="text-xs uppercase tracking-widest font-semibold opacity-90">Descuento Asignado</span>

      {isEditing ? (
        <div className="flex items-center gap-2 mt-1">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-20 px-2 py-1 bg-white text-stone-900 font-bold rounded text-lg focus:outline-none text-center"
              autoFocus
            />
            <span className="absolute right-2 top-1 text-stone-600 font-bold">%</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white transition-colors cursor-pointer"
            title="Guardar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setInputVal(discount.toString());
            }}
            disabled={loading}
            className="p-1.5 bg-stone-600 hover:bg-stone-700 rounded text-white transition-colors cursor-pointer"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black mt-0.5 flex items-center gap-1">
            {discount}% <span className="text-sm font-normal opacity-80">OFF</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold bg-white/10"
            title="Editar porcentaje de descuento"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        </div>
      )}
    </div>
  );
}
