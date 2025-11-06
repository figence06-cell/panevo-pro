-- Create security definer function to check if user is supplier for an order
CREATE OR REPLACE FUNCTION public.is_supplier_for_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM order_supplier_links
    WHERE order_id = _order_id
      AND supplier_user_id = _user_id
  )
$$;

-- Create security definer function to get supplier's product IDs
CREATE OR REPLACE FUNCTION public.get_supplier_product_ids(_user_id uuid)
RETURNS TABLE(product_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM products p
  JOIN suppliers s ON s.id = p.supplier_id
  WHERE s.user_id = _user_id
$$;

-- Create security definer function to check if customer belongs to user
CREATE OR REPLACE FUNCTION public.is_users_customer(_customer_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customers
    WHERE id = _customer_id
      AND user_id = _user_id
  )
$$;

-- Drop and recreate customers policies to fix infinite recursion
DROP POLICY IF EXISTS "Suppliers can view customers through links" ON public.customers;

CREATE POLICY "Suppliers can view customers through orders"
ON public.customers
FOR SELECT
USING (
  -- Customer's own user can see it
  user_id = auth.uid()
  OR
  -- Admin can see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  )
  OR
  -- Supplier can see if they have orders with items from their products
  EXISTS (
    SELECT 1
    FROM order_supplier_links osl
    JOIN orders o ON o.id = osl.order_id
    WHERE o.customer_id = customers.id
    AND osl.supplier_user_id = auth.uid()
  )
);