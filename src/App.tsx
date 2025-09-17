import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddProductForm } from "@/components/supplier/AddProductForm";
import { ProductsPage } from "@/components/supplier/ProductsPage";
import { SupplierOrdersPage } from "@/components/supplier/SupplierOrdersPage";
import { SuppliersManagementPage } from "@/components/admin/SuppliersManagementPage";
import { CategoriesManagementPage } from "@/components/admin/CategoriesManagementPage";
import { CustomerProductsPage } from "@/components/customer/CustomerProductsPage";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />
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
            <Route path="/admin/customers" element={
              <DashboardLayout>
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Müşteri Yönetimi</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
              </DashboardLayout>
            } />
            <Route path="/admin/orders" element={
              <DashboardLayout>
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Sipariş Yönetimi</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
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
            
            {/* Catch-all routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
