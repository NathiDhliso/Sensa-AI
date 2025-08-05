import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormInputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: LucideIcon;
  className?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
  minLength?: number;
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  icon: Icon,
  className = '',
  inputClassName = '',
  showPasswordToggle = true,
  minLength,
  maxLength
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasPasswordToggle = type === 'password' && showPasswordToggle;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className={`relative flex items-center ${
          error ? 'ring-2 ring-red-500' : isFocused ? 'ring-2 ring-purple-500' : 'ring-1 ring-gray-300'
        } rounded-lg transition-all duration-200`}>
          {Icon && (
            <Icon className="absolute left-3 w-5 h-5 text-gray-400" />
          )}
          
          <input
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            minLength={minLength}
            maxLength={maxLength}
            className={`
              w-full px-4 py-3 bg-white border-0 rounded-lg
              focus:outline-none focus:ring-0
              disabled:bg-gray-50 disabled:text-gray-500
              placeholder-gray-400
              ${Icon ? 'pl-12' : 'pl-4'}
              ${hasPasswordToggle ? 'pr-12' : 'pr-4'}
              ${inputClassName}
            `}
          />
          
          {hasPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 text-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormInput;