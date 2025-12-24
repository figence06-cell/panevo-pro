import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wrench, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export const MaintenanceModeCard: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          const value = data.value as unknown as MaintenanceSettings;
          setSettings({
            enabled: value.enabled || false,
            message: value.message || 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
          });
        }
      } catch (error) {
        console.error('Error fetching maintenance settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      const newSettings = { ...settings, enabled };
      
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: JSON.parse(JSON.stringify(newSettings)),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      
      setSettings(newSettings);
      toast.success(enabled ? 'Bakım modu aktif edildi' : 'Bakım modu kapatıldı');
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      toast.error('Bakım modu güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: JSON.parse(JSON.stringify(settings)),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      
      toast.success('Bakım mesajı kaydedildi');
    } catch (error) {
      console.error('Error saving maintenance message:', error);
      toast.error('Mesaj kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Bakım Modu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={settings.enabled ? 'border-warning' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className={`h-5 w-5 ${settings.enabled ? 'text-warning' : ''}`} />
          Bakım Modu
        </CardTitle>
        <CardDescription>
          Siteyi bakıma alarak admin dışındaki kullanıcıların erişimini engelleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode">Bakım Modu</Label>
            <p className="text-sm text-muted-foreground">
              {settings.enabled ? 'Aktif - Site bakımda' : 'Kapalı - Site normal çalışıyor'}
            </p>
          </div>
          <Switch
            id="maintenance-mode"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Bakım Mesajı</Label>
          <div className="flex gap-2">
            <Input
              id="maintenance-message"
              value={settings.message}
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="Bakım mesajını girin..."
              disabled={saving}
            />
            <Button 
              onClick={handleSaveMessage} 
              disabled={saving}
              size="icon"
              variant="outline"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
