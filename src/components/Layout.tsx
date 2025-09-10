import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Facebook, Instagram, Phone } from "lucide-react";
import { TikTok } from "@/components/ui/TikTok";
import  Footer  from "./Footer";
import { Outlet } from "react-router-dom";


interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navigation = [
    { name: t.home, href: "/" },
    { name: t.services, href: "/services" },
    { name: t.bookAppointment, href: "/book" },
    { name: t.contact, href: "/contact" },
    { name: t.aboutUs, href: "/about" },
  ];

  return (
    <div className="min-h-screen bg-background">

       {/* Top bar with contact info and social media */}
        <div className="bg-primary text-primary-foreground py-2">
          <div className="w-full flex justify-between items-center text-sm px-2 md:px-4">
            {/* Contact Info */}
            <div className="flex items-center gap-2">
              <a href="tel:+4528446749" className="hover:text-primary-glow transition-colors">
                <Phone className="h-4 w-4" />
              </a>
              <a
                href="https://maps.app.goo.gl/dnxDTh4eBf29qTXx8"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-primary-glow transition-colors"
              >
                NÆRUM HOVEDGADE 52
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61579828196545&mibextid=wwXIfr&rdid=QGr4vSV24B482Qiz&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GzCTzu2cX%2F%3Fmibextid%3DwwXIfr#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-5 w-5 hover:text-primary-glow transition-colors cursor-pointer" />
              </a>
              <a
                href="https://www.instagram.com/barber.shop122/?igsh=MW5hNWg1c2cwejFiZA%3D%3D&utm_source=qr#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5 hover:text-primary-glow transition-colors cursor-pointer" />
              </a>
              <a
                href="https://www.tiktok.com/@barber.shop123"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TikTok className="h-5 w-5 hover:text-primary-glow transition-colors cursor-pointer" />
              </a>
            </div>
          </div>
        </div>



      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo192.png" 
                alt="Frisør Nærum Logo" 
                className="h-10 w-auto" 
              />
              <span className="text-xl font-bold text-foreground">Frisør Nærum</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Language Switcher and Admin Login */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  {t.adminLogin}
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      location.pathname === item.href
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="px-3 py-2">
                  <LanguageSwitcher />
                </div>
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.adminLogin}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      

        <main>
          <Outlet />  {/* 👈 this renders the active page */}
        </main>


      {/* Footer */}
      <Footer />
    </div>
  );
}