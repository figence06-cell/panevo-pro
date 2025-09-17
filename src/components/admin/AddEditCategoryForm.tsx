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
import { Loader2, Upload, X, Image } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

interface AddEditCategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddEditCategoryForm: React.FC<AddEditCategoryFormProps> = ({
  category,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isEditing = !!category;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || '',
      });
      if (category.image_url) {
        setImagePreview(category.image_url);
      }
    }
  }, [category, form]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Hata',
          description: 'Resim boyutu 5MB\'dan küçük olmalıdır.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(category?.image_url || null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('category-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      setLoading(true);
      let imageUrl = category?.image_url || null;

      // Upload new image if selected
      if (selectedImage) {
        setUploading(true);
        imageUrl = await uploadImage(selectedImage);
        setUploading(false);
      }

      const categoryData = {
        name: values.name,
        description: values.description || null,
        image_url: imageUrl,
      };

      if (isEditing) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category!.id);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Kategori güncellendi.',
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: 'Başarılı',
          description: 'Yeni kategori eklendi.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Hata',
        description: 'Kategori kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-4">
          <FormLabel>Kategori Resmi</FormLabel>
          
          {imagePreview ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border">
              <img 
                src={imagePreview} 
                alt="Kategori resmi" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button type="button" variant="outline" className="cursor-pointer" asChild>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Resim Seç
                </span>
              </Button>
            </label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            JPG, PNG veya WebP formatında, maksimum 5MB
          </p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori Adı *</FormLabel>
              <FormControl>
                <Input placeholder="Kategori adını girin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Kategori açıklaması (isteğe bağlı)"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || uploading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? 'Resim Yükleniyor...' : 'Kaydediliyor...'}
              </>
            ) : (
              isEditing ? 'Güncelle' : 'Ekle'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};