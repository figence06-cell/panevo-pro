import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, ShoppingCart, Users, TrendingUp, Star, LogIn, UserPlus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MaintenanceModeCard } from '@/components/admin/MaintenanceModeCard';

interface DashboardStats {
  stat1: string;
  stat2: string;
  stat3: string;
  stat4: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: unknown;
  created_at: string;
  user_id: string;
}

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

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
              // First get product count
              const productsRes = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('supplier_id', supplier.id);

              // Get order IDs from supplier links
              const { data: supplierLinks } = await supabase
                .from('order_supplier_links')
                .select('order_id')
                .eq('supplier_user_id', profile.id);

              const orderIds = supplierLinks?.map(link => link.order_id) || [];

              let pendingCount = 0;
              let monthSales = 0;

              if (orderIds.length > 0) {
                // Get pending orders count
                const pendingRes = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .in('id', orderIds)
                  .eq('status', 'pending');

                pendingCount = pendingRes.count || 0;

                // Get completed orders for monthly sales
                const { data: completedOrders } = await supabase
                  .from('orders')
                  .select('total_amount')
                  .in('id', orderIds)
                  .eq('status', 'completed')
                  .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

                monthSales = completedOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
              }

              setStats({
                stat1: productsRes.count?.toString() || '0',
                stat2: pendingCount.toString(),
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

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!profile) return;

      try {
        setActivitiesLoading(true);

        if (profile.role === 'admin') {
          // Admin sees all activities
          const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          setActivities(data || []);
        } else {
          // Other users see only their own activities
          const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          setActivities(data || []);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [profile]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return { icon: LogIn, color: 'bg-primary/10', textColor: 'text-primary' };
      case 'signup':
      case 'user_created':
        return { icon: UserPlus, color: 'bg-accent/10', textColor: 'text-accent' };
      case 'product_added':
      case 'product_created':
        return { icon: Package, color: 'bg-primary/10', textColor: 'text-primary' };
      case 'product_updated':
        return { icon: Edit, color: 'bg-warning/10', textColor: 'text-warning' };
      case 'product_deleted':
        return { icon: Trash2, color: 'bg-destructive/10', textColor: 'text-destructive' };
      case 'order_created':
        return { icon: ShoppingCart, color: 'bg-accent/10', textColor: 'text-accent' };
      case 'order_completed':
        return { icon: CheckCircle, color: 'bg-green-500/10', textColor: 'text-green-500' };
      case 'customer_added':
        return { icon: Users, color: 'bg-warning/10', textColor: 'text-warning' };
      case 'supplier_added':
        return { icon: Building2, color: 'bg-primary/10', textColor: 'text-primary' };
      default:
        return { icon: Package, color: 'bg-muted/10', textColor: 'text-muted-foreground' };
    }
  };

  const getActivityText = (action: string, details: unknown) => {
    const detailsObj = details as Record<string, unknown> | null;
    const name = detailsObj?.name || detailsObj?.product_name || detailsObj?.customer_name || detailsObj?.supplier_name || '';
    
    switch (action) {
      case 'login':
        return 'Sisteme giriş yapıldı';
      case 'signup':
      case 'user_created':
        return 'Yeni kullanıcı kaydı oluşturuldu';
      case 'product_added':
      case 'product_created':
        return name ? `"${name}" ürünü eklendi` : 'Yeni ürün eklendi';
      case 'product_updated':
        return name ? `"${name}" ürünü güncellendi` : 'Ürün güncellendi';
      case 'product_deleted':
        return name ? `"${name}" ürünü silindi` : 'Ürün silindi';
      case 'order_created':
        return 'Yeni sipariş oluşturuldu';
      case 'order_completed':
        return 'Sipariş tamamlandı';
      case 'customer_added':
        return name ? `"${name}" müşterisi eklendi` : 'Yeni müşteri eklendi';
      case 'supplier_added':
        return name ? `"${name}" tedarikçisi eklendi` : 'Yeni tedarikçi eklendi';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const getActivityBadge = (action: string) => {
    switch (action) {
      case 'login':
        return 'Giriş';
      case 'signup':
      case 'user_created':
        return 'Kayıt';
      case 'product_added':
      case 'product_created':
        return 'Yeni';
      case 'product_updated':
        return 'Güncelleme';
      case 'product_deleted':
        return 'Silindi';
      case 'order_created':
        return 'Sipariş';
      case 'order_completed':
        return 'Tamamlandı';
      case 'customer_added':
        return 'Müşteri';
      case 'supplier_added':
        return 'Tedarikçi';
      default:
        return 'İşlem';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Az önce';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

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
      {/* Maintenance Mode Card - Admin Only */}
      {profile?.role === 'admin' && <MaintenanceModeCard />}
      
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
            {profile?.role === 'admin' ? 'Platform üzerindeki son hareketler' : 'Platform üzerindeki son hareketleriniz'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitiesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz aktivite bulunmuyor
              </div>
            ) : (
              activities.map((activity) => {
                const { icon: Icon, color, textColor } = getActivityIcon(activity.action);
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
                    <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {getActivityText(activity.action, activity.details)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                    <Badge variant="secondary">{getActivityBadge(activity.action)}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;