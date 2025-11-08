import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const customerSchemaBase = z.object({
  customer_name: z.string().min(1, 'Müşteri adı gereklidir'),
  phone: z.string().min(1, 'Telefon numarası gereklidir'),
  email: z.string().email('Geçerli bir e-posta adresi girin').min(1, 'E-posta adresi gereklidir'),
  tabdk_no: z.string().min(1, 'TABDK numarası gereklidir'),
  address: z.string().optional(),
  tax_office: z.string().optional(),
  tax_number: z.string().optional(),
  company_representative: z.string().optional(),
});

const customerSchemaNew = customerSchemaBase.extend({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

const customerSchemaEdit = customerSchemaBase;

type CustomerFormValuesNew = z.infer<typeof customerSchemaNew>;
type CustomerFormValuesEdit = z.infer<typeof customerSchemaEdit>;
type CustomerFormValues = CustomerFormValuesNew | CustomerFormValuesEdit;

interface Customer {
  id: string;
  customer_name: string;
  phone: string;
  email?: string;
  tabdk_no: string;
  address?: string;
  tax_office?: string;
  tax_number?: string;
  company_representative?: string;
  created_at: string;
  updated_at: string;
}

interface AddEditCustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddEditCustomerForm: React.FC<AddEditCustomerFormProps> = ({
  customer,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(isEditing ? customerSchemaEdit : customerSchemaNew),
    defaultValues: {
      customer_name: '',
      phone: '',
      email: '',
      tabdk_no: '',
      address: '',
      tax_office: '',
      tax_number: '',
      company_representative: '',
      ...(isEditing ? {} : { password: '', confirmPassword: '' }),
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        customer_name: customer.customer_name,
        phone: customer.phone,
        email: customer.email || '',
        tabdk_no: customer.tabdk_no,
        address: customer.address || '',
        tax_office: customer.tax_office || '',
        tax_number: customer.tax_number || '',
        company_representative: customer.company_representative || '',
      });
    }
  }, [customer, form]);

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setLoading(true);

      if (isEditing) {
        // Update existing customer
        const customerData = {
          customer_name: values.customer_name,
          phone: values.phone,
          email: values.email,
          tabdk_no: values.tabdk_no,
          address: values.address || null,
          tax_office: values.tax_office || null,
          tax_number: values.tax_number || null,
          company_representative: values.company_representative || null,
        };

        const { error } = await supabase
          .from('customers')
          .update({
            ...customerData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customer!.id);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Müşteri bilgileri güncellendi.',
        });
      } else {
        // Create new customer with user account
        const { password, confirmPassword, ...customerData } = values as CustomerFormValuesNew;

        // First create the user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: customerData.email,
          password: password,
          options: {
            data: {
              full_name: customerData.customer_name,
              role: 'customer',
              tabdk_no: customerData.tabdk_no
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Kullanıcı oluşturulamadı');

        // Create the customer record with user_id
        const { error: customerError } = await supabase
          .from('customers')
          .insert([{
            customer_name: customerData.customer_name,
            phone: customerData.phone,
            email: customerData.email,
            tabdk_no: customerData.tabdk_no,
            address: customerData.address || null,
            tax_office: customerData.tax_office || null,
            tax_number: customerData.tax_number || null,
            company_representative: customerData.company_representative || null,
            user_id: authData.user.id,
          }]);

        if (customerError) throw customerError;

        toast({
          title: 'Başarılı',
          description: 'Yeni müşteri ve kullanıcı hesabı oluşturuldu.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Hata',
        description: isEditing 
          ? 'Müşteri güncellenirken bir hata oluştu.'
          : 'Müşteri oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri Adı *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Müşteri adını girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tabdk_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TABDK Numarası *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="TABDK numarasını girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Telefon numarasını girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="E-posta adresini girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Şifre girin"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre Tekrar *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Şifreyi tekrar girin"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tax_office"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vergi Dairesi</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Vergi dairesi girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vergi Numarası</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Vergi numarası girin" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company_representative"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şirket Yetkilisi</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Şirket yetkilisi adını girin" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Adres bilgisini girin"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Güncelle' : 'Ekle'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        </div>
      </form>
    </Form>
  );
};