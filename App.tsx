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
  const [dadImage, setDadImage] = useState<UploadedImage | null>(() => {
    try {
      const raw = sessionStorage.getItem('dadImage');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [momImage, setMomImage] = useState<UploadedImage | null>(() => {
    try {
      const raw = sessionStorage.getItem('momImage');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [gender, setGender] = useState<ChildGender>(() => {
    try {
      return (sessionStorage.getItem('gender') as ChildGender) || 'girl';
    } catch {
      return 'girl';
    }
  });
  const [currency, setCurrency] = useState<CheckoutCurrency>(detectCurrency);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [genState, setGenState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });

  const persistDad = (img: UploadedImage | null) => {
    setDadImage(img);
    try {
      if (img) sessionStorage.setItem('dadImage', JSON.stringify(img));
      else sessionStorage.removeItem('dadImage');
    } catch {
      /* ignore quota */
    }
  };

  const persistMom = (img: UploadedImage | null) => {
    setMomImage(img);
    try {
      if (img) sessionStorage.setItem('momImage', JSON.stringify(img));
      else sessionStorage.removeItem('momImage');
    } catch {
      /* ignore */
    }
  };

  const persistGender = (g: ChildGender) => {
    setGender(g);
    try {
      sessionStorage.setItem('gender', g);
    } catch {
      /* ignore */
    }
  };

  const runGeneration = async (token: string) => {
    setPaymentToken(token);
    setGenState({ isLoading: true, resultImage: null, error: null });
    setCheckoutOpen(true);
    try {
      const dad =
        dadImage ||
        (sessionStorage.getItem('dadImage')
          ? JSON.parse(sessionStorage.getItem('dadImage')!)
          : null);
      const mom =
        momImage ||
        (sessionStorage.getItem('momImage')
          ? JSON.parse(sessionStorage.getItem('momImage')!)
          : null);
      if (!dad || !mom) {
        throw new Error('Parent photos are missing. Please upload both photos again.');
      }
      const resultBase64 = await generateChildPortrait({
        dadBase64: dad.base64,
        dadMimeType: dad.mimeType,
        momBase64: mom.base64,
        momMimeType: mom.mimeType,
        gender,
        paymentToken: token,
      });
      setGenState({ isLoading: false, resultImage: resultBase64, error: null });
      setCheckoutOpen(false);
      setPaymentToken(null);
    } catch (err: any) {
      setGenState({
        isLoading: false,
        resultImage: null,
        error: err?.message || 'Failed to generate image. Please try again.',
      });
      setCheckoutOpen(false);
      setPaymentToken(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const cancelled = params.get('payment_cancelled');
    if (sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      (async () => {
        setVerifying(true);
        setCheckoutOpen(true);
        setGenState({ isLoading: false, resultImage: null, error: null });
        try {
          const result = await verifyCheckoutSession(sessionId);
          if (!result?.paymentToken) {
            throw new Error('Your payment could not be verified by Stripe.');
          }
          // runGeneration sets paymentToken synchronously before its first await;
          // React batches that with setVerifying(false) so PaymentCheckout never flashes.
          setVerifying(false);
          await runGeneration(result.paymentToken);
        } catch (e: any) {
          setVerifying(false);
          setCheckoutOpen(false);
          setGenState({
            isLoading: false,
            resultImage: null,
            error: e?.message || 'Failed to verify Stripe payment.',
          });
        }
      })();
    } else if (cancelled) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setGenState((s) => ({
        ...s,
        error: 'Payment was cancelled. Please try again.',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateClick = () => {
    if (!dadImage || !momImage) return;
    // Open checkout only — do NOT set isLoading here or the UI skips
    // PaymentCheckout and falsely shows "Payment Verified".
    setPaymentToken(null);
    setGenState({ isLoading: false, resultImage: null, error: null });
    setCheckoutOpen(true);
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
          title: 'My MiniMe AI Result',
          text: 'Check out what our future kid might look like!',
          files: [file],
        });
      } else {
        alert('Sharing is not supported on this browser. Please use the Download button.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const DadIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label="Dad">
      👨
    </span>
  );

  const MomIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label="Mom">
      👩
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 selection:bg-indigo-100">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1">
            <header className="text-center lg:text-left space-y-2">
              <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm mb-2 border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                  AI Baby Generator
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                MiniMe <span className="text-indigo-500">AI</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mx-auto lg:mx-0">
                Upload photos of both parents and let our genetic AI predict your future child's
                adorable face!
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader
                label="Dad's Photo"
                subLabel="Upload a clear portrait"
                image={dadImage}
                onImageUpload={persistDad}
                onRemove={() => persistDad(null)}
                icon={DadIcon}
              />
              <ImageUploader
                label="Mom's Photo"
                subLabel="Upload a clear portrait"
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
                    Select Gender
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
                      <span className="text-lg">👦</span> Boy
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
                      <span className="text-lg">👧</span> Girl
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <Button
                    onClick={handleGenerateClick}
                    isLoading={genState.isLoading && !checkoutOpen}
                    disabled={!dadImage || !momImage || checkoutOpen}
                    className="w-full md:min-w-[220px]"
                  >
                    {genState.isLoading
                      ? `Creating Magic...`
                      : `Meet Your Future ${gender === 'boy' ? 'Son' : 'Daughter'}`}
                  </Button>
                </div>
              </div>

              {genState.error && (
                <p className="text-center text-rose-400 text-sm font-medium bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
                  {genState.error}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-8">
            <div
              className={`
              relative w-full rounded-[2.5rem] overflow-hidden transition-all duration-500
              ${
                genState.resultImage
                  ? 'bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                  : 'bg-white/50 border-2 border-dashed border-indigo-100 min-h-[400px] lg:min-h-[600px] flex flex-col items-center justify-center p-8'
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
                      <span className="text-xs font-bold text-slate-600">✨ AI Generated</span>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-6 bg-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Your MiniMe is Here!</h2>
                      <p className="text-slate-500 text-sm">
                        Based on genetic traits from both parents.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
                      >
                        Share
                      </button>
                    </div>

                    <button
                      onClick={() => window.location.reload()}
                      className="w-full text-indigo-400 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider py-2 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              ) : checkoutOpen ? (
                <div className="w-full h-full flex flex-col items-center justify-center py-6">
                  {verifying ? (
                    <div className="text-center space-y-4 max-w-[350px]">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800">Verifying Stripe Payment</h3>
                      <p className="text-slate-400 text-xs">
                        Validating your Checkout session with Stripe…
                      </p>
                    </div>
                  ) : paymentToken ? (
                    <div className="text-center space-y-4 max-w-[350px]">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                      <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Payment Verified
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800">Combining DNA Traits</h3>
                      <p className="text-slate-400 text-xs">
                        Rendering your future child&apos;s portrait. Please don&apos;t close this window.
                      </p>
                    </div>
                  ) : (
                    <PaymentCheckout
                      currency={currency}
                      onCurrencyChange={setCurrency}
                      onPaymentSuccess={(token) => {
                        void runGeneration(token);
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
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Create</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Upload both parents photos and hit generate to unlock the secure checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
