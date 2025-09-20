-- First, drop the problematic policy
DROP POLICY IF EXISTS "Customers can create own orders" ON orders;

-- Create a security definer function to get customer ID safely
CREATE OR REPLACE FUNCTION public.get_current_customer_id()
RETURNS UUID AS $$
  SELECT customers.id 
  FROM customers 
  WHERE customers.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create the corrected policy using the security definer function
CREATE POLICY "Customers can create own orders" 
ON orders 
FOR INSERT 
WITH CHECK (customer_id = public.get_current_customer_id());

-- Also add missing INSERT policy for order_items
CREATE POLICY "Customers can create order items for their orders" 
ON order_items 
FOR INSERT 
WITH CHECK (order_id IN (
  SELECT orders.id 
  FROM orders 
  WHERE orders.customer_id = public.get_current_customer_id()
));