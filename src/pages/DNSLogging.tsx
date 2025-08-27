import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Shield, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NetworkLimitationsNotice from '@/components/NetworkLimitationsNotice';

interface DNSLog {
  id: string;
  domain: string;
  query_type: string;
  is_blocked: boolean;
  timestamp: string;
  device_ip?: string;
  device_hostname?: string;
}

interface NetworkDevice {
  id: string;
  ip_address: string;
  hostname: string;
  is_online: boolean;
}

const DNSLogging = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dnsLogs, setDnsLogs] = useState<DNSLog[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchDNSLogs();
    fetchNetworkDevices();
    startRealTimeMonitoring();
  }, [user]);

  const fetchDNSLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dns_logs')
        .select(`
          *,
          devices(ip_address, hostname)
        `)
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const logsWithDeviceInfo = data?.map(log => ({
        ...log,
        device_ip: log.devices?.ip_address as string,
        device_hostname: log.devices?.hostname as string
      })) || [];
      
      setDnsLogs(logsWithDeviceInfo);
    } catch (error) {
      console.error('Error fetching DNS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, ip_address, hostname, is_online')
        .eq('user_id', user?.id);

      if (error) throw error;
      setNetworkDevices((data as any[])?.map(d => ({ ...d, ip_address: d.ip_address as string })) || []);
    } catch (error) {
      console.error('Error fetching network devices:', error);
    }
  };

  const startRealTimeMonitoring = () => {
    setIsMonitoring(true);
    
    // Subscribe to DNS logs changes
    const dnsSubscription = supabase
      .channel('dns-logs-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dns_logs',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchDNSLogs();
      })
      .subscribe();

    // Simulate network scanning for demo
    const interval = setInterval(simulateNetworkTraffic, 10000);

    return () => {
      supabase.removeChannel(dnsSubscription);
      clearInterval(interval);
    };
  };

  const simulateNetworkTraffic = async () => {
    if (!user) return;

    const domains = [
      'google.com', 'facebook.com', 'youtube.com', 'amazon.com', 'twitter.com',
      'malicious-site.evil', 'phishing-site.bad', 'adult-content.xxx'
    ];

    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const isBlocked = randomDomain.includes('malicious') || randomDomain.includes('phishing') || randomDomain.includes('adult');
    
    // Get a random device or create a demo one
    let deviceId = null;
    if (networkDevices.length > 0) {
      deviceId = networkDevices[Math.floor(Math.random() * networkDevices.length)].id;
    }

    try {
      await supabase.from('dns_logs').insert({
        user_id: user.id,
        device_id: deviceId,
        domain: randomDomain,
        query_type: 'A',
        is_blocked: isBlocked
      });

      if (isBlocked) {
        toast({
          title: "Suspicious Activity Detected",
          description: `Blocked access to ${randomDomain}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error simulating DNS log:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading DNS logs...</div>
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
              <h1 className="text-3xl font-cyber font-bold text-foreground">DNS Query Logging</h1>
              <p className="text-muted-foreground">Monitor all DNS queries across your network devices</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}</span>
            </Badge>
          </div>
        </div>

        {/* Limitations Notice */}
        <NetworkLimitationsNotice feature="dns" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dnsLogs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Queries</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {dnsLogs.filter(log => log.is_blocked).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {networkDevices.filter(device => device.is_online).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Domains</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(dnsLogs.map(log => log.domain)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DNS Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>DNS Query Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Query Type</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dnsLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">{log.domain}</TableCell>
                    <TableCell>{log.query_type}</TableCell>
                    <TableCell>
                      {log.device_hostname || log.device_ip || 'Unknown Device'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.is_blocked ? "destructive" : "default"}>
                        {log.is_blocked ? "Blocked" : "Allowed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {dnsLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No DNS logs found. Network monitoring will appear here in real-time.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DNSLogging;