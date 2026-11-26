import React, { useEffect, useRef, useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { PaymentCheckout } from './components/PaymentCheckout';
import { UploadedImage, GenerationState, ChildGender } from './types';
import {
  CheckoutCurrency,
  generateChildPortrait,
  verifyCheckoutSession,
} from './services/apiService';
import {
  clearDraftAfterSuccess,
  loadDraftDad,
  loadDraftGender,
  loadDraftMom,
  loadDraftPaymentToken,
  readPhotosForGenerate,
  saveDraftGender,
  saveDraftImage,
  saveDraftPaymentToken,
  storedToUploaded,
} from './services/draftStorage';
import { DemoExample } from './components/DemoExample';
import { GenerationWaitExperience } from './components/GenerationWaitExperience';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeToggle } from './components/ThemeToggle';
import { useLanguage } from './i18n/LanguageContext';
import { Segmented } from './components/Segmented';
import { Spinner } from './components/Button';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Baby,
  DownloadSimple,
  ShareNetwork,
  User,
  Warning,
} from '@phosphor-icons/react';

const CREATOR_ACCESS_KEY = 'minime_creator_access';

const readCreatorAccess = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('access');
    if (fromUrl && fromUrl.length >= 16) {
      sessionStorage.setItem(CREATOR_ACCESS_KEY, fromUrl);
      params.delete('access');
      const qs = params.toString();
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
      );
      return fromUrl;
    }
    return sessionStorage.getItem(CREATOR_ACCESS_KEY);
  } catch {
    return null;
  }
};

