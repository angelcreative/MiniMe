import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary disabled:bg-subtle disabled:text-muted',
  secondary:
    'bg-bg text-text border border-control-border disabled:bg-subtle disabled:text-muted disabled:border-transparent',
  ghost: 'bg-transparent text-accent underline-offset-4 hover:underline disabled:text-muted',
};

const SIZES: Record<Size, string> = {
  sm: 'h-control-sm px-2',
  md: 'h-control px-4',
  lg: 'h-control-lg px-4',
};

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    aria-hidden
    className={`inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent spin ${className}`}
  />
);

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    className={`ctl touch inline-flex items-center justify-center gap-2 rounded-control font-sans text-label font-medium whitespace-normal text-center ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {isLoading && <Spinner />}
    {children}
  </button>
);
