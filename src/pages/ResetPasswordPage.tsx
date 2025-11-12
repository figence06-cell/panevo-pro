import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');

    if (error || errorCode) {
      // Handle error cases (expired link, invalid link, etc.)
      let errorMessage = "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.";
      
      if (errorCode === 'otp_expired') {
        errorMessage = "Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.";
      }
      
      toast({
        title: "Geçersiz Bağlantı",
        description: errorMessage,
        variant: "destructive",
      });
      setValidToken(false);
    } else if (type === 'recovery' && accessToken) {
      setValidToken(true);
    } else {
      toast({
        title: "Geçersiz Bağlantı",
        description: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
        variant: "destructive",
      });
      setValidToken(false);
    }
  }, [toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Başarılı",
          description: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.",
        });
        
        // Sign out the user and redirect to login
        await supabase.auth.signOut();
        navigate('/auth');
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validToken === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bağlantı Geçersiz</CardTitle>
            <CardDescription>
              Şifre sıfırlama bağlantısının süresi dolmuş veya geçersiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Şifre sıfırlama bağlantıları güvenlik nedeniyle kısa sürelidir. 
              Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Şifre Sıfırla</CardTitle>
          <CardDescription>
            Yeni şifrenizi belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Şifreyi Güncelle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
