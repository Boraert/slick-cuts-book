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
import { format } from "date-fns";
import BarberPhotoUpload from "@/components/BarberPhotoUpload";
import { 
  Calendar, 
  Clock, 
  User, 
  Users, 
  CheckCircle2, 
  XCircle, 
  LogOut,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  photo_path?: string;
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
    checkAuth();
    loadData();
    loadAvailability();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
    }
  };

  const loadData = async () => {
    try {
      const [appointmentsResult, barbersResult] = await Promise.all([
        supabase.from("appointments").select("*").order("appointment_date", { ascending: false }),
        supabase.from("barbers").select("*").eq("is_active", true)
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (barbersResult.error) throw barbersResult.error;

      setAppointments(appointmentsResult.data || []);
      setBarbers(barbersResult.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("barber_availability")
        .select("*")
        .eq("date", selectedDate);

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const updateAvailability = async (
    barberId: string, 
    isAvailable: boolean, 
    startTime: string, 
    endTime: string
  ) => {
    try {
      const { data: existing } = await supabase
        .from("barber_availability")
        .select("id")
        .eq("barber_id", barberId)
        .eq("date", selectedDate)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("barber_availability")
          .update({
            is_available: isAvailable,
            start_time: startTime,
            end_time: endTime,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("barber_availability")
          .insert({
            barber_id: barberId,
            date: selectedDate,
            is_available: isAvailable,
            start_time: startTime,
            end_time: endTime,
          });

        if (error) throw error;
      }

      loadAvailability();
      toast({
        title: "Success",
        description: "Availability updated successfully.",
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
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : "Unknown";
  };

  const getServiceLabel = (serviceType: string) => {
    if (!serviceType) return "General Cut";
    return serviceType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments.filter(apt => apt.status === "confirmed").length} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Next 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{barbers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently available
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Appointments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>
                  Latest bookings and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Barber</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Booked On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.slice(0, 10).map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{appointment.customer_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {appointment.customer_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(new Date(appointment.appointment_date), "MMM d, yyyy")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {appointment.appointment_time}
                              </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Barber Management
                </CardTitle>
                <CardDescription>
                  Manage barber photos and availability schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {barbers.map((barber) => {
                    const barberAvail = availability.find(a => a.barber_id === barber.id);
                    
                    return (
                      <div key={barber.id} className="space-y-4">
                        {/* Barber Photo Upload */}
                        <BarberPhotoUpload
                          barberId={barber.id}
                          barberName={barber.name}
                          currentPhotoPath={barber.photo_path}
                          onPhotoUpdate={(photoPath) => {
                            setBarbers(prev => prev.map(b => 
                              b.id === barber.id ? { ...b, photo_path: photoPath } : b
                            ));
                          }}
                        />

                        {/* Availability Management */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Availability for {selectedDate}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`available-${barber.id}`} className="text-sm font-medium">
                                Available
                              </Label>
                              <Switch
                                id={`available-${barber.id}`}
                                checked={barberAvail?.is_available || false}
                                onCheckedChange={(checked) => 
                                  updateAvailability(barber.id, checked, "09:00", "18:00")
                                }
                              />
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
                          </CardContent>
                        </Card>
                      </div>
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