// Internationalization utilities for Arabic, Danish, and English
export type Language = 'ar' | 'da' | 'en';

export interface Translations {
  // Navigation
  home: string;
  services: string;
  bookAppointment: string;
  contact: string;
  adminLogin: string;

  // Common
  bookNow: string;
  bookYourAppointment: string;
  readyForYourNextCut: string;
  experienceEliteCuts: string;

  // Hero section
  heroTitle: string;
  heroSubtitle: string;
  viewServices: string;

  // Services
  ourServices: string;
  professionalBarbering: string;
  whyChooseEliteCuts: string;
  traditionalExcellence: string;
  quickEasyBooking: string;
  quickBookingDesc: string;
  expertBarbers: string;
  expertBarbersDesc: string;
  premiumService: string;
  premiumServiceDesc: string;

  // Service types
  classicHaircut: string;
  classicHaircutDesc: string;
  beardTrim: string;
  beardTrimDesc: string;
  fullPackage: string;
  fullPackageDesc: string;

  // Booking form
  appointmentDetails: string;
  fillInformation: string;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  preferredBarber: string;
  selectBarber: string;
  selectDate: string;
  date: string;
  time: string;
  pickDate: string;
  selectTime: string;
  booking: string;
  appointmentSummary: string;
  customerDetails: string;
  noAvailableSlots: string;
  selectOptionsToSee: string;
  openingHours: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  closed: string;

  // Booking confirmation
  bookingConfirmed: string;
  appointmentSuccessfullyBooked: string;
  confirmationEmailSent: string;
  appointmentDetailsTitle: string;
  bookAnother: string;
  returnHome: string;
  notificationPreference: string;
  selectNotificationMethod: string;
  sms: string;
  
  // Services page
  mostPopular: string;
  whatsIncluded: string;
  bookThisService: string;
  eliteCutsExperience: string;
  detailedConsultation: string;
  premiumProducts: string;
  expertCraftsmanship: string;
  finestGroomingProducts: string;
  skilledBarbers: string;
  bookAppointmentToday: string;
  hairConsultation: string;
  shampooConditioning: string;
  precisionCutting: string;
  styling: string;
  hotTowelFinish: string;
  beardAssessment: string;
  precisionTrimming: string;
  edgeCleanup: string;
  mustacheStyling: string;
  beardOilApplication: string;
  everythingFromServices: string;
  hotTowelTreatment: string;
  faceCleansing: string;
  aftershaveApplication: string;
  stylingConsultation: string;
  
  // Add after existing service types in the Translations interface
mensHaircut: string;
mensHaircutDesc: string;
mensHaircutPrecisionCut: string;
mensHaircutStyling: string;
mensHaircutConsultation: string;
mensHaircutCleanFinish: string;

childHaircut: string;
childHaircutDesc: string;
childHaircutKidsFriendly: string;
childHaircutQuickCut: string;
childHaircutStyling: string;

pensionerHaircut: string;
pensionerHaircutDesc: string;
pensionerHaircutPrecisionCut: string;
pensionerHaircutAffordablePrice: string;
pensionerHaircutStyling: string;

beardTrimShaping: string;
beardTrimHotTowel: string;
beardTrimAftershave: string;

haircutAndBeard: string;
haircutAndBeardDesc: string;
haircutAndBeardCombo: string;
haircutAndBeardHotTowel: string;
haircutAndBeardFaceCleansing: string;
haircutAndBeardAftershave: string;
haircutAndBeardConsultation: string;
  // Contact page
  contactUs: string;
  getInTouchDesc: string;
  getInTouch: string;
  visitUsDesc: string;
  findUs: string;
  locationDesc: string;
  interactiveMap: string;
  mapIntegration: string;
  whyVisitEliteCuts: string;
  convenientLocation: string;
  centrallyLocated: string;
  flexibleHours: string;
  openSevenDays: string;
  professionalService: string;
  expertBarbersDedicated: string;
  haveQuestions: string;

