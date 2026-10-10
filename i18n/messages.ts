import type { Lang } from '../data/trivia';

export type Messages = {
  badge: string;
  tagline: string;
  dadPhoto: string;
  momPhoto: string;
  uploadPortrait: string;
  selectGender: string;
  boy: string;
  girl: string;
  creatingMagic: string;
  generateCreator: string;
  generatePaid: string;
  meetFutureSon: string;
  meetFutureDaughter: string;
  creatorBanner: string;
  paidBanner: string;
  verifyingTitle: string;
  verifyingBody: string;
  creatorModeTitle: string;
  creatorModeBody: string;
  readyTitle: string;
  readyBody: string;
  resultTitle: string;
  resultSubtitle: string;
  download: string;
  share: string;
  startOver: string;
  aiGenerated: string;
  photosMissingPaid: string;
  photosMissingCreator: string;
  paymentCancelled: string;
  verifyFailed: string;
  shareUnsupported: string;
  shareTitle: string;
  shareText: string;
  formatsHint: string;
  heicError: string;
  fileTooLarge: string;
  unsupportedFormat: string;
  demoTitle: string;
  demoSubtitle: string;
  demoFather: string;
  demoMother: string;
  demoFatherCaption: string;
  demoMotherCaption: string;
  demoPredicted: string;
  demoDisclaimer: string;
  checkoutBadge: string;
  checkoutTitle: string;
  checkoutSubtitle: string;
  checkoutFee: string;
  awaitingPayment: string;
  awaitingBody: string;
  reopenStripe: string;
  cancel: string;
  payCta: string;
  redirecting: string;
  popupBlocked: string;
  stripeFail: string;
  waitKeepOpen: string;
  waitElapsed: string;
  waitTrivia: string;
  waitQuiz: string;
  waitTrue: string;
  waitFalse: string;
  waitNice: string;
  waitAlmost: string;
  waitNext: string;
  waitSkip: string;
  waitCombining: string;
  waitUsually: string;
  langLabel: string;
  upload: string;
  camera: string;
  readPhotoFail: string;
};