const detectCurrency = (): CheckoutCurrency => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.includes('Europe') ||
      tz.includes('Madrid') ||
      tz.includes('Berlin') ||
      tz.includes('Paris')
    ) {
      return 'EUR';
    }
  } catch {
    /* ignore */
  }
  return 'USD';
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const [dadImage, setDadImage] = useState<UploadedImage | null>(() => loadDraftDad());
  const [momImage, setMomImage] = useState<UploadedImage | null>(() => loadDraftMom());
  const [gender, setGender] = useState<ChildGender>(() => loadDraftGender());
  const [currency, setCurrency] = useState<CheckoutCurrency>(detectCurrency);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(() =>
    loadDraftPaymentToken()
  );
  const [creatorAccess, setCreatorAccess] = useState<string | null>(() =>
    typeof window !== 'undefined' ? readCreatorAccess() : null
  );
  const [genState, setGenState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });
  const panelRef = useRef<HTMLElement>(null);

  // On narrow screens the panel sits below the form: bring checkout, progress
  // and the result into view when they appear.
  useEffect(() => {
    if (!checkoutOpen && !genState.resultImage) return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [checkoutOpen, genState.resultImage]);

  const persistDad = (img: UploadedImage | null) => {
    setDadImage(img);
    void saveDraftImage('dad', img);
  };

  const persistMom = (img: UploadedImage | null) => {
    setMomImage(img);
    void saveDraftImage('mom', img);
  };

  const persistGender = (g: ChildGender) => {
    setGender(g);
    saveDraftGender(g);
  };

  const rememberPaymentToken = (token: string | null) => {
    setPaymentToken(token);
    saveDraftPaymentToken(token);
  };

  const resolveParents = (): {
    dad: UploadedImage | null;
    mom: UploadedImage | null;
  } => {
    const fromStore = readPhotosForGenerate();
    const dad =
      dadImage || (fromStore.dad ? storedToUploaded(fromStore.dad) : null);
    const mom =
      momImage || (fromStore.mom ? storedToUploaded(fromStore.mom) : null);
    if (dad && !dadImage) setDadImage(dad);
    if (mom && !momImage) setMomImage(mom);
    return { dad, mom };
  };

  const runGeneration = async (opts: {
    paymentToken?: string;
    creatorBypass?: string;
  }) => {
    if (opts.paymentToken) rememberPaymentToken(opts.paymentToken);
    setGenState({ isLoading: true, resultImage: null, error: null });
    if (opts.creatorBypass) {
      setCheckoutOpen(false);
    } else {
      setCheckoutOpen(true);
    }

    const { dad, mom } = resolveParents();
    if (!dad || !mom) {
      setGenState({
        isLoading: false,
        resultImage: null,
        error: opts.creatorBypass ? t.photosMissingCreator : t.photosMissingPaid,
      });
      setCheckoutOpen(false);
      return;
    }

    try {
      const resultBase64 = await generateChildPortrait({
        dadBase64: dad.base64,
        dadMimeType: dad.mimeType,
        momBase64: mom.base64,
        momMimeType: mom.mimeType,
        gender: loadDraftGender() || gender,
        paymentToken: opts.paymentToken,
        creatorBypass: opts.creatorBypass,
      });
      clearDraftAfterSuccess();
      if (!opts.creatorBypass) rememberPaymentToken(null);
      setGenState({ isLoading: false, resultImage: resultBase64, error: null });
      setCheckoutOpen(false);
    } catch (err: any) {
      const msg = String(err?.message || "We couldn't create the portrait. Try again in a moment.");
      setGenState({
        isLoading: false,
        resultImage: null,
        error: opts.creatorBypass ? `Creator generate failed: ${msg}` : msg,
      });
      setCheckoutOpen(false);
      if (/already used|already been used/i.test(msg)) {
        rememberPaymentToken(null);
      }
    }
  };

  useEffect(() => {
    const access = readCreatorAccess();
    if (access) setCreatorAccess(access);

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const cancelled = params.get('payment_cancelled');
    if (sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      (async () => {
        setVerifying(true);
        setCheckoutOpen(true);
        setGenState({ isLoading: false, resultImage: null, error: null });
        const dad = loadDraftDad();
        const mom = loadDraftMom();
        if (dad) setDadImage(dad);
        if (mom) setMomImage(mom);
        setGender(loadDraftGender());
        try {
          const result = await verifyCheckoutSession(sessionId);
          if (!result?.paymentToken) {
            throw new Error('Your payment could not be verified by Stripe.');
          }
          setVerifying(false);
          await runGeneration({ paymentToken: result.paymentToken });
        } catch (e: any) {
          setVerifying(false);
          setCheckoutOpen(false);
          const token = loadDraftPaymentToken();
          setGenState({
            isLoading: false,
            resultImage: null,
            error: e?.message || (token ? t.photosMissingPaid : t.verifyFailed),
          });
        }
      })();
    } else if (cancelled) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setGenState((s) => ({
        ...s,
        error: t.paymentCancelled,
      }));
    } else {
      const existing = loadDraftPaymentToken();
      if (existing && (!loadDraftDad() || !loadDraftMom())) {
        setGenState((s) => ({
          ...s,
          error: t.photosMissingPaid,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateClick = () => {
    const { dad, mom } = resolveParents();
    if (!dad || !mom) {
      if (paymentToken || loadDraftPaymentToken()) {
        setGenState({
          isLoading: false,
          resultImage: null,
          error: t.photosMissingPaid,
        });
      }
      return;
    }
    const bypass = creatorAccess || readCreatorAccess();
    if (bypass) {
      void runGeneration({ creatorBypass: bypass });
      return;
    }
    const token = paymentToken || loadDraftPaymentToken();
    if (token) {
      void runGeneration({ paymentToken: token });
      return;
    }
    void (async () => {
      await saveDraftImage('dad', dad);
      await saveDraftImage('mom', mom);
      saveDraftGender(gender);
      setGenState({ isLoading: false, resultImage: null, error: null });
      setCheckoutOpen(true);
    })();
  };

  const handleDownload = async () => {
    if (!genState.resultImage) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      try {
        const response = await fetch(genState.resultImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        window.open(genState.resultImage, '_blank');
      }
    } else {
      const link = document.createElement('a');
      link.href = genState.resultImage;
      link.download = `minime-${gender}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (!genState.resultImage) return;
    try {
      const response = await fetch(genState.resultImage);
      const blob = await response.blob();
      const file = new File([blob], `minime-${gender}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: t.shareTitle,
          text: t.shareText,
          files: [file],
        });
      } else {
        alert(t.shareUnsupported);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const paidReady = Boolean(paymentToken);
  const creatorMode = Boolean(creatorAccess);
  const showFlow = checkoutOpen || (creatorMode && genState.isLoading);

  const ctaLabel = genState.isLoading
    ? t.creatingMagic
    : creatorMode
      ? t.generateCreator
      : paidReady
        ? t.generatePaid
        : gender === 'boy'
          ? t.meetFutureSon
          : t.meetFutureDaughter;

  const placeholderIcon = <User size={24} weight="duotone" aria-hidden />;

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <span className="font-serif text-lead text-text">MiniMe</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex flex-col gap-8 sm:gap-12 lg:gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-7 flex flex-col gap-8" aria-labelledby="hero-title">
            <div className="flex flex-col gap-2">
              <p className="text-label font-medium text-muted">{t.badge}</p>
              <h1
                id="hero-title"
                className="font-serif text-heading sm:text-title text-text max-w-headline"
              >
                {t.heroTitle}
              </h1>
              <p className="text-body text-muted max-w-prose">{t.tagline}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <ImageUploader
                  label={t.dadPhoto}
                  subLabel={t.uploadPortrait}
                  image={dadImage}
                  onImageUpload={persistDad}
                  onRemove={() => persistDad(null)}
                  icon={placeholderIcon}
                />
                <ImageUploader
                  label={t.momPhoto}
                  subLabel={t.uploadPortrait}
                  image={momImage}
                  onImageUpload={persistMom}
                  onRemove={() => persistMom(null)}
                  icon={placeholderIcon}
                />
              </div>
              <p className="text-small text-muted max-w-prose">{t.formatsHint}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-container bg-surface shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-label font-medium text-muted">{t.childLabel}</span>
                  <Segmented<ChildGender>
                    label={t.childLabel}
                    value={gender}
                    onChange={persistGender}
                    options={[
                      { id: 'girl', label: t.girl },
                      { id: 'boy', label: t.boy },
                    ]}
                  />
                </div>
                <Button
                  size="lg"
                  onClick={handleGenerateClick}
                  isLoading={genState.isLoading && !(checkoutOpen && !creatorMode)}
                  disabled={!dadImage || !momImage || checkoutOpen || genState.isLoading}
                  className="w-full sm:w-auto"
                >
                  {ctaLabel}
                  {!genState.isLoading && <ArrowRight size={16} weight="bold" aria-hidden />}
                </Button>
              </div>

              {creatorMode && !genState.resultImage && (
                <p className="text-small text-warning-text bg-warning-bg rounded-inner px-4 py-2">
                  {t.creatorBanner}
                </p>
              )}
              {paidReady && !creatorMode && !genState.resultImage && (
                <p className="text-small text-success-text bg-success-bg rounded-inner px-4 py-2">
                  {t.paidBanner}
                </p>
              )}
              {genState.error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 text-small text-error-text bg-error-bg rounded-inner px-4 py-2"
                >
                  <Warning size={20} weight="duotone" className="shrink-0" aria-hidden />
                  {genState.error}
                </p>
              )}
            </div>
          </section>

          <aside ref={panelRef} className="lg:col-span-5 lg:sticky lg:top-8 scroll-mt-4">
            <div className="p-4 rounded-container bg-surface shadow-sm">
              {genState.resultImage ? (
                <div className="flex flex-col gap-4 enter">
                  <div className="relative aspect-square rounded-inner overflow-hidden bg-subtle">
                    <img
                      src={genState.resultImage}
                      alt={t.resultTitle}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-surface text-text text-label font-medium px-2 shadow-sm">
                      {t.aiGenerated}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 px-2">
                    <h2 className="font-serif text-heading text-text">{t.resultTitle}</h2>
                    <p className="text-small text-muted">{t.resultSubtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="lg" onClick={handleDownload}>
                      <DownloadSimple size={16} weight="duotone" aria-hidden />
                      {t.download}
                    </Button>
                    <Button size="lg" onClick={handleShare}>
                      <ShareNetwork size={16} weight="duotone" aria-hidden />
                      {t.share}
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={() => window.location.reload()}>
                    <ArrowCounterClockwise size={16} aria-hidden />
                    {t.startOver}
                  </Button>
                </div>
              ) : showFlow ? (
                <div className="p-2">
                  {verifying ? (
                    <div className="flex flex-col gap-2 enter" role="status">
                      <div className="flex items-center gap-2 text-text">
                        <Spinner />
                        <h2 className="font-serif text-lead">{t.verifyingTitle}</h2>
                      </div>
                      <p className="text-small text-muted">{t.verifyingBody}</p>
                    </div>
                  ) : (paymentToken || creatorMode) && genState.isLoading ? (
                    <GenerationWaitExperience
                      mode={creatorMode ? 'creator' : 'paid'}
                      gender={gender}
                    />
                  ) : creatorMode ? (
                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-heading text-text">{t.creatorModeTitle}</h2>
                      <p className="text-small text-muted">{t.creatorModeBody}</p>
                    </div>
                  ) : (
                    <PaymentCheckout
                      currency={currency}
                      onCurrencyChange={setCurrency}
                      onBeforeRedirect={async () => {
                        await saveDraftImage('dad', dadImage);
                        await saveDraftImage('mom', momImage);
                        saveDraftGender(gender);
                      }}
                      onPaymentSuccess={(token) => {
                        void runGeneration({ paymentToken: token });
                      }}
                      onPaymentError={(msg) => {
                        setCheckoutOpen(false);
                        setGenState({ isLoading: false, resultImage: null, error: msg });
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="hidden lg:flex aspect-square rounded-inner bg-subtle items-center justify-center text-muted">
                    <Baby size={24} weight="duotone" aria-hidden />
                  </div>
                  <div className="flex flex-col gap-2 px-2 pb-2">
                    <h2 className="font-serif text-lead text-text">{t.readyTitle}</h2>
                    <p className="text-small text-muted">{t.readyBody}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <DemoExample />
      </main>
    </div>
  );
};

export default App;
