import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Tedarikçi Yönetimi</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
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
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Ürün Yönetimi</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
              </DashboardLayout>
            } />
            <Route path="/supplier/add-product" element={
              <DashboardLayout>
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Ürün Ekle</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
              </DashboardLayout>
            } />
            
            {/* Customer Routes */}
            <Route path="/customer/products" element={
              <DashboardLayout>
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Ürünler</h2>
                  <p className="text-muted-foreground">Bu özellik yakında eklenecek...</p>
                </div>
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
