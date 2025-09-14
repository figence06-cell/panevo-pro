import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Search, ShoppingCart, User, Calendar, DollarSign } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    id: string;
    name: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customers: {
    customer_name: string;
    phone: string;
  } | null;
  order_items: OrderItem[];
}

export const SupplierOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierData, setSupplierData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!supplierData) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          customers (
            customer_name,
            phone
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter orders to only include those with supplier's products
      const filteredOrders = data?.filter(order => 
        order.order_items.some(item => 
          item.products && item.products.id // Ensure product exists
        )
      ) || [];

      setOrders(filteredOrders);
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Siparişler yüklenirken bir hata oluştu',
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
      fetchOrders();
    }
  }, [supplierData]);

  const filteredOrders = orders.filter(order =>
    order.customers?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_items.some(item => 
      item.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Beklemede', variant: 'secondary' as const },
      'confirmed': { label: 'Onaylandı', variant: 'default' as const },
      'shipped': { label: 'Kargoya Verildi', variant: 'outline' as const },
      'delivered': { label: 'Teslim Edildi', variant: 'default' as const },
      'cancelled': { label: 'İptal Edildi', variant: 'destructive' as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
  };

  const getSupplierItemsTotal = (orderItems: OrderItem[]) => {
    return orderItems.reduce((total, item) => total + item.total_price, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">Siparişler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Siparişlerim</h1>
          <p className="text-muted-foreground">Ürünlerinize ait siparişleri buradan takip edebilirsiniz</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Aktif Siparişler ({filteredOrders.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sipariş ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? 'Henüz sipariş bulunmuyor' : 'Arama kriterinize uygun sipariş bulunamadı'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          Sipariş #{order.id.slice(0, 8)}
                        </h3>
                        <Badge {...getStatusBadge(order.status)}>
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </div>
                      
                      {order.customers && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{order.customers.customer_name}</span>
                          <span>•</span>
                          <span>{order.customers.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>₺{getSupplierItemsTotal(order.order_items).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Ürünlerim ({order.order_items.length})
                    </h4>
                    <div className="grid gap-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.products?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} adet × ₺{item.unit_price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">₺{item.total_price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
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