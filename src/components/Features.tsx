import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Activity, Eye, Wifi, Lock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Features = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Eye,
      title: "DNS Query Logging",
      description: "Track and log all DNS queries to monitor visited sites and detect suspicious activity in real-time.",
      color: "text-primary",
      link: "/dns-logging"
    },
    {
      icon: Wifi,
      title: "Device Discovery",
      description: "Automatically detect and monitor all connected devices with IP, MAC, and hostname identification.",
      color: "text-accent",
      link: "/device-discovery"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Continuous monitoring of device activity, online/offline status, and network performance metrics.",
      color: "text-primary",
      link: "/real-time-monitoring"
    },
    {
      icon: Shield,
      title: "Automated Blocking",
      description: "Instantly block suspicious IPs, domains, or devices with customizable security rules and policies.",
      color: "text-accent",
      link: "/automated-blocking"
    },
    {
      icon: Lock,
      title: "Remote Control",
      description: "Remotely shutdown or lock compromised devices to prevent unauthorized access and data breaches.",
      color: "text-primary",
      link: "/remote-control"
    },
    {
      icon: AlertTriangle,
      title: "Smart Alerts",
      description: "Receive instant notifications and warnings for security threats, policy violations, and anomalies.",
      color: "text-accent",
      link: "/smart-alerts"
    }
  ];

  return (
    <section id="features" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-cyber font-bold text-foreground mb-6">
            Powerful <span className="bg-gradient-neon bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced network monitoring capabilities designed for professional cybersecurity teams and IT administrators.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover-glow group cursor-pointer"
                onClick={() => navigate(feature.link)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-background/50 flex items-center justify-center ${feature.color} group-hover:neon-glow-soft transition-all duration-300`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-cyber text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-neon rounded-full text-background font-semibold hover-scale cursor-pointer">
            Explore All Features
            <Shield className="w-5 h-5 ml-2" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;