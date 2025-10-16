-- 1) Create a denormalized link table between orders and supplier users
CREATE TABLE IF NOT EXISTS public.order_supplier_links (
  order_id uuid NOT NULL,
  supplier_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_supplier_links_pkey PRIMARY KEY (order_id, supplier_user_id),
  CONSTRAINT order_supplier_links_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_supplier_links_supplier_user_fk FOREIGN KEY (supplier_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on the link table
ALTER TABLE public.order_supplier_links ENABLE ROW LEVEL SECURITY;

-- Suppliers can select their own links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'order_supplier_links' AND policyname = 'Suppliers can view own links'
  ) THEN
    CREATE POLICY "Suppliers can view own links" ON public.order_supplier_links
    FOR SELECT USING (supplier_user_id = auth.uid());
  END IF;
END$$;

-- 2) Function to populate the link table when order_items are inserted
CREATE OR REPLACE FUNCTION public.link_order_to_supplier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_user_id uuid;
BEGIN
  -- Find the supplier user for the product in the order item
  SELECT s.user_id
    INTO v_supplier_user_id
  FROM public.products p
  JOIN public.suppliers s ON s.id = p.supplier_id
  WHERE p.id = NEW.product_id
  LIMIT 1;

  IF v_supplier_user_id IS NOT NULL THEN
    INSERT INTO public.order_supplier_links(order_id, supplier_user_id)
    VALUES (NEW.order_id, v_supplier_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger to call the function after inserting order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_link_order_to_supplier'
  ) THEN
    CREATE TRIGGER trg_link_order_to_supplier
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.link_order_to_supplier();
  END IF;
END$$;

-- 4) Replace Orders policies that referenced order_items to avoid recursion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders.select.by_supplier'
  ) THEN
    DROP POLICY "orders.select.by_supplier" ON public.orders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders.update.by_supplier'
  ) THEN
    DROP POLICY "orders.update.by_supplier" ON public.orders;
  END IF;

  -- Recreate supplier policies using the link table (no references to order_items)
  CREATE POLICY "orders.select.by_supplier" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_supplier_links l
      WHERE l.order_id = orders.id
        AND l.supplier_user_id = auth.uid()
    )
  );

  CREATE POLICY "orders.update.by_supplier" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.order_supplier_links l
      WHERE l.order_id = orders.id
        AND l.supplier_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_supplier_links l
      WHERE l.order_id = orders.id
        AND l.supplier_user_id = auth.uid()
    )
  );
END$$;
