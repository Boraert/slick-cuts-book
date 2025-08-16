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
  Users, 
  LogOut,
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
  from_date: string;
  to_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<BarberAvailability[]>([]);
  // per-barber date ranges + times stored in maps keyed by barber id
  const [barberRanges, setBarberRanges] = useState<Record<string, { fromDate: string; toDate: string; startTime: string; endTime: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadData();
    // loadAvailability will be called after barbers are loaded (see loadData -> setBarbers)
    // so we don't call it here with empty barbers.
  }, []);

  // initialize defaults for a barber range
  const defaultRangeFor = (barberId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return {
      fromDate: today,
      toDate: today,
      startTime: "09:00",
      endTime: "18:00",
    };
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .single();

    if (error || !adminUser) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      toast({
        title: "Access Denied",
        description: "You don't have admin access to this system.",
        variant: "destructive",
      });
    }
  };

  // load appointments and barbers; after barbers are loaded, set defaults and load availability
  const loadData = async () => {
    try {
      const [appointmentsResult, barbersResult] = await Promise.all([
        supabase.from("appointments").select("*").order("appointment_date", { ascending: false }),
        supabase.from("barbers").select("*").eq("is_active", true)
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (barbersResult.error) throw barbersResult.error;

      const barbersData: Barber[] = barbersResult.data || [];
      setAppointments(appointmentsResult.data || []);
      setBarbers(barbersData);

      // initialize barberRanges map for each barber if not existing
      setBarberRanges(prev => {
        const copy = { ...prev };
        for (const b of barbersData) {
          if (!copy[b.id]) {
            copy[b.id] = defaultRangeFor(b.id);
          }
        }
        return copy;
      });

      // load all availability rows (we will match per-barber in the UI)
      await loadAvailability();
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

  // Load all availability rows (you can later filter by barber on the client)
  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("barber_availability")
        .select("*");

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability.",
        variant: "destructive",
      });
    }
  };

  // Update or insert a row for a specific barber + from_date + to_date (update same row if exists)
  const updateAvailability = async (
    barberId: string,
    isAvailable: boolean,
    startTime: string,
    endTime: string,
    fromDate: string,
    toDate: string
  ) => {
    try {
      // Check for existing row for this barber + exact date range
      const { data: existing, error: selectError } = await supabase
        .from("barber_availability")
        .select("id")
        .eq("barber_id", barberId)
        .eq("from_date", fromDate)
        .eq("to_date", toDate)
        .maybeSingle(); // safe in case multiple rows (shouldn't happen if you have unique constraint)

      if (selectError) throw selectError;

      if (existing && existing.id) {
        // update the existing row
        const { error: updateError } = await supabase
          .from("barber_availability")
          .update({
            is_available: isAvailable,
            start_time: startTime,
            end_time: endTime,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        // insert a new row for this barber/range
        const { error: insertError } = await supabase
          .from("barber_availability")
          .insert({
            barber_id: barberId,
            from_date: fromDate,
            to_date: toDate,
            is_available: isAvailable,
            start_time: startTime,
            end_time: endTime,
          });

        if (insertError) throw insertError;
      }

      await loadAvailability();
      toast({
        title: "Success",
        description: "Availability updated successfully.",
      });
    } catch (err: any) {
      console.error("Error updating availability:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to update availability.",
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

          {/* Appointments */}
          <TabsContent value="appointments" className="space-y-6">
            {/* Stats */}
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
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{barbers.length}</div>
                  <p className="text-xs text-muted-foreground">Currently available</p>
                </CardContent>
              </Card>
            </div>

            {/* Appointments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>Latest bookings and their status</CardDescription>
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
                              <div className="text-sm text-muted-foreground">{appointment.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(new Date(appointment.appointment_date), "MMM d, yyyy")}
                              </div>
                              <div className="text-sm text-muted-foreground">{appointment.appointment_time}</div>
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
                    <div className="text-center py-8 text-muted-foreground">No appointments found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Barber Management */}
          <TabsContent value="barbers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Barber Management
                </CardTitle>
                <CardDescription>Manage barber photos and availability schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {barbers.map((barber) => {
                    // get this barber's configured range (local state)
                    const range = barberRanges[barber.id] ?? defaultRangeFor(barber.id);

                    // find a matching availability row (exact match on barber + range)
                    const barberAvail = availability.find(
                      (a) =>
                        a.barber_id === barber.id &&
                        a.from_date === range.fromDate &&
                        a.to_date === range.toDate
                    );

                    return (
                      <div key={barber.id} className="space-y-4">
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

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {barber.name} — Range
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 max-w-md mb-2">
                              <div>
                                <Label htmlFor={`from-${barber.id}`}>From</Label>
                                <Input
                                  id={`from-${barber.id}`}
                                  type="date"
                                  value={range.fromDate}
                                  onChange={(e) => {
                                    const newFrom = e.target.value;
                                    setBarberRanges(prev => ({ ...prev, [barber.id]: { ...range, fromDate: newFrom } }));
                                  }}
                                />
                              </div>

                              <div>
                                <Label htmlFor={`to-${barber.id}`}>To</Label>
                                <Input
                                  id={`to-${barber.id}`}
                                  type="date"
                                  value={range.toDate}
                                  onChange={(e) => {
                                    const newTo = e.target.value;
                                    setBarberRanges(prev => ({ ...prev, [barber.id]: { ...range, toDate: newTo } }));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor={`available-${barber.id}`} className="text-sm font-medium">
                                Available
                              </Label>
                              <Switch
                                id={`available-${barber.id}`}
                                checked={barberAvail?.is_available || false}
                                onCheckedChange={(checked) => {
                                  // use current range.startTime/endTime from state or defaults
                                  const { startTime, endTime, fromDate, toDate } = barberRanges[barber.id] ?? defaultRangeFor(barber.id);
                                  updateAvailability(barber.id, checked, startTime, endTime, fromDate, toDate);
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`start-${barber.id}`}>Start Time</Label>
                                <Input
                                  id={`start-${barber.id}`}
                                  type="time"
                                  value={barberAvail?.start_time ?? range.startTime}
                                  onChange={(e) => {
                                    const newStart = e.target.value;
                                    // update local map
                                    setBarberRanges(prev => ({ ...prev, [barber.id]: { ...range, startTime: newStart } }));
                                    // if there is an existing DB row for this exact range, update it
                                    const { fromDate, toDate } = range;
                                    updateAvailability(barber.id, true, newStart, barberAvail?.end_time ?? range.endTime, fromDate, toDate);
                                  }}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`end-${barber.id}`}>End Time</Label>
                                <Input
                                  id={`end-${barber.id}`}
                                  type="time"
                                  value={barberAvail?.end_time ?? range.endTime}
                                  onChange={(e) => {
                                    const newEnd = e.target.value;
                                    setBarberRanges(prev => ({ ...prev, [barber.id]: { ...range, endTime: newEnd } }));
                                    const { fromDate, toDate } = range;
                                    updateAvailability(barber.id, true, barberAvail?.start_time ?? range.startTime, newEnd, fromDate, toDate);
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => {
                                  // Save (create or update) availability for this barber + range using current local state
                                  const { fromDate, toDate, startTime, endTime } = barberRanges[barber.id] ?? defaultRangeFor(barber.id);
                                  // If toggle not set in DB, we will treat as available = true by default when saving
                                  const isAvailable = barberAvail?.is_available ?? true;
                                  updateAvailability(barber.id, isAvailable, startTime, endTime, fromDate, toDate);
                                }}
                              >
                                Save Range
                              </Button>

                              <Button
                                variant="outline"
                                onClick={async () => {
                                  // Delete the row for this barber + exact range if exists
                                  const rangeState = barberRanges[barber.id] ?? defaultRangeFor(barber.id);
                                  try {
                                    const { error } = await supabase
                                      .from("barber_availability")
                                      .delete()
                                      .eq("barber_id", barber.id)
                                      .eq("from_date", rangeState.fromDate)
                                      .eq("to_date", rangeState.toDate);

                                    if (error) throw error;
                                    await loadAvailability();
                                    toast({ title: "Deleted", description: "Availability removed for that range." });
                                  } catch (err: any) {
                                    console.error("Error deleting availability:", err);
                                    toast({ title: "Error", description: "Failed to delete availability.", variant: "destructive" });
                                  }
                                }}
                              >
                                Remove Range
                              </Button>
                            </div>

                            {/* show currently saved availability for this barber+range */}
                            {barberAvail ? (
                              <div className="text-sm text-muted-foreground pt-2">
                                Saved: {barberAvail.is_available ? "Available" : "Unavailable"} • {barberAvail.start_time} — {barberAvail.end_time} ({barberAvail.from_date} → {barberAvail.to_date})
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground pt-2">
                                No saved availability for this exact range.
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
