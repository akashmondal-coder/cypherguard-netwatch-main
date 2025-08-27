import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Shield, Ban, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface BlockedDomain {
  id: string;
  domain: string;
  reason: string;
  is_active: boolean;
  created_at: string;
}

interface BlockingRule {
  id: string;
  name: string;
  type: 'domain' | 'ip' | 'category';
  pattern: string;
  action: 'block' | 'allow' | 'log';
  is_active: boolean;
  description: string;
}

const AutomatedBlocking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>([]);
  const [blockingRules, setBlockingRules] = useState<BlockingRule[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newReason, setNewReason] = useState('');
  const [autoBlockMalicious, setAutoBlockMalicious] = useState(true);
  const [autoBlockAdult, setAutoBlockAdult] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchBlockedDomains();
    initializeBlockingRules();
    startAutomatedBlocking();
  }, [user]);

  const fetchBlockedDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_domains')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlockedDomains(data || []);
    } catch (error) {
      console.error('Error fetching blocked domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeBlockingRules = () => {
    // Initialize predefined blocking rules
    const defaultRules: BlockingRule[] = [
      {
        id: '1',
        name: 'Malicious Domains',
        type: 'category',
        pattern: '(malicious|phishing|scam|fraud)',
        action: 'block',
        is_active: autoBlockMalicious,
        description: 'Automatically block known malicious domains'
      },
      {
        id: '2',
        name: 'Adult Content',
        type: 'category',
        pattern: '(adult|xxx|porn|18+)',
        action: 'block',
        is_active: autoBlockAdult,
        description: 'Block adult and inappropriate content'
      },
      {
        id: '3',
        name: 'Social Media',
        type: 'domain',
        pattern: '(facebook|twitter|instagram|tiktok)',
        action: 'log',
        is_active: false,
        description: 'Monitor social media access'
      },
      {
        id: '4',
        name: 'Suspicious IPs',
        type: 'ip',
        pattern: '(tor|vpn|proxy)',
        action: 'block',
        is_active: true,
        description: 'Block connections from suspicious IP ranges'
      }
    ];
    
    setBlockingRules(defaultRules);
  };

  const startAutomatedBlocking = () => {
    // Subscribe to DNS logs for real-time blocking
    const subscription = supabase
      .channel('dns-blocking')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dns_logs',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        const dnsLog = payload.new as any;
        checkAndBlockDomain(dnsLog.domain);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const checkAndBlockDomain = async (domain: string) => {
    // Check against blocking rules
    const maliciousPatterns = ['malicious', 'phishing', 'scam', 'fraud', 'evil', 'bad'];
    const adultPatterns = ['adult', 'xxx', 'porn', '18+', 'sex'];
    
    let shouldBlock = false;
    let reason = '';

    if (autoBlockMalicious && maliciousPatterns.some(pattern => domain.includes(pattern))) {
      shouldBlock = true;
      reason = 'Malicious domain detected';
    } else if (autoBlockAdult && adultPatterns.some(pattern => domain.includes(pattern))) {
      shouldBlock = true;
      reason = 'Adult content blocked';
    }

    if (shouldBlock) {
      try {
        // Add to blocked domains
        const { error: blockError } = await supabase
          .from('blocked_domains')
          .insert({
            user_id: user?.id,
            domain,
            reason,
            is_active: true
          });

        if (blockError) throw blockError;

        // Update DNS log to mark as blocked
        await supabase
          .from('dns_logs')
          .update({ is_blocked: true })
          .eq('user_id', user?.id)
          .eq('domain', domain);

        // Create security alert
        await supabase
          .from('security_alerts')
          .insert({
            user_id: user?.id,
            alert_type: 'blocked_domain',
            title: 'Domain Automatically Blocked',
            description: `${domain} was automatically blocked - ${reason}`,
            severity: 'high'
          });

        toast({
          title: "Domain Blocked",
          description: `${domain} has been automatically blocked`,
          variant: "destructive"
        });

        fetchBlockedDomains();
      } catch (error) {
        console.error('Error blocking domain:', error);
      }
    }
  };

  const addBlockedDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain to block",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_domains')
        .insert({
          user_id: user?.id,
          domain: newDomain.trim(),
          reason: newReason.trim() || 'Manually blocked',
          is_active: true
        });

      if (error) throw error;

      setNewDomain('');
      setNewReason('');
      
      toast({
        title: "Domain Blocked",
        description: `${newDomain} has been added to the block list`,
      });

      fetchBlockedDomains();
    } catch (error) {
      console.error('Error adding blocked domain:', error);
      toast({
        title: "Error",
        description: "Failed to block domain",
        variant: "destructive"
      });
    }
  };

  const toggleDomainBlock = async (domainId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('blocked_domains')
        .update({ is_active: !currentActive })
        .eq('id', domainId);

      if (error) throw error;
      
      toast({
        title: currentActive ? "Domain Unblocked" : "Domain Blocked",
        description: `Domain has been ${currentActive ? 'unblocked' : 'blocked'}`,
      });

      fetchBlockedDomains();
    } catch (error) {
      console.error('Error toggling domain block:', error);
    }
  };

  const removeDomain = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
      
      toast({
        title: "Domain Removed",
        description: "Domain has been removed from the block list",
      });

      fetchBlockedDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
    }
  };

  const toggleRule = (ruleId: string) => {
    setBlockingRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: !rule.is_active }
          : rule
      )
    );

    // Update automation settings
    if (ruleId === '1') setAutoBlockMalicious(!autoBlockMalicious);
    if (ruleId === '2') setAutoBlockAdult(!autoBlockAdult);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading blocking configuration...</div>
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
              <h1 className="text-3xl font-cyber font-bold text-foreground">Automated Blocking</h1>
              <p className="text-muted-foreground">Block suspicious domains and IPs automatically</p>
            </div>
          </div>
          <Badge variant="default" className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Protection Active</span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Domains</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{blockedDomains.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {blockingRules.filter(rule => rule.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Today</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {blockedDomains.filter(domain => 
                  new Date(domain.created_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocking Rules */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Automated Blocking Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blockingRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch 
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{rule.type}</Badge>
                          <Badge variant={rule.action === 'block' ? 'destructive' : 'secondary'}>
                            {rule.action}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Pattern: {rule.pattern}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add New Blocked Domain */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Blocked Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="Security threat"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addBlockedDomain} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Block Domain
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Domains Table */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Domains List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Blocked Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>{domain.reason}</TableCell>
                    <TableCell>
                      <Badge variant={domain.is_active ? "destructive" : "secondary"}>
                        {domain.is_active ? "Blocked" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(domain.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant={domain.is_active ? "default" : "destructive"}
                          size="sm"
                          onClick={() => toggleDomainBlock(domain.id, domain.is_active)}
                        >
                          {domain.is_active ? "Unblock" : "Block"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDomain(domain.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {blockedDomains.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No domains blocked yet. Add domains manually or enable automated rules above.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutomatedBlocking;