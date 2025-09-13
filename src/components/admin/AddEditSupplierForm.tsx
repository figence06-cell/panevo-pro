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

const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Tedarikçi adı gereklidir'),
  phone: z.string().min(1, 'Telefon numarası gereklidir'),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional().or(z.literal('')),
  tabdk_no: z.string().min(1, 'TABDK numarası gereklidir'),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  supplier_name: string;
  phone: string;
  email?: string;
  tabdk_no: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface AddEditSupplierFormProps {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddEditSupplierForm: React.FC<AddEditSupplierFormProps> = ({
  supplier,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!supplier;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: '',
      phone: '',
      email: '',
      tabdk_no: '',
      address: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        supplier_name: supplier.supplier_name,
        phone: supplier.phone,
        email: supplier.email || '',
        tabdk_no: supplier.tabdk_no,
        address: supplier.address || '',
      });
    }
  }, [supplier, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      setLoading(true);

      const supplierData = {
        supplier_name: values.supplier_name,
        phone: values.phone,
        email: values.email || null,
        tabdk_no: values.tabdk_no,
        address: values.address || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('suppliers')
          .update({
            ...supplierData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplier!.id);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Tedarikçi bilgileri güncellendi.',
        });
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([supplierData]);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Yeni tedarikçi eklendi.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Hata',
        description: isEditing 
          ? 'Tedarikçi güncellenirken bir hata oluştu.'
          : 'Tedarikçi eklenirken bir hata oluştu.',
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
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tedarikçi Adı *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Tedarikçi adını girin" 
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
                <FormLabel>E-posta</FormLabel>
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