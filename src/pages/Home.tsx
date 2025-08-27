import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, Users, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Services from "./Services";

export default function Home() {
  const { t } = useLanguage();
  
 
  const features = [
    {
      icon: Clock,
      title: t.quickEasyBooking,
      description: t.quickBookingDesc,
    },
    {
      icon: Users,
      title: t.expertBarbers,
      description: t.expertBarbersDesc,
    },
    {
      icon: Star,
      title: t.premiumService,
      description: t.premiumServiceDesc,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent py-30 lg:py-42">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6">
            {t.heroTitle}
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t.bookAppointment}
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t.viewServices}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      


      {/* Services Section */}
      <Services />

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t.whyChooseEliteCuts}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.traditionalExcellence}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-lg">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t.readyForYourNextCut}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t.experienceEliteCuts}
          </p>
          <Link to="/book">
            <Button size="lg" className="px-8 py-4 text-lg">
              {t.bookYourAppointment}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}