import crypto from "node:crypto";

export async function seedWorkflow(db) {
  const sellerUser = crypto.randomUUID(),
    adminUser = crypto.randomUUID(),
    staffUser = crypto.randomUUID();
  for (const id of [sellerUser, adminUser, staffUser])
    await db.query("insert into auth.users(id) values($1)", [id]);
  const seller = (
    await db.query(
      "insert into sellers(user_id,username,full_name,email) values($1,$2,'Synthetic Seller','seller@example.invalid') returning id",
      [sellerUser, "s" + sellerUser],
    )
  ).rows[0].id;
  await db.query(
    "insert into admin_users(user_id,username,full_name) values($1,$2,'Synthetic Admin')",
    [adminUser, "a" + adminUser],
  );
  await db.query(
    "insert into administration_users(user_id,full_name,email) values($1,'Synthetic Staff','staff@example.invalid')",
    [staffUser],
  );
  const client = (
    await db.query(
      "insert into clients(seller_id,name) values($1,'Synthetic Client') returning id",
      [seller],
    )
  ).rows[0].id;
  const category = (
    await db.query(
      "insert into product_categories(name,slug) values('Synthetic baths',$1) returning id",
      ["b-" + crypto.randomUUID()],
    )
  ).rows[0].id;
  const products = [];
  for (const name of ["Bañera", "Almohadilla", "Jets extra"]) {
    const product = (
      await db.query(
        "insert into products(category_id,name,slug,short_description,description) values($1,$2,$3,'Synthetic description','Synthetic complete product description') returning id",
        [category, name, "p-" + crypto.randomUUID()],
      )
    ).rows[0].id;
    const supply = (
      await db.query(
        "insert into supplies(code,name,unit_of_measure) values($1,$2,'un') returning id",
        ["S-" + crypto.randomUUID(), name + " componente"],
      )
    ).rows[0].id;
    const recipe = (
      await db.query(
        "insert into product_compositions(product_id,name,status) values($1,$2,'published') returning id,updated_at::text as updated_at",
        [product, "Receta " + name],
      )
    ).rows[0];
    await db.query(
      "insert into composition_items(composition_id,supply_id,quantity) values($1,$2,1)",
      [recipe.id, supply],
    );
    products.push({ product, name, recipe, supply });
  }
  async function quote(count = 3) {
    const budget = (
      await db.query(
        "insert into budgets(client_id,seller_id,total_amount,subtotal_amount,tax_rate,tax_amount) values($1,$2,$3,$3,21,0) returning id",
        [client, seller, count * 100],
      )
    ).rows[0].id;
    const items = [];
    for (const p of products.slice(0, count)) {
      const item = (
        await db.query(
          "insert into budget_items(budget_id,product_name,quantity,unit_price,total_price,configuration) values($1,$2,1,100,100,'{}') returning id",
          [budget, p.name],
        )
      ).rows[0].id;
      items.push({ budgetItemId: item, quantity: 1 });
    }
    const request = (
      await db.query(
        "select submit_order_request($1,$2,$3::jsonb,null,$4,'synthetic') result",
        [sellerUser, budget, JSON.stringify(items), crypto.randomUUID()],
      )
    ).rows[0].result.request_id;
    return { budget, request, items };
  }
  function lines(q) {
    return q.items.map((i, index) => ({
      source_id: i.budgetItemId,
      quantity: 1,
      product_id: products[index].product,
      variant_id: null,
      bom_id: products[index].recipe.id,
      recipe_updated_at: products[index].recipe.updated_at,
      configuration: {},
      expected_configuration: {},
      expected_product_id: null,
      expected_variant_id: null,
    }));
  }
  async function emit(
    q,
    {
      actor = adminUser,
      key = crypto.randomUUID(),
      hash = "same",
      customLines = lines(q),
      supplies = products
        .slice(0, q.items.length)
        .map((p) => ({
          code: p.supply,
          name: p.name + " componente",
          quantity: 1,
          unitOfMeasure: "un",
        })),
      instructions = [],
    } = {},
  ) {
    return (
      await db.query(
        "select prepare_and_issue_order($1,$2,null,$3,$4::jsonb,$5::jsonb,$6::jsonb,null,$7,$8) result",
        [
          actor,
          q.request,
          q.items[0].budgetItemId,
          JSON.stringify(customLines),
          JSON.stringify(supplies),
          JSON.stringify(instructions),
          key,
          hash,
        ],
      )
    ).rows[0].result;
  }
  return {
    sellerUser,
    adminUser,
    staffUser,
    client,
    seller,
    products,
    quote,
    lines,
    emit,
  };
}
