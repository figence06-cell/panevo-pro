import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Calendar, Package, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the customer ID for the current user
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        return;
      }

      // Then fetch orders for this customer
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images
            )
          )
        `)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Hata",
        description: "Siparişler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Beklemede", variant: "secondary" as const },
      confirmed: { label: "Onaylandı", variant: "default" as const },
      preparing: { label: "Hazırlanıyor", variant: "default" as const },
      shipped: { label: "Kargoda", variant: "default" as const },
      delivered: { label: "Teslim Edildi", variant: "default" as const },
      cancelled: { label: "İptal Edildi", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Siparişlerim</h1>
          <p className="text-muted-foreground">Verdiğiniz siparişleri buradan takip edebilirsiniz</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz siparişiniz yok</h3>
            <p className="text-muted-foreground text-center">
              İlk siparişinizi vermek için ürünler sayfasını ziyaret edin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Siparişlerim ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Sipariş #{order.id.slice(0, 8)}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {order.order_items.length} ürün
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <CreditCard className="h-4 w-4" />
                          ₺{order.total_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Sipariş İçeriği:</h4>
                      <div className="grid gap-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            {item.products.images && item.products.images.length > 0 ? (
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                📦
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.products.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              ₺{item.total_price.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};