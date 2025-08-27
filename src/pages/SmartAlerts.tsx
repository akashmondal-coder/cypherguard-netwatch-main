import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  device_hostname?: string;
}

interface AlertSettings {
  maliciousWebsites: boolean;
  adultContent: boolean;
  suspiciousActivity: boolean;
  newDevices: boolean;
  failedLogins: boolean;
  highBandwidth: boolean;
  policyViolations: boolean;
  systemErrors: boolean;
}

const SmartAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    maliciousWebsites: true,
    adultContent: true,
    suspiciousActivity: true,
    newDevices: true,
    failedLogins: true,
    highBandwidth: false,
    policyViolations: true,
    systemErrors: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchAlerts();
    startRealTimeAlerts();
    simulateAlertGeneration();
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select(`
          *,
          devices(hostname)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const alertsWithDeviceInfo = data?.map(alert => ({
        ...alert,
        severity: alert.severity as 'low' | 'medium' | 'high',
        device_hostname: alert.devices?.hostname as string
      })) || [];
      
      setAlerts(alertsWithDeviceInfo);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeAlerts = () => {
    // Subscribe to new alerts
    const subscription = supabase
      .channel('security-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_alerts',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        const newAlert = payload.new as SecurityAlert;
        
        // Show real-time notification
        toast({
          title: `${newAlert.severity.toUpperCase()} SECURITY ALERT`,
          description: newAlert.title,
          variant: newAlert.severity === 'high' ? 'destructive' : 'default'
        });
        
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const simulateAlertGeneration = () => {
    // Simulate various types of alerts for demonstration
    const interval = setInterval(async () => {
      if (!user || Math.random() > 0.3) return; // 30% chance every 15 seconds

      const alertTypes = [
        {
          type: 'malicious_website',
          title: 'Malicious Website Blocked',
          description: 'Attempted access to known malicious domain',
          severity: 'high',
          setting: 'maliciousWebsites'
        },
        {
          type: 'adult_content',
          title: 'Adult Content Blocked',
          description: 'Access to adult content was blocked',
          severity: 'medium',
          setting: 'adultContent'
        },
        {
          type: 'new_device',
          title: 'New Device Detected',
          description: 'Unknown device connected to network',
          severity: 'low',
          setting: 'newDevices'
        },
        {
          type: 'suspicious_activity',
          title: 'Suspicious Network Activity',
          description: 'Unusual traffic patterns detected',
          severity: 'high',
          setting: 'suspiciousActivity'
        },
        {
          type: 'policy_violation',
          title: 'Security Policy Violation',
          description: 'Device attempted to bypass security rules',
          severity: 'medium',
          setting: 'policyViolations'
        },
        {
          type: 'bandwidth_alert',
          title: 'High Bandwidth Usage',
          description: 'Unusually high bandwidth consumption detected',
          severity: 'low',
          setting: 'highBandwidth'
        }
      ];

      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      // Check if this type of alert is enabled
      const settingKey = alertType.setting as keyof AlertSettings;
      if (!alertSettings[settingKey]) return;

      try {
        await supabase.from('security_alerts').insert({
          user_id: user.id,
          alert_type: alertType.type,
          title: alertType.title,
          description: alertType.description,
          severity: alertType.severity
        });
      } catch (error) {
        console.error('Error creating simulated alert:', error);
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const unresolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          is_resolved: false,
          resolved_at: null
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Reopened",
        description: "Alert has been reopened",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error reopening alert:', error);
    }
  };

  const toggleAlertSetting = (setting: keyof AlertSettings) => {
    setAlertSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Shield className="w-4 h-4" />;
      case 'low': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading smart alerts...</div>
      </div>
    );
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.is_resolved);
  const resolvedAlerts = alerts.filter(alert => alert.is_resolved);

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
              <h1 className="text-3xl font-cyber font-bold text-foreground">Smart Alerts</h1>
              <p className="text-muted-foreground">Real-time security notifications and threat alerts</p>
            </div>
          </div>
          <Badge variant="default" className="flex items-center space-x-1">
            <Bell className="w-3 h-3 animate-pulse" />
            <span>Monitoring Active</span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{unresolvedAlerts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {alerts.filter(alert => alert.severity === 'high').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="malicious">Malicious Websites</Label>
                  <Switch 
                    id="malicious"
                    checked={alertSettings.maliciousWebsites}
                    onCheckedChange={() => toggleAlertSetting('maliciousWebsites')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="adult">Adult Content</Label>
                  <Switch 
                    id="adult"
                    checked={alertSettings.adultContent}
                    onCheckedChange={() => toggleAlertSetting('adultContent')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="suspicious">Suspicious Activity</Label>
                  <Switch 
                    id="suspicious"
                    checked={alertSettings.suspiciousActivity}
                    onCheckedChange={() => toggleAlertSetting('suspiciousActivity')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="devices">New Devices</Label>
                  <Switch 
                    id="devices"
                    checked={alertSettings.newDevices}
                    onCheckedChange={() => toggleAlertSetting('newDevices')}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="logins">Failed Logins</Label>
                  <Switch 
                    id="logins"
                    checked={alertSettings.failedLogins}
                    onCheckedChange={() => toggleAlertSetting('failedLogins')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bandwidth">High Bandwidth</Label>
                  <Switch 
                    id="bandwidth"
                    checked={alertSettings.highBandwidth}
                    onCheckedChange={() => toggleAlertSetting('highBandwidth')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="policy">Policy Violations</Label>
                  <Switch 
                    id="policy"
                    checked={alertSettings.policyViolations}
                    onCheckedChange={() => toggleAlertSetting('policyViolations')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="errors">System Errors</Label>
                  <Switch 
                    id="errors"
                    checked={alertSettings.systemErrors}
                    onCheckedChange={() => toggleAlertSetting('systemErrors')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Active Alerts</span>
              <Badge variant="destructive">{unresolvedAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unresolvedAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {alert.alert_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg">{alert.title}</h4>
                      <p className="text-muted-foreground">{alert.description}</p>
                      {alert.device_hostname && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Device: {alert.device_hostname}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(alert.created_at)}
                      </p>
                    </div>
                    <Button
                      onClick={() => resolveAlert(alert.id)}
                      size="sm"
                      className="ml-4"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
              {unresolvedAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No active alerts. Your network is secure!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Resolved Alerts</span>
                <Badge variant="secondary">{resolvedAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resolvedAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-3 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Badge variant="outline" className="text-xs">
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <h5 className="font-medium">{alert.title}</h5>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Resolved: {alert.resolved_at ? formatTimestamp(alert.resolved_at) : 'Unknown'}
                        </p>
                      </div>
                      <Button
                        onClick={() => unresolveAlert(alert.id)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reopen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartAlerts;