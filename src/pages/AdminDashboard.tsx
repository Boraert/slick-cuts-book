import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Calendar, Users, Clock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  barber_id: string;
  created_at: string;
}

interface Barber {
  id: string;
  name: string;
  is_active: boolean;
}

interface BarberAvailability {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<BarberAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      // Verify admin access
      const { data: adminUser, error: adminError } = await (supabase as any)
        .from("admin_users")
        .select("*")
        .eq("email", session.user.email)
        .eq("is_active", true)
        .single();

      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      await loadData();
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/admin");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load appointments
      const { data: appointmentsData, error: appointmentsError } = await (supabase as any)
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Load barbers
      const { data: barbersData, error: barbersError } = await (supabase as any)
        .from("barbers")
        .select("*");

      if (barbersError) throw barbersError;

      setAppointments(appointmentsData || []);
      setBarbers(barbersData || []);
      
      await loadAvailability();
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("barber_availability")
        .select("*")
        .eq("date", selectedDate);

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const updateAvailability = async (barberId: string, isAvailable: boolean, startTime?: string, endTime?: string) => {
    try {
      const updateData: any = { is_available: isAvailable };
      if (startTime) updateData.start_time = startTime;
      if (endTime) updateData.end_time = endTime;

      const { error } = await (supabase as any)
        .from("barber_availability")
        .upsert({
          barber_id: barberId,
          date: selectedDate,
          ...updateData,
        });

      if (error) throw error;
      
      await loadAvailability();
      toast({
        title: "Updated",
        description: "Barber availability updated successfully.",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : "Unknown";
  };

  const getServiceLabel = (serviceType: string) => {
    const services: Record<string, string> = {
      haircut: "Classic Haircut",
      beard_trim: "Beard Trim",
      full_package: "Full Package",
    };
    return services[serviceType] || serviceType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date === format(new Date(), "yyyy-MM-dd")
  );

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) > new Date()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="barbers">Barber Management</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
            </div>

            {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>
              Manage and view all customer appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Barber</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.customer_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{appointment.customer_email}</div>
                          <div className="text-muted-foreground">{appointment.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(appointment.appointment_date), "MMM d, yyyy")}</div>
                          <div className="text-muted-foreground">{appointment.appointment_time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getServiceLabel(appointment.service_type)}</TableCell>
                      <TableCell>{getBarberName(appointment.barber_id)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(appointment.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {appointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments found.
                </div>
              )}
            </div>
          </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="barbers" className="space-y-6">
            {/* Date Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Barber Availability Management
                </CardTitle>
                <CardDescription>
                  Manage barber working hours and availability for specific dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label htmlFor="date-select">Select Date</Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      loadAvailability();
                    }}
                    className="max-w-xs"
                  />
                </div>

                <div className="space-y-4">
                  {barbers.map((barber) => {
                    const barberAvail = availability.find(a => a.barber_id === barber.id);
                    
                    return (
                      <Card key={barber.id} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{barber.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {barber.is_active ? "Active" : "Inactive"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`available-${barber.id}`}>Available</Label>
                            <Switch
                              id={`available-${barber.id}`}
                              checked={barberAvail?.is_available ?? false}
                              onCheckedChange={(checked) => 
                                updateAvailability(barber.id, checked)
                              }
                            />
                          </div>
                        </div>

                        {barberAvail?.is_available && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`start-${barber.id}`}>Start Time</Label>
                              <Input
                                id={`start-${barber.id}`}
                                type="time"
                                value={barberAvail?.start_time || "09:00"}
                                onChange={(e) => 
                                  updateAvailability(barber.id, true, e.target.value, barberAvail?.end_time)
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-${barber.id}`}>End Time</Label>
                              <Input
                                id={`end-${barber.id}`}
                                type="time"
                                value={barberAvail?.end_time || "18:00"}
                                onChange={(e) => 
                                  updateAvailability(barber.id, true, barberAvail?.start_time, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}