// ─────────────────────────────────────────────────────────────
// BarbersTab.tsx
// Manages barbers: list panel, weekly schedules, date-range
// availability, add / activate / delete barbers.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO, addDays, startOfWeek } from "date-fns";
import BarberPhotoUpload from "@/components/BarberPhotoUpload";
import {
  Clock, Plus, Trash2, Save, X, Copy, CalendarRange,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Barber, BarberAvailability, DaySchedule, WeekSchedule } from "./Types";

// ── Constants ────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_CLOSED: DaySchedule = { isOpen: false, startTime: "09:00", endTime: "18:00" };
const DEFAULT_OPEN:   DaySchedule = { isOpen: true,  startTime: "09:00", endTime: "18:00" };

// ── Week helpers ─────────────────────────────────────────────

const getWeekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });
const getWeekDates = (ws: Date) =>
  Array.from({ length: 7 }, (_, i) => format(addDays(ws, i), "yyyy-MM-dd"));

const seedWeekFromAvailability = (
  weekDates: string[], availability: BarberAvailability[], barberId: string
): WeekSchedule => {
  const schedule: WeekSchedule = Object.fromEntries(weekDates.map((d) => [d, { ...DEFAULT_CLOSED }]));
  for (const date of weekDates) {
    const match = availability.find(
      (a) => a.barber_id === barberId && a.from_date <= date && a.to_date >= date
    );
    if (match)
      schedule[date] = { isOpen: match.is_available, startTime: match.start_time, endTime: match.end_time };
  }
  return schedule;
};

// ── Avatar helpers ───────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "bg-emerald-100", text: "text-emerald-800" },
  { bg: "bg-blue-100",    text: "text-blue-800" },
  { bg: "bg-orange-100",  text: "text-orange-800" },
  { bg: "bg-purple-100",  text: "text-purple-800" },
  { bg: "bg-rose-100",    text: "text-rose-800" },
  { bg: "bg-teal-100",    text: "text-teal-800" },
];
const avatarColor = (idx: number) => AVATAR_COLORS[idx % AVATAR_COLORS.length];
const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

// ═══════════════════════════════════════════════════════════════
// RangeAvailabilityPanel
// ═══════════════════════════════════════════════════════════════

interface RangeAvailabilityPanelProps {
  barberId: string;
  barberName: string;
  availability: BarberAvailability[];
  onSaveRange: (
    barberId: string, isAvailable: boolean,
    startTime: string, endTime: string,
    fromDate: string, toDate: string
  ) => Promise<void>;
  onDeleteRange: (availId: string) => Promise<void>;
}

