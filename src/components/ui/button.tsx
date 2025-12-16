import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function Button({ children, variant = 'primary', size = 'default', className = '', ...props }: ButtonProps) {
    const baseStyles = "rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-[#0073ea] text-white hover:bg-[#0060b9] focus:ring-[#0073ea]/50 shadow-sm",
        secondary: "bg-white border border-[#d0d4e4] text-[#323338] hover:bg-[#f5f6f8] focus:ring-[#0073ea]/50",
        outline: "border border-[#d0d4e4] text-[#323338] hover:bg-[#f5f6f8] focus:ring-[#0073ea]/50",
        ghost: "bg-transparent hover:bg-[#f5f6f8] text-[#323338] focus:ring-[#676879]/50",
        destructive: "bg-[#e2445c] text-white hover:bg-[#c42e45] focus:ring-[#e2445c]/50"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
        icon: "h-9 w-9 flex items-center justify-center p-0"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
