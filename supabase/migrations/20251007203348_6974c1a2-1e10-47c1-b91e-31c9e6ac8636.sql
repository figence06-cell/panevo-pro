-- Allow customers to insert order items for their own orders
CREATE POLICY "order_items.insert.customer_self"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT o.id 
    FROM orders o 
    WHERE o.customer_id = public.get_current_customer_id()
  )
);