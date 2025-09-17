import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, FolderOpen, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AddEditCategoryForm } from './AddEditCategoryForm';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export const CategoriesManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Hata',
        description: 'Kategoriler yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait ürünler etkilenebilir.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Kategori başarıyla silindi.',
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Hata',
        description: 'Kategori silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleCategorySaved = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kategori Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Ürün kategorilerini ekleyin, düzenleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleAddCategory} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kategori
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resimsiz Kategori</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => !c.image_url).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Eklenen</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
          <CardDescription>
            Tüm kategorilerinizi görüntüleyin ve yönetin
          </CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resim</TableHead>
                    <TableHead>Kategori Adı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchTerm ? 'Arama kriterlerine uygun kategori bulunamadı.' : 'Henüz kategori eklenmemiş.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {category.image_url ? (
                              <img 
                                src={category.image_url} 
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderOpen className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {category.description ? (
                              category.description.length > 50 ? 
                              category.description.slice(0, 50) + '...' : 
                              category.description
                            ) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
            </DialogTitle>
          </DialogHeader>
          <AddEditCategoryForm
            category={selectedCategory}
            onSuccess={handleCategorySaved}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};