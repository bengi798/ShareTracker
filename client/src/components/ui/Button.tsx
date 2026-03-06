import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#0038a8] text-white hover:bg-[#002a80] disabled:opacity-50',
  danger:  'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
  ghost:   'bg-transparent text-gray-900 dark:text-gray-100 border border-gray-900 dark:border-gray-400 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 disabled:opacity-50',
};

export function Button({ variant = 'primary', isLoading, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`inline-flex items-center justify-center rounded-none px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
