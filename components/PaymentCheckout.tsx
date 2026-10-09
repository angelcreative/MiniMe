import React, { useEffect, useRef, useState } from 'react';
import {
  CheckoutCurrency,
  createCheckoutSession,
  verifyCheckoutSession,
} from '../services/apiService';

interface Props {
  currency: CheckoutCurrency;
  onCurrencyChange: (c: CheckoutCurrency) => void;
  /** Persist parent photos before leaving for Stripe. */
  onBeforeRedirect?: () => void | Promise<void>;
  onPaymentSuccess: (paymentToken: string) => void;
  onPaymentError: (message: string) => void;
}

const DISPLAY: Record<CheckoutCurrency, { amount: string; symbol: string }> = {
  EUR: { amount: '1.00', symbol: '€' },
  USD: { amount: '1.10', symbol: '$' },
};

export const PaymentCheckout: React.FC<Props> = ({
  currency,
  onCurrencyChange,
  onBeforeRedirect,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    []
  );

  const startPolling = (sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAwaiting(true);
    setError(null);
    pollRef.current = setInterval(async () => {
      try {
        const result = await verifyCheckoutSession(sessionId);
        if (result?.paymentToken) {
          if (pollRef.current) clearInterval(pollRef.current);
          setAwaiting(false);
          onPaymentSuccess(result.paymentToken);
        }
      } catch (e) {
        console.warn('Polling checkout status...', e);
      }
    }, 2500);
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onBeforeRedirect) {
        await onBeforeRedirect();
      }
      const { url, sessionId } = await createCheckoutSession(currency);
      setCheckoutUrl(url);
      // Same-window redirect keeps draft storage in this browsing context.
      // Fallback: if navigation is blocked (rare), open tab + poll.
      try {
        window.location.assign(url);
        return;
      } catch {
        const popup = window.open(url, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setError('Popup blocked. Please click the button below to pay securely.');
        }
        startPolling(sessionId);
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to connect to Stripe server. Please try again.';
      setError(msg);
      onPaymentError(msg);
    } finally {
      setLoading(false);
    }
  };

  const { amount, symbol } = DISPLAY[currency];

  return (
    <div className="relative z-10 w-full max-w-[350px] bg-white/95 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] space-y-4 mx-auto animate-fade-in">
      <div className="text-center space-y-0.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
          Secure Checkout
        </div>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
          Unlock Baby Portrait
        </h3>
        <p className="text-slate-500 text-[11px] font-medium max-w-xs mx-auto">
          Pay a secure one-time processing fee to complete genetic compilation with Gemini AI.
        </p>
      </div>

      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            Total Processing Fee
          </span>
          <span className="text-xl font-extrabold text-slate-800 tracking-tight">
            {symbol}
            {amount}
          </span>
        </div>
        <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-slate-100">
          <button
            type="button"
            onClick={() => onCurrencyChange('EUR')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              currency === 'EUR'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            EUR (€)
          </button>
          <button
            type="button"
            onClick={() => onCurrencyChange('USD')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              currency === 'USD'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {awaiting ? (
        <div className="text-center py-6 space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Awaiting Secure Payment...</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto">
              Complete payment in the Stripe tab. This page will continue automatically.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-1.5 items-center justify-center">
            <button
              type="button"
              onClick={async () => {
                if (onBeforeRedirect) await onBeforeRedirect();
                if (checkoutUrl) window.open(checkoutUrl, '_blank');
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              Reopen Stripe Gateway
            </button>
            <button
              type="button"
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setAwaiting(false);
              }}
              className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-60"
          >
            {loading ? 'Redirecting to Stripe...' : 'Pay with Card / Apple Pay / Google Pay'}
          </button>
          {error && (
            <div className="text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-[11px] font-semibold">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
