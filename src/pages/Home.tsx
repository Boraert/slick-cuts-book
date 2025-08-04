import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, Users, Star } from "lucide-react";

export default function Home() {
  const services = [
    {
      name: "Classic Haircut",
      description: "Traditional scissor cut with styling",
      price: "$25",
      icon: Scissors,
    },
    {
      name: "Beard Trim",
      description: "Professional beard shaping and styling",
      price: "$15",
      icon: Scissors,
    },
    {
      name: "Full Package",
      description: "Haircut + beard trim + hot towel treatment",
      price: "$35",
      icon: Star,
    },
  ];

  const features = [
    {
      icon: Clock,
      title: "Quick & Easy Booking",
      description: "Book your appointment online in just a few clicks",
    },
    {
      icon: Users,
      title: "Expert Barbers",
      description: "Experienced professionals with years of expertise",
    },
    {
      icon: Star,
      title: "Premium Service",
      description: "High-quality tools and premium products",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Welcome to Elite Cuts
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Experience the finest barbershop tradition with modern style. 
            Professional cuts, expert service, timeless craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Book Appointment
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional barbering services tailored to your style and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                    <service.icon className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription className="text-lg">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent mb-4">{service.price}</div>
                  <Link to="/book">
                    <Button className="w-full">Book Now</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose Elite Cuts?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine traditional barbering excellence with modern convenience
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
            Ready for Your Next Cut?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Book your appointment today and experience the Elite Cuts difference
          </p>
          <Link to="/book">
            <Button size="lg" className="px-8 py-4 text-lg">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}