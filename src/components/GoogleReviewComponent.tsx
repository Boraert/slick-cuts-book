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
    star.style.transform = 'scale(1.3)';
    setTimeout(() => {
      star.style.transform = 'scale(1)';
    }, 200);
  };

  const handleGoogleReview = () => {
    // Method 1: Direct link to Google Business Profile (recommended)
    if (googleBusinessUrl) {
      window.open(googleBusinessUrl, '_blank');
    } else if (placeId) {
      // Method 2: Using Place ID
      const googleReviewUrl = `https://www.google.com/maps/place${placeId}`;
      window.open(googleReviewUrl, '_blank');
    }
    
    // Track the click for analytics (if gtag is available)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Review',
        event_label: 'Google Review Click'
      });
    }

    // Call custom callback if provided
    if (onReviewClick) {
      onReviewClick();
    }
  };

  const styles = {
    body: {
      margin: 0,
      padding: '20px',
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
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      textAlign: 'center' as const,
      maxWidth: '500px',
      width: '90%',
    } as React.CSSProperties,

    googleLogo: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(45deg, #4285f4, #ea4335, #fbbc05, #34a853)',
      borderRadius: '50%',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '35px',
      color: 'white',
      fontWeight: 'bold',
    } as React.CSSProperties,

    h1: {
      color: 'hsl(var(--foreground))',
      marginBottom: '10px',
      fontSize: '28px',
      fontWeight: 'bold',
    } as React.CSSProperties,

    subtitle: {
      color: 'hsl(var(--muted-foreground))',
      marginBottom: '20px',
      fontSize: '16px',
      lineHeight: 1.5,
    } as React.CSSProperties,

    steps: {
      textAlign: 'left' as const,
      background: 'hsl(var(--muted))',
      padding: '25px',
      borderRadius: '8px',
      margin: '25px 0',
    } as React.CSSProperties,

    step: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px',
      fontSize: '14px',
      color: 'hsl(var(--foreground))',
    } as React.CSSProperties,

    stepLast: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0',
      fontSize: '14px',
      color: 'hsl(var(--foreground))',
    } as React.CSSProperties,

    stepNumber: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      marginRight: '12px',
      flexShrink: 0,
    } as React.CSSProperties,

    googleBtn: {
      background: 'linear-gradient(45deg, #4285f4, #34a853)',
      color: 'white',
      padding: '18px 40px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      display: 'inline-block',
      margin: '20px 0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    } as React.CSSProperties,

    incentive: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      padding: '20px',
      borderRadius: '8px',
      margin: '25px 0',
      fontSize: '16px',
      fontWeight: '600',
    } as React.CSSProperties,

    thankYou: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: '14px',
      fontStyle: 'italic',
      marginTop: '20px',
    } as React.CSSProperties,

    ratingPreview: {
      display: 'flex',
      justifyContent: 'center',
      gap: '5px',
      margin: '20px 0',
      fontSize: '30px',
    } as React.CSSProperties,

    star: {
      color: '#ffd700',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.googleLogo}>G</div>
        <h1 style={styles.h1}>Tak for dit besøg! 💇‍♀️</h1>
        <p style={styles.subtitle}>
          Hjælp andre med at finde os ved at dele din oplevelse på Google
        </p>

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

        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div>Klik på "Bedøm på Google" knappen</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div>Vælg antal stjerner (vi håber på 5! 😊)</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div>Skriv en kort besked om din oplevelse</div>
          </div>
          <div style={styles.stepLast}>
            <div style={styles.stepNumber}>4</div>
            <div>Tryk "Publicer" og du er færdig!</div>
          </div>
        </div>

        <button
          style={styles.googleBtn}
          onClick={handleGoogleReview}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(66, 133, 244, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(66, 133, 244, 0.3)';
          }}
        >
          📍 Bedøm på Google Maps
        </button>

        <div style={styles.incentive}>
          🎁 Som tak får du {discountPercentage}% rabat på dit næste besøg!
          <br />
          <small>Vis denne besked ved dit næste besøg</small>
        </div>

        <p style={styles.thankYou}>
          Din anmeldelse betyder enormt meget for vores lille salon ❤️
        </p>
      </div>
    </div>
  );
};

export default GoogleReviewComponent;