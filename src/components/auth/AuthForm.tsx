import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Building2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';

export const AuthForm: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'customer' as UserRole,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.role, signUpData.fullName);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TanePro B2B</h1>
          <p className="text-muted-foreground mt-2">Professional B2B Platform</p>
        </div>

        <Card className="glass-card shadow-xl">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="space-y-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
                <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="form-group">
                    <Label htmlFor="signin-email" className="form-label">E-posta</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="signin-password" className="form-label">Şifre</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary shadow-primary transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Giriş Yap
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="form-group">
                    <Label htmlFor="signup-name" className="form-label form-label-required">Ad Soyad</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ad Soyad"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="signup-email" className="form-label form-label-required">E-posta</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="signup-role" className="form-label form-label-required">Rol</Label>
                    <Select
                      value={signUpData.role}
                      onValueChange={(value: UserRole) => setSignUpData({ ...signUpData, role: value })}
                    >
                      <SelectTrigger className="transition-colors">
                        <SelectValue placeholder="Rolünüzü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Müşteri</SelectItem>
                        <SelectItem value="supplier">Tedarikçi</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="form-group">
                    <Label htmlFor="signup-password" className="form-label form-label-required">Şifre</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="signup-confirm" className="form-label form-label-required">Şifre Tekrar</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                      className="transition-colors"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary shadow-primary transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Kayıt Ol
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};