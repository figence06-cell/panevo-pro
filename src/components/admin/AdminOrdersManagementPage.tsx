import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Search, ShoppingCart, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
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
    email: string | null;
    address: string | null;
    company_representative: string | null;
  } | null;
  order_items: OrderItem[];
}

export const AdminOrdersManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          customers (
            customer_name,
            phone,
            email,
            address,
            company_representative
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_id,
            products (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.customers?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_items.some(item => 
      item.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Sipariş durumu güncellendi',
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Sipariş durumu güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Tüm siparişleri görüntüleyin ve yönetin
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Listesi</CardTitle>
          <CardDescription>
            Tüm siparişleri görüntüleyin ve durumlarını güncelleyin
          </CardDescription>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sipariş, müşteri veya ürün ara..."
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
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-6 space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-border">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          Sipariş #{order.id.slice(0, 8)}
                        </h3>
                        <Badge {...getStatusBadge(order.status)}>
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                      <p className="text-2xl font-bold">
                        ₺{order.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info & Status Update */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Müşteri Bilgileri</h4>
                      {order.customers ? (
                        <div className="space-y-1">
                          <p className="font-medium">{order.customers.customer_name}</p>
                          {order.customers.company_representative && (
                            <p className="text-sm text-muted-foreground">Yetkili: {order.customers.company_representative}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{order.customers.phone}</p>
                          {order.customers.email && (
                            <p className="text-sm text-muted-foreground">{order.customers.email}</p>
                          )}
                          {order.customers.address && (
                            <p className="text-sm text-muted-foreground">Adres: {order.customers.address}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Bilgi bulunamadı</p>
                      )}
                    </div>

                    {/* Status Update */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Sipariş Durumu</h4>
                      <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="confirmed">Onaylandı</SelectItem>
                          <SelectItem value="shipped">Kargoya Verildi</SelectItem>
                          <SelectItem value="delivered">Teslim Edildi</SelectItem>
                          <SelectItem value="cancelled">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Sipariş Ürünleri ({order.order_items.length})
                    </h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ürün</TableHead>
                            <TableHead className="text-right">Miktar</TableHead>
                            <TableHead className="text-right">Birim Fiyat</TableHead>
                            <TableHead className="text-right">Toplam</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.order_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.products?.name || 'Bilinmeyen Ürün'}
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                ₺{item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₺{item.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
