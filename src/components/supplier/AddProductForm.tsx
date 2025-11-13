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
import { Package, Upload, X, Image } from 'lucide-react';

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

interface AddProductFormProps {
  productId?: string;
  onSuccess?: () => void;
}

export const AddProductForm = ({ productId, onSuccess }: AddProductFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: '',
      shelf_price: undefined,
      selling_price: undefined,
      stock_quantity: 12,
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

      // Fetch product data if editing
      if (productId) {
        const { data: productData, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productData && !error) {
          form.reset({
            name: productData.name,
            category_id: productData.category_id,
            shelf_price: productData.shelf_price,
            selling_price: productData.selling_price,
            stock_quantity: productData.stock_quantity,
          });
          
          if (productData.images) {
            setImageUrls(productData.images);
          }
        }
      }
    };

    fetchData();
  }, [user, productId, form]);

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context oluşturulamadı'));
            return;
          }

          // Maksimum boyut 1000x1000, en-boy oranını koru
          const MAX_SIZE = 1000;
          let width = img.width;
          let height = img.height;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (height / width) * MAX_SIZE;
              width = MAX_SIZE;
            } else {
              width = (width / height) * MAX_SIZE;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // RGB formatında çiz (alpha kanalı yok)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Resim dönüştürülemedi'));
              }
            },
            'image/jpeg',
            0.9
          );
        };
        img.onerror = () => reject(new Error('Resim yüklenemedi'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Resmi yeniden boyutlandır
        const resizedBlob = await resizeImage(file);
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, resizedBlob, {
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setImageUrls(prev => [...prev, ...uploadedUrls]);
      toast({
        title: 'Başarılı',
        description: `${files.length} resim yüklendi`,
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Resim yüklenirken hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
      handleImageUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!supplierData && !productId) {
      toast({
        title: 'Hata',
        description: 'Tedarikçi bilgileri bulunamadı',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (productId) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            category_id: data.category_id,
            shelf_price: data.shelf_price,
            selling_price: data.selling_price,
            stock_quantity: data.stock_quantity,
            images: imageUrls,
          })
          .eq('id', productId);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Ürün başarıyla güncellendi',
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Insert new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: data.name,
            category_id: data.category_id,
            shelf_price: data.shelf_price,
            selling_price: data.selling_price,
            stock_quantity: data.stock_quantity,
            supplier_id: supplierData.id,
            images: imageUrls,
          });

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Ürün başarıyla eklendi',
        });

        form.reset();
        setImageUrls([]);
        setSelectedImages([]);
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Bir hata oluştu',
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
            {productId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
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
                        placeholder="" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        placeholder="" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                      placeholder="12" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 12)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">Ürün Resimleri</span>
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        Resim yüklemek için tıklayın
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP (Maks. 10MB)
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Ürün resmi ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="text-center text-sm text-muted-foreground">
                  Resimler yükleniyor...
                </div>
              )}
            </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (productId ? 'Güncelleniyor...' : 'Ekleniyor...') : (productId ? 'Ürünü Güncelle' : 'Ürün Ekle')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};