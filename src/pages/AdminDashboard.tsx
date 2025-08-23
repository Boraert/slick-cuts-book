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
import { Calendar, Clock, Users, LogOut, ArrowUpDown, Filter, Plus, Trash2, PencilLine, Save, X, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import servicesData from "@/utils/services.json";

/* =========================
   Types
========================= */

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

type ServiceCategory = "men" | "women";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  tags?: string[];
  features?: string[];
  featured?: boolean;
}

/* =========================
   JSON Services Data Processing
========================= */

const processServicesData = (data: any[]): Service[] => {
  if (!Array.isArray(data)) {
    console.error('Services data is not an array, using empty array');
    return [];
  }

  return data.map((service: any, index: number) => {
    if (!service.id || !service.name || !service.category) {
      console.warn(`Service at index ${index} is missing required fields (id, name, category)`);
    }
    
    return {
      id: String(service.id || generateServiceId()),
      name: String(service.name || `Service ${index + 1}`),
      description: service.description || null,
      price: service.price ? Number(service.price) : null,
      category: (service.category as ServiceCategory) || "men",
      is_active: Boolean(service.is_active !== false), // default to true
      created_at: service.created_at || new Date().toISOString(),
      tags: Array.isArray(service.tags) ? service.tags : [],
      features: Array.isArray(service.features) ? service.features : [],
      featured: Boolean(service.featured)
    };
  });
};

