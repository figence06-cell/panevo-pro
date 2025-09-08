import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, ShoppingCart, Users, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();

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

  const getQuickStats = () => {
    switch (profile?.role) {
      case 'admin':
        return [
          { title: 'Toplam Tedarikçi', value: '12', icon: Building2, color: 'bg-primary' },
          { title: 'Toplam Müşteri', value: '48', icon: Users, color: 'bg-accent' },
          { title: 'Aktif Siparişler', value: '23', icon: ShoppingCart, color: 'bg-warning' },
          { title: 'Toplam Ürün', value: '156', icon: Package, color: 'bg-muted' },
        ];
      case 'supplier':
        return [
          { title: 'Toplam Ürünüm', value: '24', icon: Package, color: 'bg-primary' },
          { title: 'Bekleyen Siparişler', value: '8', icon: ShoppingCart, color: 'bg-warning' },
          { title: 'Bu Ay Satış', value: '₺12,450', icon: TrendingUp, color: 'bg-accent' },
          { title: 'Müşteri Puanı', value: '4.8', icon: Star, color: 'bg-muted' },
        ];
      case 'customer':
        return [
          { title: 'Toplam Siparişim', value: '15', icon: ShoppingCart, color: 'bg-primary' },
          { title: 'Bekleyen', value: '2', icon: Package, color: 'bg-warning' },
          { title: 'Tamamlanan', value: '13', icon: TrendingUp, color: 'bg-accent' },
          { title: 'Favori Ürünler', value: '8', icon: Star, color: 'bg-muted' },
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
        {quickStats.map((stat, index) => (
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
        ))}
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