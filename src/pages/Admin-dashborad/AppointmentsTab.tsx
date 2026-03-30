// ─────────────────────────────────────────────────────────────
// AppointmentsTab.tsx
// Manages appointments: list, filter, sort, cancel, delete.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isFuture, parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calendar, Clock, Users, ArrowUpDown, Filter, Trash2, AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Appointment, Barber, Service } from "./Types";
import servicesData from "@/utils/services.json";

// ── Props ────────────────────────────────────────────────────

interface AppointmentsTabProps {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
  activeBarberCount: number;    // barbers available today
  onRefresh: () => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────

type SortCol = "date" | "time" | "customer" | "barber" | "status";
type DateFilter = "today" | "upcoming" | "all";

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":  return "bg-green-100 text-green-800";
    case "cancelled":  return "bg-red-100 text-red-800";
    case "completed":  return "bg-blue-100 text-blue-800";
    default:           return "bg-gray-100 text-gray-800";
  }
}

// ── Component ────────────────────────────────────────────────

export default function AppointmentsTab({
  appointments, barbers, services, activeBarberCount, onRefresh,
}: AppointmentsTabProps) {
  const [sortBy, setSortBy]           = useState<SortCol>("date");
  const [sortOrder, setSortOrder]     = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter]   = useState<DateFilter>("today");

  const { toast }    = useToast();
  const { language } = useLanguage();

  // ── Derived counts ────────────────────────────────────────

  const todayCount    = appointments.filter((a) => isToday(parseISO(a.appointment_date))).length;
  const upcomingCount = appointments.filter((a) => isFuture(parseISO(a.appointment_date))).length;

  // ── Label helpers ─────────────────────────────────────────

  const getBarberName = (id: string) =>
    barbers.find((b) => b.id === id)?.name ?? "Unknown";

  const getServiceLabel = (serviceType: string) => {
    const match = (servicesData as any[]).find(
      (s) => s.id === serviceType || s.name === serviceType ||
             s.id.toLowerCase().startsWith(serviceType.toLowerCase()) ||
             serviceType.toLowerCase().startsWith(s.id.toLowerCase())
    );
    if (!match) return serviceType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    return language === "da" && match.name_da ? match.name_da : match.name;
  };

  const getServicePrice = (serviceType: string) => {
    const match = services.find(
      (s) => s.id === serviceType || s.name === serviceType ||
             s.id.toLowerCase().startsWith(serviceType.toLowerCase()) ||
             serviceType.toLowerCase().startsWith(s.id.toLowerCase())
    );
    return match?.price != null ? `DKK ${Number(match.price).toFixed(0)}` : "—";
  };

  // ── Sort & filter ─────────────────────────────────────────

  const handleSort = (col: SortCol) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const processed = (() => {
    let list = [...appointments];

    // Date filter
    if (dateFilter === "today")    list = list.filter((a) => isToday(parseISO(a.appointment_date)));
    if (dateFilter === "upcoming") list = list.filter((a) => isFuture(parseISO(a.appointment_date)));

    // Status filter
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);

    // Sort
    list.sort((a, b) => {
      const dtA = `${a.appointment_date} ${a.appointment_time}`;
      const dtB = `${b.appointment_date} ${b.appointment_time}`;
      let cmp = 0;
      switch (sortBy) {
        case "date":     cmp = dtA.localeCompare(dtB); break;
        case "time":     cmp = a.appointment_time.localeCompare(b.appointment_time); break;
        case "customer": cmp = a.customer_name.localeCompare(b.customer_name); break;
        case "barber":   cmp = getBarberName(a.barber_id).localeCompare(getBarberName(b.barber_id)); break;
        case "status":   cmp = a.status.localeCompare(b.status); break;
      }
      return cmp !== 0 ? (sortOrder === "asc" ? cmp : -cmp) : dtA.localeCompare(dtB);
    });

    return list;
  })();

  // ── Actions ───────────────────────────────────────────────

  const cancelAppointment = async (appt: Appointment) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("appointments").select("*").eq("id", appt.id).single();
      if (fetchErr || !existing) throw new Error("Appointment not found");

      const { data: updated, error: updateErr } = await supabase
        .from("appointments").update({ status: "cancelled" }).eq("id", appt.id).select();
      if (updateErr || !updated?.length) throw new Error("Failed to update (check RLS policies)");

      const barberName  = getBarberName(appt.barber_id);
      const formattedDate = (() => {
        try { return format(parseISO(appt.appointment_date), "d. MMMM yyyy"); }
        catch { return appt.appointment_date; }
      })();

      const { error: notifErr } = await supabase.functions.invoke("send-cancellation-email", {
        body: {
          customerName:    appt.customer_name,
          customerEmail:   appt.customer_email,
          customerPhone:   appt.customer_phone,
          appointmentDate: formattedDate,
          appointmentTime: appt.appointment_time,
          barberName,
        },
      });
      if (notifErr) toast({ title: "Warning", description: "Cancelled but notification failed.", variant: "destructive" });

      await onRefresh();
      toast({ title: "Cancelled", description: `${appt.customer_name}'s appointment cancelled.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to cancel.", variant: "destructive" });
    }
  };

  const deleteAppointment = async (appt: Appointment) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("appointments").select("*").eq("id", appt.id).single();
      if (fetchErr) throw fetchErr;
      if (!existing) throw new Error("Appointment not found");

      const { data: deleted, error: deleteErr } = await supabase
        .from("appointments").delete().eq("id", appt.id).select();
      if (deleteErr) throw deleteErr;
      if (!deleted || deleted.length === 0) throw new Error("No rows deleted — check RLS policies");

      await new Promise((r) => setTimeout(r, 500));
      await onRefresh();
      toast({ title: "Deleted", description: `${appt.customer_name}'s appointment has been deleted.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete.", variant: "destructive" });
    }
  };

  // ── Sort button helper ────────────────────────────────────

  const SortBtn = ({ col, label }: { col: SortCol; label: string }) => (
    <Button variant="ghost" onClick={() => handleSort(col)} className="h-auto p-0 font-semibold hover:bg-transparent">
      {label} <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              {appointments.filter((a) => isToday(parseISO(a.appointment_date)) && a.status === "confirmed").length} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Future bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBarberCount}</div>
            <p className="text-xs text-muted-foreground">Available today</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Table card ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Manage and view all bookings</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Date filter tabs */}
              <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="today">Today ({todayCount})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming ({upcomingCount})</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
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
                  <TableHead><SortBtn col="customer" label="Customer" /></TableHead>
                  <TableHead><SortBtn col="date"     label="Date & Time" /></TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead><SortBtn col="barber"   label="Barber" /></TableHead>
                  <TableHead><SortBtn col="status"   label="Status" /></TableHead>
                  <TableHead>Booked On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.slice(0, 50).map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      <div className="font-medium">{appt.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{appt.customer_email}</div>
                      {appt.customer_phone && (
                        <div className="text-sm text-muted-foreground">{appt.customer_phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{format(parseISO(appt.appointment_date), "MMM d, yyyy")}</div>
                      <div className="text-sm text-muted-foreground">{appt.appointment_time}</div>
                    </TableCell>
                    <TableCell>{getServiceLabel(appt.service_type)}</TableCell>
                    <TableCell className="font-medium text-emerald-700">{getServicePrice(appt.service_type)}</TableCell>
                    <TableCell className="font-medium">{getBarberName(appt.barber_id)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(appt.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {appt.status !== "cancelled" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cancel {appt.customer_name}'s appointment on{" "}
                                  {format(parseISO(appt.appointment_date), "MMMM d, yyyy")} at {appt.appointment_time}?
                                  <br /><br />The customer will be notified via email.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelAppointment(appt)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Cancel Appointment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Permanently delete {appt.customer_name}'s appointment on{" "}
                                {format(parseISO(appt.appointment_date), "MMMM d, yyyy")} at {appt.appointment_time}?
                                <br /><br /><strong>This cannot be undone.</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAppointment(appt)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {processed.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {dateFilter === "today"    ? "No appointments today." :
                 dateFilter === "upcoming" ? "No upcoming appointments." :
                 statusFilter !== "all"    ? `No ${statusFilter} appointments found.` :
                                            "No appointments found."}
              </div>
            )}
            {processed.length > 50 && (
              <div className="text-center py-4 text-sm text-muted-foreground border-t">
                Showing first 50 of {processed.length} appointments
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}