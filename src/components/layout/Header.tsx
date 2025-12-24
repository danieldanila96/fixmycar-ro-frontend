import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Car, User, LogOut, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'garage' | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) {
        setUserType(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserType(data.user_type as 'customer' | 'garage');
      }
    };

    fetchUserType();
  }, [user]);

  const navLinks = [
    { href: "/", label: "Acasă" },
    { href: "#cum-functioneaza", label: "Cum funcționează" },
    { href: "#pentru-garaje", label: "Pentru Garaje" },
    { href: "#contact", label: "Contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    return userType === 'garage' ? '/service' : '/contul-meu';
  };

  const getDashboardLabel = () => {
    return userType === 'garage' ? 'Portal Service' : 'Dashboard';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            FixMyCar<span className="text-accent">.ro</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {userType === 'garage' ? <Wrench className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  Contul meu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                  {userType === 'garage' ? <Wrench className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                  {getDashboardLabel()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Deconectare
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/autentificare')}>
              Autentificare
            </Button>
          )}
          {(!user || userType === 'customer') && (
            <Button variant="accent" size="sm" onClick={() => navigate("/cerere")}>
              Solicită Oferte
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              {user ? (
                <>
                  <Button variant="outline" className="w-full" onClick={() => { setIsMenuOpen(false); navigate(getDashboardPath()); }}>
                    {userType === 'garage' ? <Wrench className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                    {getDashboardLabel()}
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => { setIsMenuOpen(false); handleSignOut(); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Deconectare
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => { setIsMenuOpen(false); navigate('/autentificare'); }}>
                  Autentificare
                </Button>
              )}
              {(!user || userType === 'customer') && (
                <Button variant="accent" className="w-full" onClick={() => { setIsMenuOpen(false); navigate("/cerere"); }}>
                  Solicită Oferte
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
