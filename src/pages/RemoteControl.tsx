import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Power, Lock, Shield, AlertTriangle, Monitor, Smartphone, Laptop, Router } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  ip_address: string;
  mac_address: string;
  hostname: string;
  device_type: string;
  is_online: boolean;
  is_blocked: boolean;
  last_seen: string;
  remote_status: 'normal' | 'locked' | 'shutdown' | 'quarantined';
}

interface RemoteAction {
  id: string;
  device_id: string;
  action_type: 'shutdown' | 'lock' | 'quarantine' | 'unblock';
  status: 'pending' | 'completed' | 'failed';
  reason: string;
  executed_at?: string;
  created_at: string;
}

const RemoteControl = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [remoteActions, setRemoteActions] = useState<RemoteAction[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [actionType, setActionType] = useState<'shutdown' | 'lock' | 'quarantine'>('lock');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchDevices();
    fetchRemoteActions();
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
      
      // Add remote_status to devices (simulated)
      const devicesWithStatus = data?.map(device => ({
        ...device,
        ip_address: device.ip_address as string,
        mac_address: device.mac_address as string,
        hostname: device.hostname as string,
        remote_status: device.is_blocked ? 'quarantined' as const : 'normal' as const
      })) || [];
      
      setDevices(devicesWithStatus);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemoteActions = async () => {
    try {
      // Simulate remote actions from activity logs
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user?.id)
        .in('activity_type', ['remote_shutdown', 'remote_lock', 'device_quarantine'])
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const actionsData = data?.map(log => ({
        id: log.id,
        device_id: log.device_id || '',
        action_type: log.activity_type.replace('remote_', '').replace('device_', '') as any,
        status: 'completed' as const,
        reason: log.description,
        executed_at: log.timestamp,
        created_at: log.timestamp
      })) || [];
      
      setRemoteActions(actionsData);
    } catch (error) {
      console.error('Error fetching remote actions:', error);
    }
  };

  const startRealTimeMonitoring = () => {
    // Subscribe to device changes
    const subscription = supabase
      .channel('remote-control-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchDevices();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_logs',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchRemoteActions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const executeRemoteAction = async (device: Device, action: 'shutdown' | 'lock' | 'quarantine', reason: string) => {
    try {
      // Log the remote action
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        device_id: device.id,
        activity_type: action === 'quarantine' ? 'device_quarantine' : `remote_${action}`,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} executed on ${device.hostname} - ${reason}`,
        severity: 'warning',
        metadata: {
          device_ip: device.ip_address,
          device_hostname: device.hostname,
          action_reason: reason
        }
      });

      // Update device status if quarantining
      if (action === 'quarantine') {
        await supabase
          .from('devices')
          .update({ is_blocked: true })
          .eq('id', device.id);
      }

      // Create security alert
      await supabase.from('security_alerts').insert({
        user_id: user?.id,
        device_id: device.id,
        alert_type: 'remote_control',
        title: `Remote ${action.charAt(0).toUpperCase() + action.slice(1)} Executed`,
        description: `Device ${device.hostname} has been remotely ${action}ed due to: ${reason}`,
        severity: action === 'shutdown' ? 'high' : 'medium'
      });

      toast({
        title: "Remote Action Executed",
        description: `${device.hostname} has been ${action}ed successfully`,
        variant: action === 'shutdown' ? 'destructive' : 'default'
      });

      fetchDevices();
      fetchRemoteActions();
      setSelectedDevice(null);
    } catch (error) {
      console.error('Error executing remote action:', error);
      toast({
        title: "Action Failed",
        description: "Failed to execute remote action. Please try again.",
        variant: "destructive"
      });
    }
  };

  const restoreDevice = async (device: Device) => {
    try {
      await supabase
        .from('devices')
        .update({ is_blocked: false })
        .eq('id', device.id);

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        device_id: device.id,
        activity_type: 'device_restore',
        description: `Device ${device.hostname} has been restored to normal operation`,
        severity: 'info'
      });

      toast({
        title: "Device Restored",
        description: `${device.hostname} has been restored to normal operation`,
      });

      fetchDevices();
    } catch (error) {
      console.error('Error restoring device:', error);
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

  const getStatusBadge = (device: Device) => {
    if (!device.is_online) {
      return <Badge variant="secondary">Offline</Badge>;
    }
    if (device.is_blocked) {
      return <Badge variant="destructive">Quarantined</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading remote control panel...</div>
      </div>
    );
  }

  const onlineDevices = devices.filter(d => d.is_online).length;
  const quarantinedDevices = devices.filter(d => d.is_blocked).length;
  const pendingActions = remoteActions.filter(a => a.status === 'pending').length;

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
              <h1 className="text-3xl font-cyber font-bold text-foreground">Remote Control</h1>
              <p className="text-muted-foreground">Remotely control and secure compromised devices</p>
            </div>
          </div>
          <Badge variant="destructive" className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Emergency Controls</span>
          </Badge>
        </div>

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
              <Power className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
              <Lock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{quarantinedDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingActions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Device Control Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
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
                    <TableCell>{device.hostname}</TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(device.last_seen)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {device.is_blocked ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => restoreDevice(device)}
                          >
                            Restore
                          </Button>
                        ) : device.is_online ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setSelectedDevice(device)}
                                >
                                  <Lock className="w-4 h-4 mr-1" />
                                  Control
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Remote Control Actions</DialogTitle>
                                  <DialogDescription>
                                    Execute remote control actions on {selectedDevice?.hostname}. 
                                    Use these controls only in emergency situations.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <Button
                                      variant={actionType === 'lock' ? 'default' : 'outline'}
                                      onClick={() => setActionType('lock')}
                                      className="h-20 flex-col"
                                    >
                                      <Lock className="w-6 h-6 mb-2" />
                                      Lock Device
                                    </Button>
                                    <Button
                                      variant={actionType === 'quarantine' ? 'default' : 'outline'}
                                      onClick={() => setActionType('quarantine')}
                                      className="h-20 flex-col"
                                    >
                                      <Shield className="w-6 h-6 mb-2" />
                                      Quarantine
                                    </Button>
                                    <Button
                                      variant={actionType === 'shutdown' ? 'destructive' : 'outline'}
                                      onClick={() => setActionType('shutdown')}
                                      className="h-20 flex-col"
                                    >
                                      <Power className="w-6 h-6 mb-2" />
                                      Shutdown
                                    </Button>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedDevice(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (selectedDevice) {
                                        const reason = actionType === 'shutdown' 
                                          ? 'Emergency security response' 
                                          : actionType === 'lock' 
                                            ? 'Suspicious activity detected'
                                            : 'Device compromised - quarantined for investigation';
                                        executeRemoteAction(selectedDevice, actionType, reason);
                                      }
                                    }}
                                  >
                                    Execute {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {devices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No devices available for remote control.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Remote Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {remoteActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={action.action_type === 'shutdown' ? 'destructive' : 'secondary'}>
                        {action.action_type.toUpperCase()}
                      </Badge>
                      <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                        {action.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="font-medium">{action.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      Device ID: {action.device_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatTimestamp(action.created_at)}
                  </div>
                </div>
              ))}
            </div>
            {remoteActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No remote actions executed yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RemoteControl;