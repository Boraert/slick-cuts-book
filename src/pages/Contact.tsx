import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-accent py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            {t.contactUs || "Contact Us"}
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            {t.getInTouchDesc || "Get in touch with Nærum Frisør. We're here to help with any questions or to schedule your next appointment."}
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  {t.getInTouch || "Get In Touch"}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t.visitUsDesc || "Visit us at our barbershop or reach out through any of the following methods. We look forward to serving you!"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <MapPin className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="text-lg">{t.location || "Location"}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Nærum Hovedgade 52, 2850 Nærum<br />
                      Nærum Danmark<br />
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Phone className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="text-lg">{t.phone || "Phone"}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      <br />
                      <span className="text-sm">Call for appointments</span>
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Mail className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="text-lg">{t.email || "Email"}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      info@frisørnærum.dk<br />
                      <span className="text-sm">General inquiries</span>
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Clock className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle className="text-lg">{t.hours || "Hours"}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base space-y-1">
                      <div className="flex justify-between">
                        <span>{t.mondayFriday}</span>
                        <span>09:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.saturday || "Saturday"}</span>
                        <span>09:00 - 16:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.sunday || "Sunday"}</span>
                        <span className="text-muted-foreground">{t.closed || "Closed"}</span>
                      </div>
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="lg:order-last">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t.findUs || "Find Us"}</CardTitle>
                  <CardDescription>
                    {t.locationDesc || "Located in the heart of the city, easily accessible by car or public transport."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden h-64 lg:h-96">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2696.7646664368403!2d12.534582677320067!3d55.81985657310903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46524ea54ba87fef%3A0x39a217c2530b8ff7!2sN%C3%A6rum%20Hovedgade%2052%2C%202850%20N%C3%A6rum!5e1!3m2!1sda!2sdk!4v1755331751062!5m2!1sda!2sdk"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </CardContent>

              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t.whyVisitEliteCuts || "Why Visit Nærum Frisør?"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">{t.convenientLocation || "Convenient Location"}</h3>
              <p className="text-muted-foreground">
                {t.centrallyLocated || "Centrally located with easy parking and public transport access."}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">{t.flexibleHours || "Flexible Hours"}</h3>
              <p className="text-muted-foreground">
                {t.openSevenDays || "Open 7 days a week with extended hours to fit your schedule."}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">{t.professionalService || "Professional Service"}</h3>
              <p className="text-muted-foreground">
                {t.expertBarbersDedicated || "Expert barbers dedicated to providing the best grooming experience."}
              </p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground">
            {t.haveQuestions || "Have questions about our services or want to schedule an appointment? Don't hesitate to reach out - we're here to help!"}
          </p>
        </div>
      </section>
    </div>
  );
}