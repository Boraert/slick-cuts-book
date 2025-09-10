import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Award, Clock, Users } from "lucide-react";
import teamPortrait from "@/assets/team-portrait.jpg";

const About = () => {
  const stats = [
    { icon: <Users className="h-8 w-8" />, number: "1000+", label: "Tilfredse kunder" },
    { icon: <Clock className="h-8 w-8" />, number: "15+", label: "År med erfaring" },
    { icon: <Award className="h-8 w-8" />, number: "100%", label: "Professionel service" },
    { icon: <Scissors className="h-8 w-8" />, number: "Premium", label: "Udstyr og produkter" },
  ];

  return (
    <section id="om-os" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={teamPortrait}
                alt="Vores professionelle frisørteam"
                className="w-full rounded-lg shadow-elegant"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-accent/20 rounded-lg -z-10"></div>
          </div>

          {/* Content */}
          <div>
            <div className="mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Om Os
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Frisør Nærum har været hjørnet af kvalitet og tradition i over 15 år. 
                Vores erfarne team af professionelle frisører kombinerer klassisk håndværk 
                med moderne teknikker for at give dig den perfekte frisure.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Vi tror på, at hver kunde fortjener en personlig oplevelse, hvor vi 
                lytter til dine ønsker og giver professionelle råd baseret på din 
                hårtype og livsstil.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-warm">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4 text-accent">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;