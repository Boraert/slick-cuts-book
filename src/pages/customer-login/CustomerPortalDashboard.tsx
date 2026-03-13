// src/pages/CustomerPortalDashboard.tsx
// Frisør Nærum — My Bookings dashboard — Supabase connected
// Route: /min-konto/bookinger

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import CustomerRescheduleModal from './CustomerRescheduleModal';
import services from "@/utils/services.json";


/* ─── TYPES ──────────────────────────────────────────────────────────── */
interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  barber_id: string;
  service_type: string;
  appointment_date: string;   // 'YYYY-MM-DD'
  appointment_time: string;   // 'HH:MM' or 'HH:MM:SS'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  duration?: number;
  price?: number;
  created_at?: string;
}

/* ─── HELPERS ────────────────────────────────────────────────────────── */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fmtDate = (dateStr: string) =>
  capitalize(
    new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  );

const aptDateTime = (apt: Appointment): Date => {
  const d = parseISO(apt.appointment_date);
  const [h, m] = apt.appointment_time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

const getServiceName = (serviceId: string) => {
  const service = services.find(s => s.id === serviceId);
  if (!service) return serviceId;

  return "da" === "da"
    ? service.name_da || service.name
    : service.name;
};


const STATUS_MAP = {
  confirmed: { label: 'Bekræftet', color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  pending:   { label: 'Afventer',  color: '#92400e', bg: '#fffbeb', border: '#fcd34d' },
  cancelled: { label: 'Annulleret',color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' },
  completed: { label: 'Gennemført',color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
} as const;

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  button:focus { outline: none; }

  .cd-root { min-height: 100vh; background: #faf8f4; font-family: 'DM Sans', sans-serif; }

  /* header */
  .cd-header {
    background: #0a2540; border-bottom: 3px solid #c8a96e;
    position: sticky; top: 0; z-index: 100;
  }
  .cd-header-inner {
    max-width: 800px; margin: 0 auto; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .cd-logo-wrap { display: flex; align-items: center; gap: 12px; }
  .cd-logo-ring {
    width: 38px; height: 38px; border-radius: 10px;
    border: 1.5px solid #c8a96e;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .cd-logo-name   { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; color: #fff; line-height: 1; }
  .cd-logo-sub    { font-size: 10px; color: #c8a96e; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .cd-header-right { display: flex; align-items: center; gap: 14px; }
  .cd-welcome { font-size: 13px; color: rgba(255,255,255,.55); }
  .cd-welcome strong { color: #c8a96e; }
  .cd-logout {
    padding: 7px 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 8px;
    background: transparent; color: rgba(255,255,255,.65); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .cd-logout:hover { border-color: #c8a96e; color: #c8a96e; }

  /* toast */
  .cd-toast {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    background: #0a2540; color: #fff; padding: 13px 20px; border-radius: 12px;
    font-size: 14px; font-weight: 600; box-shadow: 0 8px 28px rgba(10,37,64,.35);
    border-left: 4px solid #c8a96e; animation: cdSlide .3s ease;
    font-family: 'DM Sans', sans-serif;
  }

  /* main */
  .cd-main { max-width: 800px; margin: 0 auto; padding: 36px 24px 60px; }

  /* stats */
  .cd-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 32px; }
  .cd-stat {
    background: #fff; border-radius: 16px; padding: 18px 20px;
    box-shadow: 0 2px 10px rgba(10,37,64,.06);
    display: flex; align-items: center; gap: 14px;
  }
  .cd-stat-icon { font-size: 26px; flex-shrink: 0; }
  .cd-stat-val  { font-size: 26px; font-weight: 800; line-height: 1; }
  .cd-stat-lbl  { font-size: 11px; color: #6b7280; font-weight: 500; margin-top: 3px; }

  /* tabs */
  .cd-tabs {
    display: flex; gap: 0; margin-bottom: 24px;
    background: #fff; border-radius: 12px; padding: 4px;
    border: 1px solid #e8e0d5;
  }
  .cd-tab {
    flex: 1; padding: 10px 0; border: none; border-radius: 9px;
    font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all .2s;
  }
  .cd-tab.active   { background: #0a2540; color: #fff; }
  .cd-tab.inactive { background: transparent; color: #6b7280; }
  .cd-tab.inactive:hover { color: #0a2540; }

  /* card */
  .cd-card {
    background: #fff; border-radius: 18px; overflow: hidden;
    box-shadow: 0 4px 16px rgba(10,37,64,.07); border: 1px solid #e8e0d5;
    margin-bottom: 14px; transition: all .2s;
    animation: cdFadeUp .4s ease both;
  }
  .cd-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(10,37,64,.12); }
  .cd-card:nth-child(1) { animation-delay: .04s }
  .cd-card:nth-child(2) { animation-delay: .08s }
  .cd-card:nth-child(3) { animation-delay: .12s }
  .cd-card:nth-child(4) { animation-delay: .16s }

  .cd-stripe { height: 3px; }
  .cd-card-body { padding: 20px 22px; }
  .cd-card-top  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .cd-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 600; color: #0a2540; }
  .cd-card-barber { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .cd-badge {
    padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;
    white-space: nowrap; border-width: 1px; border-style: solid;
  }
  .cd-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
  .cd-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7280; }
  .cd-actions { display: flex; gap: 10px; }
  .cd-btn-primary {
    flex: 1; padding: 10px 0; border: 1.5px solid #0a2540; border-radius: 9px;
    background: #0a2540; color: #fff; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .cd-btn-primary:hover { background: #1a3a5c; }
  .cd-btn-outline {
    flex: 1; padding: 10px 0; border: 1.5px solid #fca5a5; border-radius: 9px;
    background: #fff; color: #991b1b; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .cd-btn-outline:hover { background: #fef2f2; }

  /* empty */
  .cd-empty {
    background: #fff; border-radius: 20px; padding: 52px 24px; text-align: center;
    box-shadow: 0 2px 10px rgba(10,37,64,.06); border: 1px solid #e8e0d5;
  }
  .cd-empty-icon  { font-size: 52px; margin-bottom: 16px; }
  .cd-empty-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #0a2540; margin-bottom: 8px; }
  .cd-empty-sub   { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
  .cd-book-btn {
    padding: 12px 28px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #0a2540, #1a3a5c);
    color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    box-shadow: 0 4px 12px rgba(10,37,64,.25);
  }

  /* CTA banner */
  .cd-cta {
    margin-top: 40px; padding: 30px; background: #0a2540; border-radius: 20px;
    text-align: center; position: relative; overflow: hidden;
  }
  .cd-cta::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(200,169,110,.12); pointer-events: none;
  }
  .cd-cta-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 6px; position: relative; }
  .cd-cta-sub   { font-size: 13px; color: rgba(255,255,255,.55); margin-bottom: 18px; position: relative; }
  .cd-cta-btn {
    padding: 12px 28px; border: 1.5px solid #c8a96e; border-radius: 10px;
    background: transparent; color: #c8a96e; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; position: relative;
  }
  .cd-cta-btn:hover { background: #c8a96e; color: #0a2540; }

  /* loading */
  .cd-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #faf8f4; }
  .cd-spinner {
    width: 44px; height: 44px; border: 3px solid #e8e0d5; border-top-color: #0a2540;
    border-radius: 50%; animation: spin .7s linear infinite;
  }

  /* confirm dialog overlay */
  .cd-overlay {
    position: fixed; inset: 0; background: rgba(10,37,64,.65); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
    animation: cdFadeIn .2s ease;
  }
  .cd-dialog {
    background: #fff; border-radius: 22px; padding: 32px; max-width: 380px; width: 100%;
    box-shadow: 0 32px 80px rgba(10,37,64,.3);
    animation: cdSlide .25s ease;
  }
  .cd-dialog::before {
    content: ''; display: block; height: 3px; margin: -32px -32px 28px;
    background: linear-gradient(90deg, #c8a96e, #e8d5a3, #c8a96e);
    border-radius: 22px 22px 0 0;
  }
  .cd-dialog-icon  { font-size: 44px; text-align: center; margin-bottom: 16px; }
  .cd-dialog-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #0a2540; margin-bottom: 8px; text-align: center; }
  .cd-dialog-sub   { font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 20px; }
  .cd-dialog-info  {
    background: #faf8f4; border: 1px solid #e8e0d5; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 22px;
  }
  .cd-dialog-info-title { font-size: 14px; font-weight: 700; color: #0a2540; margin-bottom: 4px; }
  .cd-dialog-info-sub   { font-size: 12px; color: #6b7280; }
  .cd-dialog-actions    { display: flex; gap: 10px; }
  .cd-dialog-keep {
    flex: 1; padding: 13px; border: 1.5px solid #e8e0d5; border-radius: 10px;
    background: #fff; color: #0a2540; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
  }
  .cd-dialog-cancel {
    flex: 1; padding: 13px; border: none; border-radius: 10px;
    background: #dc2626; color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .cd-dialog-cancel:hover   { background: #b91c1c; }
  .cd-dialog-cancel:disabled{ opacity: .7; cursor: not-allowed; }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes cdFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cdSlide  { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cdFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 600px) {
    .cd-stats { grid-template-columns: 1fr 1fr; }
    .cd-stats .cd-stat:last-child { grid-column: 1/-1; }
    .cd-meta  { gap: 10px; }
    .cd-header-inner { padding: 0 16px; }
  }
`;

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerPortalDashboard() {
  const [appointments, setAppointments]         = useState<Appointment[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [tab, setTab]                           = useState<'upcoming' | 'past'>('upcoming');
  const [toast, setToast]                       = useState('');
  const [cancelTarget, setCancelTarget]         = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading]       = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const navigate = useNavigate();
  const { toast: shadToast } = useToast();
  const customerName  = sessionStorage.getItem('cp_name')  || 'Kunde';
  const customerEmail = sessionStorage.getItem('cp_email') || '';
  const customerPhone = sessionStorage.getItem('cp_phone') || '';

  // Auth guard
  useEffect(() => {
    if (!customerEmail || !customerPhone) {
      navigate('/min-konto');
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!customerEmail || !customerPhone) return;
    try {
      const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      barbers (
        name
      )
    `)
    .eq('customer_email', customerEmail)
    .eq('customer_phone', customerPhone)
    .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('loadAppointments error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [customerEmail, customerPhone]);


  
  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cp_email');
    sessionStorage.removeItem('cp_phone');
    sessionStorage.removeItem('cp_name');
    navigate('/min-konto');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', cancelTarget.id);

      if (error) throw error;

      showToast('✓ Booking annulleret.');
      setCancelTarget(null);
      await loadAppointments();
    } catch (err) {
      console.error('Cancel error:', err);
      showToast('⚠ Kunne ikke annullere. Prøv igen.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Split into upcoming / past
  const upcoming = appointments.filter(
    (a) => a.status !== 'cancelled' && isFuture(aptDateTime(a))
  );
  const past = appointments.filter(
    (a) => isPast(aptDateTime(a)) || a.status === 'cancelled'
  );
  const displayList = tab === 'upcoming' ? upcoming : past;

  const canAct = (apt: Appointment) =>
    apt.status !== 'cancelled' &&
    apt.status !== 'completed' &&
    isFuture(aptDateTime(apt));

  if (isLoading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cd-loading">
          <div className="cd-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="cd-toast">{toast}</div>}

      <div className="cd-root">
        {/* Header */}
        <header className="cd-header">
          <div className="cd-header-inner">
            <div className="cd-logo-wrap">
              
                <img className="cd-logo-ring"
                src="/logo192.png" 
                alt="Frisør Nærum Logo" 
                
              />
              <div>
                <div className="cd-logo-name">Frisør Nærum</div>
                
                <div className="cd-logo-sub">Mine Bookinger</div>
              </div>
            </div>
            <div className="cd-header-right">
              <span className="cd-welcome">
                Hej, <strong>{customerName.split(' ')[0]}</strong>
              </span>
              <button className="cd-logout" onClick={handleLogout}>Log ud</button>
            </div>
          </div>
        </header>

        <main className="cd-main">
          {/* Stats */}
          <div className="cd-stats">
            {[
              { icon: '📅', val: upcoming.length, lbl: 'Kommende',    color: '#0a2540' },
              { icon: '✅', val: appointments.filter(a => a.status === 'completed').length, lbl: 'Gennemførte', color: '#166534' },
              { icon: '📋', val: appointments.length, lbl: 'I alt',    color: '#6b7280' },
            ].map((s) => (
              <div key={s.lbl} className="cd-stat" style={{ borderTop: `3px solid ${s.color}` }}>
                <span className="cd-stat-icon">{s.icon}</span>
                <div>
                  <div className="cd-stat-val" style={{ color: s.color }}>{s.val}</div>
                  <div className="cd-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="cd-tabs">
            <button
              className={`cd-tab ${tab === 'upcoming' ? 'active' : 'inactive'}`}
              onClick={() => setTab('upcoming')}
            >
              Kommende ({upcoming.length})
            </button>
            <button
              className={`cd-tab ${tab === 'past' ? 'active' : 'inactive'}`}
              onClick={() => setTab('past')}
            >
              Historik ({past.length})
            </button>
          </div>

          {/* Appointment Cards */}
          {displayList.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon">📅</div>
              <div className="cd-empty-title">
                {tab === 'upcoming' ? 'Ingen kommende bookinger' : 'Ingen historik endnu'}
              </div>
              <p className="cd-empty-sub">
                {tab === 'upcoming'
                  ? 'Book din næste tid hos os online'
                  : 'Dine tidligere besøg vises her'}
              </p>
              {tab === 'upcoming' && (
                <button className="cd-book-btn" onClick={() => navigate('/book')}>
                  Book en tid →
                </button>
              )}
            </div>
          ) : (
            displayList.map((apt) => {
              const s    = STATUS_MAP[apt.status] ?? STATUS_MAP.pending;
              const time = apt.appointment_time.substring(0, 5);
              const stripe =
                apt.status === 'confirmed'  ? `linear-gradient(90deg,#0a2540,#c8a96e)` :
                apt.status === 'pending'    ? '#f59e0b' :
                apt.status === 'cancelled'  ? '#dc2626' : '#d1d5db';

              return (
                <div key={apt.id} className="cd-card">
                  <div className="cd-stripe" style={{ background: stripe }} />
                  <div className="cd-card-body">
                    <div className="cd-card-top">
                      <div>
                        
                        <div className="cd-card-title">{getServiceName(apt.service_type)}</div>

                        
                        <div className="cd-card-barber"> Frisør: {apt.barbers.name || "Ukendt"}</div>
                        

                      </div>
                      <span
                        className="cd-badge"
                        style={{ color: s.color, background: s.bg, borderColor: s.border }}
                      >
                        {s.label}
                      </span>
                    </div>

                    <div className="cd-meta">
                      <span className="cd-meta-item">📅 {fmtDate(apt.appointment_date)}</span>
                      <span className="cd-meta-item">🕐 {time} · {apt.duration ?? 30} min</span>
                      {apt.price && (
                        <span className="cd-meta-item">💰 {apt.price},00 kr.</span>
                      )}
                    </div>

                    {canAct(apt) && (
                      <div className="cd-actions">
                        <button
                          className="cd-btn-primary"
                          onClick={() => setRescheduleTarget(apt)}
                        >
                          ✏ Ændr tidspunkt
                        </button>
                        <button
                          className="cd-btn-outline"
                          onClick={() => setCancelTarget(apt)}
                        >
                          ✕ Annuller
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* CTA */}
          <div className="cd-cta">
            <div className="cd-cta-title">Klar til næste besøg?</div>
            <div className="cd-cta-sub">Book din næste tid nemt og hurtigt online</div>
            <button className="cd-cta-btn" onClick={() => navigate('/book')}>
              ✂ Book ny tid
            </button>
          </div>
        </main>
      </div>

      {/* Cancel confirm dialog */}
      {cancelTarget && (
        <div className="cd-overlay" onClick={() => setCancelTarget(null)}>
          <div className="cd-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cd-dialog-icon">🗑️</div>
            <div className="cd-dialog-title">Annuller Booking?</div>
            <p className="cd-dialog-sub">Denne handling kan ikke fortrydes.</p>
            <div className="cd-dialog-info">
              <div className="cd-dialog-info-title">{cancelTarget.service_type}</div>
              <div className="cd-dialog-info-sub">
                {fmtDate(cancelTarget.appointment_date)} · {cancelTarget.appointment_time.substring(0, 5)}
              </div>
            </div>
            <div className="cd-dialog-actions">
              <button className="cd-dialog-keep" onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
                Behold
              </button>
              <button className="cd-dialog-cancel" onClick={handleCancelConfirm} disabled={cancelLoading}>
                {cancelLoading ? 'Annullerer…' : 'Ja, annuller'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <CustomerRescheduleModal
          appointment={rescheduleTarget}
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={async (newDate, newTime) => {
            showToast(`✓ Booking ændret til ${fmtDate(newDate)} kl. ${newTime}`);
            setRescheduleTarget(null);
            await loadAppointments();
          }}
        />
      )}
    </>
  );
}