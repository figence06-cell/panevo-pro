import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, Users, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AddEditSupplierForm } from './AddEditSupplierForm';

interface Supplier {
  id: string;
  supplier_name: string;
  phone: string;
  email?: string;
  tabdk_no: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export const SuppliersManagementPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Hata',
        description: 'Tedarikçiler yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Tedarikçi başarıyla silindi.',
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Hata',
        description: 'Tedarikçi silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleSupplierSaved = () => {
    setIsDialogOpen(false);
    setSelectedSupplier(null);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tabdk_no.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tedarikçi Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Tedarikçileri ekleyin, düzenleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleAddSupplier} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Tedarikçi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tedarikçi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Eklenen</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => {
                const createdDate = new Date(s.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Tedarikçi</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
          <CardDescription>
            Tüm tedarikçilerinizi görüntüleyin ve yönetin
          </CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tedarikçi Adı</TableHead>
                    <TableHead>TABDK No</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? 'Arama kriterlerine uygun tedarikçi bulunamadı.' : 'Henüz tedarikçi eklenmemiş.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          {supplier.supplier_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.tabdk_no}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {supplier.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {supplier.email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {supplier.address ? supplier.address.slice(0, 50) + (supplier.address.length > 50 ? '...' : '') : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(supplier.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSupplier(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
            </DialogTitle>
          </DialogHeader>
          <AddEditSupplierForm
            supplier={selectedSupplier}
            onSuccess={handleSupplierSaved}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};