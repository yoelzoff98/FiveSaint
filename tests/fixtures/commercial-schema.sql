DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
    END $$;

    CREATE SEQUENCE IF NOT EXISTS budgets_budget_number_seq START WITH 1;
    CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START WITH 1;

    CREATE TABLE admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE sellers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      username TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE distributors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      discount_percentage NUMERIC(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      status TEXT DEFAULT 'nuevo',
      seller_id UUID REFERENCES sellers(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      source TEXT
    );

    CREATE TABLE budgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_number INTEGER DEFAULT nextval('budgets_budget_number_seq'),
      client_id UUID REFERENCES clients(id),
      seller_id UUID REFERENCES sellers(id),
      distributor_id UUID REFERENCES distributors(id),
      status TEXT DEFAULT 'draft',
      total_amount NUMERIC(14,2) NOT NULL,
      discounts JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      rejection_reason TEXT,
      view_count INTEGER DEFAULT 0,
      viewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE budget_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
      product_id UUID,
      variant_id UUID,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(14,2) NOT NULL,
      total_price NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number INTEGER DEFAULT nextval('orders_order_number_seq'),
      budget_id UUID REFERENCES budgets(id),
      client_id UUID REFERENCES clients(id),
      seller_id UUID REFERENCES sellers(id),
      distributor_id UUID REFERENCES distributors(id),
      status TEXT DEFAULT 'pending',
      total_amount NUMERIC(14,2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      budget_item_id UUID REFERENCES budget_items(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(14,2) NOT NULL,
      total_price NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE client_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id),
      seller_id UUID REFERENCES sellers(id),
      content TEXT NOT NULL,
      contacted_at TIMESTAMPTZ DEFAULT now(),
      note_type TEXT DEFAULT 'manual',
      budget_id UUID REFERENCES budgets(id),
      order_id UUID REFERENCES orders(id),
      created_at TIMESTAMPTZ DEFAULT now()
    );
