// src/components/CustomerRescheduleModal.tsx
// 3-step reschedule modal: pick date → pick available time → confirm
// Reads barber_availability + existing appointments from Supabase

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface Appointment {
  id: string;
  barber_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  duration?: number;
}

interface Props {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDate: string, newTime: string) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

/* ─── HELPERS ────────────────────────────────────────────────────────── */
const MONTHS = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
const DAY_NAMES = ['søn','man','tir','ons','tor','fre','lør'];
const DAY_COL   = ['Ma','Ti','On','To','Fr','Lø','Sø'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDateLong = (d: string) =>
  capitalize(new Date(d).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const CSS = `
  .cr-overlay {
    position: fixed; inset: 0; background: rgba(10,37,64,.7); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 16px;
    animation: crFadeIn .2s ease;
  }
  .cr-modal {
    background: #fff; border-radius: 24px; width: 100%; max-width: 480px;
    box-shadow: 0 32px 80px rgba(10,37,64,.35); overflow: hidden;
    animation: crSlide .25s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .cr-gold-bar { height: 3px; background: linear-gradient(90deg,#c8a96e,#e8d5a3,#c8a96e); }
  .cr-inner    { padding: 28px; }

  /* header */
  .cr-header   { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .cr-title    { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #0a2540; }
  .cr-subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .cr-close    {
    background: #f3f4f6; border: none; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; font-size: 20px; color: #6b7280;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* stepper */
  .cr-steps  { display: flex; align-items: center; margin-bottom: 28px; }
  .cr-step   { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .cr-step-line { flex: 1; height: 2px; margin: 0 6px; margin-bottom: 18px; transition: background .3s; }
  .cr-step-circle {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; border: 2px solid; transition: all .3s;
  }
  .cr-step-label { font-size: 10px; font-weight: 600; }

  /* calendar */
  .cr-cal-nav   { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .cr-cal-month { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #0a2540; }
  .cr-cal-btn   {
    background: none; border: 1px solid #e8e0d5; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; font-size: 18px; color: #0a2540;
    display: flex; align-items: center; justify-content: center;
  }
  .cr-cal-grid    { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
  .cr-cal-dayname { text-align: center; font-size: 11px; font-weight: 600; color: #9ca3af; padding: 4px 0; }
  .cr-cal-day     {
    aspect-ratio: 1; border: none; border-radius: 8px; font-size: 13px;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s;
    display: flex; align-items: center; justify-content: center;
  }

  /* time grid */
  .cr-date-pill {
    background: #faf8f4; border: 1px solid #e8e0d5; border-radius: 10px;
    padding: 10px 14px; margin-bottom: 16px; font-size: 13px; font-weight: 600; color: #0a2540;
  }
  .cr-slot-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; max-height: 220px; overflow-y: auto; }
  .cr-slot {
    padding: 10px 0; border-radius: 9px; font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s;
    border: 1.5px solid;
  }

  /* confirm summary */
  .cr-summary {
    background: #f0fdf4; border: 1px solid #86efac; border-radius: 14px;
    padding: 18px; margin-bottom: 20px;
  }
  .cr-summary-head { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
  .cr-summary-row  { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #bbf7d0; }
  .cr-summary-key  { font-size: 13px; color: #6b7280; }
  .cr-summary-val  { font-size: 13px; font-weight: 600; color: #0a2540; }
  .cr-info-box {
    background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
    padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 20px;
  }

  /* buttons */
  .cr-btn-primary {
    flex: 2; padding: 13px; border: none; border-radius: 11px;
    background: linear-gradient(135deg,#0a2540,#1a3a5c);
    color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    box-shadow: 0 4px 12px rgba(10,37,64,.25); transition: all .2s;
  }
  .cr-btn-primary:disabled { opacity: .7; cursor: not-allowed; }
  .cr-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(10,37,64,.35); }
  .cr-btn-back {
    flex: 1; padding: 13px; border: 1.5px solid #e8e0d5; border-radius: 11px;
    background: #fff; color: #0a2540; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
  }
  .cr-btn-back:hover { border-color: #c8a96e; color: #c8a96e; }
  .cr-btn-row { display: flex; gap: 10px; }

  .cr-loading-row { text-align: center; padding: 24px 0; color: #6b7280; font-size: 14px; }
  .cr-spinner-sm  {
    display: inline-block; width: 20px; height: 20px;
    border: 2px solid #e8e0d5; border-top-color: #0a2540;
    border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 8px;
  }
  .cr-no-slots { text-align: center; padding: 28px 0; }
  .cr-no-slots-icon { font-size: 40px; margin-bottom: 10px; }
  .cr-no-slots-text { font-size: 14px; color: #6b7280; }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes crFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes crSlide  { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerRescheduleModal({ appointment, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep]                   = useState<1 | 2 | 3>(1);
  const [calYear, setCalYear]             = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]           = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedTime, setSelectedTime]   = useState('');
  const [slots, setSlots]                 = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [slotsError, setSlotsError]       = useState('');
  const [saving, setSaving]               = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) { setStep(1); setSelectedDate(''); setSelectedTime(''); setSlots([]); setSlotsError(''); }
  }, [isOpen]);

  // Load slots when date chosen
  useEffect(() => {
    if (step === 2 && selectedDate) loadSlots(selectedDate);
  }, [step, selectedDate]);

  const loadSlots = async (dateStr: string) => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      // 1. Check barber availability
      const { data: avail } = await supabase
        .from('barber_availability')
        .select('start_time, end_time')
        .eq('barber_id', appointment.barber_id)
        .lte('from_date', dateStr)
        .gte('to_date',   dateStr)
        .eq('is_available', true);

      if (!avail || avail.length === 0) {
        setSlotsError('Frisøren er ikke tilgængelig denne dag.');
        setSlots([]);
        return;
      }

      const { start_time, end_time } = avail[0];

      // 2. Get already-booked slots for this barber on this date
      const { data: booked } = await supabase
        .from('appointments')
        .select('appointment_time, duration')
        .eq('barber_id', appointment.barber_id)
        .eq('appointment_date', dateStr)
        .neq('id', appointment.id)   // exclude current appointment
        .neq('status', 'cancelled');

      const bookedSlots = booked || [];

      // 3. Build 30-min slots between start and end
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins   = eh * 60 + em;
      const duration  = appointment.duration ?? 30;

      const generated: TimeSlot[] = [];
      for (let m = startMins; m + duration <= endMins; m += 30) {
        const h   = Math.floor(m / 60);
        const min = m % 60;
        const time = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

        const isBooked = bookedSlots.some((b) => {
          const [bh, bm] = b.appointment_time.split(':').map(Number);
          const bs = bh * 60 + bm;
          const be = bs + (b.duration ?? 30);
          return m < be && m + duration > bs;
        });

        generated.push({ time, available: !isBooked });
      }

      setSlots(generated);
    } catch (err) {
      console.error('loadSlots error:', err);
      setSlotsError('Kunne ikke indlæse ledige tider. Prøv igen.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          status: 'pending',          // reset to pending for admin reconfirmation
        })
        .eq('id', appointment.id);

      if (error) throw error;
      onSuccess(selectedDate, selectedTime);
    } catch (err) {
      console.error('handleConfirm error:', err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Calendar helpers ── */
  const today = new Date(); today.setHours(0,0,0,0);
  const firstDayOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const pickDate = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    if (d < today) return;
    const str = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(str);
    setStep(2);
  };

  if (!isOpen) return null;

  /* ── Stepper config ── */
  const steps = [
    { n: 1, label: 'Dato'   },
    { n: 2, label: 'Tid'    },
    { n: 3, label: 'Bekræft'},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="cr-overlay" onClick={onClose}>
        <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cr-gold-bar" />
          <div className="cr-inner">

            {/* Header */}
            <div className="cr-header">
              <div>
                <div className="cr-title">Ændr Tidspunkt</div>
                <div className="cr-subtitle">{appointment.service_type}</div>
              </div>
              <button className="cr-close" onClick={onClose}>×</button>
            </div>

            {/* Steps */}
            <div className="cr-steps">
              {steps.map((s, i) => {
                const done    = step > s.n;
                const current = step === s.n;
                return (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'unset' }}>
                    <div className="cr-step">
                      <div
                        className="cr-step-circle"
                        style={{
                          background:   done ? '#c8a96e' : current ? '#0a2540' : '#fff',
                          borderColor:  done || current ? (done ? '#c8a96e' : '#0a2540') : '#e8e0d5',
                          color:        done || current ? '#fff' : '#9ca3af',
                        }}
                      >
                        {done ? '✓' : s.n}
                      </div>
                      <span
                        className="cr-step-label"
                        style={{ color: current ? '#0a2540' : done ? '#c8a96e' : '#9ca3af' }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="cr-step-line"
                        style={{ background: done ? '#c8a96e' : '#e8e0d5' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Step 1: Calendar ── */}
            {step === 1 && (
              <div>
                <div className="cr-cal-nav">
                  <button className="cr-cal-btn" onClick={prevMonth}>‹</button>
                  <span className="cr-cal-month">{MONTHS[calMonth]} {calYear}</span>
                  <button className="cr-cal-btn" onClick={nextMonth}>›</button>
                </div>
                <div className="cr-cal-grid" style={{ marginBottom: 4 }}>
                  {DAY_COL.map(d => (
                    <div key={d} className="cr-cal-dayname">{d}</div>
                  ))}
                </div>
                <div className="cr-cal-grid">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const d = new Date(calYear, calMonth, day);
                    const isPast = d < today;
                    const isSelected = selectedDate === `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    return (
                      <button
                        key={day}
                        className="cr-cal-day"
                        disabled={isPast}
                        onClick={() => pickDate(day)}
                        style={{
                          background:   isSelected ? '#0a2540' : 'transparent',
                          color:        isSelected ? '#fff' : isPast ? '#d1d5db' : '#0a2540',
                          fontWeight:   isSelected ? 700 : 400,
                          cursor:       isPast ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!isPast && !isSelected) e.currentTarget.style.background = '#f3f0eb'; }}
                        onMouseLeave={e => { if (!isPast && !isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 2: Time slots ── */}
            {step === 2 && (
              <div>
                <div className="cr-date-pill">📅 {fmtDateLong(selectedDate)}</div>

                {slotsLoading ? (
                  <div className="cr-loading-row">
                    <span className="cr-spinner-sm" />Indlæser ledige tider…
                  </div>
                ) : slotsError ? (
                  <div className="cr-no-slots">
                    <div className="cr-no-slots-icon">😔</div>
                    <div className="cr-no-slots-text">{slotsError}</div>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="cr-no-slots">
                    <div className="cr-no-slots-icon">😔</div>
                    <div className="cr-no-slots-text">Ingen ledige tider denne dag</div>
                  </div>
                ) : (
                  <div className="cr-slot-grid">
                    {slots.map(({ time, available }) => (
                      <button
                        key={time}
                        className="cr-slot"
                        disabled={!available}
                        onClick={() => { setSelectedTime(time); setStep(3); }}
                        style={{
                          background:   !available ? '#f9fafb' : selectedTime === time ? '#0a2540' : '#fff',
                          color:        !available ? '#d1d5db' : selectedTime === time ? '#fff' : '#0a2540',
                          borderColor:  !available ? '#e5e7eb' : selectedTime === time ? '#0a2540' : '#e8e0d5',
                          cursor:       !available ? 'not-allowed' : 'pointer',
                          textDecoration: !available ? 'line-through' : 'none',
                        }}
                        onMouseEnter={e => { if (available && selectedTime !== time) { e.currentTarget.style.borderColor = '#c8a96e'; e.currentTarget.style.background = '#faf8f4'; } }}
                        onMouseLeave={e => { if (available && selectedTime !== time) { e.currentTarget.style.borderColor = '#e8e0d5'; e.currentTarget.style.background = '#fff'; } }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <button
                    className="cr-btn-back"
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e0d5', borderRadius: 10, background: '#fff', color: '#6b7280', fontFamily: 'DM Sans', cursor: 'pointer', fontSize: 13 }}
                    onClick={() => setStep(1)}
                  >
                    ← Vælg anden dato
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 3 && (
              <div>
                <div className="cr-summary">
                  <div className="cr-summary-head">✓ Din nye aftale</div>
                  {[
                    ['Service',    appointment.service_type],
                    ['Ny dato',    fmtDateLong(selectedDate)],
                    ['Nyt tidspunkt', selectedTime],
                    ['Varighed',   `${appointment.duration ?? 30} min`],
                  ].map(([k, v]) => (
                    <div key={k} className="cr-summary-row">
                      <span className="cr-summary-key">{k}</span>
                      <span className="cr-summary-val">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="cr-info-box">
                  ℹ️ Din booking vil blive sat til <strong>"Afventer bekræftelse"</strong> og vil blive bekræftet af salonen.
                </div>

                <div className="cr-btn-row">
                  <button className="cr-btn-back" onClick={() => setStep(2)} disabled={saving}>
                    ← Tilbage
                  </button>
                  <button className="cr-btn-primary" onClick={handleConfirm} disabled={saving}>
                    {saving ? 'Gemmer…' : 'Bekræft ændring'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}