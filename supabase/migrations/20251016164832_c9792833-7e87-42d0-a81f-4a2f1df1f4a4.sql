-- Add company information fields to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_representative text,
ADD COLUMN IF NOT EXISTS tax_office text,
ADD COLUMN IF NOT EXISTS tax_number text;

-- Add company information fields to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS company_representative text,
ADD COLUMN IF NOT EXISTS tax_office text,
ADD COLUMN IF NOT EXISTS tax_number text;

-- Add comments for documentation
COMMENT ON COLUMN public.customers.company_representative IS 'Company representative name';
COMMENT ON COLUMN public.customers.tax_office IS 'Tax office name';
COMMENT ON COLUMN public.customers.tax_number IS 'Tax identification number';

COMMENT ON COLUMN public.suppliers.company_representative IS 'Company representative name';
COMMENT ON COLUMN public.suppliers.tax_office IS 'Tax office name';
COMMENT ON COLUMN public.suppliers.tax_number IS 'Tax identification number';