  // Location and contact
  location: string;
  copenhagen: string;
  denmark: string;
  contactInfo: string;
  hours: string;
  address: string;
  phone: string;
  email: string;

  // Hours
  mondayFriday: string;

  // Footer
  professionalBarbershopFooter: string;
  allRightsReserved: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    bookAppointment: 'Book Appointment',
    contact: 'Contact',
    adminLogin: 'Admin Login',

    // Common
    bookNow: 'Book Now',
    bookYourAppointment: 'Book Your Appointment',
    readyForYourNextCut: 'Ready for Your Next Cut?',
    experienceEliteCuts: 'Book your appointment today and experience the Frisør Nærum difference',

    // Hero section
    heroTitle: 'Welcome to Frisør Nærum',
    heroSubtitle: 'Experience the finest barbershop tradition with modern style in the heart of Nærum  Professional cuts, expert service, timeless craftsmanship.',
    viewServices: 'View Services',

    // Services
    ourServices: 'Our Services',
    professionalBarbering: 'Professional barbering services tailored to your style and preferences',
    whyChooseEliteCuts: 'Why Choose Frisør Nærum?',
    traditionalExcellence: 'We combine traditional barbering excellence with modern convenience',
    quickEasyBooking: 'Quick & Easy Booking',
    quickBookingDesc: 'Book your appointment online in just a few clicks',
    expertBarbers: 'Expert Barbers',
    expertBarbersDesc: 'Experienced professionals with years of expertise',
    premiumService: 'Premium Service',
    premiumServiceDesc: 'High-quality tools and premium products',

    // Service types
    classicHaircut: 'Classic Haircut',
    classicHaircutDesc: 'Traditional scissor cut with styling',
    beardTrim: 'Beard Trim',
    beardTrimDesc: 'Professional beard shaping and styling',
    fullPackage: 'Full Package',
    fullPackageDesc: 'Haircut + beard trim + hot towel treatment',

    // Booking form
    appointmentDetails: 'Appointment Details',
    fillInformation: 'Fill in your information to schedule your appointment',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    preferredBarber: 'Preferred Barber',
    selectBarber: 'Select a barber',
    selectDate: 'Select Date',
    date: 'Date',
    time: 'Time',
    pickDate: 'Pick a date',
    selectTime: 'Select time',
    booking: 'Booking...',
    appointmentSummary: 'Appointment Summary',
    customerDetails: 'Customer Details',
    noAvailableSlots: 'No available time slots for this date',
    selectOptionsToSee: 'Select options to see summary',
    openingHours: 'Opening Hours',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    closed: 'Closed',

    // Booking confirmation
    bookingConfirmed: 'Booking Confirmed!',
    appointmentSuccessfullyBooked: 'Your appointment has been successfully booked. We will send you a confirmation email shortly.',
    confirmationEmailSent: '',
    appointmentDetailsTitle: 'Appointment Details',
    bookAnother: 'Book Another Appointment',
    returnHome: 'Return to Home',
    notificationPreference: 'How would you like to receive notifications?',
    selectNotificationMethod: 'Select notification method',
    youCanBook: "You can book appointments up to one year in advance",
    
    sms: 'SMS',
    
