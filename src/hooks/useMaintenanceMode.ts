import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching maintenance mode:', error);
          setLoading(false);
          return;
        }

        if (data) {
          const value = data.value as unknown as MaintenanceSettings;
          setIsMaintenanceMode(value.enabled || false);
          setMaintenanceMessage(value.message || 'Site bakımda. Lütfen daha sonra tekrar deneyin.');
        }
      } catch (error) {
        console.error('Error fetching maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('maintenance-mode-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const value = payload.new.value as MaintenanceSettings;
            setIsMaintenanceMode(value.enabled || false);
            setMaintenanceMessage(value.message || 'Site bakımda. Lütfen daha sonra tekrar deneyin.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isMaintenanceMode, maintenanceMessage, loading };
};
