import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm border border-transparent',
  secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  'danger-solid': 'bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 border border-transparent shadow-sm',
};

const SIZES = {
  xs: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md',
  sm: 'text-sm px-3 py-2 gap-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-lg',
  lg: 'text-base px-6 py-3.5 gap-2 rounded-lg',
};

/**
 * Design-system button. Pass `as={Link}` (plus `to`) or `as="a"` to render a link
 * with button styling.
 */
const Button = ({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  type,
  ...rest
}) => {
  const isButton = Component === 'button';
  const isDisabled = disabled || loading;
  return (
    <Component
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${SIZES[size] || SIZES.md} ${!isButton && isDisabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
      ) : (
        Icon && <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
    </Component>
  );
};

export default Button;
