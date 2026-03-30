// src/components/CustomerRescheduleModal.tsx
// 3-step reschedule modal: pick date → pick available time → confirm
// Reads barber_availability + existing appointments from Supabase
// Includes live availability re-check before saving

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseISO } from 'date-fns';

interface Appointment {
  id: string;
  barber_id: string | null;
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

/* ─── HELPERS ─────────────────────────────────────────────────────────── */
const MONTHS   = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
const DAY_COL  = ['Ma','Ti','On','To','Fr','Lø','Sø'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDateLong = (d: string) =>
  capitalize(new Date(d).toLocaleDateString('da-DK', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const navy  = '#0a2240';
const gold  = '#c8a96e';
const cream = '#faf7f2';
const white = '#ffffff';
const muted = '#6b7280';
const red   = '#dc2626';

/* ─── KEYFRAMES (only what can't be done inline) ─────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');
  @keyframes crFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes crSlide  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
`;

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerRescheduleModal({ appointment, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep]                 = useState<1 | 2 | 3>(1);
  const [calYear, setCalYear]           = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]         = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots]               = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError]     = useState('');
  const [saving, setSaving]             = useState(false);

  /* ── live re-check state ── */
  const [checking, setChecking]         = useState(false);
  const [checkResult, setCheckResult]   = useState<'idle' | 'available' | 'taken'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStep(1); setSelectedDate(''); setSelectedTime('');
      setSlots([]); setSlotsError(''); setCheckResult('idle');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 2 && selectedDate) loadSlots(selectedDate);
  }, [step, selectedDate]);

  /* Reset check result whenever user changes date/time */
  useEffect(() => { setCheckResult('idle'); }, [selectedDate, selectedTime]);

