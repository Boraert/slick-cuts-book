import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const handler = async (req)=>{
  // Håndter CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { customerName, customerEmail, customerPhone, appointmentDate, appointmentTime, barberName } = await req.json();
    console.log("Sender notifikation for booking:", {
      customerName,
      appointmentDate,
      appointmentTime,
      barberName
    });
    // Send e-mail hvis Resend API er sat op
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      try {
        const emailResponse = await resend.emails.send({
          from: "Frisør Nærum <no-reply@xn--frisrnrum-l3a9q.dk>",
          to: [
            customerEmail
          ],
          subject: "Bekræftelse af booking - Frisør Nærum",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; text-align: center;">Din booking er bekræftet!</h1>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Detaljer om din aftale</h2>
                <p><strong>Kunde:</strong> ${customerName}</p>
                <p><strong>Dato:</strong> ${appointmentDate}</p>
                <p><strong>Tidspunkt:</strong> ${appointmentTime}</p>
                <p><strong>Frisør:</strong> ${barberName}</p>
              </div>
              
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-top: 0;">Vigtig information</h3>
                <ul style="color: #333;">
                  <li>Mød venligst op 5 minutter før din aftale</li>
                  <li>Hvis du ønsker at aflyse eller ændre, skal du ringe senest 2 timer før</li>
                  <li>Vi glæder os til at se dig!</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666;">Frisør Nærum</p>
                <p style="color: #666;">Tak fordi du valgte os</p>
              </div>
            </div>
          `
        });
        console.log("E-mail sendt:", emailResponse);
      } catch (emailError) {
        console.error("Fejl ved afsendelse af e-mail:", emailError);
      }
    }
    // Send SMS hvis Twilio er sat op
    if (twilioSid && twilioToken && twilioPhone && customerPhone) {
      try {
        const smsBody = `Frisør Nærum: Din tid er bekræftet d. ${appointmentDate} kl. ${appointmentTime} hos ${barberName}. Mød venligst op 5 min før. Tak!`;
        const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: customerPhone,
            From: twilioPhone,
            Body: smsBody
          })
        });
        if (smsResponse.ok) {
          console.log("SMS sendt");
        } else {
          const errorText = await smsResponse.text();
          console.error("Fejl ved afsendelse af SMS:", errorText);
        }
      } catch (smsError) {
        console.error("Fejl ved SMS:", smsError);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Notifikationer sendt med succes"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Fejl i send-booking-notification funktionen:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
