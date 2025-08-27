import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Monitoring", href: "#monitoring" },
      { name: "Security", href: "#security" },
      { name: "Documentation", href: "#" }
    ],
    support: [
      { name: "Get Started", href: "#" },
      { name: "Contact", href: "#contact" },
      { name: "FAQ", href: "#" },
      { name: "Status", href: "#" }
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "License", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#contact", label: "Contact" }
  ];

  return (
    <footer className="bg-card/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center neon-glow-soft">
                <Shield className="w-6 h-6 text-background" />
              </div>
              <div>
                <h3 className="text-xl font-cyber font-bold text-foreground">CypherGuard</h3>
                <p className="text-xs text-muted-foreground font-mono">NETWORK</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Professional network monitoring solution with real-time device tracking, 
              DNS logging, and automated security enforcement for enterprise environments.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-background/50 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:neon-glow-soft transition-all duration-300"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {links.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {links.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">
              © {currentYear} CypherGuard Network. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full pulse-glow"></div>
                <span>System Status: Operational</span>
              </span>
              <span className="font-mono">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;