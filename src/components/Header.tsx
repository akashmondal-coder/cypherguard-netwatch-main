import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = ["Features", "Monitoring", "Security", "Contact"];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center neon-glow">
              <Shield className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-cyber font-bold text-foreground">CypherGuard</h1>
              <p className="text-xs text-muted-foreground font-mono">NETWORK</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-neon transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* CTA Buttons / User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground neon-glow-soft hover:neon-glow transition-all duration-300" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:neon-glow-soft">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.user_metadata?.full_name || user.email || 'User'}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="text-muted-foreground hover:text-primary" asChild>
                  <a href="/auth">Sign In</a>
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground neon-glow-soft hover:neon-glow transition-all duration-300" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="space-y-2 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 p-2 border border-border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.user_metadata?.full_name || user.email || 'User'}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full" asChild>
                      <a href="/dashboard">Dashboard</a>
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <a href="/auth">Sign In</a>
                    </Button>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full" asChild>
                      <a href="/dashboard">Dashboard</a>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;