    // Services page
    mostPopular: 'Most Popular',
    whatsIncluded: "What's Included:",
    bookThisService: 'Book This Service',
    eliteCutsExperience: 'The Frisør Nærum Experience',
    detailedConsultation: 'Every service includes a detailed consultation to understand your style preferences and lifestyle needs. Our experienced barbers use only premium products and tools to ensure the best results.',
    premiumProducts: 'Premium Products',
    expertCraftsmanship: 'Expert Craftsmanship',
    finestGroomingProducts: 'We use only the finest grooming products from trusted brands to ensure your hair and skin receive the best care possible.',
    skilledBarbers: 'Our skilled barbers have years of experience and stay updated with the latest trends and techniques in men\'s grooming.',
    bookAppointmentToday: 'Book Your Appointment Today',
    hairConsultation: 'Hair consultation',
    shampooConditioning: 'Shampoo & conditioning',
    precisionCutting: 'Precision cutting',
    styling: 'Styling',
    hotTowelFinish: 'Hot towel finish',
    beardAssessment: 'Beard assessment',
    precisionTrimming: 'Precision trimming',
    edgeCleanup: 'Edge cleanup',
    mustacheStyling: 'Mustache styling',
    beardOilApplication: 'Beard oil application',
    everythingFromServices: 'Everything from haircut & beard trim',
    hotTowelTreatment: 'Hot towel treatment',
    faceCleansing: 'Face cleansing',
    aftershaveApplication: 'Aftershave application',
    stylingConsultation: 'Styling consultation',
    // New Services
  mensHaircut: 'Men\'s Haircut',
  mensHaircutDesc: 'Precision men\'s haircut with styling',
  mensHaircutPrecisionCut: 'Precision haircut',
  mensHaircutStyling: 'Styling included',
  mensHaircutConsultation: 'Style consultation',
  mensHaircutCleanFinish: 'Clean finish with neckline trim',

  childHaircut: 'Children\'s Haircut (under 12)',
  childHaircutDesc: 'Gentle haircut for children under 12 years old',
  childHaircutKidsFriendly: 'Child-friendly service',
  childHaircutQuickCut: 'Quick and gentle haircut',
  childHaircutStyling: 'Basic styling included',

  pensionerHaircut: 'Pensioner Haircut',
  pensionerHaircutDesc: 'Affordable, neat haircut for pensioners',
  pensionerHaircutPrecisionCut: 'Neat and tidy haircut',
  pensionerHaircutAffordablePrice: 'Special pensioner price',
  pensionerHaircutStyling: 'Basic styling included',

  beardTrimShaping: 'Beard shaping',
  beardTrimHotTowel: 'Hot towel option',
  beardTrimAftershave: 'Aftershave application',

  haircutAndBeard: 'Haircut & Beard Trim',
  haircutAndBeardDesc: 'Full grooming service for hair and beard',
  haircutAndBeardCombo: 'Haircut and beard trim',
  haircutAndBeardHotTowel: 'Hot towel treatment',
  haircutAndBeardFaceCleansing: 'Face cleansing',
  haircutAndBeardAftershave: 'Aftershave application',
  haircutAndBeardConsultation: 'Styling consultation',
    
    // Contact page
    contactUs: 'Contact Us',
    getInTouchDesc: 'Get in touch with risørnærum. We\'re here to help with any questions or to schedule your next appointment.',
    getInTouch: 'Get In Touch',
    visitUsDesc: 'Visit us at our barbershop or reach out through any of the following methods. We look forward to serving you!',
    findUs: 'Find Us',
    locationDesc: 'Located in the heart of the city, easily accessible by car or public transport.',
    interactiveMap: 'Interactive Map',
    mapIntegration: 'Map integration would go here',
    whyVisitEliteCuts: 'Why Visit Frisør Nærum ?',
    convenientLocation: 'Convenient Location',
    centrallyLocated: 'Centrally located with easy parking and public transport access.',
    flexibleHours: 'Flexible Hours',
    openSevenDays: 'Open 7 days a week with extended hours to fit your schedule.',
    professionalService: 'Professional Service',
    expertBarbersDedicated: 'Expert barbers dedicated to providing the best grooming experience.',
    haveQuestions: 'Have questions about our services or want to schedule an appointment? Don\'t hesitate to reach out - we\'re here to help!',

    // Location and contact
    location: 'Location',
    copenhagen: 'Nærum',
    denmark: 'Denmark',
    contactInfo: 'Contact Info',
    hours: 'Hours',
    address: 'Nærum Hovedgade 52, 2850 Nærum',
    phone: 'Phone: +45 28 44 67 49',
    email: 'Email: info@frisørnærum.dk',

