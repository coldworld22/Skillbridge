export default function Button({ children, onClick, className = '', variant = 'primary', type = 'button', ...props }) {
    const base =
      'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none transition';
  
    const variants = {
      primary: 'bg-yellow-500 text-black hover:bg-yellow-600',
      outline: 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'text-gray-400 hover:text-white',
    };
  
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${base} ${variants[variant] || variants.primary} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  