// ─────────────────────────────────────────────────────────────
// AdminDashboard.tsx  (slim orchestrator)
//
// Responsibilities:
//   • Auth check
//   • Load appointments, barbers, availability from Supabase
//   • Pass data + refresh callbacks down to tab components
//   • Render the top-level tab shell
//
// Each tab owns its own logic:
//   • AppointmentsTab  → cancel / delete appointments
//   • BarbersTab       → CRUD barbers + schedules + availability
//   • ServicesTab      → CRUD services (local JSON state)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Appointment, Barber, BarberAvailability, Service } from "./Types";
import { processServicesData } from "./Servicestab";
import AppointmentsTab from "./AppointmentsTab";
import BarbersTab      from "./Barberstab";
import ServicesTab     from "./Servicestab";
import servicesData    from "@/utils/services.json";

// ── Component ────────────────────────────────────────────────

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers,      setBarbers]      = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<BarberAvailability[]>([]);
  const [services,     setServices]     = useState<Service[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [activeTab,    setActiveTab]    = useState<"appointments" | "barbers" | "services">("appointments");

  const { toast }  = useToast();
  const navigate   = useNavigate();

  // ── Auth ─────────────────────────────────────────────────

  useEffect(() => {
    checkAuth();
    loadAll();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return; }
    const { data: adminUser, error } = await supabase
      .from("admin_users").select("*")
      .eq("user_id", session.user.id).eq("is_active", true).single();
    if (error || !adminUser) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      toast({ title: "Access Denied", description: "You don't have admin access.", variant: "destructive" });
    }
  };

  // ── Data loading ─────────────────────────────────────────

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [apptRes, barbersRes] = await Promise.all([
        supabase.from("appointments").select("*").order("appointment_date", { ascending: false }),
        supabase.from("barbers").select("*"),
      ]);
      if (apptRes.error)    throw apptRes.error;
      if (barbersRes.error) throw barbersRes.error;

      setAppointments(apptRes.data   || []);
      setBarbers(barbersRes.data     || []);
      setServices(processServicesData(servicesData as any[]));

      await loadAvailability();
    } catch (err) {
      console.error("Error loading data:", err);
      toast({ title: "Error", description: "Failed to load data. Please refresh.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailability = async () => {
    const { data, error } = await supabase.from("barber_availability").select("*");
    if (error) {
      toast({ title: "Error", description: "Failed to load availability.", variant: "destructive" });
      return;
    }
    setAvailability(data || []);
  };

  // ── Helpers passed to AppointmentsTab ────────────────────

  const activeBarberCount = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return barbers.filter((b) =>
      availability.some(
        (a) => a.barber_id === b.id && a.is_available && a.from_date <= today && a.to_date >= today
      )
    ).length;
  })();

  // ── Logout ───────────────────────────────────────────────

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  // ── Loading state ─────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="barbers">Barber Management</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* ── Appointments ── */}
          <TabsContent value="appointments">
            <AppointmentsTab
              appointments={appointments}
              barbers={barbers}
              services={services}
              activeBarberCount={activeBarberCount}
              onRefresh={loadAll}
            />
          </TabsContent>

          {/* ── Barbers ── */}
          <TabsContent value="barbers">
            <BarbersTab
              barbers={barbers}
              availability={availability}
              onRefresh={loadAll}
            />
          </TabsContent>

          {/* ── Services ── */}
          <TabsContent value="services">
            <ServicesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}