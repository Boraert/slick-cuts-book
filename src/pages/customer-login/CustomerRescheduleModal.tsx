// src/components/CustomerRescheduleModal.tsx
// Reschedule modal — slot logic mirrors BookAppointment exactly
// Step 1: pick date  →  Step 2: pick time  →  Step 3: confirm

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

/* ─── HELPERS ─────────────────────────────────────────────────────────── */
const MONTHS  = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
const DAY_COL = ['Ma','Ti','On','To','Fr','Lø','Sø'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtLong    = (d: string) =>
  capitalize(new Date(d).toLocaleDateString('da-DK', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));

/** Generate every 30-min slot between startTime and endTime ("HH:MM:SS" or "HH:MM") */
const generateSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const start = new Date(`1970-01-01T${startTime}`);
  const end   = new Date(`1970-01-01T${endTime}`);
  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + 30);
  }
  return slots;
};

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const navy  = '#0a2240';
const gold  = '#c8a96e';
const cream = '#faf7f2';
const white = '#ffffff';
const muted = '#6b7280';

const KF = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');
  @keyframes crFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes crSlide  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
`;

/* ─── SPINNER ─────────────────────────────────────────────────────────── */
const Spinner = ({ size = 20 }: { size?: number }) => (
  <span style={{
    display:'inline-block', width:size, height:size,
    border:'2px solid #e8e0d5', borderTopColor:navy,
    borderRadius:'50%', animation:'spin .7s linear infinite',
    verticalAlign:'middle', marginRight:6,
  }} />
);

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerRescheduleModal({ appointment, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [calYear, setCalYear]         = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]       = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  /* slot state — same shape as BookAppointment */
  const [allSlots, setAllSlots]         = useState<string[]>([]);
  const [bookedSlots, setBookedSlots]   = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg]         = useState('');

  /* confirm state */
  const [saving, setSaving]           = useState(false);
  const [checking, setChecking]       = useState(false);
  const [checkResult, setCheckResult] = useState<'idle'|'available'|'taken'>('idle');

  /* reset when modal opens */
  useEffect(() => {
    if (isOpen) {
      setStep(1); setSelectedDate(''); setSelectedTime('');
      setAllSlots([]); setBookedSlots([]); setSlotsMsg(''); setCheckResult('idle');
    }
  }, [isOpen]);

  /* fetch slots whenever date is chosen on step 2 */
  useEffect(() => {
    if (step === 2 && selectedDate) fetchSlotsForDate(selectedDate);
  }, [step, selectedDate]);

  /* reset live-check on any selection change */
  useEffect(() => { setCheckResult('idle'); }, [selectedDate, selectedTime]);

  /* ── STEP 2: fetch availability + booked — mirrors BookAppointment exactly ── */
  const fetchSlotsForDate = async (dateStr: string) => {
    setSlotsLoading(true); setSlotsMsg(''); setAllSlots([]); setBookedSlots([]);
    try {
      /* 1. availability windows */
      const { data: avail, error: availErr } = await supabase
        .from('barber_availability')
        .select('start_time, end_time')
        .eq('barber_id', appointment.barber_id)
        .lte('from_date', dateStr)
        .gte('to_date',   dateStr)
        .eq('is_available', true);

      if (availErr) throw availErr;
      if (!avail || avail.length === 0) { setSlotsMsg('Frisøren er ikke tilgængelig denne dag.'); return; }

      /* 2. build slot list from all windows */
      let slots: string[] = [];
      avail.forEach((w: { start_time: string; end_time: string }) => {
        slots = [...slots, ...generateSlots(w.start_time, w.end_time)];
      });
      slots = [...new Set(slots)].sort();
      if (slots.length === 0) { setSlotsMsg('Ingen ledige tider på denne dato.'); return; }

      /* 3. booked slots — same filter as BookAppointment */
      const { data: booked, error: bookedErr } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('barber_id', appointment.barber_id)
        .eq('appointment_date', dateStr)
        .neq('id', appointment.id)              // exclude the appointment being rescheduled
        .in('status', ['confirmed', 'pending']); // ← same as BookAppointment

      if (bookedErr) throw bookedErr;

      const bookedNorm = (booked || []).map(
        (b: any) => (b.appointment_time as string).slice(0, 5)
      );

      console.debug('[Reschedule] slots:', slots, '| booked:', bookedNorm);
      setAllSlots(slots);
      setBookedSlots(bookedNorm);
    } catch (err) {
      console.error('fetchSlotsForDate error:', err);
      setSlotsMsg('Kunne ikke indlæse ledige tider. Prøv igen.');
    } finally {
      setSlotsLoading(false);
    }
  };

  /* ── Shared conflict check ── */
  const fetchConflict = async (dateStr: string, timeStr: string): Promise<boolean> => {
    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time, duration')
      .eq('barber_id', appointment.barber_id)
      .eq('appointment_date', dateStr)
      .neq('id', appointment.id)
      .in('status', ['confirmed', 'pending']);

    const duration  = appointment.duration ?? 30;
    const [sh, sm]  = timeStr.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd   = slotStart + duration;

    return (booked || []).some((b: any) => {
      const [bh, bm] = (b.appointment_time as string).slice(0, 5).split(':').map(Number);
      const bs = bh * 60 + bm;
      const be = bs + (b.duration ?? 30);
      return slotStart < be && slotEnd > bs;
    });
  };

  const checkAvailability = async () => {
    setChecking(true); setCheckResult('idle');
    try   { setCheckResult(await fetchConflict(selectedDate, selectedTime) ? 'taken' : 'available'); }
    catch { setCheckResult('idle'); }
    finally { setChecking(false); }
  };

  const handleConfirm = async () => {
    setChecking(true);
    try {
      if (await fetchConflict(selectedDate, selectedTime)) { setCheckResult('taken'); return; }
    } catch { return; }
    finally { setChecking(false); }

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
    } finally { setSaving(false); }
  };

  /* ── Calendar helpers ── */
  const today       = new Date(); today.setHours(0, 0, 0, 0);
  const firstOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => calMonth === 0  ? (setCalYear(y => y-1), setCalMonth(11)) : setCalMonth(m => m-1);
  const nextMonth = () => calMonth === 11 ? (setCalYear(y => y+1), setCalMonth(0))  : setCalMonth(m => m+1);

  const pickDate = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    if (d < today) return;
    const str = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(str); setStep(2);
  };

  if (!isOpen) return null;

  const steps = [{ n:1, label:'Dato' }, { n:2, label:'Tid' }, { n:3, label:'Bekræft' }];

  return (
    <>
      <style>{KF}</style>

      {/* Overlay */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(10,34,64,.7)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1100, padding:16, animation:'crFadeIn .2s ease',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background:white, borderRadius:24, width:'100%', maxWidth:480,
          boxShadow:'0 32px 80px rgba(10,34,64,.35)', overflow:'hidden',
          animation:'crSlide .25s ease', fontFamily:"'Outfit',sans-serif",
        }}>
          {/* Gold bar */}
          <div style={{ height:3, background:`linear-gradient(90deg,${gold},#e8d5a3,${gold})` }} />

          <div style={{ padding:28 }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:navy }}>Ændr Tidspunkt</div>
                <div style={{ fontSize:13, color:muted, marginTop:4 }}>{appointment.service_type}</div>
              </div>
              <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:20, color:muted, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
            </div>

            {/* Stepper */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
              {steps.map((s, i) => {
                const done = step > s.n; const current = step === s.n;
                return (
                  <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'unset' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', border:'2px solid', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all .3s', background: done?gold:current?navy:white, borderColor: done?gold:current?navy:'#e8e0d5', color: done||current?white:'#9ca3af' }}>
                        {done ? '✓' : s.n}
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color: current?navy:done?gold:'#9ca3af' }}>{s.label}</span>
                    </div>
                    {i < steps.length-1 && <div style={{ flex:1, height:2, margin:'0 6px', marginBottom:18, transition:'background .3s', background: done?gold:'#e8e0d5' }} />}
                  </div>
                );
              })}
            </div>

            {/* ══ STEP 1: Calendar ══ */}
            {step === 1 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1px solid #e8e0d5', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:navy, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:navy }}>{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1px solid #e8e0d5', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:navy, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
                  {DAY_COL.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#9ca3af', padding:'4px 0' }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const past   = new Date(calYear, calMonth, day) < today;
                    const selStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const isSel  = selectedDate === selStr;
                    return (
                      <button key={day} disabled={past} onClick={() => pickDate(day)}
                        onMouseEnter={e => { if (!past&&!isSel) e.currentTarget.style.background='#f3f0eb'; }}
                        onMouseLeave={e => { if (!past&&!isSel) e.currentTarget.style.background='transparent'; }}
                        style={{ aspectRatio:'1', border:'none', borderRadius:8, fontSize:13, cursor:past?'not-allowed':'pointer', fontFamily:"'Outfit',sans-serif", transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', background:isSel?navy:'transparent', color:isSel?white:past?'#d1d5db':navy, fontWeight:isSel?700:400 }}
                      >{day}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ STEP 2: Time grid ══ */}
            {step === 2 && (
              <div>
                <div style={{ background:cream, border:'1px solid #ede8e0', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, fontWeight:600, color:navy }}>
                  📅 {fmtLong(selectedDate)}
                </div>

                {/* Legend */}
                <div style={{ display:'flex', gap:16, marginBottom:12, fontSize:11, color:muted }}>
                  {[{ bg:'#f0fdf4', b:'#86efac', t:'Ledig' }, { bg:'#fef2f2', b:'#fca5a5', t:'Optaget' }].map(({ bg, b, t }) => (
                    <span key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:bg, border:`1px solid ${b}`, display:'inline-block' }} />{t}
                    </span>
                  ))}
                </div>

                {slotsLoading && (
                  <div style={{ textAlign:'center', padding:'28px 0', color:muted, fontSize:14 }}>
                    <Spinner />Indlæser ledige tider…
                  </div>
                )}

                {!slotsLoading && slotsMsg && (
                  <div style={{ textAlign:'center', padding:'28px 0' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>😔</div>
                    <div style={{ fontSize:14, color:muted }}>{slotsMsg}</div>
                  </div>
                )}

                {!slotsLoading && !slotsMsg && allSlots.length > 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxHeight:240, overflowY:'auto' }}>
                    {allSlots.map(time => {
                      const booked   = bookedSlots.includes(time);
                      const selected = selectedTime === time;
                      return (
                        <button key={time} disabled={booked}
                          onClick={() => { setSelectedTime(time); setStep(3); }}
                          onMouseEnter={e => { if (!booked&&!selected) { e.currentTarget.style.background='#fff7ed'; e.currentTarget.style.borderColor='#fb923c'; e.currentTarget.style.color='#c2410c'; } }}
                          onMouseLeave={e => { if (!booked&&!selected) { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#86efac'; e.currentTarget.style.color='#166534'; } }}
                          style={{
                            padding:'10px 0', borderRadius:9, fontSize:13, fontWeight:600,
                            fontFamily:"'Outfit',sans-serif", transition:'all .15s', border:'1.5px solid',
                            cursor: booked?'not-allowed':'pointer',
                            background: selected?navy:booked?'#fef2f2':'#f0fdf4',
                            color:      selected?white:booked?'#dc2626':'#166534',
                            borderColor:selected?navy:booked?'#fca5a5':'#86efac',
                            textDecoration: booked?'line-through':'none',
                          }}
                        >{time}</button>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop:16 }}>
                  <button onClick={() => setStep(1)} style={{ width:'100%', padding:12, border:'1.5px solid #e8e0d5', borderRadius:10, background:white, color:muted, fontFamily:"'Outfit',sans-serif", cursor:'pointer', fontSize:13, fontWeight:500 }}>
                    ← Vælg anden dato
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3: Confirm ══ */}
            {step === 3 && (
              <div>
                {/* Summary */}
                <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:14, padding:18, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>✓ Din nye aftale</div>
                  {[
                    ['Service', appointment.service_type],
                    ['Ny dato', fmtLong(selectedDate)],
                    ['Nyt tidspunkt', selectedTime],
                    ['Varighed', `${appointment.duration ?? 30} min`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #bbf7d0' }}>
                      <span style={{ fontSize:13, color:muted }}>{k}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:navy }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Live check */}
                <div style={{ marginBottom:16 }}>
                  <button onClick={checkAvailability} disabled={checking||saving} style={{
                    width:'100%', padding:'11px 0',
                    border:`1.5px solid ${checkResult==='available'?'#86efac':checkResult==='taken'?'#fca5a5':gold}`,
                    borderRadius:11, cursor:checking?'not-allowed':'pointer',
                    background: checkResult==='available'?'#f0fdf4':checkResult==='taken'?'#fef2f2':cream,
                    color: checkResult==='available'?'#166534':checkResult==='taken'?'#991b1b':'#92400e',
                    fontSize:13, fontWeight:600, fontFamily:"'Outfit',sans-serif",
                    transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  }}>
                    {checking ? <><Spinner size={16} />Tjekker ledighed…</> :
                     checkResult==='available' ? '✅ Tidspunkt er ledigt' :
                     checkResult==='taken'     ? '❌ Ikke længere ledigt' :
                     '🔍 Tjek om tidspunkt stadig er ledigt'}
                  </button>
                  {checkResult !== 'idle' && (
                    <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, fontSize:12, fontWeight:500, animation:'crFadeIn .25s ease', background:checkResult==='available'?'#f0fdf4':'#fef2f2', border:`1px solid ${checkResult==='available'?'#86efac':'#fca5a5'}`, color:checkResult==='available'?'#166534':'#991b1b' }}>
                      {checkResult==='available' ? 'Tidspunktet er ledigt lige nu. Du kan roligt bekræfte.' : 'En anden har booket denne tid. Gå tilbage og vælg et andet tidspunkt.'}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#92400e', marginBottom:20 }}>
                  ℹ️ Din booking sættes til <strong>"Afventer bekræftelse"</strong> og bekræftes af salonen.
                </div>

                {/* Buttons */}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setStep(2)} disabled={saving||checking}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=gold; e.currentTarget.style.color=gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e8e0d5'; e.currentTarget.style.color=navy; }}
                    style={{ flex:1, padding:13, border:'1.5px solid #e8e0d5', borderRadius:11, background:white, color:navy, fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif", cursor:'pointer', transition:'all .2s' }}>
                    ← Tilbage
                  </button>
                  <button onClick={handleConfirm} disabled={saving||checking||checkResult==='taken'}
                    onMouseEnter={e => { if (checkResult!=='taken'&&!saving&&!checking) e.currentTarget.style.boxShadow='0 8px 20px rgba(10,34,64,.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow=checkResult==='taken'?'none':'0 4px 12px rgba(10,34,64,.25)'; }}
                    style={{ flex:2, padding:13, border:'none', borderRadius:11, background:checkResult==='taken'?'#e5e7eb':`linear-gradient(135deg,${navy},#1a3a5c)`, color:checkResult==='taken'?'#9ca3af':white, fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif", cursor:saving||checking||checkResult==='taken'?'not-allowed':'pointer', opacity:saving||checking?0.7:1, boxShadow:checkResult==='taken'?'none':'0 4px 12px rgba(10,34,64,.25)', transition:'all .2s' }}>
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