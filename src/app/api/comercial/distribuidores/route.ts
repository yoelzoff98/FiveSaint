import { NextRequest, NextResponse } from "next/server";
import { searchDistributorsPaginated, requireCommercialUser } from "@/lib/supabase/comercial";

export async function GET(req: NextRequest) {
  try {
    await requireCommercialUser();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const result = await searchDistributorsPaginated({
      query,
      page,
      pageSize,
      onlyActive: true
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/comercial/distribuidores error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al obtener distribuidores" },
      { status: error?.message?.includes("No autorizado") ? 401 : 500 }
    );
  }
}
