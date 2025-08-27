import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, AlertTriangle, Zap, Download, FileText } from "lucide-react";
import securityIcon from "@/assets/security-icon.jpg";

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "IP & Domain Blocking",
      description: "Instantly block malicious IPs and domains",
      action: "Configure Rules"
    },
    {
      icon: Lock,
      title: "Remote Device Control",
      description: "Shutdown or lock compromised devices",
      action: "Manage Devices"
    },
    {
      icon: AlertTriangle,
      title: "Threat Detection",
      description: "AI-powered anomaly detection system",
      action: "View Alerts"
    },
    {
      icon: Zap,
      title: "Automated Response",
      description: "Instant security policy enforcement",
      action: "Setup Automation"
    }
  ];

  return (
    <section id="security" className="py-20 bg-card/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Security Visualization */}
          <div className="relative">
            <div className="cyber-bg rounded-2xl p-8 text-center">
              <div className="relative z-10">
                <img 
                  src={securityIcon} 
                  alt="Security Shield" 
                  className="w-32 h-32 mx-auto mb-6 rounded-full neon-glow"
                />
                <h3 className="text-2xl font-cyber font-bold text-foreground mb-4">
                  Multi-Layer Protection
                </h3>
                <p className="text-muted-foreground mb-6">
                  Advanced security protocols protecting your network infrastructure
                </p>
                
                {/* Security Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">99.9%</div>
                      <div className="text-sm text-muted-foreground">Threat Detection</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/10 border-accent/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-accent mb-1">&lt;1s</div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <Badge variant="outline" className="border-accent text-accent mb-6 neon-glow-soft">
              Enterprise Security
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-foreground mb-6">
              Automated <span className="bg-gradient-neon bg-clip-text text-transparent">Security</span> Response
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Protect your network with intelligent security automation. CypherGuard responds to threats 
              in real-time, enforcing policies and maintaining network integrity without manual intervention.
            </p>

            {/* Security Features */}
            <div className="space-y-4 mb-8">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="bg-card/30 border-border hover:border-primary/50 transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-background/50 rounded-lg flex items-center justify-center text-primary group-hover:neon-glow-soft transition-all duration-300">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                              {feature.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          {feature.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-neon text-background font-semibold hover-glow hover-scale">
                <Download className="w-4 h-4 mr-2" />
                Download CypherGuard
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;