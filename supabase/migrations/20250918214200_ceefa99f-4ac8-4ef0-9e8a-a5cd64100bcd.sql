-- Add INSERT policy for customers to create their own orders
CREATE POLICY "Customers can create own orders" 
ON orders 
FOR INSERT 
WITH CHECK (customer_id IN (
  SELECT customers.id 
  FROM customers 
  WHERE customers.user_id = auth.uid()
));