export const MESSAGES: Record<Lang, Messages> = {
  en: {
    badge: 'AI Baby Generator',
    tagline:
      "Upload photos of both parents and let our genetic AI predict your future child's adorable face!",
    dadPhoto: "Dad's Photo",
    momPhoto: "Mom's Photo",
    uploadPortrait: 'Upload a clear portrait',
    selectGender: 'Select Gender',
    boy: 'Boy',
    girl: 'Girl',
    creatingMagic: 'Creating Magic...',
    generateCreator: 'Generate (creator access)',
    generatePaid: 'Generate (payment verified)',
    meetFutureSon: 'Meet Your Future Son',
    meetFutureDaughter: 'Meet Your Future Daughter',
    creatorBanner: 'Creator access active — Stripe checkout is skipped for this session.',
    paidBanner:
      'Payment verified. Upload both photos if needed, then click generate — you will not be charged again.',
    verifyingTitle: 'Verifying Stripe Payment',
    verifyingBody: 'Validating your Checkout session with Stripe…',
    creatorModeTitle: 'Creator Mode',
    creatorModeBody: 'Upload both parents photos and hit generate — checkout is skipped.',
    readyTitle: 'Ready to Create',
    readyBody: 'Upload both parents photos and hit generate to unlock the secure checkout.',
    resultTitle: 'Your MiniMe is Here!',
    resultSubtitle: 'Based on genetic traits from both parents.',
    download: 'Download',
    share: 'Share',
    startOver: 'Start Over',
    aiGenerated: '✨ AI Generated',
    photosMissingPaid:
      'Payment already verified — please re-upload both parent photos, then click generate. You will not be charged again.',
    photosMissingCreator: 'Please upload both parent photos, then click generate.',
    paymentCancelled: 'Payment was cancelled. Please try again.',
    verifyFailed: 'Failed to verify Stripe payment.',
    shareUnsupported: 'Sharing is not supported on this browser. Please use the Download button.',
    shareTitle: 'My MiniMe AI Result',
    shareText: 'Check out what our future kid might look like!',
    formatsHint:
      'Accepted: JPG, PNG, or WebP. iPhone HEIC is not supported — export as JPG in Photos.',
    heicError:
      'iPhone HEIC is not supported — export as JPG in Photos, or turn on “Most Compatible” in Settings → Camera → Formats.',
    fileTooLarge: 'Photo is too large (max 15MB). Try a smaller export or take a new photo.',
    unsupportedFormat: 'Unsupported format. Please upload a JPG, PNG, or WebP photo.',
    demoTitle: 'Expected Result Example',
    demoSubtitle:
      'See how our AI analyzes and combines key facial traits from both parents to predict an adorable look of their child at 5 years of age.',
    demoFather: 'Father',
    demoMother: 'Mother',
    demoFatherCaption: "Father's Photo",
    demoMotherCaption: "Mother's Photo",
    demoPredicted: 'Predicted · Age 5',
    demoDisclaimer:
      'Example only — an artistic illustration of what the tool can produce, not a scientific prediction.',
    checkoutBadge: 'Secure Checkout',
    checkoutTitle: 'Unlock Baby Portrait',
    checkoutSubtitle:
      'Pay a secure one-time processing fee to complete genetic compilation with AI.',
    checkoutFee: 'Total Processing Fee',
    awaitingPayment: 'Awaiting Secure Payment...',
    awaitingBody: 'Complete payment in the Stripe tab. This page will continue automatically.',
    reopenStripe: 'Reopen Stripe Gateway',
    cancel: 'Cancel',
    payCta: 'Pay with Card / Apple Pay / Google Pay',
    redirecting: 'Redirecting to Stripe...',
    popupBlocked: 'Popup blocked. Please click the button below to pay securely.',
    stripeFail: 'Failed to connect to Stripe server. Please try again.',
    waitKeepOpen: "Keep this tab open.",
    waitElapsed: 'elapsed',
    waitTrivia: 'Genetics trivia',
    waitQuiz: 'Quick quiz',
    waitTrue: 'True',
    waitFalse: 'False',
    waitNice: 'Nice!',
    waitAlmost: 'Almost!',
    waitNext: 'Next',
    waitSkip: 'Skip',
    waitCombining: 'Combining DNA traits…',
    waitUsually: 'Painting your future {child}\'s face — usually 20–45 seconds.',
    langLabel: 'Language',
    upload: 'Upload',
    camera: 'Camera',
    readPhotoFail: 'Could not read that photo. Try JPG, PNG, or WebP.',
  },
  es: {
    badge: 'Generador de bebés con IA',
    tagline:
      'Sube fotos de ambos padres y deja que nuestra IA genética prediga la carita de vuestro futuro hijo o hija.',
    dadPhoto: 'Foto del papá',
    momPhoto: 'Foto de la mamá',
    uploadPortrait: 'Sube un retrato claro',
    selectGender: 'Elige el género',
    boy: 'Niño',
    girl: 'Niña',
    creatingMagic: 'Creando magia...',
    generateCreator: 'Generar (acceso creador)',
    generatePaid: 'Generar (pago verificado)',
    meetFutureSon: 'Conoce a tu futuro hijo',
    meetFutureDaughter: 'Conoce a tu futura hija',
    creatorBanner: 'Acceso creador activo — se omite el checkout de Stripe en esta sesión.',
    paidBanner:
      'Pago verificado. Sube ambas fotos si hace falta y pulsa generar — no se te cobrará otra vez.',
    verifyingTitle: 'Verificando el pago de Stripe',
    verifyingBody: 'Validando tu sesión de Checkout con Stripe…',
    creatorModeTitle: 'Modo creador',
    creatorModeBody: 'Sube las fotos de ambos padres y pulsa generar — sin checkout.',
    readyTitle: 'Listo para crear',
    readyBody: 'Sube las fotos de ambos padres y pulsa generar para abrir el pago seguro.',
    resultTitle: '¡Tu MiniMe ya está aquí!',
    resultSubtitle: 'Basado en rasgos genéticos de ambos padres.',
    download: 'Descargar',
    share: 'Compartir',
    startOver: 'Empezar de nuevo',
    aiGenerated: '✨ Generado con IA',
    photosMissingPaid:
      'Pago ya verificado — vuelve a subir ambas fotos de los padres y pulsa generar. No se te cobrará otra vez.',
    photosMissingCreator: 'Sube ambas fotos de los padres y luego pulsa generar.',
    paymentCancelled: 'El pago se canceló. Inténtalo de nuevo.',
    verifyFailed: 'No se pudo verificar el pago de Stripe.',
    shareUnsupported:
      'Compartir no está disponible en este navegador. Usa el botón Descargar.',
    shareTitle: 'Mi resultado MiniMe AI',
    shareText: '¡Mira cómo podría ser nuestro futuro hijo o hija!',
    formatsHint:
      'Formatos: JPG, PNG o WebP. HEIC de iPhone no compatible — exporta como JPG en Fotos.',
    heicError:
      'HEIC de iPhone no compatible — exporta como JPG en Fotos, o activa “Más compatible” en Ajustes → Cámara → Formatos.',
    fileTooLarge: 'La foto es demasiado grande (máx. 15MB). Prueba una exportación más pequeña.',
    unsupportedFormat: 'Formato no compatible. Sube una foto JPG, PNG o WebP.',
    demoTitle: 'Ejemplo de resultado esperado',
    demoSubtitle:
      'Así combina nuestra IA rasgos faciales clave de ambos padres para imaginar a su hijo o hija a los 5 años.',
    demoFather: 'Padre',
    demoMother: 'Madre',
    demoFatherCaption: 'Foto del padre',
    demoMotherCaption: 'Foto de la madre',
    demoPredicted: 'Predicción · 5 años',
    demoDisclaimer:
      'Solo un ejemplo — ilustración artística de lo que puede generar la herramienta, no una predicción científica.',
    checkoutBadge: 'Pago seguro',
    checkoutTitle: 'Desbloquea el retrato',
    checkoutSubtitle:
      'Paga una tarifa única y segura de procesamiento para completar la compilación genética con IA.',
    checkoutFee: 'Tarifa total de procesamiento',
    awaitingPayment: 'Esperando el pago seguro...',
    awaitingBody: 'Completa el pago en la pestaña de Stripe. Esta página continuará sola.',
    reopenStripe: 'Reabrir Stripe',
    cancel: 'Cancelar',
    payCta: 'Pagar con tarjeta / Apple Pay / Google Pay',
    redirecting: 'Redirigiendo a Stripe...',
    popupBlocked: 'Popup bloqueado. Pulsa el botón de abajo para pagar con seguridad.',
    stripeFail: 'No se pudo conectar con Stripe. Inténtalo de nuevo.',
    waitKeepOpen: 'No cierres esta pestaña.',
    waitElapsed: 'transcurridos',
    waitTrivia: 'Trivia genética',
    waitQuiz: 'Quiz rápido',
    waitTrue: 'Verdadero',
    waitFalse: 'Falso',
    waitNice: '¡Bien!',
    waitAlmost: '¡Casi!',
    waitNext: 'Siguiente',
    waitSkip: 'Saltar',
    waitCombining: 'Combinando rasgos de ADN…',
    waitUsually: 'Pintando la cara de tu futur{o/a} {child} — suele tardar 20–45 segundos.',
    langLabel: 'Idioma',
    upload: 'Subir',
    camera: 'Cámara',
    readPhotoFail: 'No se pudo leer esa foto. Prueba JPG, PNG o WebP.',
  },
};

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('minime_lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* ignore */
  }
  try {
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('es')) return 'es';
  } catch {
    /* ignore */
  }
  return 'en';
}
