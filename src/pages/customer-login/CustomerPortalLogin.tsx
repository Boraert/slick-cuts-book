// src/pages/CustomerPortalLogin.tsx
// Branded Frisør Nærum customer login — Supabase connected
// Route: /min-konto

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/* ─── VALIDATION ─────────────────────────────────────────────────────── */
const schema = z.object({
  email: z.string().email('Ugyldig email-adresse'),
  phone: z
    .string()
    .min(1, 'Telefonnummer er påkrævet')
    .refine(
      (v) => v.replace(/\D/g, '').length >= 8,
      'Telefonnummer skal indeholde mindst 8 cifre'
    ),
});
type FormData = z.infer<typeof schema>;

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus { outline: none; }
  button:focus { outline: none; }

  .cp-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Sans', sans-serif;
  }

  /* LEFT — navy brand panel */
  .cp-left {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 48px;
    background: linear-gradient(160deg, #0a2540 0%, #0d3360 60%, #0a2540 100%);
    overflow: hidden;
  }
  .cp-left::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200,169,110,.13) 0%, transparent 70%);
    pointer-events: none;
  }
  .cp-left::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200,169,110,.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .cp-pattern {
    position: absolute; inset: 0; pointer-events: none;
    background-image: repeating-linear-gradient(
      45deg, transparent, transparent 40px,
      rgba(200,169,110,.025) 40px, rgba(200,169,110,.025) 41px
    );
  }

  .cp-brand   { position: relative; z-index: 1; animation: cpFadeUp .7s ease both; }
  .cp-logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1.5px solid #c8a96e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  background: rgba(200,169,110,.1);
  margin-bottom: 24px;
}

