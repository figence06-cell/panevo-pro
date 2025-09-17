import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  shelf_price: number;
  stock_quantity: number;
  images?: string[];
  categories?: Category;
}

export const CustomerProductsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, image_url")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Hata",
        description: "Kategoriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name,
            description
          )
        `)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Hata",
        description: "Ürünler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.categories?.id === selectedCategory)
    : products;

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const getCategoryDisplay = (category: Category) => {
    if (category.image_url) {
      return (
        <img 
          src={category.image_url} 
          alt={category.name}
          className="w-12 h-12 object-cover rounded-full"
        />
      );
    }
    
    // Fallback emojis for categories without images
    const categoryImages: Record<string, string> = {
      "Sebzeler": "🥬",
      "Meyveler": "🍎",
      "Süt Ürünleri": "🥛",
      "Et Ürünleri": "🥩",
      "Tahıllar": "🌾",
      "İçecekler": "🥤",
    };
    
    return (
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">
        {categoryImages[category.name] || "🛒"}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Ürünlerimiz</h1>
        <p className="text-muted-foreground">Taze ve kaliteli ürünlerimizi keşfedin</p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Kategoriler</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? "text-primary" : ""}
          >
            Tümü
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col items-center space-y-2 cursor-pointer min-w-0 flex-shrink-0"
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors overflow-hidden ${
                selectedCategory === category.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}>
                {getCategoryDisplay(category)}
              </div>
              <span className={`text-sm font-medium text-center ${
                selectedCategory === category.id ? "text-primary" : "text-foreground"
              }`}>
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : "Tüm Ürünler"
            }
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} ürün
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Bu kategoride henüz ürün bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative">
                  {/* Product Image */}
                  <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-4xl text-muted-foreground">📦</div>
                    )}
                    
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.has(product.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>

                    {/* Discount Badge */}
                    {product.shelf_price > product.selling_price && (
                      <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                        %{Math.round(((product.shelf_price - product.selling_price) / product.shelf_price) * 100)} İNDİRİM
                      </Badge>
                    )}

                    {/* Stock Badge */}
                    {product.stock_quantity < 10 && (
                      <Badge variant="secondary" className="absolute bottom-2 left-2">
                        Son {product.stock_quantity} adet
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          ₺{product.selling_price.toFixed(2)}
                        </span>
                        {product.shelf_price > product.selling_price && (
                          <span className="text-sm line-through text-muted-foreground">
                            ₺{product.shelf_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs gap-1"
                        onClick={() => {
                          toast({
                            title: "Sepete Eklendi",
                            description: `${product.name} sepetinize eklendi.`,
                          });
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Sepete Ekle
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};