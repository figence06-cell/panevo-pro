import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddProductForm } from "@/components/supplier/AddProductForm";
import { ProductsPage } from "@/components/supplier/ProductsPage";
import { SupplierOrdersPage } from "@/components/supplier/SupplierOrdersPage";
import { SuppliersManagementPage } from "@/components/admin/SuppliersManagementPage";
import { CategoriesManagementPage } from "@/components/admin/CategoriesManagementPage";
import { ProductsManagementPage } from "@/components/admin/ProductsManagementPage";
import { CustomersManagementPage } from "@/components/admin/CustomersManagementPage";
import { AdminOrdersManagementPage } from "@/components/admin/AdminOrdersManagementPage";
import { CustomerProductsPage } from "@/components/customer/CustomerProductsPage";
import { CustomerOrdersPage } from "@/components/customer/CustomerOrdersPage";
import { CartPage } from "@/components/customer/CartPage";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MaintenancePage from "./pages/MaintenancePage";
import NotFound from "./pages/NotFound";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

const queryClient = new QueryClient();

const MaintenanceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaintenanceMode, maintenanceMessage, loading } = useMaintenanceMode();
  const { profile, loading: authLoading } = useAuth();

  // Show loading or nothing while checking
  if (loading || authLoading) {
    return <>{children}</>;
  }

  // If maintenance mode is enabled and user is not admin, show maintenance page
  if (isMaintenanceMode && profile?.role !== 'admin') {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <MaintenanceWrapper>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      {/* Admin Routes */}
      <Route path="/admin/suppliers" element={
        <DashboardLayout>
          <SuppliersManagementPage />
        </DashboardLayout>
      } />
      <Route path="/admin/categories" element={
        <DashboardLayout>
          <CategoriesManagementPage />
        </DashboardLayout>
      } />
      <Route path="/admin/products" element={
        <DashboardLayout>
          <ProductsManagementPage />
        </DashboardLayout>
      } />
      <Route path="/admin/customers" element={
        <DashboardLayout>
          <CustomersManagementPage />
        </DashboardLayout>
      } />
      <Route path="/admin/orders" element={
        <DashboardLayout>
          <AdminOrdersManagementPage />
        </DashboardLayout>
      } />
      
      {/* Supplier Routes */}
      <Route path="/supplier/products" element={
        <DashboardLayout>
          <ProductsPage />
        </DashboardLayout>
      } />
      <Route path="/supplier/add-product" element={
        <DashboardLayout>
          <AddProductForm />
        </DashboardLayout>
      } />
      <Route path="/supplier/orders" element={
        <DashboardLayout>
          <SupplierOrdersPage />
        </DashboardLayout>
      } />
      
      {/* Customer Routes */}
      <Route path="/customer/products" element={
        <DashboardLayout>
          <CustomerProductsPage />
        </DashboardLayout>
      } />
      <Route path="/customer/orders" element={
        <DashboardLayout>
          <CustomerOrdersPage />
        </DashboardLayout>
      } />
      <Route path="/customer/cart" element={
        <DashboardLayout>
          <CartPage />
        </DashboardLayout>
      } />
      
      {/* Profile Route */}
      <Route path="/profile" element={
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      } />
      
      {/* Catch-all routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </MaintenanceWrapper>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
