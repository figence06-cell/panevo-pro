-- Fix infinite recursion in customers policy by using security definer functions

-- 1) Helper: check if user is admin (avoid touching profiles table directly in policies)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.role = 'admin'::public.user_role
  );
$$;

-- 2) Helper: can a supplier view a specific customer? (avoid customers<->orders recursion)
CREATE OR REPLACE FUNCTION public.can_supplier_view_customer(_user_id uuid, _customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_supplier_links osl
    JOIN public.orders o ON o.id = osl.order_id
    WHERE o.customer_id = _customer_id
      AND osl.supplier_user_id = _user_id
  );
$$;

-- 3) Replace recursive policy with function-based one
DROP POLICY IF EXISTS "Suppliers can view customers through orders" ON public.customers;

CREATE POLICY "Suppliers can view customers through orders (fn)"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Customer themselves
  (user_id = auth.uid())
  OR
  -- Admins
  public.is_admin(auth.uid())
  OR
  -- Suppliers linked to orders for this customer
  public.can_supplier_view_customer(auth.uid(), id)
);
