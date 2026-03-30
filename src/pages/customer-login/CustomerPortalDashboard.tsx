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
  barber_id: string | null;
  barbers?: { name: string } | null;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
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
  return service.name_da || service.name;
};

const STATUS_MAP = {
  confirmed: { label: 'Bekræftet', color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  pending:   { label: 'Afventer',  color: '#92400e', bg: '#fffbeb', border: '#fcd34d' },
  cancelled: { label: 'Annulleret',color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' },
  completed: { label: 'Gennemført',color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
} as const;

/* ─── GLOBAL ANIMATIONS ──────────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes slideDown{ from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin     { to   { transform:rotate(360deg); } }
  @keyframes shimmer  { 0%,100%{opacity:.6} 50%{opacity:1} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; }
`;

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerPortalDashboard() {
  const [appointments, setAppointments]         = useState<Appointment[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [tab, setTab]                           = useState<'upcoming' | 'past'>('upcoming');
  const [toastMsg, setToastMsg]                 = useState('');
  const [cancelTarget, setCancelTarget]         = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading]       = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [hoveredCard, setHoveredCard]           = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast: shadToast } = useToast();
  const customerName  = sessionStorage.getItem('cp_name')  || 'Kunde';
  const customerEmail = sessionStorage.getItem('cp_email') || '';
  const customerPhone = sessionStorage.getItem('cp_phone') || '';

  useEffect(() => {
    if (!customerEmail || !customerPhone) navigate('/min-konto');
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!customerEmail || !customerPhone) return;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, barbers(name)`)
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
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
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

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && isFuture(aptDateTime(a)));
  const past     = appointments.filter(a => isPast(aptDateTime(a)) || a.status === 'cancelled');
  const displayList = tab === 'upcoming' ? upcoming : past;

  const canAct = (apt: Appointment) =>
    apt.status !== 'cancelled' && apt.status !== 'completed' && isFuture(aptDateTime(apt));

  /* ── palette ── */
  const navy  = '#0a2240';
  const gold  = '#c8a96e';
  const cream = '#faf7f2';
  const white = '#ffffff';
  const muted = '#6b7280';

  /* ── Loading ── */
  if (isLoading) {
    return (
      <>
        <style>{KEYFRAMES}</style>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: cream, flexDirection: 'column', gap: 20,
        }}>
          <div style={{
            width: 48, height: 48, border: `3px solid #e8e0d5`,
            borderTopColor: navy, borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }} />
          <p style={{ fontFamily: "'Outfit', sans-serif", color: muted, fontSize: 13 }}>Henter dine bookinger…</p>
        </div>
      </>
    );
  }

  /* ── Stat card data ── */
  const stats = [
    { icon: '📅', val: upcoming.length,                                                label: 'Kommende',    accent: navy },
    { icon: '✅', val: appointments.filter(a => a.status === 'completed').length,      label: 'Gennemførte', accent: '#166534' },
    { icon: '📋', val: appointments.length,                                            label: 'I alt',       accent: muted },
  ];

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: navy, color: white,
          padding: '13px 22px', borderRadius: 14,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 12px 36px rgba(10,34,64,.3)',
          borderLeft: `4px solid ${gold}`,
          animation: 'slideDown .3s ease',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {toastMsg}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: cream, fontFamily: "'Outfit', sans-serif" }}>

        {/* ── Header ── */}
        <header style={{
          background: navy,
          borderBottom: `2px solid ${gold}`,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{
            maxWidth: 820, margin: '0 auto', padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 68,
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                border: `1.5px solid ${gold}`,
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo192.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 15, fontWeight: 600, color: white, lineHeight: 1,
                }}>Frisør Nærum</div>
                <div style={{
                  fontSize: 10, color: gold, letterSpacing: '1.5px',
                  textTransform: 'uppercase', marginTop: 3,
                }}>Mine Bookinger</div>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                Hej,{' '}
                <strong style={{ color: gold, fontWeight: 600 }}>
                  {customerName.split(' ')[0]}
                </strong>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '7px 18px',
                  border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 9, background: 'transparent',
                  color: 'rgba(255,255,255,.6)',
                  fontSize: 12, fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.borderColor = gold;
                  (e.target as HTMLElement).style.color = gold;
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,.18)';
                  (e.target as HTMLElement).style.color = 'rgba(255,255,255,.6)';
                }}
              >
                Log ud
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 72px' }}>

          {/* Stats row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 16, marginBottom: 36,
          }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  background: white, borderRadius: 18, padding: '20px 22px',
                  boxShadow: '0 2px 12px rgba(10,34,64,.07)',
                  borderTop: `3px solid ${s.accent}`,
                  display: 'flex', alignItems: 'center', gap: 16,
                  animation: `fadeUp .5s ease ${i * .08}s both`,
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: muted, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: white,
            borderRadius: 14, padding: 4,
            border: '1px solid #ede8e0',
            marginBottom: 26,
            boxShadow: '0 1px 6px rgba(10,34,64,.05)',
          }}>
            {(['upcoming', 'past'] as const).map(t => {
              const active = tab === t;
              const label  = t === 'upcoming' ? `Kommende (${upcoming.length})` : `Historik (${past.length})`;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '11px 0',
                    border: 'none', borderRadius: 11,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer', transition: 'all .25s',
                    background: active ? navy : 'transparent',
                    color: active ? white : muted,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Cards or empty */}
          {displayList.length === 0 ? (
            <div style={{
              background: white, borderRadius: 22,
              padding: '60px 28px', textAlign: 'center',
              boxShadow: '0 2px 12px rgba(10,34,64,.06)',
              border: '1px solid #ede8e0',
              animation: 'fadeUp .4s ease both',
            }}>
              <div style={{ fontSize: 56, marginBottom: 18 }}>📅</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22, fontWeight: 600, color: navy, marginBottom: 10,
              }}>
                {tab === 'upcoming' ? 'Ingen kommende bookinger' : 'Ingen historik endnu'}
              </div>
              <p style={{ fontSize: 14, color: muted, marginBottom: 26 }}>
                {tab === 'upcoming'
                  ? 'Book din næste tid hos os online'
                  : 'Dine tidligere besøg vises her'}
              </p>
              {tab === 'upcoming' && (
                <button
                  onClick={() => navigate('/book')}
                  style={{
                    padding: '13px 30px', border: 'none', borderRadius: 12,
                    background: `linear-gradient(135deg, ${navy}, #1a3a5c)`,
                    color: white, fontSize: 14, fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,34,64,.25)',
                  }}
                >
                  Book en tid →
                </button>
              )}
            </div>
          ) : (
            displayList.map((apt, idx) => {
              const s = STATUS_MAP[apt.status] ?? STATUS_MAP.pending;
              const time = apt.appointment_time.substring(0, 5);
              const isHovered = hoveredCard === apt.id;

              const stripeGradient =
                apt.status === 'confirmed' ? `linear-gradient(90deg, ${navy}, ${gold})` :
                apt.status === 'pending'   ? '#f59e0b' :
                apt.status === 'cancelled' ? '#dc2626' : '#d1d5db';

              return (
                <div
                  key={apt.id}
                  onMouseEnter={() => setHoveredCard(apt.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: white, borderRadius: 20, overflow: 'hidden',
                    boxShadow: isHovered
                      ? '0 14px 36px rgba(10,34,64,.14)'
                      : '0 4px 16px rgba(10,34,64,.07)',
                    border: '1px solid #ede8e0',
                    marginBottom: 14,
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all .25s ease',
                    animation: `fadeUp .45s ease ${idx * .06}s both`,
                  }}
                >
                  {/* Stripe */}
                  <div style={{ height: 3, background: stripeGradient }} />

                  {/* Body */}
                  <div style={{ padding: '22px 24px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 18, fontWeight: 600, color: navy,
                        }}>
                          {getServiceName(apt.service_type)}
                        </div>
                        <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                          Frisør: {apt.barbers?.name ?? 'Ukendt'}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                        whiteSpace: 'nowrap',
                        color: s.color, background: s.bg,
                        border: `1px solid ${s.border}`,
                      }}>
                        {s.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 18 }}>
                      {[
                        { icon: '📅', text: fmtDate(apt.appointment_date) },
                        { icon: '🕐', text: `${time} · ${apt.duration ?? 30} min` },
                        ...(apt.price ? [{ icon: '💰', text: `${apt.price},00 kr.` }] : []),
                      ].map(item => (
                        <span key={item.icon} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: muted,
                        }}>
                          {item.icon} {item.text}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    {canAct(apt) && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => setRescheduleTarget(apt)}
                          style={{
                            flex: 1, padding: '10px 0',
                            border: `1.5px solid ${navy}`, borderRadius: 10,
                            background: navy, color: white,
                            fontSize: 12, fontWeight: 600,
                            fontFamily: "'Outfit', sans-serif",
                            cursor: 'pointer', transition: 'background .2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1a3a5c')}
                          onMouseLeave={e => (e.currentTarget.style.background = navy)}
                        >
                          ✏ Ændr tidspunkt
                        </button>
                        <button
                          onClick={() => setCancelTarget(apt)}
                          style={{
                            flex: 1, padding: '10px 0',
                            border: '1.5px solid #fca5a5', borderRadius: 10,
                            background: white, color: '#991b1b',
                            fontSize: 12, fontWeight: 600,
                            fontFamily: "'Outfit', sans-serif",
                            cursor: 'pointer', transition: 'background .2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = white)}
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

          {/* CTA Banner */}
          <div style={{
            marginTop: 44, padding: '34px 32px',
            background: navy, borderRadius: 22,
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {/* decorative circle */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 140, height: 140, borderRadius: '50%',
              background: `rgba(200,169,110,.1)`, pointerEvents: 'none',
            }} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontWeight: 600, color: white,
              marginBottom: 8, position: 'relative',
            }}>
              Klar til næste besøg?
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,.5)',
              marginBottom: 20, position: 'relative',
            }}>
              Book din næste tid nemt og hurtigt online
            </div>
            <button
              onClick={() => navigate('/book')}
              style={{
                padding: '12px 30px',
                border: `1.5px solid ${gold}`, borderRadius: 11,
                background: 'transparent', color: gold,
                fontSize: 14, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer', transition: 'all .2s', position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = gold;
                e.currentTarget.style.color = navy;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = gold;
              }}
            >
              ✂ Book ny tid
            </button>
          </div>
        </main>
      </div>

      {/* ── Cancel Dialog ── */}
      {cancelTarget && (
        <div
          onClick={() => setCancelTarget(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,34,64,.65)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16, animation: 'fadeIn .2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: white, borderRadius: 24,
              padding: '0 0 32px', maxWidth: 390, width: '100%',
              boxShadow: '0 40px 100px rgba(10,34,64,.35)',
              animation: 'slideDown .25s ease', overflow: 'hidden',
            }}
          >
            {/* Gold top bar */}
            <div style={{
              height: 4,
              background: `linear-gradient(90deg, ${gold}, #e8d5a3, ${gold})`,
            }} />
            <div style={{ padding: '28px 32px 0' }}>
              <div style={{ fontSize: 46, textAlign: 'center', marginBottom: 16 }}>🗑️</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 23, fontWeight: 600, color: navy,
                textAlign: 'center', marginBottom: 8,
              }}>
                Annuller Booking?
              </div>
              <p style={{ fontSize: 13, color: muted, textAlign: 'center', marginBottom: 20 }}>
                Denne handling kan ikke fortrydes.
              </p>
              <div style={{
                background: cream, border: '1px solid #ede8e0', borderRadius: 14,
                padding: '14px 18px', marginBottom: 24,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: navy, marginBottom: 4 }}>
                  {getServiceName(cancelTarget.service_type)}
                </div>
                <div style={{ fontSize: 12, color: muted }}>
                  {fmtDate(cancelTarget.appointment_date)} · {cancelTarget.appointment_time.substring(0, 5)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelLoading}
                  style={{
                    flex: 1, padding: 13,
                    border: '1.5px solid #ede8e0', borderRadius: 11,
                    background: white, color: navy,
                    fontSize: 14, fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Behold
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancelLoading}
                  style={{
                    flex: 1, padding: 13, border: 'none', borderRadius: 11,
                    background: '#dc2626', color: white,
                    fontSize: 14, fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                    opacity: cancelLoading ? .7 : 1,
                    transition: 'background .2s',
                  }}
                  onMouseEnter={e => { if (!cancelLoading) e.currentTarget.style.background = '#b91c1c'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#dc2626'; }}
                >
                  {cancelLoading ? 'Annullerer…' : 'Ja, annuller'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ── */}
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