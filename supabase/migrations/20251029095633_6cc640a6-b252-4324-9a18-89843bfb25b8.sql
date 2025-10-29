-- Ensure enum exists in public schema
DO $$ BEGIN
  PERFORM 1 FROM pg_type WHERE typname = 'user_role';
  -- if not exists, create it
  IF NOT FOUND THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'supplier', 'customer');
  END IF;
END $$;

-- Recreate handle_new_user with fixed search_path and fully-qualified enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_role public.user_role;
  v_tabdk_no text;
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  
  -- Get the role and tabdk_no from metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role;
  v_tabdk_no := NEW.raw_user_meta_data->>'tabdk_no';
  
  -- Create customer or supplier record if role matches and tabdk_no is provided
  IF v_tabdk_no IS NOT NULL THEN
    IF v_role = 'customer' THEN
      INSERT INTO public.customers (user_id, customer_name, tabdk_no, phone, email)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        v_tabdk_no,
        COALESCE(NEW.phone, ''),
        NEW.email
      );
    ELSIF v_role = 'supplier' THEN
      INSERT INTO public.suppliers (user_id, supplier_name, tabdk_no, phone, email)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        v_tabdk_no,
        COALESCE(NEW.phone, ''),
        NEW.email
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();