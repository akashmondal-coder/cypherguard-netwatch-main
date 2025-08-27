import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Wifi, Activity, AlertTriangle, Users, Globe, Clock, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DemoButton from '@/components/DemoButton';

interface Device {
  id: string;
  ip_address: unknown;
  mac_address: string;
  hostname: string;
  device_type: string;
  is_online: boolean;
  is_blocked: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DNSLog {
  id: string;
  domain: string;
  query_type: string;
  is_blocked: boolean;
  timestamp: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: string;
  is_resolved: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [dnsLogs, setDnsLogs] = useState<DNSLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    blockedDevices: 0,
    totalAlerts: 0
  });

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch devices
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      // Fetch DNS logs
      const { data: dnsData } = await supabase
        .from('dns_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      // Fetch security alerts
      const { data: alertsData } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (devicesData) {
        setDevices(devicesData);
        setStats({
          totalDevices: devicesData.length,
          onlineDevices: devicesData.filter(d => d.is_online).length,
          blockedDevices: devicesData.filter(d => d.is_blocked).length,
          totalAlerts: alertsData?.length || 0
        });
      }

      if (dnsData) setDnsLogs(dnsData);
      if (alertsData) setSecurityAlerts(alertsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const addDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          user_id: user?.id,
          ip_address: formData.get('ip_address') as string,
          mac_address: formData.get('mac_address') as string,
          hostname: formData.get('hostname') as string,
          device_type: formData.get('device_type') as string,
          is_online: true
        });

      if (error) throw error;

      toast({
        title: "Device Added",
        description: "Device has been successfully added to monitoring",
      });
      
      fetchDashboardData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive"
      });
    }
  };

  const toggleDeviceBlock = async (deviceId: string, currentBlockStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ is_blocked: !currentBlockStatus })
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: currentBlockStatus ? "Device Unblocked" : "Device Blocked",
        description: `Device has been ${currentBlockStatus ? 'unblocked' : 'blocked'} successfully`,
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error toggling device block:', error);
      toast({
        title: "Error",
        description: "Failed to update device status",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CypherGuard Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Demo Button */}
        <DemoButton />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.onlineDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Devices</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.blockedDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="devices">Device Management</TabsTrigger>
            <TabsTrigger value="dns">DNS Logs</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            {/* Add Device Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Device</CardTitle>
                <CardDescription>Register a new device for monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={addDevice} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="ip_address">IP Address</Label>
                    <Input id="ip_address" name="ip_address" placeholder="192.168.1.1" required />
                  </div>
                  <div>
                    <Label htmlFor="mac_address">MAC Address</Label>
                    <Input id="mac_address" name="mac_address" placeholder="AA:BB:CC:DD:EE:FF" />
                  </div>
                  <div>
                    <Label htmlFor="hostname">Hostname</Label>
                    <Input id="hostname" name="hostname" placeholder="device-name" />
                  </div>
                  <div>
                    <Label htmlFor="device_type">Device Type</Label>
                    <Input id="device_type" name="device_type" placeholder="laptop" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">Add Device</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Devices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monitored Devices</CardTitle>
                <CardDescription>All devices currently being monitored</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-mono">{String(device.ip_address)}</TableCell>
                        <TableCell>{device.hostname || 'Unknown'}</TableCell>
                        <TableCell>{device.device_type}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={device.is_online ? 'default' : 'secondary'}>
                              {device.is_online ? 'Online' : 'Offline'}
                            </Badge>
                            {device.is_blocked && (
                              <Badge variant="destructive">Blocked</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(device.last_seen).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={device.is_blocked ? "outline" : "destructive"}
                            onClick={() => toggleDeviceBlock(device.id, device.is_blocked)}
                          >
                            {device.is_blocked ? 'Unblock' : 'Block'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DNS Query Logs</CardTitle>
                <CardDescription>Recent DNS queries from monitored devices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Query Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dnsLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            {log.domain}
                          </div>
                        </TableCell>
                        <TableCell>{log.query_type}</TableCell>
                        <TableCell>
                          <Badge variant={log.is_blocked ? 'destructive' : 'default'}>
                            {log.is_blocked ? 'Blocked' : 'Allowed'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Recent security events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{alert.alert_type}</Badge>
                        {alert.is_resolved && (
                          <Badge variant="default">Resolved</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;