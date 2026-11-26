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
  heroTitle: string;
  childLabel: string;
  remove: string;
  replace: string;
  cameraTitle: string;
  cameraHint: string;
  cameraError: string;
  close: string;
  capture: string;
  switchCamera: string;
  payMethods: string;
  creatorAccessBadge: string;
  paymentVerifiedBadge: string;
  priceNote: string;
  darkTheme: string;
  lightTheme: string;
  exampleTag: string;
};

export const MESSAGES: Record<Lang, Messages> = {
  en: {
    badge: 'AI family portrait',
    tagline: 'Add a photo of each parent and we\'ll imagine your child at age five.',
    dadPhoto: 'Parent one',
    momPhoto: 'Parent two',
    uploadPortrait: 'Add a clear, front-facing photo',
    selectGender: 'Child',
    boy: 'Boy',
    girl: 'Girl',
    creatingMagic: 'Creating portrait',
    generateCreator: 'Generate portrait',
    generatePaid: 'Generate portrait',
    meetFutureSon: 'Meet your son',
    meetFutureDaughter: 'Meet your daughter',
    creatorBanner: 'Creator access is on. Checkout is skipped for this session.',
    paidBanner: 'Payment confirmed. Add both photos if needed and generate. You won\'t be charged again.',
    verifyingTitle: 'Confirming your payment',
    verifyingBody: 'This takes a few seconds.',
    creatorModeTitle: 'Creator mode',
    creatorModeBody: 'Add both photos and generate. Checkout is skipped.',
    readyTitle: 'Your portrait will appear here',
    readyBody: 'Add both photos, choose boy or girl, and we\'ll take you to a secure checkout.',
    resultTitle: 'Meet your MiniMe',
    resultSubtitle: 'Imagined from both parents’ features.',
    download: 'Download',
    share: 'Share',
    startOver: 'Start again',
    aiGenerated: 'AI generated',
    photosMissingPaid: 'Your payment is confirmed. Add both photos again and generate. You won\'t be charged twice.',
    photosMissingCreator: 'Add both photos, then generate.',
    paymentCancelled: 'Payment was cancelled. You can try again whenever you like.',
    verifyFailed: 'We couldn\'t confirm your payment. Refresh the page or contact us.',
    shareUnsupported: 'Your browser can\'t share files. Use Download instead.',
    shareTitle: 'Our MiniMe',
    shareText: 'Here’s what our child might look like.',
    formatsHint: 'JPG, PNG or WebP, up to 15 MB. On iPhone, export HEIC photos as JPG first.',
    heicError: 'HEIC photos aren’t supported. Export as JPG in Photos, or set Camera › Formats to “Most compatible”.',
    fileTooLarge: 'This photo is over 15 MB. Try a smaller export or take a new one.',
    unsupportedFormat: 'We can’t read this format. Use a JPG, PNG or WebP photo.',
    demoTitle: 'What to expect',
    demoSubtitle: 'We blend key facial features from both parents into a portrait of your child at age five.',
    demoFather: 'Parent one',
    demoMother: 'Parent two',
    demoFatherCaption: 'Parent one',
    demoMotherCaption: 'Parent two',
    demoPredicted: 'At age five',
    demoDisclaimer: 'Example only. Portraits are artistic illustrations, not scientific predictions.',
    checkoutBadge: 'Secure checkout by Stripe',
    checkoutTitle: 'Unlock your portrait',
    checkoutSubtitle: 'One payment, one portrait. No account or subscription.',
    checkoutFee: 'Total',
    awaitingPayment: 'Waiting for payment',
    awaitingBody: 'Finish paying in the Stripe tab. This page will continue on its own.',
    reopenStripe: 'Reopen checkout',
    cancel: 'Cancel',
    payCta: 'Continue to payment',
    redirecting: 'Opening checkout',
    popupBlocked: 'Your browser blocked the checkout window. Use the button below to open it.',
    stripeFail: 'We couldn\'t reach the payment service. Check your connection and try again.',
    waitKeepOpen: 'Keep this tab open.',
    waitElapsed: '',
    waitTrivia: 'Did you know',
    waitQuiz: 'Quick quiz',
    waitTrue: 'True',
    waitFalse: 'False',
    waitNice: 'Right.',
    waitAlmost: 'Not quite.',
    waitNext: 'Next',
    waitSkip: 'Skip',
    waitCombining: 'Blending features',
    waitUsually: 'Painting your future {child}\'s face — usually 20–45 seconds.',
    langLabel: 'Language',
    upload: 'Upload',
    camera: 'Use camera',
    readPhotoFail: 'We couldn’t read this photo. Try a JPG, PNG or WebP.',
    heroTitle: 'See who your child might be',
    childLabel: 'Child',
    remove: 'Remove photo',
    replace: 'Replace',
    cameraTitle: 'Take a photo',
    cameraHint: 'Center your face in the oval',
    cameraError: 'We couldn\'t open your camera. Allow camera access in your browser and close other apps using it.',
    close: 'Close',
    capture: 'Take photo',
    switchCamera: 'Switch camera',
    payMethods: 'Card, Apple Pay or Google Pay',
    creatorAccessBadge: 'Creator access',
    paymentVerifiedBadge: 'Payment confirmed',
    priceNote: 'One-time payment',
    darkTheme: 'Switch to dark theme',
    lightTheme: 'Switch to light theme',
    exampleTag: 'Example',
  },
  es: {
    badge: 'Retrato familiar con IA',
    tagline: 'Añade una foto de cada progenitor e imaginaremos a vuestro hijo o hija con cinco años.',
    dadPhoto: 'Progenitor uno',
    momPhoto: 'Progenitor dos',
    uploadPortrait: 'Añade una foto nítida y de frente',
    selectGender: 'Bebé',
    boy: 'Niño',
    girl: 'Niña',
    creatingMagic: 'Creando retrato',
    generateCreator: 'Generar retrato',
    generatePaid: 'Generar retrato',
    meetFutureSon: 'Conoce a tu hijo',
    meetFutureDaughter: 'Conoce a tu hija',
    creatorBanner: 'Acceso creador activo. El pago se omite en esta sesión.',
    paidBanner: 'Pago confirmado. Añade ambas fotos si hace falta y genera. No se te cobrará otra vez.',
    verifyingTitle: 'Confirmando tu pago',
    verifyingBody: 'Tarda unos segundos.',
    creatorModeTitle: 'Modo creador',
    creatorModeBody: 'Añade ambas fotos y genera. Sin pago.',
    readyTitle: 'Tu retrato aparecerá aquí',
    readyBody: 'Añade ambas fotos, elige niño o niña y te llevaremos a un pago seguro.',
    resultTitle: 'Conoce a tu MiniMe',
    resultSubtitle: 'Imaginado a partir de los rasgos de ambos.',
    download: 'Descargar',
    share: 'Compartir',
    startOver: 'Empezar de nuevo',
    aiGenerated: 'Generado con IA',
    photosMissingPaid: 'Tu pago está confirmado. Vuelve a añadir ambas fotos y genera. No se te cobrará dos veces.',
    photosMissingCreator: 'Añade ambas fotos y luego genera.',
    paymentCancelled: 'Se canceló el pago. Puedes intentarlo cuando quieras.',
    verifyFailed: 'No pudimos confirmar tu pago. Recarga la página o escríbenos.',
    shareUnsupported: 'Tu navegador no puede compartir archivos. Usa Descargar.',
    shareTitle: 'Nuestro MiniMe',
    shareText: 'Así podría ser nuestro hijo o hija.',
    formatsHint: 'JPG, PNG o WebP, hasta 15 MB. En iPhone, exporta las fotos HEIC como JPG.',
    heicError: 'Las fotos HEIC no son compatibles. Expórtala como JPG en Fotos o activa Cámara › Formatos › “Más compatible”.',
    fileTooLarge: 'Esta foto pesa más de 15 MB. Prueba una exportación más pequeña o haz otra.',
    unsupportedFormat: 'No podemos leer este formato. Usa una foto JPG, PNG o WebP.',
    demoTitle: 'Qué puedes esperar',
    demoSubtitle: 'Combinamos rasgos faciales clave de ambos progenitores en un retrato de vuestro hijo o hija con cinco años.',
    demoFather: 'Progenitor uno',
    demoMother: 'Progenitor dos',
    demoFatherCaption: 'Progenitor uno',
    demoMotherCaption: 'Progenitor dos',
    demoPredicted: 'Con cinco años',
    demoDisclaimer: 'Solo es un ejemplo. Los retratos son ilustraciones artísticas, no predicciones científicas.',
    checkoutBadge: 'Pago seguro con Stripe',
    checkoutTitle: 'Desbloquea tu retrato',
    checkoutSubtitle: 'Un pago, un retrato. Sin cuenta ni suscripción.',
    checkoutFee: 'Total',
    awaitingPayment: 'Esperando el pago',
    awaitingBody: 'Termina el pago en la pestaña de Stripe. Esta página seguirá sola.',
    reopenStripe: 'Reabrir el pago',
    cancel: 'Cancelar',
    payCta: 'Continuar al pago',
    redirecting: 'Abriendo el pago',
    popupBlocked: 'Tu navegador bloqueó la ventana de pago. Usa el botón de abajo para abrirla.',
    stripeFail: 'No pudimos conectar con el servicio de pago. Revisa tu conexión e inténtalo de nuevo.',
    waitKeepOpen: 'No cierres esta pestaña.',
    waitElapsed: '',
    waitTrivia: '¿Sabías que…?',
    waitQuiz: 'Pregunta rápida',
    waitTrue: 'Verdadero',
    waitFalse: 'Falso',
    waitNice: 'Correcto.',
    waitAlmost: 'No exactamente.',
    waitNext: 'Siguiente',
    waitSkip: 'Saltar',
    waitCombining: 'Combinando rasgos',
    waitUsually: 'Pintando la cara de tu futur{o/a} {child} — suele tardar 20–45 segundos.',
    langLabel: 'Idioma',
    upload: 'Subir',
    camera: 'Usar cámara',
    readPhotoFail: 'No pudimos leer esta foto. Prueba con JPG, PNG o WebP.',
    heroTitle: 'Descubre cómo podría ser tu hijo',
    childLabel: 'Bebé',
    remove: 'Quitar foto',
    replace: 'Cambiar',
    cameraTitle: 'Haz una foto',
    cameraHint: 'Centra tu cara en el óvalo',
    cameraError: 'No pudimos abrir la cámara. Permite el acceso en tu navegador y cierra otras apps que la usen.',
    close: 'Cerrar',
    capture: 'Hacer foto',
    switchCamera: 'Cambiar cámara',
    payMethods: 'Tarjeta, Apple Pay o Google Pay',
    creatorAccessBadge: 'Acceso creador',
    paymentVerifiedBadge: 'Pago confirmado',
    priceNote: 'Pago único',
    darkTheme: 'Cambiar a tema oscuro',
    lightTheme: 'Cambiar a tema claro',
    exampleTag: 'Ejemplo',
  },
};

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('minime_lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}
