import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Timer, Star, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Services() {
  const { t } = useLanguage();

  const services = [
    {
      name: t.classicHaircut,
      price: "$25",
      duration: "30 min",
      description: t.classicHaircutDesc,
      features: [t.hairConsultation || "Hair consultation", t.shampooConditioning || "Shampoo & conditioning", t.precisionCutting || "Precision cutting", t.styling || "Styling", t.hotTowelFinish || "Hot towel finish"],
      icon: Scissors,
    },
    {
      name: t.beardTrim,
      price: "$15",
      duration: "20 min",
      description: t.beardTrimDesc,
      features: [t.beardAssessment || "Beard assessment", t.precisionTrimming || "Precision trimming", t.edgeCleanup || "Edge cleanup", t.mustacheStyling || "Mustache styling", t.beardOilApplication || "Beard oil application"],
      icon: Sparkles,
    },
    {
      name: t.fullPackage,
      price: "$35",
      duration: "60 min",
      description: t.fullPackageDesc,
      features: [t.everythingFromServices || "Everything from haircut & beard trim", t.hotTowelTreatment || "Hot towel treatment", t.faceCleansing || "Face cleansing", t.aftershaveApplication || "Aftershave application", t.stylingConsultation || "Styling consultation"],
      icon: Star,
      featured: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-accent py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            {t.ourServices}
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            {t.professionalBarbering}
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-lg transition-shadow ${
                  service.featured ? "ring-2 ring-accent shadow-lg" : ""
                }`}
              >
                {service.featured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                      {t.mostPopular || "Most Popular"}
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                    <service.icon className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">{service.name}</CardTitle>
                  <div className="flex items-center justify-center space-x-4 text-muted-foreground">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-1" />
                      <span>{service.duration}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-accent">{service.price}</div>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{t.whatsIncluded || "What's Included:"}</h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mr-2 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link to="/book" className="block">
                      <Button 
                        className={`w-full ${
                          service.featured ? "bg-accent hover:bg-accent/90" : ""
                        }`}
                      >
                        {t.bookThisService || "Book This Service"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t.eliteCutsExperience || "The Elite Cuts Experience"}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t.detailedConsultation || "Every service includes a detailed consultation to understand your style preferences and lifestyle needs. Our experienced barbers use only premium products and tools to ensure the best results."}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3">{t.premiumProducts || "Premium Products"}</h3>
              <p className="text-muted-foreground">
                {t.finestGroomingProducts || "We use only the finest grooming products from trusted brands to ensure your hair and skin receive the best care possible."}
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3">{t.expertCraftsmanship || "Expert Craftsmanship"}</h3>
              <p className="text-muted-foreground">
                {t.skilledBarbers || "Our skilled barbers have years of experience and stay updated with the latest trends and techniques in men's grooming."}
              </p>
            </div>
          </div>
          
          <Link to="/book">
            <Button size="lg" className="px-8 py-4 text-lg">
              {t.bookAppointmentToday || "Book Your Appointment Today"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}