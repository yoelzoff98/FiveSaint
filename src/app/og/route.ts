import renderOpenGraphImage from "@/lib/public-open-graph-image";
export const dynamic = "force-static";
export async function GET() {
  return renderOpenGraphImage();
}
