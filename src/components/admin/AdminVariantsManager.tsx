"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductVariant } from "@/types/admin";
import { AdminVariantsTable } from "./AdminVariantsTable";
import { AdminVariantForm } from "./AdminVariantForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminVariantsManagerProps {
  productId: string;
  initialVariants: AdminProductVariant[];
}

export function AdminVariantsManager({ productId, initialVariants }: AdminVariantsManagerProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleSuccess = () => {
    setIsCreating(false);
    router.refresh();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-wide">Variantes del Producto</h2>
          <p className="text-sm text-stone-500">Agregá versiones, medidas o configuraciones específicas para este producto.</p>
        </div>
        
        {!isCreating && (
          <Button variant="primary" type="button" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Variante
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 mb-6 relative">
          <div className="mb-4">
            <h3 className="font-semibold text-stone-800">Crear Nueva Variante</h3>
          </div>
          <AdminVariantForm 
            productId={productId} 
            mode="create" 
            onSuccess={handleSuccess} 
            onCancel={() => setIsCreating(false)} 
          />
        </div>
      ) : (
        <AdminVariantsTable variants={initialVariants} />
      )}
    </div>
  );
}
