import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Upload } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir'),
  category_id: z.string().min(1, 'Kategori seçimi gereklidir'),
  shelf_price: z.number().min(0, 'Geçerli bir fiyat giriniz'),
  selling_price: z.number().min(0, 'Geçerli bir fiyat giriniz'),
  stock_quantity: z.number().min(0, 'Geçerli bir miktar giriniz'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

export const AddProductForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierData, setSupplierData] = useState<any>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: '',
      shelf_price: 0,
      selling_price: 0,
      stock_quantity: 0,
    }
  });

  React.useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch supplier data
      if (user) {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setSupplierData(supplier);
      }
    };

    fetchData();
  }, [user]);

  const onSubmit = async (data: ProductFormData) => {
    if (!supplierData) {
      toast({
        title: 'Hata',
        description: 'Tedarikçi bilgileri bulunamadı',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          category_id: data.category_id,
          shelf_price: data.shelf_price,
          selling_price: data.selling_price,
          stock_quantity: data.stock_quantity,
          supplier_id: supplierData.id,
        });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Ürün başarıyla eklendi',
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Ürün eklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Yeni Ürün Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Ürün adını giriniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shelf_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raf Fiyatı (₺)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satış Fiyatı (₺)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
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
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok Miktarı</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Ekleniyor...' : 'Ürün Ekle'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};