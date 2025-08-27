import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, Wifi, Shield, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NetworkLimitationsNotice from '@/components/NetworkLimitationsNotice';

interface MonitoringData {
  devices: {
    total: number;
    online: number;
    offline: number;
    blocked: number;
  };
  network: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    throughput: number;
  };
  security: {
    threats: number;
    blockedQueries: number;
    alerts: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLoad: number;
  };
}

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  severity: string;
  timestamp: string;
  device_hostname?: string;
}

const RealTimeMonitoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    devices: { total: 0, online: 0, offline: 0, blocked: 0 },
    network: { bandwidth: 0, latency: 0, packetLoss: 0, throughput: 0 },
    security: { threats: 0, blockedQueries: 0, alerts: 0 },
    performance: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkLoad: 0 }
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchMonitoringData();
    fetchActivityLogs();
    startRealTimeMonitoring();
  }, [user]);

  const fetchMonitoringData = async () => {
    try {
      // Fetch devices data
      const { data: devices } = await supabase
        .from('devices')
        .select('is_online, is_blocked')
        .eq('user_id', user?.id);

      // Fetch security data
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('id')
        .eq('user_id', user?.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: blockedQueries } = await supabase
        .from('dns_logs')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_blocked', true)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const devicesData = {
        total: devices?.length || 0,
        online: devices?.filter(d => d.is_online).length || 0,
        offline: devices?.filter(d => !d.is_online).length || 0,
        blocked: devices?.filter(d => d.is_blocked).length || 0
      };

      const securityData = {
        threats: alerts?.length || 0,
        blockedQueries: blockedQueries?.length || 0,
        alerts: alerts?.length || 0
      };

      // Simulate network and performance metrics
      const networkData = {
        bandwidth: Math.floor(Math.random() * 1000) + 500, // Mbps
        latency: Math.floor(Math.random() * 50) + 10, // ms
        packetLoss: Math.random() * 2, // percentage
        throughput: Math.floor(Math.random() * 800) + 200 // Mbps
      };

      const performanceData = {
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 70) + 30,
        diskUsage: Math.floor(Math.random() * 80) + 15,
        networkLoad: Math.floor(Math.random() * 90) + 10
      };

      setMonitoringData({
        devices: devicesData,
        network: networkData,
        security: securityData,
        performance: performanceData
      });

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          devices(hostname)
        `)
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const logsWithDeviceInfo = data?.map(log => ({
        ...log,
        device_hostname: log.devices?.hostname
      })) || [];
      
      setActivityLogs(logsWithDeviceInfo);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const startRealTimeMonitoring = () => {
    setIsMonitoring(true);
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('monitoring-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchMonitoringData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_logs',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchActivityLogs();
      })
      .subscribe();

    // Simulate real-time updates
    const interval = setInterval(() => {
      simulateNetworkActivity();
      fetchMonitoringData();
    }, 5000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(interval);
    };
  };

  const simulateNetworkActivity = async () => {
    if (!user) return;

    const activities = [
      { type: 'network_scan', description: 'Network scan completed', severity: 'info' },
      { type: 'device_connect', description: 'New device connected to network', severity: 'info' },
      { type: 'security_check', description: 'Security policy validation passed', severity: 'info' },
      { type: 'bandwidth_alert', description: 'High bandwidth usage detected', severity: 'warning' },
      { type: 'suspicious_activity', description: 'Potential security threat detected', severity: 'error' }
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: activity.type,
        description: activity.description,
        severity: activity.severity,
        metadata: { timestamp: new Date().toISOString() }
      });

      if (activity.severity === 'error') {
        toast({
          title: "Security Alert",
          description: activity.description,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-cyber font-bold text-foreground">Real-time Monitoring</h1>
              <p className="text-muted-foreground">Continuous network and device monitoring</p>
            </div>
          </div>
          <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center space-x-1">
            <Activity className={`w-3 h-3 ${isMonitoring ? 'animate-pulse' : ''}`} />
            <span>{isMonitoring ? "Live Monitoring" : "Monitoring Inactive"}</span>
          </Badge>
        </div>

        {/* Limitations Notice */}
        <NetworkLimitationsNotice feature="monitoring" />

        {/* Device Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitoringData.devices.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{monitoringData.devices.online}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Threats</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{monitoringData.security.threats}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Queries</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{monitoringData.security.blockedQueries}</div>
            </CardContent>
          </Card>
        </div>

        {/* Network Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Bandwidth</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{monitoringData.network.bandwidth} Mbps</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Latency</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{monitoringData.network.latency} ms</span>
                  <TrendingDown className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Packet Loss</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{monitoringData.network.packetLoss.toFixed(2)}%</span>
                  {monitoringData.network.packetLoss > 1 ? 
                    <TrendingUp className="w-4 h-4 text-red-500" /> : 
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-lg font-bold">{monitoringData.performance.cpuUsage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-lg font-bold">{monitoringData.performance.memoryUsage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Network Load</span>
                <span className="text-lg font-bold">{monitoringData.performance.networkLoad}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(log.severity) as any}>
                        {log.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{log.activity_type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                    {log.device_hostname && (
                      <p className="text-xs text-muted-foreground">Device: {log.device_hostname}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
            {activityLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs yet. Real-time monitoring data will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;