function RangeAvailabilityPanel({
  barberId, barberName, availability, onSaveRange, onDeleteRange,
}: RangeAvailabilityPanelProps) {
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [startTime,    setStartTime]    = useState("09:00");
  const [endTime,      setEndTime]      = useState("18:00");
  const [isAvailable,  setIsAvailable]  = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [isExpanded,   setIsExpanded]   = useState(false);
  const { toast } = useToast();

  const barberRanges = availability
    .filter((a) => a.barber_id === barberId)
    .sort((a, b) => b.from_date.localeCompare(a.from_date));

  const rangeDays = (from: string, to: string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;

  const validate = (): string | null => {
    if (!fromDate) return "Please select a start date.";
    if (!toDate)   return "Please select an end date.";
    if (toDate < fromDate) return "End date must be on or after start date.";
    if (!startTime || !endTime) return "Please set working hours.";
    if (endTime <= startTime) return "End time must be after start time.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast({ title: "Validation error", description: err, variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      await onSaveRange(barberId, isAvailable, startTime, endTime, fromDate, toDate);
      toast({
        title: "Range saved",
        description: `${barberName}: ${fromDate} → ${toDate} marked as ${isAvailable ? "available" : "unavailable"}.`,
      });
      setFromDate(""); setToDate(""); setStartTime("09:00"); setEndTime("18:00"); setIsAvailable(true);
    } catch {
      toast({ title: "Error", description: "Failed to save range.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Date Range Availability</span>
          {barberRanges.length > 0 && (
            <Badge className="bg-primary/10 text-primary text-xs">
              {barberRanges.length} range{barberRanges.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-5 border-t">
          {/* Form */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Add / update a range
            </p>

            {/* Availability toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-background">
              <div className={`flex items-center gap-2 flex-1 ${isAvailable ? "text-emerald-700" : "text-red-600"}`}>
                {isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {isAvailable ? "Barber is available (working)" : "Barber is unavailable (holiday / off)"}
                </span>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs mb-1 block">From date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    if (toDate && toDate < e.target.value) setToDate(e.target.value);
                  }}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To date</Label>
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate || format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {fromDate && toDate && toDate >= fromDate && (
              <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <CalendarRange className="h-3 w-3" />
                {rangeDays(fromDate, toDate)} day{rangeDays(fromDate, toDate) !== 1 ? "s" : ""} selected
                {" "}({fromDate === toDate ? "single day" : `${fromDate} – ${toDate}`})
              </div>
            )}

            {/* Hours (only when available) */}
            {isAvailable && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs mb-1 block">Start time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">End time</Label>
                  <Input type="time" value={endTime}   onChange={(e) => setEndTime(e.target.value)}   className="h-9 text-sm" />
                </div>
              </div>
            )}

            <Button
              className="w-full" size="sm"
              onClick={handleSave}
              disabled={isSaving || !fromDate || !toDate}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-3.5 w-3.5" /> Save Range</span>
              )}
            </Button>
          </div>

          {/* Existing ranges */}
          {barberRanges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Existing ranges</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {barberRanges.map((a) => {
                  const days  = rangeDays(a.from_date, a.to_date);
                  const isPast = a.to_date < format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm gap-2
                        ${isPast ? "opacity-50 bg-muted/20" : "bg-background"}`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium shrink-0 text-xs">
                            {a.from_date === a.to_date ? a.from_date : `${a.from_date} → ${a.to_date}`}
                          </span>
                          <Badge className="text-xs shrink-0 px-1.5 py-0">{days} day{days !== 1 ? "s" : ""}</Badge>
                          <Badge className={`text-xs shrink-0 px-1.5 py-0 ${a.is_available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                            {a.is_available ? "Available" : "Unavailable"}
                          </Badge>
                          {isPast && <Badge className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0">Past</Badge>}
                        </div>
                        {a.is_available && (
                          <span className="text-xs text-muted-foreground">{a.start_time} – {a.end_time}</span>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this range?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove availability range{" "}
                              <strong>{a.from_date}{a.from_date !== a.to_date ? ` → ${a.to_date}` : ""}</strong> for{" "}
                              <strong>{barberName}</strong>? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteRange(a.id)} className="bg-red-600 hover:bg-red-700">
                              Delete Range
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {barberRanges.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-2">No ranges set yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BarberDetailPanel — schedule + actions for one barber
// ═══════════════════════════════════════════════════════════════

interface BarberDetailPanelProps {
  barber: Barber;
  availability: BarberAvailability[];
  onUpdate: (
    barberId: string, isAvailable: boolean,
    startTime: string, endTime: string,
    fromDate: string, toDate: string
  ) => Promise<void>;
  onDeleteRange: (availId: string) => Promise<void>;
  onToggleActive: (barber: Barber) => Promise<void>;
  onDeleteBarber: (barber: Barber) => Promise<void>;
  onPhotoUpdate: (photoPath: string) => void;
}

function BarberDetailPanel({
  barber, availability, onUpdate, onDeleteRange, onToggleActive, onDeleteBarber, onPhotoUpdate,
}: BarberDetailPanelProps) {
  const [weekStart,  setWeekStart]  = useState<Date>(() => getWeekStart(new Date()));
  const [schedule,   setSchedule]   = useState<WeekSchedule>({});
  const [isSaving,   setIsSaving]   = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const weekDates  = getWeekDates(weekStart);
  const weekLabel  = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
  const isCurrentWeek =
    format(weekStart, "yyyy-MM-dd") === format(getWeekStart(new Date()), "yyyy-MM-dd");

  useEffect(() => {
    setSchedule(seedWeekFromAvailability(weekDates, availability, barber.id));
    setHasChanges(false);
  }, [weekStart, availability, barber.id]);

  const updateDay = (date: string, patch: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
    setHasChanges(true);
  };

  const applyPreset = (preset: "weekdays" | "everyday" | "closed") => {
    const next: WeekSchedule = {};
    weekDates.forEach((date, i) => {
      if (preset === "closed")        next[date] = { ...DEFAULT_CLOSED };
      else if (preset === "everyday") next[date] = { ...DEFAULT_OPEN };
      else                             next[date] = i < 5 ? { ...DEFAULT_OPEN } : { ...DEFAULT_CLOSED };
    });
    setSchedule(next);
    setHasChanges(true);
  };

  const saveWeek = async () => {
    setIsSaving(true);
    for (const date of weekDates) {
      const day = schedule[date];
      if (!day) continue;
      await onUpdate(barber.id, day.isOpen, day.startTime, day.endTime, date, date);
    }
    setIsSaving(false);
    setHasChanges(false);
  };

  const copyToNextWeek = async () => {
    const nextStart = addDays(weekStart, 7);
    const nextDates = getWeekDates(nextStart);
    setIsSaving(true);
    for (const [i, date] of nextDates.entries()) {
      const day = schedule[weekDates[i]];
      if (!day) continue;
      await onUpdate(barber.id, day.isOpen, day.startTime, day.endTime, date, date);
    }
    setIsSaving(false);
    setWeekStart(nextStart);
  };

  const workingToday = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return availability.some(
      (a) => a.barber_id === barber.id && a.is_available && a.from_date <= today && a.to_date >= today
    );
  })();

  const openDaysCount = weekDates.filter((d) => schedule[d]?.isOpen).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <BarberPhotoUpload
          barberId={barber.id}
          barberName={barber.name}
          currentPhotoPath={barber.photo_path}
          onPhotoUpdate={onPhotoUpdate}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold truncate">{barber.name}</h3>
            <Badge className={barber.is_active ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
              {barber.is_active ? "Active" : "Inactive"}
            </Badge>
            {workingToday && <Badge className="bg-blue-100 text-blue-700 text-xs">Working today</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {openDaysCount} day{openDaysCount !== 1 ? "s" : ""} scheduled this week
          </p>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => addDays(w, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{weekLabel}</p>
          {isCurrentWeek && <p className="text-xs text-blue-600 font-medium">Current week</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => addDays(w, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">Quick set:</span>
        {(["weekdays", "everyday", "closed"] as const).map((preset) => (
          <Button key={preset} variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => applyPreset(preset)}>
            {preset === "weekdays" ? "Mon – Fri" : preset === "everyday" ? "Every day" : "All closed"}
          </Button>
        ))}
      </div>

      {/* Day rows */}
      <div className="rounded-lg border overflow-hidden">
        {weekDates.map((date, i) => {
          const day      = schedule[date] ?? { ...DEFAULT_CLOSED };
          const todayRow = isToday(parseISO(date));
          return (
            <div
              key={date}
              className={`flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-b-0
                ${todayRow ? "bg-blue-50/70" : "bg-background hover:bg-muted/30"}
                ${!day.isOpen ? "opacity-60" : ""}`}
            >
              <Switch checked={day.isOpen} onCheckedChange={(v) => updateDay(date, { isOpen: v })} className="shrink-0" />
              <div className="w-[4.5rem] shrink-0">
                <span className={`text-sm font-semibold ${todayRow ? "text-blue-700" : ""}`}>{DAYS_OF_WEEK[i]}</span>
                <span className="block text-xs text-muted-foreground">{format(parseISO(date), "d MMM")}</span>
              </div>
              {day.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input type="time" value={day.startTime} onChange={(e) => updateDay(date, { startTime: e.target.value })} className="h-8 w-[105px] text-sm" />
                  <span className="text-muted-foreground text-sm shrink-0">–</span>
                  <Input type="time" value={day.endTime}   onChange={(e) => updateDay(date, { endTime: e.target.value })}   className="h-8 w-[105px] text-sm" />
                  {day.startTime && day.endTime && (
                    <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                      {(() => {
                        const [sh, sm] = day.startTime.split(":").map(Number);
                        const [eh, em] = day.endTime.split(":").map(Number);
                        const mins = (eh * 60 + em) - (sh * 60 + sm);
                        if (mins <= 0) return "";
                        const h = Math.floor(mins / 60), m = mins % 60;
                        return m === 0 ? `${h}h` : `${h}h ${m}m`;
                      })()}
                    </span>
                  )}
                </div>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Save + Copy */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={saveWeek} disabled={isSaving || !hasChanges} variant={hasChanges ? "default" : "outline"}>
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-3.5 w-3.5" />
              {hasChanges ? "Save Week" : "All saved"}
            </span>
          )}
        </Button>
        <Button variant="outline" onClick={copyToNextWeek} disabled={isSaving} title="Copy this week's schedule to next week">
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy to next week
        </Button>
      </div>

      {/* Date range panel */}
      <RangeAvailabilityPanel
        barberId={barber.id}
        barberName={barber.name}
        availability={availability}
        onSaveRange={onUpdate}
        onDeleteRange={onDeleteRange}
      />

      {/* Barber actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" className="flex-1 text-sm" onClick={() => onToggleActive(barber)}>
          {barber.is_active ? "Deactivate" : "Activate"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex-1 text-sm">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Barber
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {barber.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {barber.name} and all their availability data.
                Existing appointments will show "Unknown" barber. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteBarber(barber)} className="bg-red-600 hover:bg-red-700">
                Delete Barber
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BarbersTab — main export
// ═══════════════════════════════════════════════════════════════

interface BarbersTabProps {
  barbers: Barber[];
  availability: BarberAvailability[];
  onRefresh: () => Promise<void>;
}

export default function BarbersTab({ barbers, availability, onRefresh }: BarbersTabProps) {
  const [selectedId,    setSelectedId]    = useState<string | null>(barbers[0]?.id ?? null);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newActive,     setNewActive]     = useState(true);
  const { toast } = useToast();

  // Keep selectedId valid when barbers list changes
  useEffect(() => {
    if (barbers.length === 0) { setSelectedId(null); return; }
    if (!barbers.find((b) => b.id === selectedId)) setSelectedId(barbers[0].id);
  }, [barbers]);

  // ── DB helpers ───────────────────────────────────────────

  const addBarber = async () => {
    if (!newName.trim()) {
      toast({ title: "Name required", description: "Please enter a barber name.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("barbers").insert([{ name: newName.trim(), is_active: newActive }]);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewName(""); setNewActive(true); setShowAddForm(false);
    toast({ title: "Barber Added", description: "New barber added successfully." });
    await onRefresh();
  };

  const handleToggleActive = async (barber: Barber) => {
    const { error } = await supabase.from("barbers").update({ is_active: !barber.is_active }).eq("id", barber.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${barber.name} is now ${barber.is_active ? "Inactive" : "Active"}.` });
    await onRefresh();
  };

 const handleDeleteBarber = async (barber: Barber) => {
  try {
    // 1. Null-out barber_id on all their appointments
    const { error: reassignError } = await supabase
      .from("appointments")
      .update({ barber_id: null })
      .eq("barber_id", barber.id);
 
    if (reassignError) {
      toast({
        title: "Error",
        description: `Could not reassign appointments: ${reassignError.message}`,
        variant: "destructive",
      });
      return;
    }
 
    // 2. Delete availability rows
    await supabase.from("barber_availability").delete().eq("barber_id", barber.id);
 
    // 3. Delete the barber
    const { error } = await supabase.from("barbers").delete().eq("id", barber.id);
    if (error) throw error;
 
    toast({ title: "Deleted", description: `${barber.name} removed. Their appointments now show "Unknown" barber.` });
    await onRefresh();
  } catch (err: any) {
    toast({ title: "Error", description: err?.message || "Failed to delete barber.", variant: "destructive" });
  }
};

  const updateAvailability = async (
    barberId: string, isAvailable: boolean,
    startTime: string, endTime: string,
    fromDate: string, toDate: string
  ) => {
    if (fromDate !== toDate) {
      const { error } = await supabase.from("barber_availability").insert({
        barber_id: barberId, from_date: fromDate, to_date: toDate,
        is_available: isAvailable, start_time: startTime, end_time: endTime,
      });
      if (error) throw error;
    } else {
      const { data: existing, error: selErr } = await supabase
        .from("barber_availability").select("id")
        .eq("barber_id", barberId).eq("from_date", fromDate).eq("to_date", toDate)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing && (existing as any).id) {
        const { error } = await supabase.from("barber_availability")
          .update({ is_available: isAvailable, start_time: startTime, end_time: endTime })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("barber_availability").insert({
          barber_id: barberId, from_date: fromDate, to_date: toDate,
          is_available: isAvailable, start_time: startTime, end_time: endTime,
        });
        if (error) throw error;
      }
    }
    await onRefresh();
  };

  const handleDeleteRange = async (availId: string) => {
    const { error } = await supabase.from("barber_availability").delete().eq("id", availId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: "Availability range removed." });
    await onRefresh();
  };

  const handlePhotoUpdate = (barberId: string, photoPath: string) => {
    // optimistic update handled by parent re-fetch via onRefresh
    onRefresh();
  };

  // ── Sidebar helpers ──────────────────────────────────────

  const isWorkingToday = (barberId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return availability.some(
      (a) => a.barber_id === barberId && a.is_available && a.from_date <= today && a.to_date >= today
    );
  };

  const openDaysThisWeek = (barberId: string) => {
    const ws    = getWeekStart(new Date());
    const dates = getWeekDates(ws);
    return dates.filter((date) =>
      availability.some(
        (a) => a.barber_id === barberId && a.is_available && a.from_date <= date && a.to_date >= date
      )
    ).length;
  };

  const selectedBarber = barbers.find((b) => b.id === selectedId) ?? null;

  // ── Add form (shared between desktop sidebar and mobile) ─

  const AddBarberForm = ({ compact }: { compact?: boolean }) => (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <Input
        placeholder="Barber name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className={compact ? "h-8 text-sm" : ""}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter")  { addBarber(); }
          if (e.key === "Escape") { setShowAddForm(false); setNewName(""); }
        }}
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={newActive}
          onCheckedChange={setNewActive}
          className={compact ? "scale-75 origin-left" : ""}
        />
        <span className={compact ? "text-xs" : ""}>Active on creation</span>
      </div>
      <div className="flex gap-2">
        <Button
          size={compact ? "sm" : "default"}
          className={`flex-1 ${compact ? "h-7 text-xs" : ""}`}
          onClick={addBarber}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Button
          size={compact ? "sm" : "default"}
          variant="ghost"
          className={compact ? "h-7 text-xs" : ""}
          onClick={() => { setShowAddForm(false); setNewName(""); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Barber Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a barber to manage their schedule, availability, and settings.
          Use <strong>Date Range Availability</strong> for multi-day blocks like holidays.
        </p>
      </div>

      {/* ── Desktop: sidebar + detail ── */}
      <div className="hidden md:flex border rounded-xl overflow-hidden" style={{ minHeight: 480 }}>

        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r flex flex-col bg-muted/30">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Barbers ({barbers.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {barbers.map((barber, idx) => {
              const col     = avatarColor(idx);
              const active  = barber.id === selectedId;
              const working = isWorkingToday(barber.id);
              const days    = openDaysThisWeek(barber.id);
              return (
                <button
                  key={barber.id}
                  onClick={() => setSelectedId(barber.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2
                    ${active
                      ? "border-l-primary bg-background"
                      : "border-l-transparent hover:bg-muted/50"}`}
                >
                  <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${col.bg} ${col.text}`}>
                    {getInitials(barber.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{barber.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {barber.is_active ? `${days} day${days !== 1 ? "s" : ""} this week` : "Inactive"}
                    </p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${working ? "bg-emerald-500" : "bg-border"}`}
                    title={working ? "Working today" : "Not working today"}
                  />
                </button>
              );
            })}
            {barbers.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No barbers yet.</p>
            )}
          </div>

          {/* Add inline at bottom of sidebar */}
          <div className="border-t p-3">
            {showAddForm
              ? <AddBarberForm compact />
              : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <Plus className="h-4 w-4" /> Add barber
                </button>
              )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {selectedBarber ? (
            <div className="p-6">
              <BarberDetailPanel
                barber={selectedBarber}
                availability={availability}
                onUpdate={updateAvailability}
                onDeleteRange={handleDeleteRange}
                onToggleActive={handleToggleActive}
                onDeleteBarber={handleDeleteBarber}
                onPhotoUpdate={(path) => handlePhotoUpdate(selectedBarber.id, path)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a barber to manage their schedule.
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: accordion list ── */}
      <div className="md:hidden space-y-2">
        {/* Add barber (mobile) */}
        <Card>
          <CardContent className="pt-4 pb-4">
            {showAddForm
              ? <AddBarberForm />
              : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <Plus className="h-4 w-4" /> Add Barber
                </button>
              )}
          </CardContent>
        </Card>

        {barbers.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl">
            No barbers yet. Add one above.
          </div>
        )}

        {barbers.map((barber, idx) => {
          const col     = avatarColor(idx);
          const isOpen  = expandedId === barber.id;
          const working = isWorkingToday(barber.id);
          const days    = openDaysThisWeek(barber.id);
          return (
            <div key={barber.id} className="border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setExpandedId(isOpen ? null : barber.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${col.bg} ${col.text}`}>
                  {getInitials(barber.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{barber.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${working ? "bg-emerald-500" : "bg-border"}`} />
                    <p className="text-xs text-muted-foreground">
                      {barber.is_active
                        ? working
                          ? `Working today · ${days} day${days !== 1 ? "s" : ""} this week`
                          : `${days} day${days !== 1 ? "s" : ""} this week`
                        : "Inactive"}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4 pt-4">
                  <BarberDetailPanel
                    barber={barber}
                    availability={availability}
                    onUpdate={updateAvailability}
                    onDeleteRange={handleDeleteRange}
                    onToggleActive={handleToggleActive}
                    onDeleteBarber={handleDeleteBarber}
                    onPhotoUpdate={(path) => handlePhotoUpdate(barber.id, path)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}