import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NetworkStats {
  devicesOnline: number;
  devicesOffline: number;
  recentAlerts: number;
  blockedQueries: number;
}

export const useNetworkMonitoring = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<NetworkStats>({
    devicesOnline: 0,
    devicesOffline: 0,
    recentAlerts: 0,
    blockedQueries: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (user) {
      startMonitoring();
      
      // Set up real-time subscriptions
      const devicesSubscription = supabase
        .channel('devices-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user.id}`
        }, () => {
          updateStats();
        })
        .subscribe();

      const alertsSubscription = supabase
        .channel('alerts-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const alert = payload.new as any;
          toast({
            title: "Security Alert",
            description: alert.title,
            variant: alert.severity === 'high' ? 'destructive' : 'default'
          });
          updateStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(devicesSubscription);
        supabase.removeChannel(alertsSubscription);
      };
    }
  }, [user]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    updateStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  };

  const updateStats = async () => {
    if (!user) return;

    try {
      // Get device stats
      const { data: devices } = await supabase
        .from('devices')
        .select('is_online')
        .eq('user_id', user.id);

      // Get recent alerts (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', yesterday.toISOString());

      // Get blocked queries (last 24 hours)
      const { data: blockedQueries } = await supabase
        .from('dns_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_blocked', true)
        .gte('timestamp', yesterday.toISOString());

      const devicesOnline = devices?.filter(d => d.is_online).length || 0;
      const devicesOffline = (devices?.length || 0) - devicesOnline;

      setStats({
        devicesOnline,
        devicesOffline,
        recentAlerts: alerts?.length || 0,
        blockedQueries: blockedQueries?.length || 0
      });

    } catch (error) {
      console.error('Error updating network stats:', error);
    }
  };

  const logDNSQuery = async (domain: string, queryType: string = 'A', deviceId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('dns_logs')
        .insert({
          user_id: user.id,
          device_id: deviceId,
          domain,
          query_type: queryType,
          is_blocked: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging DNS query:', error);
    }
  };

  const createSecurityAlert = async (
    alertType: string,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
    deviceId?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          user_id: user.id,
          device_id: deviceId,
          alert_type: alertType,
          title,
          description,
          severity
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating security alert:', error);
    }
  };

  const logActivity = async (
    activityType: string,
    description: string,
    severity: 'info' | 'warning' | 'error' = 'info',
    deviceId?: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          device_id: deviceId,
          activity_type: activityType,
          description,
          severity,
          metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const simulateNetworkActivity = async () => {
    if (!user) return;

    // Simulate some DNS queries
    const domains = [
      'google.com',
      'facebook.com',
      'malicious-site.evil',
      'github.com',
      'suspicious-domain.bad'
    ];

    // Add some sample devices if none exist
    const { data: existingDevices } = await supabase
      .from('devices')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingDevices || existingDevices.length === 0) {
      await supabase.from('devices').insert([
        {
          user_id: user.id,
          ip_address: '192.168.1.100',
          mac_address: 'AA:BB:CC:DD:EE:FF',
          hostname: 'laptop-demo',
          device_type: 'laptop',
          is_online: true
        },
        {
          user_id: user.id,
          ip_address: '192.168.1.101',
          mac_address: 'FF:EE:DD:CC:BB:AA',
          hostname: 'phone-demo',
          device_type: 'mobile',
          is_online: true
        }
      ]);
    }

    // Log some DNS queries
    for (let i = 0; i < 3; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const isBlocked = domain.includes('malicious') || domain.includes('suspicious');
      
      await supabase.from('dns_logs').insert({
        user_id: user.id,
        domain,
        query_type: 'A',
        is_blocked: isBlocked
      });

      if (isBlocked) {
        await createSecurityAlert(
          'blocked_domain',
          'Malicious Domain Blocked',
          `Blocked access to suspicious domain: ${domain}`,
          'high'
        );
      }
    }

    toast({
      title: "Demo Data Generated",
      description: "Created sample network activity for demonstration",
    });

    updateStats();
  };

  return {
    stats,
    isMonitoring,
    logDNSQuery,
    createSecurityAlert,
    logActivity,
    simulateNetworkActivity,
    updateStats
  };
};