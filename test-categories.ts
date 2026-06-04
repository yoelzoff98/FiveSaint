import { getProductCategories } from "./src/lib/supabase/products";

async function run() {
  const categories = await getProductCategories();
  console.log(JSON.stringify(categories, null, 2));
}

run();
