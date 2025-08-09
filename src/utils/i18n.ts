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
    experienceEliteCuts: 'Book your appointment today and experience the Elite Cuts difference',

    // Hero section
    heroTitle: 'Welcome to Elite Cuts Copenhagen',
    heroSubtitle: 'Experience the finest barbershop tradition with modern style in the heart of Copenhagen. Professional cuts, expert service, timeless craftsmanship.',
    viewServices: 'View Services',

    // Services
    ourServices: 'Our Services',
    professionalBarbering: 'Professional barbering services tailored to your style and preferences',
    whyChooseEliteCuts: 'Why Choose Elite Cuts?',
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
    appointmentDetailsTitle: 'Appointment Details:',
    bookAnother: 'Book Another Appointment',
    returnHome: 'Return to Home',

    // Location and contact
    location: 'Location',
    copenhagen: 'Copenhagen',
    denmark: 'Denmark',
    contactInfo: 'Contact Info',
    hours: 'Hours',
    address: 'Nørrebrogade 123, 2200 Copenhagen N',
    phone: 'Phone: +45 12 34 56 78',
    email: 'Email: info@elitecuts.dk',

    // Hours
    mondayFriday: 'Monday - Friday: 9:00 AM - 7:00 PM',

    // Footer
    professionalBarbershopFooter: 'Professional barbershop services with traditional craftsmanship and modern style in Copenhagen.',
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
    experienceEliteCuts: 'Book din tid i dag og oplev Elite Cuts forskellen',

    // Hero section
    heroTitle: 'Velkommen til Elite Cuts København',
    heroSubtitle: 'Oplev den fineste barbertradition med moderne stil i hjertet af København. Professionelle klipninger, ekspertservice, tidløs håndværk.',
    viewServices: 'Se Tjenester',

    // Services
    ourServices: 'Vores Tjenester',
    professionalBarbering: 'Professionelle barbertjenester skræddersyet til din stil og præferencer',
    whyChooseEliteCuts: 'Hvorfor Vælge Elite Cuts?',
    traditionalExcellence: 'Vi kombinerer traditionel barberekspertise med moderne bekvemmelighed',
    quickEasyBooking: 'Hurtig & Nem Booking',
    quickBookingDesc: 'Book din tid online med blot få klik',
    expertBarbers: 'Ekspert Barbere',
    expertBarbersDesc: 'Erfarne professionelle med års ekspertise',
    premiumService: 'Premium Service',
    premiumServiceDesc: 'Højkvalitets værktøj og premium produkter',

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

    // Booking confirmation
    bookingConfirmed: 'Booking Bekræftet!',
    appointmentSuccessfullyBooked: 'Din tid er blevet booket med succes. Vi sender dig en bekraeftelses-email snart.',
    confirmationEmailSent: '',
    appointmentDetailsTitle: 'Tidsdetaljer:',
    bookAnother: 'Book Endnu En Tid',
    returnHome: 'Tilbage til Hjem',

    // Location and contact
    location: 'Beliggenhed',
    copenhagen: 'København',
    denmark: 'Danmark',
    contactInfo: 'Kontakt Info',
    hours: 'Åbningstider',
    address: 'Nørrebrogade 123, 2200 København N',
    phone: 'Telefon: +45 12 34 56 78',
    email: 'Email: info@elitecuts.dk',

    // Hours
    mondayFriday: 'Mandag - Fredag: 9:00 - 19:00',

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
    experienceEliteCuts: 'احجز موعدك اليوم واختبر الفرق في إليت كتس',

    // Hero section
    heroTitle: 'مرحباً بكم في إليت كتس كوبنهاغن',
    heroSubtitle: 'اختبر أفضل تقاليد الحلاقة مع الأناقة الحديثة في قلب كوبنهاغن. قصات احترافية، خدمة خبيرة، حرفية خالدة.',
    viewServices: 'عرض الخدمات',

    // Services
    ourServices: 'خدماتنا',
    professionalBarbering: 'خدمات حلاقة احترافية مصممة خصيصاً لأسلوبك وتفضيلاتك',
    whyChooseEliteCuts: 'لماذا تختار إليت كتس؟',
    traditionalExcellence: 'نجمع بين التميز التقليدي في الحلاقة والراحة الحديثة',
    quickEasyBooking: 'حجز سريع وسهل',
    quickBookingDesc: 'احجز موعدك عبر الإنترنت بنقرات قليلة فقط',
    expertBarbers: 'حلاقون خبراء',
    expertBarbersDesc: 'محترفون ذوو خبرة مع سنوات من الإتقان',
    premiumService: 'خدمة مميزة',
    premiumServiceDesc: 'أدوات عالية الجودة ومنتجات مميزة',

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
    appointmentDetailsTitle: 'تفاصيل الموعد:',
    bookAnother: 'احجز موعداً آخر',
    returnHome: 'العودة للرئيسية',

    // Location and contact
    location: 'الموقع',
    copenhagen: 'كوبنهاغن',
    denmark: 'الدنمارك',
    contactInfo: 'معلومات الاتصال',
    hours: 'ساعات العمل',
    address: 'نوريبروغادي ١٢٣، ٢٢٠٠ كوبنهاغن شمال',
    phone: 'الهاتف: ٧٨ ٥٦ ٣٤ ١٢ ٤٥+',
    email: 'البريد الإلكتروني: info@elitecuts.dk',

    // Hours
    mondayFriday: 'الاثنين - الجمعة: ٩:٠٠ ص - ٧:٠٠ م',

    // Footer
    professionalBarbershopFooter: 'خدمات حلاقة احترافية مع الحرفية التقليدية والأناقة الحديثة في كوبنهاغن.',
    allRightsReserved: 'جميع الحقوق محفوظة.'
  }
};
