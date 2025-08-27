import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wifi, Monitor, Smartphone, Laptop, Router, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NetworkLimitationsNotice from '@/components/NetworkLimitationsNotice';

interface Device {
  id: string;
  ip_address: string;
  mac_address: string;
  hostname: string;
  device_type: string;
  is_online: boolean;
  is_blocked: boolean;
  last_seen: string;
  created_at: string;
}

const DeviceDiscovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchDevices();
    startRealTimeMonitoring();
  }, [user]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setDevices((data as any[])?.map(d => ({ ...d, ip_address: d.ip_address as string, mac_address: d.mac_address as string, hostname: d.hostname as string })) || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeMonitoring = () => {
    // Subscribe to device changes
    const subscription = supabase
      .channel('devices-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const scanNetwork = async () => {
    setScanning(true);
    
    try {
      // Simulate network scanning by adding discovered devices
      const mockDevices = [
        {
          ip_address: '192.168.1.100',
          mac_address: generateMacAddress(),
          hostname: 'laptop-user',
          device_type: 'laptop'
        },
        {
          ip_address: '192.168.1.101',
          mac_address: generateMacAddress(),
          hostname: 'smartphone-android',
          device_type: 'mobile'
        },
        {
          ip_address: '192.168.1.102',
          mac_address: generateMacAddress(),
          hostname: 'smart-tv',
          device_type: 'tv'
        },
        {
          ip_address: '192.168.1.1',
          mac_address: generateMacAddress(),
          hostname: 'router-home',
          device_type: 'router'
        }
      ];

      for (const device of mockDevices) {
        // Check if device already exists
        const { data: existing } = await supabase
          .from('devices')
          .select('id')
          .eq('user_id', user?.id)
          .eq('ip_address', device.ip_address)
          .single();

        if (!existing) {
          await supabase.from('devices').insert({
            user_id: user?.id,
            ...device,
            is_online: Math.random() > 0.3,
            is_blocked: false
          });
        } else {
          // Update existing device status
          await supabase
            .from('devices')
            .update({ 
              is_online: Math.random() > 0.3,
              last_seen: new Date().toISOString()
            })
            .eq('id', existing.id);
        }
      }

      toast({
        title: "Network Scan Complete",
        description: `Discovered ${mockDevices.length} devices on the network`,
      });

    } catch (error) {
      console.error('Error scanning network:', error);
      toast({
        title: "Scan Error",
        description: "Failed to scan network. Please try again.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const generateMacAddress = () => {
    return Array.from({length: 6}, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();
  };

  const toggleDeviceBlock = async (deviceId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ is_blocked: !currentBlocked })
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: currentBlocked ? "Device Unblocked" : "Device Blocked",
        description: `Device has been ${currentBlocked ? 'unblocked' : 'blocked'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling device block:', error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'laptop':
        return <Laptop className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'router':
        return <Router className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Discovering network devices...</div>
      </div>
    );
  }

  const onlineDevices = devices.filter(d => d.is_online).length;
  const blockedDevices = devices.filter(d => d.is_blocked).length;

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
              <h1 className="text-3xl font-cyber font-bold text-foreground">Device Discovery</h1>
              <p className="text-muted-foreground">Automatically detect and monitor network devices</p>
            </div>
          </div>
          <Button 
            onClick={scanNetwork} 
            disabled={scanning}
            className="flex items-center space-x-2"
          >
            <Scan className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Scan Network'}</span>
          </Button>
        </div>

        {/* Limitations Notice */}
        <NetworkLimitationsNotice feature="discovery" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {devices.length - onlineDevices}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Devices</CardTitle>
              <Monitor className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{blockedDevices}</div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Discovered Network Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="flex items-center space-x-2">
                      {getDeviceIcon(device.device_type)}
                      <span className="capitalize">{device.device_type}</span>
                    </TableCell>
                    <TableCell className="font-mono">{device.ip_address}</TableCell>
                    <TableCell className="font-mono text-sm">{device.mac_address}</TableCell>
                    <TableCell>{device.hostname}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Badge variant={device.is_online ? "default" : "secondary"}>
                          {device.is_online ? "Online" : "Offline"}
                        </Badge>
                        {device.is_blocked && (
                          <Badge variant="destructive">Blocked</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(device.last_seen)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={device.is_blocked ? "default" : "destructive"}
                        size="sm"
                        onClick={() => toggleDeviceBlock(device.id, device.is_blocked)}
                      >
                        {device.is_blocked ? "Unblock" : "Block"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {devices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No devices discovered yet. Click "Scan Network" to find devices on your network.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceDiscovery;