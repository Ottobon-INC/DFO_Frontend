import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface FloatingInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  showCapsLockWarning?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  showCapsLockWarning = false,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const checkCapsLock = (e: React.MouseEvent | React.FocusEvent) => {
    if (e.type === 'blur') {
      // Optional behavior on blur
    }
  };

  const inputType = type === 'password' && isPasswordVisible ? 'text' : type;

  return (
    <div className="relative mb-2">
      <input
        type={inputType}
        id={id}
        className={`
          block px-4 pb-3 pt-6 w-full text-sm font-medium text-brand-textPrimary bg-brand-bg rounded-lg border 
          appearance-none focus:outline-none focus:ring-0 peer transition-colors duration-200
          ${isFocused ? 'border-brand-primary bg-brand-bg shadow-sm shadow-brand-primary/10' : 'border-brand-border hover:border-brand-textSecondary/50'}
        `}
        placeholder=" "
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          checkCapsLock(e);
        }}
        required={required}
      />
      <label
        htmlFor={id}
        className={`
          absolute text-sm font-semibold duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] px-2 rounded bg-brand-bg
          peer-focus:px-2 peer-focus:text-brand-primary peer-placeholder-shown:scale-100 
          peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 
          peer-focus:scale-75 peer-focus:-translate-y-4 left-3 text-brand-textSecondary pointer-events-none
        `}
      >
        {label}
      </label>

      {/* Password Toggle */}
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-textSecondary hover:text-brand-primary transition-colors"
          tabIndex={-1}
        >
          {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {/* Caps Lock Warning */}
      {showCapsLockWarning && capsLockActive && (
        <div className="absolute -bottom-6 left-0 flex items-center text-xs text-brand-warning font-bold animate-pulse">
          <AlertTriangle size={12} className="mr-1" />
          Caps Lock is on
        </div>
      )}
    </div>
  );
};