.cp-logo img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

  .cp-name    { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #fff; line-height: 1.1; }
  .cp-sub     { font-size: 11px; color: #c8a96e; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; font-weight: 500; }

  .cp-divider { display: flex; align-items: center; gap: 12px; margin: 28px 0; }
  .cp-dline   { flex: 1; height: 1px; }
  .cp-dline.l { background: linear-gradient(to right, transparent, #c8a96e); }
  .cp-dline.r { background: linear-gradient(to left,  transparent, #c8a96e); }
  .cp-scissors{ font-size: 16px; color: #c8a96e; }

  .cp-quote   {
    font-family: 'Playfair Display', serif; font-style: italic;
    font-size: 20px; color: rgba(255,255,255,.5); line-height: 1.6;
    max-width: 300px; position: relative; z-index: 1;
    animation: cpFadeUp .7s ease .15s both;
  }

  .cp-perks   { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; animation: cpFadeUp .7s ease .3s both; }
  .cp-perk    { display: flex; align-items: center; gap: 12px; font-size: 13px; color: rgba(255,255,255,.6); }
  .cp-dot     { width: 6px; height: 6px; border-radius: 50%; background: #c8a96e; flex-shrink: 0; }
  .cp-copy    { position: relative; z-index: 1; font-size: 11px; color: rgba(255,255,255,.2); letter-spacing: 1px; }

  /* RIGHT — cream form panel */
  .cp-right {
    display: flex; align-items: center; justify-content: center;
    background: #faf8f4; padding: 48px 40px;
  }
  .cp-form-wrap { width: 100%; max-width: 380px; animation: cpFadeUp .6s ease .1s both; }

  .cp-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; background: #0a2540; border-radius: 20px;
    font-size: 11px; font-weight: 600; color: #c8a96e;
    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px;
  }
  .cp-title  { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #0a2540; line-height: 1.15; margin-bottom: 8px; }
  .cp-desc   { font-size: 14px; color: #6b7280; margin-bottom: 32px; }

  .cp-label  { display: block; font-size: 11px; font-weight: 600; color: #0a2540; letter-spacing: .8px; text-transform: uppercase; margin-bottom: 8px; }
  .cp-input  {
    width: 100%; padding: 13px 16px; border: 1.5px solid #e8e0d5; border-radius: 10px;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    background: #fff; color: #0a2540; transition: border-color .2s, box-shadow .2s;
  }
  .cp-input:focus   { border-color: #c8a96e; box-shadow: 0 0 0 3px rgba(200,169,110,.12); }
  .cp-input::placeholder { color: #9ca3af; }
  .cp-input-wrap    { position: relative; }
  .cp-input-prefix  {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 12px; font-weight: 600; color: #9ca3af; pointer-events: none;
  }

  .cp-error {
    background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px;
    padding: 11px 14px; font-size: 13px; color: #991b1b;
    margin-bottom: 18px; display: flex; align-items: flex-start; gap: 8px;
  }

  .cp-submit {
    width: 100%; padding: 14px; border: none; border-radius: 12px;
    background: linear-gradient(135deg, #0a2540, #1a3a5c);
    color: #fff; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    box-shadow: 0 4px 16px rgba(10,37,64,.3); transition: all .2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    letter-spacing: .3px; margin-top: 8px;
  }
  .cp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(10,37,64,.4); }
  .cp-submit:disabled { opacity: .7; cursor: not-allowed; }

  .cp-link-btn {
    width: 100%; padding: 13px; border: 1.5px solid #e8e0d5; border-radius: 12px;
    background: #fff; color: #0a2540; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; margin-top: 10px;
  }
  .cp-link-btn:hover { border-color: #c8a96e; color: #c8a96e; }

  .cp-footer {
    margin-top: 28px; padding-top: 22px; border-top: 1px solid #e8e0d5;
    font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;
  }

  .cp-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
  }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes cpFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }

  @media (max-width: 768px) {
    .cp-root  { grid-template-columns: 1fr; }
    .cp-left  { display: none; }
    .cp-right { background: linear-gradient(160deg, #0a2540, #0d3360); padding: 36px 24px; }
    .cp-title { color: #fff; }
    .cp-desc  { color: rgba(255,255,255,.6); }
    .cp-label { color: rgba(255,255,255,.75); }
    .cp-input { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.15); color: #fff; }
    .cp-badge { background: rgba(200,169,110,.2); }
    .cp-link-btn { background: transparent; color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.2); }
    .cp-footer { border-color: rgba(255,255,255,.1); color: rgba(255,255,255,.3); }
  }
`;

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function CustomerPortalLogin() {
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', phone: '' },
  });

  // Normalize any phone format to last 8 digits (Danish local number)
  // Handles: "22379189", "004522379189", "+4522379189", "4522379189", "22 37 91 89"
  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    return digits.slice(-8);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setAuthError('');

    try {
      const cleanEmail = data.email.toLowerCase().trim();
      const enteredNorm = normalizePhone(data.phone);

      // Query by email only — phone normalization happens client-side
      // because DB may store phones in many formats (004522379189, +4522379189, 22379189 etc.)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_email, customer_phone')
        .eq('customer_email', cleanEmail);

      if (error) throw error;

      // Find a row where the normalized phone tail matches
      const matched = (appointments || []).find(
        (apt) => normalizePhone(apt.customer_phone) === enteredNorm
      );

      if (!matched) {
        setAuthError(
          'Vi kunne ikke finde nogen bookinger med denne email og dette telefonnummer. ' +
          'Tjek venligst at du bruger de samme oplysninger du brugte ved booking.'
        );
        return;
      }

      // Store the EXACT phone as in DB so dashboard queries match correctly
      sessionStorage.setItem('cp_email', cleanEmail);
      sessionStorage.setItem('cp_phone', matched.customer_phone);
      sessionStorage.setItem('cp_name',  matched.customer_name || 'Kunde');

      toast({
        title: 'Login lykkedes ✓',
        description: `Velkommen, ${matched.customer_name}!`,
      });

      navigate('/min-konto/bookinger');
    } catch (err: any) {
      console.error('CustomerPortalLogin error:', err);
      setAuthError('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="cp-root">
        {/* ── LEFT PANEL ── */}
        <div className="cp-left">
          <div className="cp-pattern" />

          <div className="cp-brand">
            <div className="cp-logo">
  <img
    src="/logo192.png"
    alt="Frisør Nærum Logo"
  />
</div>


            <div className="cp-name">Frisør<br />Nærum</div>
            <div className="cp-sub">Professionel Herreklipning & Barbering</div>
            <div className="cp-divider">
              <div className="cp-dline l" />
              <span className="cp-scissors">✂</span>
              <div className="cp-dline r" />
            </div>
            <p className="cp-quote">
              "Håndværk med stolthed.<br />Service med omsorg."
            </p>
          </div>

          <div className="cp-perks">
            {[
              'Se dine kommende bookinger',
              'Ændr tidspunkt til en ledig tid',
              'Annuller hvis planerne ændrer sig',
              'Booking historik på ét sted',
            ].map((p) => (
              <div key={p} className="cp-perk">
                <div className="cp-dot" />
                {p}
              </div>
            ))}
          </div>

          <div className="cp-copy">© 2026 Frisør Nærum</div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="cp-right">
          <div className="cp-form-wrap">
            <div className="cp-badge">👤 Kundportal</div>
            <h1 className="cp-title">Velkomst<br />tilbage</h1>
            <p className="cp-desc">
              Log ind med den email og det telefonnummer du brugte ved din booking.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem style={{ marginBottom: 18 }}>
                      <FormLabel className="cp-label">Email-adresse</FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          type="email"
                          placeholder="din@email.dk"
                          className="cp-input"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }} />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem style={{ marginBottom: 20 }}>
                      <FormLabel className="cp-label">Telefonnummer</FormLabel>
                      <FormControl>
                        <div className="cp-input-wrap">
                          <span className="cp-input-prefix">+45</span>
                          <input
                            {...field}
                            type="tel"
                            placeholder="12 34 56 78"
                            className="cp-input"
                            style={{ paddingLeft: 48 }}
                            autoComplete="tel"
                            disabled={isLoading}
                            onChange={(e) => {
                              // Allow digits and spaces; store raw for normalization at submit
                              const val = e.target.value.replace(/[^\d\s+]/g, '');
                              field.onChange(val);
                            }}
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormMessage style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }} />
                    </FormItem>
                  )}
                />

                {/* Auth error */}
                {authError && (
                  <div className="cp-error">
                    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <span>{authError}</span>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="cp-submit" disabled={isLoading}>
                  {isLoading
                    ? <><div className="cp-spinner" /> Søger dine bookinger…</>
                    : 'Log ind på min konto →'
                  }
                </button>

                {/* Back to booking */}
                <button
                  type="button"
                  className="cp-link-btn"
                  onClick={() => navigate('/book')}
                  disabled={isLoading}
                >
                  + Book en ny tid
                </button>
              </form>
            </Form>

            <div className="cp-footer">
              Ingen konto nødvendig · Log ind med dine bookingoplysninger
              <br />
              <span
                style={{ color: '#c8a96e', cursor: 'pointer', fontSize: 12 }}
                onClick={() => navigate('/')}
              >
                ← Tilbage til forsiden
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}