import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  shelf_price: number;
  selling_price: number;
  stock_quantity: number;
  categories: { name: string } | null;
  created_at: string;
}

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierData, setSupplierData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!supplierData) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          shelf_price,
          selling_price,
          stock_quantity,
          created_at,
          categories (
            name
          )
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Ürünler yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!user) return;

      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setSupplierData(supplier);
    };

    fetchSupplierData();
  }, [user]);

  useEffect(() => {
    if (supplierData) {
      fetchProducts();
    }
  }, [supplierData]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: 'Başarılı',
        description: 'Ürün başarıyla silindi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Ürün silinirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ürün Yönetimi</h1>
          <p className="text-muted-foreground">Ürünlerinizi buradan yönetebilirsiniz</p>
        </div>
        <Link to="/supplier/add-product">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ürün Ekle
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ürünlerim ({products.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {products.length === 0 ? 'Henüz ürün eklenmemiş' : 'Arama kriterinize uygun ürün bulunamadı'}
              </p>
              {products.length === 0 && (
                <Link to="/supplier/add-product">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Ürününüzü Ekleyin
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        {product.categories && (
                          <Badge variant="secondary">
                            {product.categories.name}
                          </Badge>
                        )}
                        <Badge 
                          variant={product.stock_quantity > 0 ? "default" : "destructive"}
                        >
                          Stok: {product.stock_quantity}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Raf Fiyatı: ₺{product.shelf_price}</span>
                        <span>Satış Fiyatı: ₺{product.selling_price}</span>
                        <span>Eklenme: {new Date(product.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};