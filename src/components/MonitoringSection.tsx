import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Server, Database, BarChart3 } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const MonitoringSection = () => {
  const capabilities = [
    {
      icon: Monitor,
      title: "Live Dashboard",
      description: "Real-time visualization of network activity"
    },
    {
      icon: Server,
      title: "Device Management",
      description: "Complete control over connected devices"
    },
    {
      icon: Database,
      title: "Data Logging",
      description: "Comprehensive logs stored in SQLite"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Detailed reports and export capabilities"
    }
  ];

  return (
    <section id="monitoring" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <Badge variant="outline" className="border-primary text-primary mb-6 neon-glow-soft">
              Network Intelligence
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-foreground mb-6">
              Advanced <span className="bg-gradient-neon bg-clip-text text-transparent">Monitoring</span> Platform
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Get complete visibility into your network with our comprehensive monitoring solution. 
              Track devices, analyze traffic patterns, and maintain security with enterprise-grade tools.
            </p>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {capabilities.map((capability, index) => {
                const IconComponent = capability.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center text-primary group-hover:neon-glow-soft transition-all duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                        {capability.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Technical Specs */}
            <div className="mt-8 p-6 bg-card/30 rounded-lg border border-border">
              <h4 className="font-cyber font-semibold text-foreground mb-4">Technical Specifications</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="text-foreground font-mono">Linux/Windows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port:</span>
                  <span className="text-foreground font-mono">5000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="text-foreground font-mono">SQLite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="text-foreground font-mono">Flask</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <Card className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 neon-glow-soft hover:neon-glow">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={dashboardImage} 
                    alt="CypherGuard Dashboard Preview" 
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-muted-foreground">Live Status</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full pulse-glow"></div>
                          <span className="text-sm text-foreground">Monitoring Active</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">24</div>
                          <div className="text-xs text-muted-foreground">Devices</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">1.2k</div>
                          <div className="text-xs text-muted-foreground">Queries</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">0</div>
                          <div className="text-xs text-muted-foreground">Threats</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonitoringSection;