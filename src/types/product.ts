/**
 * Definiciones de tipos de TypeScript para el catálogo de productos de Five Saint.
 */

export interface ProductSpec {
  name: string;
  value: string;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  href: string;
  badge?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}

export interface ProductFile {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  sortOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  href: string;
  sortOrder: number;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  tagline?: string;
  highlights?: string[];
  featured?: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  sizeLabel?: string | null;
  capacityLabel?: string | null;
  features: string[];
  equipment: string[];
  technicalNotes: string[];
  planFileUrl?: string | null;
  planFileName?: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug?: string; // Sprint 8
  shortDescription: string;
  description: string;
  features: string[];
  applications?: string[]; // Sprint 8
  technicalNotes?: string[]; // Sprint 8
  href: string;
  badge?: string | null;
  isFeatured?: boolean; // Sprint 8
  image?: ProductImage | null;
  images?: ProductImage[]; // Sprint 8
  files?: ProductFile[]; // Sprint 8
  variants?: ProductVariant[]; // Sprint 12
  seoTitle?: string | null;
  seoDescription?: string | null;
  price?: number; // Compatibilidad antigua
  specs?: ProductSpec[]; // Compatibilidad antigua
}
