import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  ShoppingCart,
  History,
  Store,
  Grid3X3,
  List,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const isCollapsed = state === 'collapsed';

  const getNavItems = () => {
    const baseItems = [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ];

    switch (profile?.role) {
      case 'admin':
        return [
          ...baseItems,
          { title: 'Tedarikçi Yönetimi', url: '/admin/suppliers', icon: Users },
          { title: 'Kategori Yönetimi', url: '/admin/categories', icon: FolderOpen },
          { title: 'Müşteri Yönetimi', url: '/admin/customers', icon: UserPlus },
          { title: 'Sipariş Yönetimi', url: '/admin/orders', icon: ShoppingCart },
          { title: 'Sipariş Geçmişi', url: '/admin/order-history', icon: History },
        ];
      
      case 'supplier':
        return [
          ...baseItems,
          { title: 'Ürün Yönetimi', url: '/supplier/products', icon: Package },
          { title: 'Ürün Ekle', url: '/supplier/add-product', icon: Store },
          { title: 'Siparişlerim', url: '/supplier/orders', icon: ShoppingCart },
          { title: 'Sipariş Geçmişi', url: '/supplier/order-history', icon: History },
          { title: 'İstatistikler', url: '/supplier/stats', icon: TrendingUp },
        ];
      
      case 'customer':
        return [
          ...baseItems,
          { title: 'Ürünler', url: '/customer/products', icon: Grid3X3 },
          { title: 'Siparişlerim', url: '/customer/orders', icon: ShoppingCart },
          { title: 'Sipariş Geçmişi', url: '/customer/order-history', icon: History },
        ];
      
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const getNavClassName = (path: string) => {
    const isCurrentlyActive = isActive(path);
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isCurrentlyActive
        ? 'bg-primary text-primary-foreground shadow-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'admin':
        return 'Yönetici Paneli';
      case 'supplier':
        return 'Tedarikçi Paneli';
      case 'customer':
        return 'Müşteri Paneli';
      default:
        return 'Ana Menü';
    }
  };

  return (
    <Sidebar
      className={isCollapsed ? 'w-16' : 'w-64'}
    >
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-3 py-2">
            {!isCollapsed && getRoleLabel()}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};