    // Hours
    mondayFriday: 'Monday - Friday',

    // Footer
    professionalBarbershopFooter: 'Herrefrisør i Nærum med fokus på stilfulde klipninger, barbering og skægpleje. Vi kombinerer høj kvalitet med personlig service, så du altid går herfra velklædt og tilfreds.',
    allRightsReserved: 'All rights reserved.'
  },

  da: {
    // Navigation
    home: 'Hjem',
    services: 'Tjenester',
    bookAppointment: 'Book Tid',
    contact: 'Kontakt',
    adminLogin: 'Admin Login',

    // Common
    bookNow: 'Book Nu',
    bookYourAppointment: 'Book Din Tid',
    readyForYourNextCut: 'Klar til Dit Næste Klip?',
    experienceEliteCuts: 'Book din tid i dag og oplev Frisør Nærum forskellen',

    // Hero section
    heroTitle: 'Velkommen til Frisør Nærum.',
    heroSubtitle: 'Oplev den fineste barbertradition med moderne stil i hjertet af København. Professionelle klipninger, ekspertservice, tidløs håndværk.',
    viewServices: 'Se Tjenester',

    // Services
    ourServices: 'Vores Tjenester',
    professionalBarbering: 'Professionelle barbertjenester skræddersyet til din stil og præferencer',
    whyChooseEliteCuts: 'Hvorfor Vælge Frisør Nærum',
    traditionalExcellence: 'Vi kombinerer traditionel barberekspertise med moderne bekvemmelighed',
    quickEasyBooking: 'Hurtig & Nem Booking',
    quickBookingDesc: 'Book din tid online med blot få klik',
    expertBarbers: 'Ekspert Barbere',
    expertBarbersDesc: 'Erfarne professionelle med års ekspertise',
    premiumService: 'Premium Service',
    premiumServiceDesc: 'Højkvalitets værktøj og premium produkter',
    mensHaircut: 'Herreklip',
  mensHaircutDesc: 'Præcisionsklipning til mænd med styling',
  mensHaircutPrecisionCut: 'Præcisionsklip',
  mensHaircutStyling: 'Styling inkluderet',
  mensHaircutConsultation: 'Styling konsultation',
  mensHaircutCleanFinish: 'Ren afslutning med nakke trim',

  childHaircut: 'Børneklip (under 12 år)',
  childHaircutDesc: 'Skånsom klipning til børn under 12 år',
  childHaircutKidsFriendly: 'Børnevenlig service',
  childHaircutQuickCut: 'Hurtig og skånsom klipning',
  childHaircutStyling: 'Basis styling inkluderet',

  pensionerHaircut: 'Pensionistklip',
  pensionerHaircutDesc: 'Prisvenlig og pæn klipning til pensionister',
  pensionerHaircutPrecisionCut: 'Pæn og ordentlig klipning',
  pensionerHaircutAffordablePrice: 'Særlig pensionistpris',
  pensionerHaircutStyling: 'Basis styling inkluderet',

  beardTrimShaping: 'Skægformning',
  beardTrimHotTowel: 'Mulighed for varmt håndklæde',
  beardTrimAftershave: 'Aftershave påføring',

  haircutAndBeard: 'Klip & Skæg',
  haircutAndBeardDesc: 'Fuld grooming service til hår og skæg',
  haircutAndBeardCombo: 'Klipning og skægtrimning',
  haircutAndBeardHotTowel: 'Varmt håndklæde behandling',
  haircutAndBeardFaceCleansing: 'Ansigtsrensning',
  haircutAndBeardAftershave: 'Aftershave påføring',
  haircutAndBeardConsultation: 'Styling konsultation',

    // Service types
    classicHaircut: 'Klassisk Klipning',
    classicHaircutDesc: 'Traditionel sakseklipning med styling',
    beardTrim: 'Skægtrimning',
    beardTrimDesc: 'Professionel skægformning og styling',
    fullPackage: 'Fuld Pakke',
    fullPackageDesc: 'Klipning + skægtrimning + varmt håndklæde behandling',

    // Booking form
    appointmentDetails: 'Tidsdetaljer',
    fillInformation: 'Udfyld dine oplysninger for at planlægge din tid',
    fullName: 'Fulde Navn',
    phoneNumber: 'Telefonnummer',
    emailAddress: 'Email Adresse',
    preferredBarber: 'Foretrukken Barber',
    selectBarber: 'Vælg en barber',
    selectDate: 'Vælg Dato',
    date: 'Dato',
    time: 'Tid',
    pickDate: 'Vælg en dato',
    selectTime: 'Vælg tid',
    booking: 'Booker...',
    appointmentSummary: 'Aftale Oversigt',
    customerDetails: 'Kunde Detaljer',
    noAvailableSlots: 'Ingen ledige tider for denne dato',
    selectOptionsToSee: 'Vælg muligheder for at se oversigt',
    openingHours: 'Åbningstider',
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag',
    closed: 'Lukket',
    youCanBook: "Du kan booke aftaler op til et år i forvejen",

    // Booking confirmation
    bookingConfirmed: 'Booking Bekræftet!',
    appointmentSuccessfullyBooked: 'Din tid er blevet booket med succes. Vi sender dig en bekraeftelses-email snart.',
    confirmationEmailSent: '',
    appointmentDetailsTitle: 'Aftaledetaljer',
    bookAnother: 'Book Endnu en Aftale',
    returnHome: 'Tilbage til Hjem',
    notificationPreference: 'Hvordan vil du gerne modtage notifikationer?',
    selectNotificationMethod: 'Vælg notifikationsmetode',
    sms: 'SMS',
    
    // Services page
    mostPopular: 'Mest Populære',
    whatsIncluded: 'Hvad er inkluderet:',
    bookThisService: 'Book denne service',
    eliteCutsExperience: 'Frisør Nærum Oplevelsen',
    detailedConsultation: 'Hver service inkluderer en detaljeret konsultation for at forstå dine stilpræferencer og livsstilsbehov. Vores erfarne barberer bruger kun premium produkter og værktøjer for at sikre de bedste resultater.',
    premiumProducts: 'Premium Produkter',
    expertCraftsmanship: 'Ekspert Håndværk',
    finestGroomingProducts: 'Vi bruger kun de fineste grooming produkter fra betroede brands for at sikre, at dit hår og hud får den bedst mulige pleje.',
    skilledBarbers: 'Vores dygtige barberer har mange års erfaring og holder sig opdateret med de nyeste trends og teknikker inden for herrefrisering.',
    bookAppointmentToday: 'Book din aftale i dag',
    hairConsultation: 'Hår konsultation',
    shampooConditioning: 'Shampoo og balsam',
    precisionCutting: 'Præcisionsklipning',
    styling: 'Styling',
    hotTowelFinish: 'Varmt håndklæde finish',
    beardAssessment: 'Skægvurdering',
    precisionTrimming: 'Præcisionstrimning',
    edgeCleanup: 'Kant oprydning',
    mustacheStyling: 'Overskæg styling',
    beardOilApplication: 'Skægolie påføring',
    everythingFromServices: 'Alt fra hårklipning og skægtrimning',
    hotTowelTreatment: 'Varmt håndklæde behandling',
    faceCleansing: 'Ansigtsrensning',
    aftershaveApplication: 'Aftershave påføring',
    stylingConsultation: 'Styling konsultation',
    
    // Contact page
    contactUs: 'Kontakt Os',
    getInTouchDesc: 'Kom i kontakt med Frisør Nærum. Vi er her for at hjælpe med eventuelle spørgsmål eller for at planlægge din næste aftale.',
    getInTouch: 'Kom i Kontakt',
    visitUsDesc: 'Besøg os i vores barbershop eller kontakt os gennem en af følgende metoder. Vi ser frem til at betjene dig!',
    findUs: 'Find Os',
    locationDesc: 'Beliggende i hjertet af byen, let tilgængelig med bil eller offentlig transport.',
    interactiveMap: 'Interaktivt Kort',
    mapIntegration: 'Kortintegration ville være her',
    whyVisitEliteCuts: 'Hvorfor Besøge Frisør Nærum?',
    convenientLocation: 'Bekvem Placering',
    centrallyLocated: 'Centralt beliggende med let parkering og offentlig transport adgang.',
    flexibleHours: 'Fleksible Åbningstider',
    openSevenDays: 'Åben 7 dage om ugen med udvidede åbningstider for at passe til din tidsplan.',
    professionalService: 'Professionel Service',
    expertBarbersDedicated: 'Ekspert barberer dedikeret til at give den bedste grooming oplevelse.',
    haveQuestions: 'Har du spørgsmål om vores tjenester eller vil du planlægge en aftale? Tøv ikke med at kontakte os - vi er her for at hjælpe!',

    // Location and contact
    location: 'Beliggenhed',
    copenhagen: 'Nærum',
    denmark: 'Danmark',
    contactInfo: 'Kontakt Info',
    hours: 'Åbningstider',
    address: 'Nærum Hovedgade 52, 2850 Nærum',
    phone: 'Phone: +45 28 44 67 49',
    email: 'Email: info@frisørnærum.dk',

    // Hours
    mondayFriday: 'Mandag - Fredag',

    // Footer
    professionalBarbershopFooter: 'Professionelle barbertjenester med traditionelt håndværk og moderne stil i København.',
    allRightsReserved: 'Alle rettigheder forbeholdes.'
  },

  ar: {
    // Navigation
    home: 'الرئيسية',
    services: 'الخدمات',
    bookAppointment: 'حجز موعد',
    contact: 'اتصل بنا',
    adminLogin: 'دخول المشرف',

    // Common
    bookNow: 'احجز الآن',
    bookYourAppointment: 'احجز موعدك',
    readyForYourNextCut: 'جاهز لقصة شعرك القادمة؟',
    experienceEliteCuts: 'احجز موعدك اليوم واختبر الفرق في Frisør Nærum ',

    // Hero section
    heroTitle: 'مرحباً بكم في Frisør Nærum ',
    heroSubtitle: 'اختبر أفضل تقاليد الحلاقة مع الأناقة الحديثة في قلب كوبنهاغن. قصات احترافية، خدمة خبيرة، حرفية خالدة.',
    viewServices: 'عرض الخدمات',

    // Services
    ourServices: 'خدماتنا',
    professionalBarbering: 'خدمات حلاقة احترافية مصممة خصيصاً لأسلوبك وتفضيلاتك',
    whyChooseEliteCuts: 'لماذا تختار Frisør Nærum ؟',
    traditionalExcellence: 'نجمع بين التميز التقليدي في الحلاقة والراحة الحديثة',
    quickEasyBooking: 'حجز سريع وسهل',
    quickBookingDesc: 'احجز موعدك عبر الإنترنت بنقرات قليلة فقط',
    expertBarbers: 'حلاقون خبراء',
    expertBarbersDesc: 'محترفون ذوو خبرة مع سنوات من الإتقان',
    premiumService: 'خدمة مميزة',
    premiumServiceDesc: 'أدوات عالية الجودة ومنتجات مميزة',
     mensHaircut: 'قص شعر للرجال',
  mensHaircutDesc: 'قص شعر دقيق مع تصفيف',
  mensHaircutPrecisionCut: 'قص دقيق',
  mensHaircutStyling: 'يشمل التصفيف',
  mensHaircutConsultation: 'استشارة التصفيف',
  mensHaircutCleanFinish: 'تشطيب نظيف مع تهذيب الرقبة',

  childHaircut: 'قص شعر للأطفال (أقل من 12 سنة)',
  childHaircutDesc: 'قص شعر لطيف للأطفال أقل من 12 سنة',
  childHaircutKidsFriendly: 'خدمة مناسبة للأطفال',
  childHaircutQuickCut: 'قص سريع ولطيف',
  childHaircutStyling: 'يشمل التصفيف الأساسي',

  pensionerHaircut: 'قص شعر للمتقاعدين',
  pensionerHaircutDesc: 'قص أنيق وبسعر مناسب للمتقاعدين',
  pensionerHaircutPrecisionCut: 'قص مرتب وأنيق',
  pensionerHaircutAffordablePrice: 'سعر خاص للمتقاعدين',
  pensionerHaircutStyling: 'يشمل التصفيف الأساسي',

  beardTrimShaping: 'تشكيل اللحية',
  beardTrimHotTowel: 'خيار المنشفة الساخنة',
  beardTrimAftershave: 'تطبيق ما بعد الحلاقة',

  haircutAndBeard: 'قص شعر وتشذيب اللحية',
  haircutAndBeardDesc: 'خدمة متكاملة للشعر واللحية',
  haircutAndBeardCombo: 'قص الشعر وتشذيب اللحية',
  haircutAndBeardHotTowel: 'علاج بالمنشفة الساخنة',
  haircutAndBeardFaceCleansing: 'تنظيف الوجه',
  haircutAndBeardAftershave: 'تطبيق ما بعد الحلاقة',
  haircutAndBeardConsultation: 'استشارة التصفيف',

    // Service types
    classicHaircut: 'قصة شعر كلاسيكية',
    classicHaircutDesc: 'قص تقليدي بالمقص مع التصفيف',
    beardTrim: 'تهذيب اللحية',
    beardTrimDesc: 'تشكيل وتصفيف اللحية المهني',
    fullPackage: 'الباقة الكاملة',
    fullPackageDesc: 'قص الشعر + تهذيب اللحية + علاج بالمنشفة الساخنة',

    // Booking form
    appointmentDetails: 'تفاصيل الموعد',
    fillInformation: 'املأ معلوماتك لجدولة موعدك',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    emailAddress: 'عنوان البريد الإلكتروني',
    preferredBarber: 'الحلاق المفضل',
    selectBarber: 'اختر حلاقاً',
    selectDate: 'اختر التاريخ',
    date: 'التاريخ',
    time: 'الوقت',
    pickDate: 'اختر تاريخاً',
    selectTime: 'اختر الوقت',
    booking: 'جاري الحجز...',
    appointmentSummary: 'ملخص الموعد',
    customerDetails: 'بيانات العميل',
    noAvailableSlots: 'لا توجد أوقات متاحة لهذا التاريخ',
    selectOptionsToSee: 'اختر الخيارات لرؤية الملخص',
    openingHours: 'ساعات العمل',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sunday: 'الأحد',
    closed: 'مغلق',

    // Booking confirmation
    bookingConfirmed: 'تم تأكيد الحجز!',
    appointmentSuccessfullyBooked: 'تم حجز موعدك بنجاح. سنرسل لك بريدا الكترونيا للتأكيد قريبا.',
    confirmationEmailSent: '',
    appointmentDetailsTitle: 'تفاصيل الموعد',
    bookAnother: 'احجز موعد آخر',
    returnHome: 'العودة للرئيسية',
    notificationPreference: 'كيف تريد استقبال الإشعارات؟',
    selectNotificationMethod: 'اختر طريقة الإشعار',
    sms: 'رسائل نصية',
    youCanBook: "يمكنك حجز المواعيد قبل عام واحد مقدمًا",
    
    // Services page
    mostPopular: 'الأكثر شعبية',
    whatsIncluded: 'ما هو مشمول:',
    bookThisService: 'احجز هذه الخدمة',
    eliteCutsExperience: 'تجربة Frisør Nærum ',
    detailedConsultation: 'تتضمن كل خدمة استشارة مفصلة لفهم تفضيلات أسلوبك واحتياجات نمط حياتك. يستخدم حلاقونا ذوو الخبرة فقط المنتجات والأدوات الممتازة لضمان أفضل النتائج.',
    premiumProducts: 'منتجات ممتازة',
    expertCraftsmanship: 'حرفية خبير',
    finestGroomingProducts: 'نحن نستخدم فقط أفضل منتجات العناية من العلامات التجارية الموثوقة لضمان حصول شعرك وبشرتك على أفضل رعاية ممكنة.',
    skilledBarbers: 'يتمتع حلاقونا المهرة بسنوات من الخبرة ويواكبون أحدث الاتجاهات والتقنيات في العناية الرجالية.',
    bookAppointmentToday: 'احجز موعدك اليوم',
    hairConsultation: 'استشارة الشعر',
    shampooConditioning: 'الشامبو والبلسم',
    precisionCutting: 'قص دقيق',
    styling: 'تصفيف',
    hotTowelFinish: 'منشفة ساخنة',
    beardAssessment: 'تقييم اللحية',
    precisionTrimming: 'تشذيب دقيق',
    edgeCleanup: 'تنظيف الحواف',
    mustacheStyling: 'تصفيف الشارب',
    beardOilApplication: 'تطبيق زيت اللحية',
    everythingFromServices: 'كل شيء من قص الشعر وتشذيب اللحية',
    hotTowelTreatment: 'علاج المنشفة الساخنة',
    faceCleansing: 'تنظيف الوجه',
    aftershaveApplication: 'تطبيق ما بعد الحلاقة',
    stylingConsultation: 'استشارة التصفيف',
    
    // Contact page
    contactUs: 'اتصل بنا',
    getInTouchDesc: 'تواصل مع إليت كتس. نحن هنا للمساعدة في أي أسئلة أو لجدولة موعدك التالي.',
    getInTouch: 'تواصل معنا',
    visitUsDesc: 'قم بزيارتنا في محل الحلاقة أو تواصل معنا من خلال أي من الطرق التالية. نتطلع لخدمتك!',
    findUs: 'اعثر علينا',
    locationDesc: 'يقع في قلب المدينة، سهل الوصول بالسيارة أو وسائل النقل العام.',
    interactiveMap: 'خريطة تفاعلية',
    mapIntegration: 'تكامل الخريطة سيكون هنا',
    whyVisitEliteCuts: 'لماذا زيارة Frisør Nærum؟',
    convenientLocation: 'موقع مناسب',
    centrallyLocated: 'يقع في وسط المدينة مع سهولة وقوف السيارات ووصول وسائل النقل العام.',
    flexibleHours: 'ساعات مرنة',
    openSevenDays: 'مفتوح 7 أيام في الأسبوع مع ساعات ممتدة لتناسب جدولك الزمني.',
    professionalService: 'خدمة مهنية',
    expertBarbersDedicated: 'حلاقون خبراء مكرسون لتقديم أفضل تجربة عناية.',
    haveQuestions: 'هل لديك أسئلة حول خدماتنا أو تريد جدولة موعد؟ لا تتردد في التواصل - نحن هنا للمساعدة!',

    // Location and contact
    location: 'الموقع',
    copenhagen: 'Nærum',
    denmark: 'الدنمارك',
    contactInfo: 'معلومات الاتصال',
    hours: 'ساعات العمل',
    address: 'Nærum Hovedgade 52, 2850 Nærum',
    phone: 'الهاتف: 45 28 44 67 49+',
    email: 'البريد الإلكتروني: info@frisørNærum.dk',
    
    
    

    // Hours
    mondayFriday: 'الاثنين - الجمعة',

    // Footer
    professionalBarbershopFooter: 'خدمات حلاقة احترافية مع الحرفية التقليدية والأناقة الحديثة في Nærum.',
    allRightsReserved: 'جميع الحقوق محفوظة.'
  }
};
