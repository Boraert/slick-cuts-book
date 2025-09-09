import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Scissors, Timer, Star, Sparkles, Heart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import servicesData from "@/utils/services.json";

interface Service {
  id: string;
  name: string;
  name_da?: string; // Add Danish name support
  description: string;
  description_da?: string; // Add Danish description support
  price: number;
  category: "men" | "women";
  duration?: string;
  tags?: string[];
  tags_da?: string[]; // Add Danish tags support
  features?: string[];
  features_da?: string[]; // Add Danish features support
  featured?: boolean;
  is_active?: boolean;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  const processServicesData = (data: any[]): Service[] => {
    if (!Array.isArray(data)) {
      console.error('Services data is not an array, using empty array');
      return [];
    }

    return data
      .map((service: any, index: number) => {
        if (!service.id || !service.name || !service.category) {
          console.warn(`Service at index ${index} is missing required fields (id, name, category)`);
        }
        
        return {
          id: String(service.id || `service-${index + 1}`),
          name: String(service.name || `Service ${index + 1}`),
          name_da: service.name_da,
          description: service.description || '',
          description_da: service.description_da,
          price: service.price ? Number(service.price) : 0,
          category: (service.category as "men" | "women") || "men",
          duration: service.duration || undefined,
          tags: Array.isArray(service.tags) ? service.tags : [],
          tags_da: Array.isArray(service.tags_da) ? service.tags_da : [],
          features: Array.isArray(service.features) ? service.features : [],
          features_da: Array.isArray(service.features_da) ? service.features_da : [],
          featured: Boolean(service.featured),
          is_active: Boolean(service.is_active !== false) // default to true
        };
      })
      .filter(service => service.is_active); // Only show active services
  };

  function loadServices() {
    setLoading(true);
    try {
      const processedServices = processServicesData(servicesData);
      setServices(processedServices);
    } catch (error) {
      console.error('Error processing services data:', error);
      setServices([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  if (loading) return <p className="p-4">{t.loading}</p>;

  // Helper function to get localized content
  const getLocalizedContent = (service: Service, field: keyof Service): string | string[] => {
    const danishField = `${field}_da` as keyof Service;
    if (language === 'da' && service[danishField]) {
      return service[danishField] as string | string[];
    }
    return service[field] as string | string[];
  };

  // Filter services by category from processed JSON data
  const getServicesByCategory = (category: "men" | "women") =>
    services.filter((s) => s.category === category);

  const ServiceCard = ({ service }: { service: Service }) => (
  <Card
    className={`relative flex flex-col h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
      service.featured ? "ring-2 ring-accent shadow-lg scale-105" : ""
    }`}
  >
    {service.featured && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
        <Badge className="bg-accent text-accent-foreground px-4 py-1">
          {t.mostPopular}
        </Badge>
      </div>
    )}

    <CardHeader className="text-center pb-4">
      <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
        <Scissors className="h-10 w-10 text-accent" />
      </div>
      <CardTitle className="text-2xl mb-2">
        {getLocalizedContent(service, "name") as string}
      </CardTitle>

      {/* Tags */}
      {(() => {
        const tags = getLocalizedContent(service, "tags") as string[];
        return (
          tags &&
          tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mb-3">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )
        );
      })()}

      {/* Duration */}
      {service.duration && (
        <div className="flex items-center justify-center text-muted-foreground mb-2">
          <Timer className="h-4 w-4 mr-1" />
          <span className="text-sm">{service.duration}</span>
        </div>
      )}

      {/* Price */}
      <div className="text-3xl font-bold text-accent mb-2">
        {service.price > 0 ? `${service.price} kr` : t.contactForPricing}
      </div>
      <CardDescription className="text-base leading-relaxed">
        {getLocalizedContent(service, "description") as string}
      </CardDescription>
    </CardHeader>

    {/* Make content expand to fill, button stays bottom */}
    <CardContent className="flex flex-col justify-between flex-grow pt-0">
      <div className="space-y-4">
        {(() => {
          const features = getLocalizedContent(service, "features") as string[];
          return (
            features &&
            features.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-foreground">
                  {t.whatsIncluded}
                </h4>
                <ul className="space-y-2">
                  {features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          );
        })()}
      </div>

      {/* Push button to bottom */}
      <div className="mt-6">
        <Button
          onClick={() => (window.location.href = "/book")}
          className={`w-full transition-all duration-300 ${
            service.featured
              ? "bg-accent hover:bg-accent/90 shadow-lg"
              : "hover:bg-primary/90"
          }`}
          size="lg"
        >
          {t.bookThisService}
        </Button>
      </div>
    </CardContent>
  </Card>
);

  const menServices = getServicesByCategory("men");
  const womenServices = getServicesByCategory("women");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-accent py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6">
            {t.ourServices}
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed">
            {t.professionalBarbering}
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="men" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-14">
                <TabsTrigger
                  value="men"
                  className="text-base font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Scissors className="h-5 w-5 mr-2" />
                  {t.menServices} ({menServices.length})
                </TabsTrigger>
                <TabsTrigger
                  value="women"
                  className="text-base font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  {t.womenServices} ({womenServices.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="men" className="mt-0">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {language === 'da' ? 'Herrepleje Tjenester' : 'Men\'s Grooming Services'}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  {language === 'da' 
                    ? 'Fra klassiske klipninger til moderne styles, vores ekspert barbere tilbyder premium pleje tjenester for den moderne gentleman.'
                    : 'From classic cuts to modern styles, our expert barbers provide premium grooming services for the modern gentleman.'
                  }
                </p>
              </div>
              {menServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {menServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    {language === 'da' 
                      ? 'Ingen herretjenester er i øjeblikket tilgængelige.'
                      : 'No men\'s services are currently available.'
                    }
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="women" className="mt-0">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {language === 'da' ? 'Dameskønhed Tjenester' : 'Women\'s Beauty Services'}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  {language === 'da'
                    ? 'Professionelle hår- og skønhedstjenester designet til at fremhæve din naturlige skønhed og booste dit selvtillid.'
                    : 'Professional hair and beauty services designed to enhance your natural beauty and boost your confidence.'
                  }
                </p>
              </div>
              {womenServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {womenServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    {language === 'da'
                      ? 'Ingen dametjenester er i øjeblikket tilgængelige.'
                      : 'No women\'s services are currently available.'
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            {t.eliteCutsExperience}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            {t.detailedConsultation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t.premiumProducts}
              </h3>
              <p className="text-muted-foreground">
                {t.finestGroomingProducts}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                <User className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t.expertCraftsmanship}
              </h3>
              <p className="text-muted-foreground">
                {t.skilledBarbers}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t.personalizedService}
              </h3>
              <p className="text-muted-foreground">
                {language === 'da'
                  ? 'Hver tjeneste er skræddersyet til din individuelle stil og præferencer.'
                  : 'Every service is tailored to your individual style and preferences.'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t.relaxingAtmosphere}
              </h3>
              <p className="text-muted-foreground">
                {language === 'da'
                  ? 'Nyd en komfortabel og imødekommende atmosfære under dit besøg.'
                  : 'Enjoy a comfortable and welcoming environment during your visit.'
                }
              </p>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = "/book")}
            size="lg"
            className="px-12 py-4 text-lg font-semibold"
          >
            {t.bookAppointmentToday}
          </Button>
        </div>
      </section>
    </div>
  );
}