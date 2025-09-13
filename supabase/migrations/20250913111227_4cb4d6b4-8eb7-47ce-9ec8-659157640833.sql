-- Update the handle_new_user function to create supplier and customer records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    user_role::user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  
  -- Create supplier record if role is supplier
  IF user_role = 'supplier' THEN
    INSERT INTO public.suppliers (user_id, supplier_name, phone, email, tabdk_no)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yeni Tedarikçi'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'tabdk_no', 'TABDK-' || EXTRACT(epoch FROM now())::text)
    );
  END IF;
  
  -- Create customer record if role is customer
  IF user_role = 'customer' THEN
    INSERT INTO public.customers (user_id, customer_name, phone, email, tabdk_no)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yeni Müşteri'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'tabdk_no', 'TABDK-' || EXTRACT(epoch FROM now())::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;