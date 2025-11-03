-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Suppliers can view customers for their orders" ON public.customers;

-- Create a simpler policy that doesn't cause recursion
-- Suppliers can view customer data only through order_supplier_links directly
CREATE POLICY "Suppliers can view customers through links"
ON public.customers
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT o.customer_id
    FROM public.orders o
    WHERE o.id IN (
      SELECT order_id 
      FROM public.order_supplier_links 
      WHERE supplier_user_id = auth.uid()
    )
  )
);