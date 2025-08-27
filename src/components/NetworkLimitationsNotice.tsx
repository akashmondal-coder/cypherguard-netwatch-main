import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Shield, Network } from "lucide-react";

interface NetworkLimitationsNoticeProps {
  feature: 'dns' | 'discovery' | 'monitoring';
}

const NetworkLimitationsNotice = ({ feature }: NetworkLimitationsNoticeProps) => {
  const getFeatureInfo = () => {
    switch (feature) {
      case 'dns':
        return {
          title: "DNS Query Logging Limitations",
          description: "Web browsers cannot access real DNS queries from other devices on your network for security reasons. This feature shows simulated data for demonstration. In a real network environment, this would require:",
          requirements: [
            "Router-level DNS logging configuration",
            "Network administrator access",
            "Integration with your DNS server or gateway",
            "Dedicated network monitoring hardware/software"
          ]
        };
      case 'discovery':
        return {
          title: "Device Discovery Limitations", 
          description: "Web applications cannot scan local networks due to browser security restrictions. Real device discovery requires:",
          requirements: [
            "Network scanning tools with elevated permissions",
            "Access to network router/gateway",
            "SNMP or similar network protocols",
            "Desktop application or mobile app with special permissions"
          ]
        };
      case 'monitoring':
        return {
          title: "Real-time Network Monitoring Limitations",
          description: "Browser-based network monitoring is limited by security policies. Professional monitoring requires:",
          requirements: [
            "Network infrastructure access",
            "SNMP monitoring protocols", 
            "Router/switch administrative access",
            "Dedicated monitoring appliances or software"
          ]
        };
      default:
        return {
          title: "Network Feature Limitations",
          description: "This feature has certain limitations in web environments.",
          requirements: []
        };
    }
  };

  const { title, description, requirements } = getFeatureInfo();

  return (
    <Alert className="mb-6 border-orange-500/20 bg-orange-500/5">
      <Info className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-500">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {requirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Professional Implementation Requirements:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center space-x-2 p-3 bg-background/50 rounded-lg border border-border/50">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            <strong>Demo Mode:</strong> This application demonstrates the UI and simulates data. 
            For production use, integration with network infrastructure is required.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NetworkLimitationsNotice;