  /* ── Load slots ── */
  const loadSlots = async (dateStr: string) => {
    setSlotsLoading(true); setSlotsError('');
    try {
      const { data: avail } = await supabase
        .from('barber_availability')
        .select('start_time, end_time')
        .eq('barber_id', appointment.barber_id)
        .lte('from_date', dateStr)
        .gte('to_date', dateStr)
        .eq('is_available', true);

      if (!avail || avail.length === 0) {
        setSlotsError('Frisøren er ikke tilgængelig denne dag.'); setSlots([]); return;
      }

      const { start_time, end_time } = avail[0];
      const { data: booked } = await supabase
        .from('appointments')
        .select('appointment_time, duration')
        .eq('barber_id', appointment.barber_id)
        .eq('appointment_date', dateStr)
        .neq('id', appointment.id)
        .in('status', ['confirmed', 'pending']);

      // Normalise to "HH:MM" — DB may return "HH:MM:SS"
      const bookedSlots = (booked || []).map(b => ({
        ...b,
        appointment_time: b.appointment_time.slice(0, 5),
      }));

      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins   = eh * 60 + em;
      const duration  = appointment.duration ?? 30;
      const generated: TimeSlot[] = [];

      for (let m = startMins; m + duration <= endMins; m += 30) {
        const time = `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
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

  /* ── Shared helper: fetch conflicting booked slots ── */
  const fetchConflicts = async (dateStr: string, timeStr: string) => {
    const duration = appointment.duration ?? 30;
    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time, duration')
      .eq('barber_id', appointment.barber_id)
      .eq('appointment_date', dateStr)
      .neq('id', appointment.id)
      .in('status', ['confirmed', 'pending']);

    const [sh, sm] = timeStr.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd   = slotStart + duration;

    return (booked || []).some((b) => {
      const [bh, bm] = b.appointment_time.slice(0, 5).split(':').map(Number);
      const bs = bh * 60 + bm;
      const be = bs + (b.duration ?? 30);
      return slotStart < be && slotEnd > bs;
    });
  };

  /* ── Live re-check ── */
  const checkAvailability = async () => {
    setChecking(true); setCheckResult('idle');
    try {
      const conflict = await fetchConflicts(selectedDate, selectedTime);
      setCheckResult(conflict ? 'taken' : 'available');
    } catch {
      setCheckResult('idle');
    } finally {
      setChecking(false);
    }
  };

  /* ── Confirm save ── */
  const handleConfirm = async () => {
    setChecking(true);
    try {
      const conflict = await fetchConflicts(selectedDate, selectedTime);
      if (conflict) { setCheckResult('taken'); return; }
    } catch {
      return;
    } finally {
      setChecking(false);
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ appointment_date: selectedDate, appointment_time: selectedTime, status: 'pending' })
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

  const prevMonth = () => calMonth === 0 ? (setCalYear(y=>y-1), setCalMonth(11)) : setCalMonth(m=>m-1);
  const nextMonth = () => calMonth === 11 ? (setCalYear(y=>y+1), setCalMonth(0)) : setCalMonth(m=>m+1);

  const pickDate = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    if (d < today) return;
    const str = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(str); setStep(2);
  };

  if (!isOpen) return null;

  const steps = [{ n:1, label:'Dato' }, { n:2, label:'Tid' }, { n:3, label:'Bekræft' }];

  /* ── Check result banner ── */
  const CheckBanner = () => {
    if (checkResult === 'idle') return null;
    const ok = checkResult === 'available';
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`,
        color: ok ? '#166534' : '#991b1b',
        fontSize: 13, fontWeight: 600,
        animation: 'crFadeIn .25s ease',
      }}>
        <span style={{ fontSize: 18 }}>{ok ? '✅' : '❌'}</span>
        {ok
          ? 'Tidspunktet er ledigt — du kan bekræfte!'
          : 'Dette tidspunkt er desværre ikke længere ledigt. Vælg et andet.'}
      </div>
    );
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,34,64,.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 16,
          animation: 'crFadeIn .2s ease',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: white, borderRadius: 24,
            width: '100%', maxWidth: 480,
            boxShadow: '0 32px 80px rgba(10,34,64,.35)',
            overflow: 'hidden', animation: 'crSlide .25s ease',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {/* Gold bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg,${gold},#e8d5a3,${gold})` }} />

          <div style={{ padding: 28 }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:navy }}>
                  Ændr Tidspunkt
                </div>
                <div style={{ fontSize:13, color:muted, marginTop:4 }}>{appointment.service_type}</div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background:'#f3f4f6', border:'none', borderRadius:8,
                  width:32, height:32, cursor:'pointer', fontSize:20, color:muted,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}
              >×</button>
            </div>

            {/* Stepper */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
              {steps.map((s, i) => {
                const done    = step > s.n;
                const current = step === s.n;
                return (
                  <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'unset' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{
                        width:30, height:30, borderRadius:'50%', border:'2px solid',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, transition:'all .3s',
                        background: done ? gold : current ? navy : white,
                        borderColor: done ? gold : current ? navy : '#e8e0d5',
                        color: done || current ? white : '#9ca3af',
                      }}>
                        {done ? '✓' : s.n}
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color: current ? navy : done ? gold : '#9ca3af' }}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length-1 && (
                      <div style={{
                        flex:1, height:2, margin:'0 6px', marginBottom:18, transition:'background .3s',
                        background: done ? gold : '#e8e0d5',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── STEP 1: Calendar ── */}
            {step === 1 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1px solid #e8e0d5', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:navy, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:navy }}>
                    {MONTHS[calMonth]} {calYear}
                  </span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1px solid #e8e0d5', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:navy, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
                  {DAY_COL.map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#9ca3af', padding:'4px 0' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const d = new Date(calYear, calMonth, day);
                    const past = d < today;
                    const selStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const isSel  = selectedDate === selStr;
                    return (
                      <button
                        key={day}
                        disabled={past}
                        onClick={() => pickDate(day)}
                        onMouseEnter={e => { if (!past && !isSel) e.currentTarget.style.background = '#f3f0eb'; }}
                        onMouseLeave={e => { if (!past && !isSel) e.currentTarget.style.background = 'transparent'; }}
                        style={{
                          aspectRatio:'1', border:'none', borderRadius:8, fontSize:13,
                          cursor: past ? 'not-allowed' : 'pointer',
                          fontFamily:"'Outfit',sans-serif", transition:'all .15s',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background: isSel ? navy : 'transparent',
                          color: isSel ? white : past ? '#d1d5db' : navy,
                          fontWeight: isSel ? 700 : 400,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 2: Time slots ── */}
            {step === 2 && (
              <div>
                <div style={{ background:cream, border:'1px solid #ede8e0', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, fontWeight:600, color:navy }}>
                  📅 {fmtDateLong(selectedDate)}
                </div>

                {slotsLoading ? (
                  <div style={{ textAlign:'center', padding:'24px 0', color:muted, fontSize:14 }}>
                    <span style={{ display:'inline-block', width:20, height:20, border:'2px solid #e8e0d5', borderTopColor:navy, borderRadius:'50%', animation:'spin .7s linear infinite', verticalAlign:'middle', marginRight:8 }} />
                    Indlæser ledige tider…
                  </div>
                ) : slotsError ? (
                  <div style={{ textAlign:'center', padding:'28px 0' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>😔</div>
                    <div style={{ fontSize:14, color:muted }}>{slotsError}</div>
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'28px 0' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>😔</div>
                    <div style={{ fontSize:14, color:muted }}>Ingen ledige tider denne dag</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxHeight:220, overflowY:'auto' }}>
                    {slots.map(({ time, available }) => (
                      <button
                        key={time}
                        disabled={!available}
                        onClick={() => { setSelectedTime(time); setStep(3); }}
                        onMouseEnter={e => { if (available && selectedTime !== time) { e.currentTarget.style.borderColor = gold; e.currentTarget.style.background = '#faf8f4'; } }}
                        onMouseLeave={e => { if (available && selectedTime !== time) { e.currentTarget.style.borderColor = '#e8e0d5'; e.currentTarget.style.background = white; } }}
                        style={{
                          padding:'10px 0', borderRadius:9, fontSize:13, fontWeight:600,
                          fontFamily:"'Outfit',sans-serif", cursor: available ? 'pointer' : 'not-allowed',
                          transition:'all .15s', border:'1.5px solid',
                          background:   !available ? '#f9fafb' : white,
                          color:        !available ? '#d1d5db' : navy,
                          borderColor:  !available ? '#e5e7eb' : '#e8e0d5',
                          textDecoration: !available ? 'line-through' : 'none',
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ marginTop:16 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      width:'100%', padding:12, border:'1.5px solid #e8e0d5', borderRadius:10,
                      background:white, color:muted, fontFamily:"'Outfit',sans-serif",
                      cursor:'pointer', fontSize:13, fontWeight:500,
                    }}
                  >← Vælg anden dato</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm ── */}
            {step === 3 && (
              <div>
                {/* Summary box */}
                <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:14, padding:18, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>✓ Din nye aftale</div>
                  {[
                    ['Service',       appointment.service_type],
                    ['Ny dato',       fmtDateLong(selectedDate)],
                    ['Nyt tidspunkt', selectedTime],
                    ['Varighed',      `${appointment.duration ?? 30} min`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #bbf7d0' }}>
                      <span style={{ fontSize:13, color:muted }}>{k}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:navy }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* ── Live availability check ── */}
                <div style={{ marginBottom:16 }}>
                  <button
                    onClick={checkAvailability}
                    disabled={checking || saving}
                    style={{
                      width:'100%', padding:'11px 0',
                      border: `1.5px solid ${checkResult === 'available' ? '#86efac' : checkResult === 'taken' ? '#fca5a5' : gold}`,
                      borderRadius:11, cursor: checking ? 'not-allowed' : 'pointer',
                      background: checkResult === 'available' ? '#f0fdf4' : checkResult === 'taken' ? '#fef2f2' : cream,
                      color: checkResult === 'available' ? '#166534' : checkResult === 'taken' ? '#991b1b' : '#92400e',
                      fontSize:13, fontWeight:600,
                      fontFamily:"'Outfit',sans-serif",
                      transition:'all .2s',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}
                  >
                    {checking ? (
                      <>
                        <span style={{ display:'inline-block', width:16, height:16, border:'2px solid #e8e0d5', borderTopColor:navy, borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        Tjekker ledighed…
                      </>
                    ) : checkResult === 'available' ? '✅ Tidspunkt er ledigt' :
                       checkResult === 'taken'     ? '❌ Ikke længere ledigt' :
                       '🔍 Tjek om tidspunkt stadig er ledigt'}
                  </button>
                  {checkResult !== 'idle' && (
                    <div style={{
                      marginTop:10, padding:'10px 14px', borderRadius:10, fontSize:12, fontWeight:500,
                      background: checkResult === 'available' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${checkResult === 'available' ? '#86efac' : '#fca5a5'}`,
                      color: checkResult === 'available' ? '#166534' : '#991b1b',
                      animation:'crFadeIn .25s ease',
                    }}>
                      {checkResult === 'available'
                        ? 'Tidspunktet er ledigt lige nu. Du kan roligt bekræfte.'
                        : 'En anden har booket denne tid. Gå tilbage og vælg et andet tidspunkt.'}
                    </div>
                  )}
                </div>

                {/* Info note */}
                <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#92400e', marginBottom:20 }}>
                  ℹ️ Din booking vil blive sat til <strong>"Afventer bekræftelse"</strong> og vil blive bekræftet af salonen.
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button
                    onClick={() => setStep(2)}
                    disabled={saving || checking}
                    style={{
                      flex:1, padding:13, border:'1.5px solid #e8e0d5', borderRadius:11,
                      background:white, color:navy, fontSize:14, fontWeight:600,
                      fontFamily:"'Outfit',sans-serif", cursor:'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e0d5'; e.currentTarget.style.color = navy; }}
                  >← Tilbage</button>

                  <button
                    onClick={handleConfirm}
                    disabled={saving || checking || checkResult === 'taken'}
                    style={{
                      flex:2, padding:13, border:'none', borderRadius:11,
                      background: checkResult === 'taken' ? '#e5e7eb' : `linear-gradient(135deg,${navy},#1a3a5c)`,
                      color: checkResult === 'taken' ? '#9ca3af' : white,
                      fontSize:14, fontWeight:600,
                      fontFamily:"'Outfit',sans-serif",
                      cursor: saving || checking || checkResult === 'taken' ? 'not-allowed' : 'pointer',
                      opacity: saving || checking ? .7 : 1,
                      boxShadow: checkResult === 'taken' ? 'none' : '0 4px 12px rgba(10,34,64,.25)',
                      transition:'all .2s',
                    }}
                    onMouseEnter={e => { if (checkResult !== 'taken' && !saving && !checking) e.currentTarget.style.boxShadow = '0 8px 20px rgba(10,34,64,.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = checkResult === 'taken' ? 'none' : '0 4px 12px rgba(10,34,64,.25)'; }}
                  >
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