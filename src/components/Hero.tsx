import { Button } from "@/components/ui/button";
import { Shield, Eye, Activity } from "lucide-react";
import heroImage from "@/assets/hero-network-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-background/80"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl float-animation"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl float-animation" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-neon-cyan/10 rounded-full blur-lg float-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full text-sm text-muted-foreground mb-8 neon-glow-soft">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Advanced Network Monitoring Solution
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-cyber font-black text-foreground mb-6 leading-tight">
            <span className="bg-gradient-neon bg-clip-text text-transparent">CypherGuard</span>
            <br />
            <span className="text-3xl md:text-5xl font-normal">Network Security</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional network monitoring with real-time device tracking, DNS logging, 
            and automated security enforcement. Protect your network with enterprise-grade monitoring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-neon text-background font-semibold px-8 py-6 text-lg hover-glow hover-scale"
              asChild
            >
              <a href="/dashboard">
                Start Monitoring
                <Activity className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg neon-glow-soft hover:neon-glow transition-all duration-300"
              asChild
            >
              <a href="#monitoring">
                Learn More
                <Eye className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Real-time Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">100%</div>
              <div className="text-muted-foreground">Network Visibility</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-muted-foreground">Device Tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;