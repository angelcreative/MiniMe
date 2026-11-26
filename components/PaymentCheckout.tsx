import React, { useEffect, useRef, useState } from 'react';
import {
  CheckoutCurrency,
  createCheckoutSession,
  verifyCheckoutSession,
} from '../services/apiService';
import { useLanguage } from '../i18n/LanguageContext';
import { LockSimple } from '@phosphor-icons/react';
import { Button, Spinner } from './Button';
import { Segmented } from './Segmented';

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
  const { t } = useLanguage();
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
      try {
        window.location.assign(url);
        return;
      } catch {
        const popup = window.open(url, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setError(t.popupBlocked);
        }
        startPolling(sessionId);
      }
    } catch (e: any) {
      const msg = e?.message || t.stripeFail;
      setError(msg);
      onPaymentError(msg);
    } finally {
      setLoading(false);
    }
  };

  const { amount, symbol } = DISPLAY[currency];

  return (
    <div className="w-full flex flex-col gap-4 enter">
      <div className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 text-label font-medium text-muted">
          <LockSimple size={16} weight="duotone" />
          {t.checkoutBadge}
        </p>
        <h2 className="font-serif text-heading text-text">{t.checkoutTitle}</h2>
        <p className="text-small text-muted max-w-prose">{t.checkoutSubtitle}</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-inner bg-bg p-4">
        <div className="flex flex-col">
          <span className="text-small text-muted">{t.checkoutFee}</span>
          <span className="font-serif text-heading text-text tabular-nums">
            {symbol}
            {amount}
          </span>
        </div>
        <Segmented<CheckoutCurrency>
          size="sm"
          label="Currency"
          value={currency}
          onChange={onCurrencyChange}
          options={[
            { id: 'EUR', label: 'EUR' },
            { id: 'USD', label: 'USD' },
          ]}
        />
      </div>

      {awaiting ? (
        <div className="flex flex-col gap-4 items-start" role="status">
          <div className="flex items-center gap-2 text-text">
            <Spinner />
            <span className="text-label font-medium">{t.awaitingPayment}</span>
          </div>
          <p className="text-small text-muted">{t.awaitingBody}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (onBeforeRedirect) await onBeforeRedirect();
                if (checkoutUrl) window.open(checkoutUrl, '_blank');
              }}
            >
              {t.reopenStripe}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setAwaiting(false);
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={handlePay} isLoading={loading} className="w-full">
            {loading ? t.redirecting : t.payCta}
          </Button>
          <p className="text-small text-muted text-center">{t.payMethods}</p>
          {error && (
            <p role="alert" className="text-small text-error-text bg-error-bg rounded-inner px-4 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
