import React from 'react';

interface GoogleReviewProps {
  salonName?: string;
  googleBusinessUrl?: string;
  placeId?: string;
  discountPercentage?: number;
  onReviewClick?: () => void;
}

const GoogleReviewComponent: React.FC<GoogleReviewProps> = ({
  salonName = "Frisør Nærum",
  googleBusinessUrl = "https://www.google.com/maps/place/Fris%C3%B8r+N%C3%A6rum/@55.8198566,12.5345827,619m/data=!3m1!1e3!4m8!3m7!1s0x46524fc7791ab43d:0x974d045b7dbfdcc9!8m2!3d55.8198566!4d12.5371576!9m1!1b1!16s%2Fg%2F11xp883j_d?entry=ttu&g_ep=EgoyMDI1MDkwMy4wIKXMDSoASAFQAw%3D%3D",
  placeId = "/Fris%C3%B8r+N%C3%A6rum/@55.8198566,12.5345827,619m/data=!3m1!1e3!4m8!3m7!1s0x46524fc7791ab43d:0x974d045b7dbfdcc9!8m2!3d55.8198566!4d12.5371576!9m1!1b1!16s%2Fg%2F11xp883j_d?entry=ttu&g_ep=EgoyMDI1MDkwMy4wIKXMDSoASAFQAw%3D%3D",
  discountPercentage = 10,
  onReviewClick
}) => {
  const handleStarClick = (star: HTMLElement) => {
    star.style.transform = 'scale(1.15)';
    setTimeout(() => {
      star.style.transform = 'scale(1)';
    }, 150);
  };

  const handleGoogleReview = () => {
    if (googleBusinessUrl) {
      window.open(googleBusinessUrl, '_blank', 'noopener,noreferrer');
    } else if (placeId) {
      const googleReviewUrl = `https://www.google.com/maps/place${placeId}`;
      window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    }
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Review',
        event_label: 'Google Review Click'
      });
    }

    if (onReviewClick) {
      onReviewClick();
    }
  };

  const styles = {
    body: {
      margin: 0,
      padding: '24px',
      fontFamily: 'inherit',
      background: 'hsl(var(--background))',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    
    container: {
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      padding: '48px 40px',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px hsl(var(--muted) / 0.3), 0 8px 10px -6px hsl(var(--muted) / 0.2)',
      textAlign: 'center' as const,
      maxWidth: '520px',
      width: '90%',
      position: 'relative' as const,
    } as React.CSSProperties,

    brandHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
      gap: '16px',
    } as React.CSSProperties,

    googleLogo: {
      width: '72px',
      height: '72px',
      background: 'linear-gradient(135deg, #4285f4 0%, #ea4335 25%, #fbbc05 50%, #34a853 75%, #4285f4 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      color: 'white',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
    } as React.CSSProperties,

    brandText: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '4px',
    } as React.CSSProperties,

    brandName: {
      fontSize: '20px',
      fontWeight: '600',
      color: 'hsl(var(--foreground))',
      margin: 0,
    } as React.CSSProperties,

    poweredBy: {
      fontSize: '12px',
      color: 'hsl(var(--muted-foreground))',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      margin: 0,
    } as React.CSSProperties,

    h1: {
      color: 'hsl(var(--foreground))',
      marginBottom: '12px',
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.2',
      margin: '0 0 12px 0',
    } as React.CSSProperties,

    subtitle: {
      color: 'hsl(var(--muted-foreground))',
      marginBottom: '32px',
      fontSize: '18px',
      lineHeight: '1.6',
      fontWeight: '400',
    } as React.CSSProperties,

    ratingSection: {
      background: 'hsl(var(--muted))',
      padding: '24px',
      borderRadius: '12px',
      margin: '32px 0',
      border: '1px solid hsl(var(--border))',
    } as React.CSSProperties,

    ratingTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'hsl(var(--foreground))',
      marginBottom: '16px',
    } as React.CSSProperties,

    ratingPreview: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '28px',
    } as React.CSSProperties,

    star: {
      color: '#ffc107',
      cursor: 'pointer',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      filter: 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3))',
    } as React.CSSProperties,

    steps: {
      textAlign: 'left' as const,
      background: 'hsl(var(--muted))',
      padding: '28px',
      borderRadius: '12px',
      margin: '32px 0',
      border: '1px solid hsl(var(--border))',
    } as React.CSSProperties,

    stepsTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'hsl(var(--foreground))',
      marginBottom: '20px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    step: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '16px',
      fontSize: '15px',
      color: 'hsl(var(--foreground))',
      lineHeight: '1.5',
    } as React.CSSProperties,

    stepLast: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '0',
      fontSize: '15px',
      color: 'hsl(var(--foreground))',
      lineHeight: '1.5',
    } as React.CSSProperties,

    stepNumber: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      marginRight: '16px',
      flexShrink: 0,
      marginTop: '2px',
      boxShadow: '0 2px 4px hsl(var(--accent) / 0.3)',
    } as React.CSSProperties,

    actionSection: {
      margin: '32px 0',
    } as React.CSSProperties,

    googleBtn: {
      background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
      color: 'white',
      padding: '16px 32px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
      minWidth: '220px',
      justifyContent: 'center',
    } as React.CSSProperties,

    incentive: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      padding: '24px',
      borderRadius: '12px',
      margin: '32px 0',
      fontSize: '16px',
      fontWeight: '600',
      boxShadow: '0 4px 12px hsl(var(--accent) / 0.3)',
    } as React.CSSProperties,

    incentiveIcon: {
      fontSize: '24px',
      marginBottom: '8px',
      display: 'block',
    } as React.CSSProperties,

    incentiveSmall: {
      fontSize: '14px',
      opacity: 0.9,
      marginTop: '8px',
      fontWeight: '500',
    } as React.CSSProperties,

    thankYou: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: '15px',
      fontWeight: '500',
      marginTop: '24px',
      lineHeight: '1.5',
    } as React.CSSProperties,

    trustBadge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '24px',
      fontSize: '14px',
      color: 'hsl(var(--muted-foreground))',
      fontWeight: '500',
    } as React.CSSProperties,

    secureIcon: {
      width: '16px',
      height: '16px',
      background: 'hsl(var(--accent))',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: 'hsl(var(--accent-foreground))',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.brandHeader}>
          <div style={styles.googleLogo}>G</div>
          <div style={styles.brandText}>
            <p style={styles.brandName}>{salonName}</p>
            <p style={styles.poweredBy}>Google Reviews</p>
          </div>
        </div>

        <h1 style={styles.h1}>Tak for dit besøg!</h1>
        <p style={styles.subtitle}>
          Del din oplevelse og hjælp andre kunder med at finde os
        </p>

        <div style={styles.ratingSection}>
          <div style={styles.ratingTitle}>Hvordan vil du bedømme os?</div>
          <div style={styles.ratingPreview}>
            {[1, 2, 3, 4, 5].map((index) => (
              <span
                key={index}
                style={styles.star}
                onClick={(e) => handleStarClick(e.currentTarget)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        <div style={styles.steps}>
          <div style={styles.stepsTitle}>Sådan gør du:</div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div>Klik på "Bedøm på Google" knappen nedenfor</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div>Vælg antal stjerner baseret på din oplevelse</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div>Skriv en ærlig anmeldelse om din oplevelse</div>
          </div>
          <div style={styles.stepLast}>
            <div style={styles.stepNumber}>4</div>
            <div>Tryk "Publicér" for at dele din anmeldelse</div>
          </div>
        </div>

        <div style={styles.actionSection}>
          <button
            style={styles.googleBtn}
            onClick={handleGoogleReview}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(66, 133, 244, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
            }}
          >
            <span>📍</span>
            Bedøm på Google
          </button>
        </div>

        <div style={styles.incentive}>
          <span style={styles.incentiveIcon}>🎁</span>
          Eksklusivt tilbud: {discountPercentage}% rabat på dit næste besøg
          <div style={styles.incentiveSmall}>
            Vis denne besked ved dit næste besøg for at få rabatten
          </div>
        </div>

        <div style={styles.trustBadge}>
          <div style={styles.secureIcon}>✓</div>
          <span>Sikker forbindelse til Google</span>
        </div>

        <p style={styles.thankYou}>
          Din mening er vigtig for os og hjælper andre kunder med at træffe det rette valg. 
          Tak for din tid og tillid.
        </p>
      </div>
    </div>
  );
};

export default GoogleReviewComponent;