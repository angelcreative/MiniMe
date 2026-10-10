import React, { useEffect, useState } from 'react';
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
import { useLanguage } from './i18n/LanguageContext';

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
      const msg = String(err?.message || 'Failed to generate image. Please try again.');
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

  const DadIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label={t.dadPhoto}>
      👨
    </span>
  );

  const MomIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label={t.momPhoto}>
      👩
    </span>
  );

  const paidReady = Boolean(paymentToken);
  const creatorMode = Boolean(creatorAccess);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 selection:bg-indigo-100">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <header className="text-center lg:text-left space-y-2">
              <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm mb-2 border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                  {t.badge}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                MiniMe <span className="text-indigo-500">AI</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mx-auto lg:mx-0">
                {t.tagline}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader
                label={t.dadPhoto}
                subLabel={t.uploadPortrait}
                image={dadImage}
                onImageUpload={persistDad}
                onRemove={() => persistDad(null)}
                icon={DadIcon}
              />
              <ImageUploader
                label={t.momPhoto}
                subLabel={t.uploadPortrait}
                image={momImage}
                onImageUpload={persistMom}
                onRemove={() => persistMom(null)}
                icon={MomIcon}
              />
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.selectGender}
                  </span>
                  <div className="flex p-1 bg-slate-100 rounded-full">
                    <button
                      onClick={() => persistGender('boy')}
                      className={`
                          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                          ${
                            gender === 'boy'
                              ? 'bg-white text-sky-500 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }
                        `}
                    >
                      <span className="text-lg">👦</span> {t.boy}
                    </button>
                    <button
                      onClick={() => persistGender('girl')}
                      className={`
                          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                          ${
                            gender === 'girl'
                              ? 'bg-white text-pink-500 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }
                        `}
                    >
                      <span className="text-lg">👧</span> {t.girl}
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <Button
                    onClick={handleGenerateClick}
                    isLoading={
                      genState.isLoading && !(checkoutOpen && !creatorMode)
                    }
                    disabled={
                      !dadImage || !momImage || checkoutOpen || genState.isLoading
                    }
                    className="w-full md:min-w-[220px]"
                  >
                    {genState.isLoading
                      ? t.creatingMagic
                      : creatorMode
                        ? t.generateCreator
                        : paidReady
                          ? t.generatePaid
                          : gender === 'boy'
                            ? t.meetFutureSon
                            : t.meetFutureDaughter}
                  </Button>
                </div>
              </div>

              {creatorMode && !genState.resultImage && (
                <p className="text-center text-amber-700 text-sm font-medium bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                  {t.creatorBanner}
                </p>
              )}

              {paidReady && !creatorMode && !genState.resultImage && (
                <p className="text-center text-emerald-600 text-sm font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                  {t.paidBanner}
                </p>
              )}

              {genState.error && (
                <p className="text-center text-rose-400 text-sm font-medium bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
                  {genState.error}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div
              className={`
              relative w-full rounded-[2.5rem] overflow-hidden transition-all duration-500
              ${
                genState.resultImage
                  ? 'bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                  : 'bg-white/50 border-2 border-dashed border-indigo-100 min-h-[220px] sm:min-h-[280px] lg:min-h-[600px] flex flex-col items-center justify-center p-6 md:p-8'
              }
            `}
            >
              {genState.resultImage ? (
                <div className="flex flex-col h-full animate-fade-in">
                  <div className="relative w-full aspect-[4/5] bg-slate-100">
                    <img
                      src={genState.resultImage}
                      alt={`Generated ${gender}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                      <span className="text-xs font-bold text-slate-600">{t.aiGenerated}</span>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-6 bg-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">{t.resultTitle}</h2>
                      <p className="text-slate-500 text-sm">{t.resultSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
                      >
                        {t.download}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
                      >
                        {t.share}
                      </button>
                    </div>

                    <button
                      onClick={() => window.location.reload()}
                      className="w-full text-indigo-400 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider py-2 transition-colors"
                    >
                      {t.startOver}
                    </button>
                  </div>
                </div>
              ) : checkoutOpen || (creatorMode && genState.isLoading) ? (
                <div className="w-full h-full flex flex-col items-center justify-center py-6">
                  {verifying ? (
                    <div className="text-center space-y-4 max-w-[350px]">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800">{t.verifyingTitle}</h3>
                      <p className="text-slate-400 text-xs">{t.verifyingBody}</p>
                    </div>
                  ) : (paymentToken || creatorMode) && genState.isLoading ? (
                    <GenerationWaitExperience
                      mode={creatorMode ? 'creator' : 'paid'}
                      gender={gender}
                    />
                  ) : creatorMode ? (
                    <div className="text-center space-y-6 max-w-xs">
                      <div className="relative mx-auto w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center">
                        <span className="text-5xl opacity-50">✨</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">{t.creatorModeTitle}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{t.creatorModeBody}</p>
                      </div>
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
                <div className="text-center space-y-6 max-w-xs">
                  <div className="relative mx-auto w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center">
                    <span className="text-5xl opacity-50">👶</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">{t.readyTitle}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{t.readyBody}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DemoExample />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
