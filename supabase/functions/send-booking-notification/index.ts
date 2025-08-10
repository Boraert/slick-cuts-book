import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  barberName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      appointmentDate, 
      appointmentTime, 
      barberName 
    }: BookingNotificationRequest = await req.json();

    console.log("Sending notification for booking:", { customerName, appointmentDate, appointmentTime, barberName });

    // Send email notification if Resend API key is available
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "Copenhagen Barbershop <onboarding@resend.dev>",
          to: [customerEmail],
          subject: "Booking Confirmation - Copenhagen Barbershop",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; text-align: center;">Booking Confirmed!</h1>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Appointment Details</h2>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentTime}</p>
                <p><strong>Barber:</strong> ${barberName}</p>
              </div>
              
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-top: 0;">Important Information</h3>
                <ul style="color: #333;">
                  <li>Please arrive 5 minutes before your appointment</li>
                  <li>If you need to cancel or reschedule, please call us at least 2 hours in advance</li>
                  <li>We look forward to seeing you!</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666;">Copenhagen Barbershop</p>
                <p style="color: #666;">Thank you for choosing us!</p>
              </div>
            </div>
          `,
        });
        
        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    // Send SMS notification if Twilio credentials are available
    if (twilioSid && twilioToken && twilioPhone && customerPhone) {
      try {
        const smsBody = `Copenhagen Barbershop: Your appointment is confirmed for ${appointmentDate} at ${appointmentTime} with ${barberName}. Please arrive 5 minutes early. Thank you!`;
        
        const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: customerPhone,
            From: twilioPhone,
            Body: smsBody,
          }),
        });

        if (smsResponse.ok) {
          console.log("SMS sent successfully");
        } else {
          const errorText = await smsResponse.text();
          console.error("Error sending SMS:", errorText);
        }
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);