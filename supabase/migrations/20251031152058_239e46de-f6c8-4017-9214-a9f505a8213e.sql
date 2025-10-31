-- Allow suppliers to view customer information for orders containing their products
CREATE POLICY "Suppliers can view customers for their orders"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_supplier_links osl ON osl.order_id = o.id
    WHERE o.customer_id = customers.id
    AND osl.supplier_user_id = auth.uid()
  )
);