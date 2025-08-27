import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkMonitoring } from "@/hooks/useNetworkMonitoring";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Play } from "lucide-react";

const DemoButton = () => {
  const { user } = useAuth();
  const { simulateNetworkActivity, stats } = useNetworkMonitoring();

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Demo Mode
        </CardTitle>
        <CardDescription>
          Generate sample network activity to test the monitoring system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-primary">{stats.devicesOnline}</div>
            <div className="text-muted-foreground">Devices Online</div>
          </div>
          <div>
            <div className="font-semibold text-accent">{stats.recentAlerts}</div>
            <div className="text-muted-foreground">Recent Alerts</div>
          </div>
          <div>
            <div className="font-semibold text-destructive">{stats.blockedQueries}</div>
            <div className="text-muted-foreground">Blocked Queries</div>
          </div>
          <div>
            <div className="font-semibold text-muted-foreground">{stats.devicesOffline}</div>
            <div className="text-muted-foreground">Offline Devices</div>
          </div>
        </div>
        
        <Button 
          onClick={simulateNetworkActivity} 
          className="w-full"
          variant="outline"
        >
          <Play className="h-4 w-4 mr-2" />
          Generate Demo Data
        </Button>
      </CardContent>
    </Card>
  );
};

export default DemoButton;