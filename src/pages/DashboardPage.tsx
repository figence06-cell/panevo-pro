import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, ShoppingCart, Users, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DashboardStats {
  stat1: string;
  stat2: string;
  stat3: string;
  stat4: string;
}

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getWelcomeMessage = () => {
    switch (profile?.role) {
      case 'admin':
        return 'Yönetici Dashboard\'ına Hoş Geldiniz';
      case 'supplier':
        return 'Tedarikçi Dashboard\'ına Hoş Geldiniz';
      case 'customer':
        return 'Müşteri Dashboard\'ına Hoş Geldiniz';
      default:
        return 'Dashboard\'a Hoş Geldiniz';
    }
  };

  const getRoleDescription = () => {
    switch (profile?.role) {
      case 'admin':
        return 'Tedarikçileri, müşterileri ve siparişleri yönetin. Platform genelindeki tüm aktiviteleri kontrol edin.';
      case 'supplier':
        return 'Ürünlerinizi yönetin, siparişleri takip edin ve satış istatistiklerinizi görüntüleyin.';
      case 'customer':
        return 'Ürünleri keşfedin, sipariş verin ve sipariş geçmişinizi takip edin.';
      default:
        return 'TanePro B2B platformuna hoş geldiniz.';
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;

      try {
        setLoading(true);

        switch (profile.role) {
          case 'admin': {
            const [suppliersRes, customersRes, ordersRes, productsRes] = await Promise.all([
              supabase.from('suppliers').select('id', { count: 'exact', head: true }),
              supabase.from('customers').select('id', { count: 'exact', head: true }),
              supabase.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
              supabase.from('products').select('id', { count: 'exact', head: true }),
            ]);

            setStats({
              stat1: suppliersRes.count?.toString() || '0',
              stat2: customersRes.count?.toString() || '0',
              stat3: ordersRes.count?.toString() || '0',
              stat4: productsRes.count?.toString() || '0',
            });
            break;
          }

          case 'supplier': {
            const { data: supplier } = await supabase
              .from('suppliers')
              .select('id')
              .eq('user_id', profile.id)
              .single();

            if (supplier) {
              const [productsRes, ordersRes] = await Promise.all([
                supabase.from('products').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
                supabase
                  .from('orders')
                  .select('id, total_amount, order_supplier_links!inner(supplier_user_id)', { count: 'exact' })
                  .eq('order_supplier_links.supplier_user_id', profile.id)
                  .eq('status', 'pending'),
              ]);

              const { data: completedOrders } = await supabase
                .from('orders')
                .select('total_amount, order_supplier_links!inner(supplier_user_id)')
                .eq('order_supplier_links.supplier_user_id', profile.id)
                .eq('status', 'completed')
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

              const monthSales = completedOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

              setStats({
                stat1: productsRes.count?.toString() || '0',
                stat2: ordersRes.count?.toString() || '0',
                stat3: `₺${monthSales.toLocaleString('tr-TR')}`,
                stat4: '-',
              });
            }
            break;
          }

          case 'customer': {
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('user_id', profile.id)
              .single();

            if (customer) {
              const [allOrdersRes, pendingOrdersRes, completedOrdersRes] = await Promise.all([
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id).eq('status', 'pending'),
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id).eq('status', 'completed'),
              ]);

              setStats({
                stat1: allOrdersRes.count?.toString() || '0',
                stat2: pendingOrdersRes.count?.toString() || '0',
                stat3: completedOrdersRes.count?.toString() || '0',
                stat4: '-',
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('İstatistikler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const getQuickStats = () => {
    if (!stats) return [];

    switch (profile?.role) {
      case 'admin':
        return [
          { title: 'Toplam Tedarikçi', value: stats.stat1, icon: Building2, color: 'bg-primary' },
          { title: 'Toplam Müşteri', value: stats.stat2, icon: Users, color: 'bg-accent' },
          { title: 'Aktif Siparişler', value: stats.stat3, icon: ShoppingCart, color: 'bg-warning' },
          { title: 'Toplam Ürün', value: stats.stat4, icon: Package, color: 'bg-muted' },
        ];
      case 'supplier':
        return [
          { title: 'Toplam Ürünüm', value: stats.stat1, icon: Package, color: 'bg-primary' },
          { title: 'Bekleyen Siparişler', value: stats.stat2, icon: ShoppingCart, color: 'bg-warning' },
          { title: 'Bu Ay Satış', value: stats.stat3, icon: TrendingUp, color: 'bg-accent' },
          { title: 'Müşteri Puanı', value: stats.stat4, icon: Star, color: 'bg-muted' },
        ];
      case 'customer':
        return [
          { title: 'Toplam Siparişim', value: stats.stat1, icon: ShoppingCart, color: 'bg-primary' },
          { title: 'Bekleyen', value: stats.stat2, icon: Package, color: 'bg-warning' },
          { title: 'Tamamlanan', value: stats.stat3, icon: TrendingUp, color: 'bg-accent' },
          { title: 'Favori Ürünler', value: stats.stat4, icon: Star, color: 'bg-muted' },
        ];
      default:
        return [];
    }
  };

  const quickStats = getQuickStats();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="gradient-card rounded-2xl p-8 border border-border/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getWelcomeMessage()}</h1>
            <p className="text-muted-foreground mt-1">
              Merhaba, {profile?.full_name || profile?.email}
            </p>
          </div>
        </div>
        <p className="text-foreground/80 max-w-2xl">
          {getRoleDescription()}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="font-medium">
            {profile?.role === 'admin' && 'Yönetici'}
            {profile?.role === 'supplier' && 'Tedarikçi'}
            {profile?.role === 'customer' && 'Müşteri'}
          </Badge>
          <Badge variant="outline">Aktif</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          quickStats.map((stat, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-lg ${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
          <CardDescription>
            Platform üzerindeki son hareketleriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Yeni ürün eklendi
                </p>
                <p className="text-xs text-muted-foreground">2 saat önce</p>
              </div>
              <Badge variant="secondary">Yeni</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Sipariş onaylandı
                </p>
                <p className="text-xs text-muted-foreground">5 saat önce</p>
              </div>
              <Badge variant="secondary">Tamamlandı</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Yeni müşteri kaydı
                </p>
                <p className="text-xs text-muted-foreground">1 gün önce</p>
              </div>
              <Badge variant="secondary">Müşteri</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;