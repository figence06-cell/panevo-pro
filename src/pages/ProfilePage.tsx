import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    tabdk_no: '',
    company_name: '',
    company_representative: '',
    tax_office: '',
    tax_number: '',
    address: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!profile || !user) return;

      // Load profile data
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
      }));

      // Load company data based on role
      if (profile.role === 'customer') {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setFormData(prev => ({
            ...prev,
            tabdk_no: data.tabdk_no || '',
            company_name: data.customer_name || '',
            company_representative: data.company_representative || '',
            tax_office: data.tax_office || '',
            tax_number: data.tax_number || '',
            address: data.address || '',
          }));
        }
      } else if (profile.role === 'supplier') {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setFormData(prev => ({
            ...prev,
            tabdk_no: data.tabdk_no || '',
            company_name: data.supplier_name || '',
            company_representative: data.company_representative || '',
            tax_office: data.tax_office || '',
            tax_number: data.tax_number || '',
            address: data.address || '',
          }));
        }
      }
    };

    loadData();
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update company data based on role
      if (profile?.role === 'customer') {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            customer_name: formData.company_name,
            phone: formData.phone,
            address: formData.address,
            tabdk_no: formData.tabdk_no,
            company_representative: formData.company_representative,
            tax_office: formData.tax_office,
            tax_number: formData.tax_number,
          })
          .eq('user_id', user?.id);

        if (customerError) throw customerError;
      } else if (profile?.role === 'supplier') {
        const { error: supplierError } = await supabase
          .from('suppliers')
          .update({
            supplier_name: formData.company_name,
            phone: formData.phone,
            address: formData.address,
            tabdk_no: formData.tabdk_no,
            company_representative: formData.company_representative,
            tax_office: formData.tax_office,
            tax_number: formData.tax_number,
          })
          .eq('user_id', user?.id);

        if (supplierError) throw supplierError;
      }

      toast({
        title: 'Başarılı',
        description: 'Profil bilgileriniz güncellendi.',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'supplier':
        return 'Tedarikçi';
      case 'customer':
        return 'Müşteri';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Profil Bilgilerim</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kişisel Bilgiler
            </CardTitle>
            <CardDescription>
              Kişisel bilgilerinizi buradan güncelleyebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Ad Soyad</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Telefon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    E-posta adresi değiştirilemez.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    value={getRoleText(profile?.role || '')}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Rol bilgisi değiştirilemez.
                  </p>
                </div>
              </div>

              {(profile?.role === 'customer' || profile?.role === 'supplier') && (
                <>
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Şirket Bilgileri
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="tabdk_no">TABDK No</Label>
                        <Input
                          id="tabdk_no"
                          value={formData.tabdk_no}
                          onChange={(e) =>
                            setFormData({ ...formData, tabdk_no: e.target.value })
                          }
                          placeholder="TABDK No"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_name">Şirket Adı</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                          placeholder="Şirket Adı"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_representative">Şirket Yetkilisi</Label>
                        <Input
                          id="company_representative"
                          value={formData.company_representative}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company_representative: e.target.value,
                            })
                          }
                          placeholder="Şirket Yetkilisi"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_office">Vergi Dairesi</Label>
                        <Input
                          id="tax_office"
                          value={formData.tax_office}
                          onChange={(e) =>
                            setFormData({ ...formData, tax_office: e.target.value })
                          }
                          placeholder="Vergi Dairesi"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_number">Vergi No</Label>
                        <Input
                          id="tax_number"
                          value={formData.tax_number}
                          onChange={(e) =>
                            setFormData({ ...formData, tax_number: e.target.value })
                          }
                          placeholder="Vergi No"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Adres</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          placeholder="Adres"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
