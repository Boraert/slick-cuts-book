import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isFuture, parseISO } from "date-fns";
import BarberPhotoUpload from "@/components/BarberPhotoUpload";
import { Calendar, Clock, Users, LogOut, ArrowUpDown, Filter } from "lucide-react";
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
  const [barberRanges, setBarberRanges] = useState<Record<string, { fromDate: string; toDate: string; startTime: string; endTime: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "time" | "customer" | "barber" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");
  const { toast } = useToast();
  const navigate = useNavigate();
  

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

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

      setBarberRanges(prev => {
        const copy = { ...prev };
        for (const b of barbersData) {
          if (!copy[b.id]) {
            copy[b.id] = defaultRangeFor(b.id);
          }
        }
        return copy;
      });

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

  // Helper function to sort appointments
  const sortAppointments = (appointments: Appointment[]) => {
    return [...appointments].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
          break;
        case "time":
          comparison = a.appointment_time.localeCompare(b.appointment_time);
          break;
        case "customer":
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case "barber":
          const barberNameA = getBarberName(a.barber_id);
          const barberNameB = getBarberName(b.barber_id);
          comparison = barberNameA.localeCompare(barberNameB);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Helper function to filter appointments
  const filterAppointments = (appointments: Appointment[]) => {
    let filtered = appointments;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    const today = new Date();
    
    switch (activeTab) {
      case "today":
        filtered = filtered.filter(apt => isToday(parseISO(apt.appointment_date)));
        break;
      case "upcoming":
        filtered = filtered.filter(apt => isFuture(parseISO(apt.appointment_date)));
        break;
      case "all":
      default:
        // No additional filtering for "all"
        break;
    }
    
    return filtered;
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Helper function to check if current date is within any available range
  const isBarberAvailableToday = (barberId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return availability.some(avail => 
      avail.barber_id === barberId && 
      avail.is_available && 
      avail.from_date <= today && 
      avail.to_date >= today
    );
  };

  const updateAvailability = async (
    barberId: string,
    isAvailable: boolean,
    startTime: string,
    endTime: string,
    fromDate: string,
    toDate: string
  ) => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from("barber_availability")
        .select("id")
        .eq("barber_id", barberId)
        .eq("from_date", fromDate)
        .eq("to_date", toDate)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing && existing.id) {
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
      toast({ title: "Success", description: "Availability updated successfully." });
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
    (apt) => isToday(parseISO(apt.appointment_date))
  );
  const upcomingAppointments = appointments.filter(
    (apt) => isFuture(parseISO(apt.appointment_date))
  );
  const activeBarbers = barbers.filter(b => isBarberAvailableToday(b.id));

  // Get filtered and sorted appointments based on current tab and filters
  const getDisplayedAppointments = () => {
    const filtered = filterAppointments(appointments);
    return sortAppointments(filtered);
  };

  const displayedAppointments = getDisplayedAppointments();

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
                  <div className="text-2xl font-bold">{activeBarbers.length}</div>
                  <p className="text-xs text-muted-foreground">Available today</p>
                </CardContent>
              </Card>
            </div>

            {/* Appointments Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>Manage and view appointment bookings</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Appointment Tabs */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full sm:w-auto">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort("customer")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Customer
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort("date")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Date & Time
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort("barber")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Barber
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort("status")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Status
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Booked On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAppointments.slice(0, 50).map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{appointment.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{appointment.customer_email}</div>
                              {appointment.customer_phone && (
                                <div className="text-sm text-muted-foreground">{appointment.customer_phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(parseISO(appointment.appointment_date), "MMM d, yyyy")}
                              </div>
                              <div className="text-sm text-muted-foreground">{appointment.appointment_time}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getServiceLabel(appointment.service_type)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{getBarberName(appointment.barber_id)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(parseISO(appointment.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {displayedAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {activeTab === "today" 
                        ? "No appointments today." 
                        : activeTab === "upcoming" 
                        ? "No upcoming appointments." 
                        : statusFilter !== "all"
                        ? `No ${statusFilter} appointments found.`
                        : "No appointments found."}
                    </div>
                  )}
                  {displayedAppointments.length > 50 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border-t">
                      Showing first 50 of {displayedAppointments.length} appointments
                    </div>
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
                    const range = barberRanges[barber.id] ?? defaultRangeFor(barber.id);
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
                            <CardTitle className="text-lg flex items-center gap-2">
                              {barber.name} — Range
                              {isBarberAvailableToday(barber.id) && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Available Today
                                </Badge>
                              )}
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
                                Available for this range
                              </Label>
                              <Switch
                                id={`available-${barber.id}`}
                                checked={barberAvail?.is_available || false}
                                onCheckedChange={(checked) => {
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
                                    setBarberRanges(prev => ({ ...prev, [barber.id]: { ...range, startTime: newStart } }));
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
                                  const { fromDate, toDate, startTime, endTime } = barberRanges[barber.id] ?? defaultRangeFor(barber.id);
                                  // Automatically set availability to true when creating a range
                                  updateAvailability(barber.id, true, startTime, endTime, fromDate, toDate);
                                }}
                              >
                                Save Range (Available)
                              </Button>
                            </div>

                            {/* Saved ranges list */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Saved Availability Ranges</h4>
                              <div className="space-y-2">
                                {availability
                                  .filter((a) => a.barber_id === barber.id)
                                  .map((a) => (
                                    <div
                                      key={a.id}
                                      className="flex justify-between items-center border rounded-md p-2 text-sm"
                                    >
                                      <span>
                                        {a.from_date} → {a.to_date} • {a.start_time} — {a.end_time} •{" "}
                                        {a.is_available ? "✅ Available" : "❌ Unavailable"}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            const { error } = await supabase
                                              .from("barber_availability")
                                              .delete()
                                              .eq("id", a.id);
                                            if (error) throw error;
                                            await loadAvailability();
                                            toast({ title: "Deleted", description: "Availability removed." });
                                          } catch (err: any) {
                                            toast({
                                              title: "Error",
                                              description: err?.message || "Failed to delete availability.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                {availability.filter((a) => a.barber_id === barber.id).length === 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    No availability ranges saved yet.
                                  </div>
                                )}
                              </div>
                            </div>
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