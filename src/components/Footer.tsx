import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { TikTok } from "@/components/ui/TikTok";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
                {/* Circular Logo */}
                <Link
                    to="/"
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-accent"
                >
                    <img
                    src="/logo192.png"
                    alt="Frisør Nærum Logo"
                    className="w-full h-full object-cover"
                    />
                </Link>

                {/* Brand Name */}
                <h3 className="text-xl font-bold">{t.brandName || "Frisør Nærum"}</h3>
                </div>


            <p className="text-primary-foreground/80 mb-6">
              {t.professionalBarbershopFooter || "Din lokale professionelle frisør i Nærum. Kvalitet, tradition og moderne stil."}
            </p>
              <div className="w-full flex justify-between items-center text-sm px-2 md:px-4">
            
            

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

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t.quickLinks || "Hurtige Links"}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t.home || "Hjem"}
                </a>
              </li>
              <li>
                <a href="services" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t.services || "Tjenester"}
                </a>
              </li>
              <li>
                <a href="about" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t.aboutUs || "Om Os"}
                </a>
              </li>
              <li>
                <a href="contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t.contact || "Kontakt"}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info + Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t.contactInfo || "Kontakt Info"}</h4>
            <div className="space-y-3 text-primary-foreground/80 text-sm">
             {/* Address */}
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-accent" />
                  <a
                    href="https://maps.app.goo.gl/dnxDTh4eBf29qTXx8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-primary-glow transition-colors"
                  >
                    {t.address || "Nærum Hovedgade 52, 2850 Nærum"}
                  </a>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-accent" />
                  <a
                    href="tel:+4528446749"
                    className="hover:underline hover:text-primary-glow transition-colors"
                  >
                    {t.phone || "+45 28 44 67 49"}
                  </a>
                </div>


              {/* Opening Hours */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-accent" />
                <div className="flex flex-col">
                  <span>{t.mondayFriday || "Man-Fre"}: 09:00 - 18:00</span>
                  <span>{t.saturday || "Lør"}: 09:00 - 16:00</span>
                  <span>{t.sunday || "Søn"}: {t.closed || "Lukket"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2025 {t.brandName || "Frisør Nærum"}. {t.allRightsReserved || "Alle rettigheder forbeholdt."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