const generateServiceId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const downloadServicesAsJSON = (services: Service[], filename: string = 'services.json') => {
  const dataStr = JSON.stringify(services, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* =========================
   Component
========================= */

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<BarberAvailability[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barberRanges, setBarberRanges] = useState<Record<string, { fromDate: string; toDate: string; startTime: string; endTime: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "time" | "customer" | "barber" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");
  const [activeMainTab, setActiveMainTab] = useState<"appointments" | "barbers" | "services">("appointments");

  // Add Barber form state
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberActive, setNewBarberActive] = useState(true);

  // Add Service form state
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcPrice, setSvcPrice] = useState<string>("");
  const [svcCategory, setSvcCategory] = useState<ServiceCategory | undefined>(undefined);
  const [svcFeatures, setSvcFeatures] = useState<string[]>([]);
  const [svcTags, setSvcTags] = useState<string[]>([]);
  const [svcFeatured, setSvcFeatured] = useState(false);

  // Inline edit state for services
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editSvc, setEditSvc] = useState<{
    name: string;
    description: string;
    price: string;
    category: ServiceCategory;
    tags?: string[];
    features?: string[];
    featured?: boolean;
  }>({
    name: "",
    description: "",
    price: "",
    category: "men",
    tags: [],
    features: [],
    featured: false
  });

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
        supabase.from("barbers").select("*"),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (barbersResult.error) throw barbersResult.error;

      const barbersData: Barber[] = barbersResult.data || [];
      setAppointments(appointmentsResult.data || []);
      setBarbers(barbersData);
      
      // Load services from imported JSON file
      const processedServices = processServicesData(servicesData);
      setServices(processedServices);

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
      const { data, error } = await supabase.from("barber_availability").select("*");
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

  /* =========================
     Appointments helpers
  ========================= */

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

  const filterAppointments = (appointments: Appointment[]) => {
    let filtered = appointments;
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    switch (activeTab) {
      case "today":
        filtered = filtered.filter(apt => isToday(parseISO(apt.appointment_date)));
        break;
      case "upcoming":
        filtered = filtered.filter(apt => isFuture(parseISO(apt.appointment_date)));
        break;
      case "all":
      default:
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

  /* =========================
     Availability helpers
  ========================= */

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

      if (existing && (existing as any).id) {
        const { error: updateError } = await supabase
          .from("barber_availability")
          .update({
            is_available: isAvailable,
            start_time: startTime,
            end_time: endTime,
          })
          .eq("id", (existing as any).id);
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

  /* =========================
     Barbers CRUD
  ========================= */

  const addBarber = async () => {
    if (!newBarberName.trim()) {
      toast({ title: "Name required", description: "Please enter a barber name.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("barbers").insert([{ name: newBarberName.trim(), is_active: newBarberActive }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewBarberName("");
    setNewBarberActive(true);
    toast({ title: "Barber Added", description: "New barber added successfully." });
    loadData();
  };

  /* =========================
     Services CRUD (In-Memory) - FIXED
  ========================= */

  const addService = () => {
    if (!svcName.trim() || !svcCategory) {
      toast({ title: "Missing fields", description: "Name and Category are required.", variant: "destructive" });
      return;
    }
    
    const priceNum = svcPrice ? Number(svcPrice) : null;
    if (svcPrice && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }

    const newService: Service = {
      id: generateServiceId(),
      name: svcName.trim(),
      description: svcDesc.trim() || null,
      price: priceNum,
      category: svcCategory,
      is_active: true,
      created_at: new Date().toISOString(),
      tags: svcTags.filter(tag => tag.trim() !== ""),
      features: svcFeatures.filter(feature => feature.trim() !== ""),
      featured: svcFeatured
    };

    setServices(prev => [...prev, newService]);

    // Reset form
    setSvcName("");
    setSvcDesc("");
    setSvcPrice("");
    setSvcCategory(undefined);
    setSvcFeatures([]);
    setSvcTags([]);
    setSvcFeatured(false);

    toast({ title: "Service Added", description: "New service added successfully." });
  };

  // FIXED: Improved service toggle function with better state handling and debugging
  const toggleServiceActive = (serviceId: string, isActive: boolean) => {
    console.log(`Toggling service ${serviceId} to ${isActive}`);
    
    setServices(prevServices => {
      const serviceIndex = prevServices.findIndex(service => service.id === serviceId);
      
      if (serviceIndex === -1) {
        console.error(`Service with ID ${serviceId} not found`);
        toast({ 
          title: "Error", 
          description: "Service not found",
          variant: "destructive"
        });
        return prevServices;
      }

      const updatedServices = [...prevServices];
      const oldService = updatedServices[serviceIndex];
      
      // Create new service object with updated active status
      updatedServices[serviceIndex] = {
        ...oldService,
        is_active: isActive
      };
      
      console.log(`Service ${serviceId} updated:`, {
        old: oldService.is_active,
        new: updatedServices[serviceIndex].is_active
      });
      
      // Show feedback to user
      toast({ 
        title: "Service Updated", 
        description: `${oldService.name} is now ${isActive ? 'active' : 'inactive'}`,
        duration: 2000
      });
      
      return updatedServices;
    });
  };

  const startEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setEditSvc({
      name: svc.name,
      description: svc.description ?? "",
      price: svc.price != null ? String(svc.price) : "",
      category: svc.category,
      tags: svc.tags || [],
      features: svc.features || [],
      featured: svc.featured || false
    });
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditSvc({
      name: "",
      description: "",
      price: "",
      category: "men",
      tags: [],
      features: [],
      featured: false
    });
  };

  const saveEditService = (svcId: string) => {
    const priceNum = editSvc.price ? Number(editSvc.price) : null;
    if (editSvc.price && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }
    
    if (!editSvc.name.trim()) {
      toast({ title: "Name required", description: "Service name cannot be empty.", variant: "destructive" });
      return;
    }

    setServices(prev => prev.map(s => 
      s.id === svcId ? {
        ...s,
        name: editSvc.name.trim(),
        description: editSvc.description.trim() || null,
        price: priceNum,
        category: editSvc.category,
        tags: editSvc.tags?.filter(tag => tag.trim() !== "") || [],
        features: editSvc.features?.filter(feature => feature.trim() !== "") || [],
        featured: editSvc.featured || false
      } : s
    ));

    setEditingServiceId(null);
    setEditSvc({
      name: "",
      description: "",
      price: "",
      category: "men",
      tags: [],
      features: [],
      featured: false
    });
    toast({ title: "Saved", description: "Service updated successfully." });
  };

  const deleteService = (svcId: string) => {
    const service = services.find(s => s.id === svcId);
    if (!service) {
      toast({ title: "Error", description: "Service not found.", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }
    
    setServices(prev => prev.filter(s => s.id !== svcId));
    toast({ 
      title: "Service Deleted", 
      description: `${service.name} has been removed.` 
    });
  };

  /* =========================
     Misc helpers
  ========================= */

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

  const getDisplayedAppointments = () => {
    const filtered = filterAppointments(appointments);
    return sortAppointments(filtered);
  };

  const displayedAppointments = getDisplayedAppointments();

  const menServices = services.filter(s => s.category === "men");
  const womenServices = services.filter(s => s.category === "women");

  /* =========================
     Render
  ========================= */

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
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as typeof activeMainTab)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="barbers">Barber Management</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* =========================
              Appointments
          ========================= */}
          <TabsContent value="appointments" className="space-y-6">
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
                        <SelectValue placeholder="All Status" />
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

          {/* =========================
              Barber Management
          ========================= */}
          <TabsContent value="barbers" className="space-y-6">
            {/* Add Barber */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Add New Barber
                </CardTitle>
                <CardDescription>Create a new barber and manage their availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                  <div className="col-span-2">
                    <Label htmlFor="barber-name">Name</Label>
                    <Input
                      id="barber-name"
                      placeholder="e.g. Alex Johnson"
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newBarberActive}
                        onCheckedChange={(v) => setNewBarberActive(!!v)}
                        id="barber-active"
                      />
                      <Label htmlFor="barber-active">Active</Label>
                    </div>
                    <Button onClick={addBarber} className="ml-auto">
                      <Plus className="h-4 w-4 mr-2" /> Add Barber
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manage Existing Barbers */}
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

                            {/* Toggle Active/Delete Buttons */}
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from("barbers")
                                    .update({ is_active: !barber.is_active })
                                    .eq("id", barber.id);

                                  if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                  } else {
                                    toast({
                                      title: "Barber Updated",
                                      description: `${barber.name} is now ${barber.is_active ? "Inactive" : "Active"}`,
                                    });
                                    loadData();
                                  }
                                }}
                              >
                                {barber.is_active ? "Deactivate" : "Activate"}
                              </Button>

                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete ${barber.name}?`)) return;

                                  const { error } = await supabase
                                    .from("barbers")
                                    .delete()
                                    .eq("id", barber.id);

                                  if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                  } else {
                                    toast({ title: "Barber Deleted", description: `${barber.name} removed successfully` });
                                    loadData();
                                  }
                                }}
                              >
                                Delete
                              </Button>
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

          {/* =========================
              Services (Local JSON)
          ========================= */}
          <TabsContent value="services" className="space-y-6">
            {/* Export/Download Services Button */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Export Services Data
                </CardTitle>
                <CardDescription>
                  Download current services configuration as JSON file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => downloadServicesAsJSON(services)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Download Services JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add Service
                </CardTitle>
                <CardDescription>
                  Add new services and categorize for men or women (stored locally)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Name */}
                  <div className="col-span-2">
                    <Label htmlFor="svc-name">Name</Label>
                    <Input
                      id="svc-name"
                      placeholder="e.g. Classic Haircut"
                      value={svcName}
                      onChange={(e) => setSvcName(e.target.value)}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <Label htmlFor="svc-price">Price (DKK)</Label>
                    <Input
                      id="svc-price"
                      placeholder="e.g. 250"
                      inputMode="decimal"
                      value={svcPrice}
                      onChange={(e) => setSvcPrice(e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={svcCategory}
                      onValueChange={(v) => setSvcCategory(v as ServiceCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="col-span-4">
                    <Label htmlFor="svc-desc">Description</Label>
                    <Input
                      id="svc-desc"
                      placeholder="Short description..."
                      value={svcDesc}
                      onChange={(e) => setSvcDesc(e.target.value)}
                    />
                  </div>

                  {/* Features */}
                  <div className="col-span-4">
                    <Label htmlFor="svc-features">Features (comma-separated)</Label>
                    <Input
                      id="svc-features"
                      placeholder="e.g. Precision cut, Professional styling"
                      value={svcFeatures.join(", ")}
                      onChange={(e) => setSvcFeatures(
                        e.target.value.split(",").map(feature => feature.trim())
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <div className="col-span-4">
                    <Label htmlFor="svc-tags">Tags (comma-separated)</Label>
                    <Input
                      id="svc-tags"
                      placeholder="e.g. Popular, Classic"
                      value={svcTags.join(", ")}
                      onChange={(e) => setSvcTags(
                        e.target.value.split(",").map(tag => tag.trim())
                      )}
                    />
                  </div>

                  {/* Featured */}
                  <div className="col-span-4 flex items-center gap-2">
                    <Checkbox
                      checked={svcFeatured}
                      onCheckedChange={(checked) => setSvcFeatured(!!checked)}
                    />
                    <Label>Featured Service</Label>
                  </div>
                </div>

                {/* Add Service Button */}
                <div className="flex justify-end">
                  <Button onClick={addService}>
                    <Plus className="h-4 w-4 mr-2" /> Add Service
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Men's Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Men's Services ({menServices.length})</CardTitle>
                  <CardDescription>Active and inactive services for men</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menServices.map((svc) => {
                          const isEditing = editingServiceId === svc.id;
                          return (
                            <TableRow key={svc.id}>
                              {/* Name */}
                              <TableCell className="font-medium">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editSvc.name}
                                      onChange={(e) =>
                                        setEditSvc((p) => ({ ...p, name: e.target.value }))
                                      }
                                      placeholder="Service name"
                                    />
                                    <Input
                                      value={editSvc.description}
                                      onChange={(e) =>
                                        setEditSvc((p) => ({ ...p, description: e.target.value }))
                                      }
                                      placeholder="Description"
                                    />
                                    <Input
                                      value={editSvc.tags?.join(", ") || ""}
                                      onChange={(e) =>
                                        setEditSvc((p) => ({
                                          ...p,
                                          tags: e.target.value.split(",").map((t) => t.trim()),
                                        }))
                                      }
                                      placeholder="Tags (comma-separated)"
                                    />
                                    <Input
                                      value={editSvc.features?.join(", ") || ""}
                                      onChange={(e) =>
                                        setEditSvc((p) => ({
                                          ...p,
                                          features: e.target.value.split(",").map((f) => f.trim()),
                                        }))
                                      }
                                      placeholder="Features (comma-separated)"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">{svc.name}</div>
                                    {svc.description && (
                                      <div className="text-sm text-muted-foreground">{svc.description}</div>
                                    )}
                                    {svc.tags && svc.tags.length > 0 && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        Tags: {svc.tags.join(", ")}
                                      </div>
                                    )}
                                    {svc.features && svc.features.length > 0 && (
                                      <div className="text-xs text-green-600 mt-1">
                                        Features: {svc.features.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>

                              {/* Price */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    inputMode="decimal"
                                    value={editSvc.price}
                                    onChange={(e) =>
                                      setEditSvc((p) => ({ ...p, price: e.target.value }))
                                    }
                                    placeholder="Price"
                                  />
                                ) : svc.price != null ? (
                                  `DKK ${Number(svc.price).toFixed(0)}`
                                ) : (
                                  "-"
                                )}
                              </TableCell>

                              {/* Featured */}
                              <TableCell>
                                {isEditing ? (
                                  <Checkbox
                                    checked={editSvc.featured || false}
                                    onCheckedChange={(v) =>
                                      setEditSvc((p) => ({ ...p, featured: Boolean(v) }))
                                    }
                                  />
                                ) : svc.featured ? (
                                  <span className="text-yellow-500">⭐ Featured</span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>

                              {/* Active - FIXED with key prop for React reconciliation */}
                              <TableCell>
                                <Switch
                                  key={`men-${svc.id}-${svc.is_active}`}
                                  checked={svc.is_active}
                                  onCheckedChange={(checked) => toggleServiceActive(svc.id, checked)}
                                />
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" onClick={() => saveEditService(svc.id)}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditService}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditService(svc)}
                                    >
                                      <PencilLine className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => deleteService(svc.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {menServices.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-sm text-muted-foreground py-6"
                            >
                              No services for men yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Women's Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Women's Services ({womenServices.length})</CardTitle>
                  <CardDescription>Active and inactive services for women</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
  {womenServices.map((svc) => {
    const isEditing = editingServiceId === svc.id;
    return (
      <TableRow key={svc.id}>
        {/* Name */}
        <TableCell className="font-medium">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editSvc.name}
                onChange={(e) =>
                  setEditSvc((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Service name"
              />
              <Input
                value={editSvc.description}
                onChange={(e) =>
                  setEditSvc((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description"
              />
              <Input
                value={editSvc.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditSvc((p) => ({
                    ...p,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  }))
                }
                placeholder="Tags (comma-separated)"
              />
              <Input
                value={editSvc.features?.join(", ") || ""}
                onChange={(e) =>
                  setEditSvc((p) => ({
                    ...p,
                    features: e.target.value.split(",").map((f) => f.trim()),
                  }))
                }
                placeholder="Features (comma-separated)"
              />
            </div>
          ) : (
            <div>
              <div className="font-medium">{svc.name}</div>
              {svc.description && (
                <div className="text-sm text-muted-foreground">
                  {svc.description}
                </div>
              )}
              {svc.tags && svc.tags.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  Tags: {svc.tags.join(", ")}
                </div>
              )}
              {svc.features && svc.features.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  Features: {svc.features.join(", ")}
                </div>
              )}
            </div>
          )}
        </TableCell>

        {/* Price */}
        <TableCell>
          {isEditing ? (
            <Input
              inputMode="decimal"
              value={editSvc.price}
              onChange={(e) =>
                setEditSvc((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="Price"
            />
          ) : svc.price != null ? (
            `DKK ${Number(svc.price).toFixed(0)}`
          ) : (
            "-"
          )}
        </TableCell>

        {/* Featured */}
        <TableCell>
          {isEditing ? (
            <Checkbox
              checked={editSvc.featured || false}
              onCheckedChange={(v) =>
                setEditSvc((p) => ({ ...p, featured: Boolean(v) }))
              }
            />
          ) : svc.featured ? (
            <span className="text-yellow-500">⭐ Featured</span>
          ) : (
            "-"
          )}
        </TableCell>

        {/* Active */}
        <TableCell>
          <Switch
            key={`women-${svc.id}-${svc.is_active}`}
            checked={svc.is_active}
            onCheckedChange={(checked) => toggleServiceActive(svc.id, checked)}
          />
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          {isEditing ? (
            <div className="flex justify-end gap-1">
              <Button size="sm" onClick={() => saveEditService(svc.id)}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditService}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEditService(svc)}
              >
                <PencilLine className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteService(svc.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  })}

  {womenServices.length === 0 && (
    <TableRow>
      <TableCell
        colSpan={5}
        className="text-center text-sm text-muted-foreground py-6"
      >
        No services for women yet.
      </TableCell>
    </TableRow>
  )}
</TableBody>

                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}