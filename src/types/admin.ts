// Tipos comunes para el panel administrador de Five Saint

export interface AdminProductVariant {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sizeLabel: string | null;
  capacityLabel: string | null;
  features: string[];
  equipment: string[];
  technicalNotes: string[];
  planFileUrl: string | null;
  planFileName: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminVariantInput {
  productId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sizeLabel: string | null;
  capacityLabel: string | null;
  features: string[];
  equipment: string[];
  technicalNotes: string[];
  planFileUrl: string | null;
  planFileName: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}
