import React, { useState } from 'react';

export const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  icon,
  rightIcon,
  onInvalid,
  onInput,
  onChange,
  rows,
  ...props
}, ref) => {
  const [localError, setLocalError] = useState('');

  const handleInvalid = (e) => {
    e.preventDefault();
    
    const validity = e.target.validity;
    let msg = e.target.validationMessage;
    
    if (validity.valueMissing && label) {
      const formatLabelText = (txt) => {
        if (!txt) return '';
        if (txt === txt.toUpperCase() && txt.length > 1) return txt;
        return txt.split(' ').map((word) => {
          if (word === word.toUpperCase() && /[A-Z]/.test(word) && word.length > 1) {
            return word;
          }
          return word.toLowerCase();
        }).join(' ');
      };
      
      msg = `Vui lòng điền ${formatLabelText(label)}`;
    } else if (validity.typeMismatch && type === 'email') {
      msg = 'Vui lòng nhập email hợp lệ';
    }
    
    setLocalError(msg);
    if (onInvalid) onInvalid(e);
  };

  const handleInput = (e) => {
    if (localError) {
      setLocalError('');
    }
    if (onInput) onInput(e);
  };

  const handleChange = (e) => {
    if (localError) {
      setLocalError('');
    }
    if (onChange) onChange(e);
  };

  const displayError = error || localError;
  const isTextarea = type === 'textarea';

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && !isTextarea && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        {isTextarea ? (
          <textarea
            ref={ref}
            placeholder={placeholder}
            onInvalid={handleInvalid}
            onInput={handleInput}
            onChange={handleChange}
            rows={rows || 3}
            className={`w-full bg-gray-50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand text-gray-900 placeholder-gray-400 rounded-lg p-3 outline-none transition-all duration-300 text-sm ${
              displayError ? 'border-red-500 focus:border-red-500/50 focus:ring-red-500/20' : ''
            } ${className}`}
            {...props}
          />
        ) : (
          <input
            type={type}
            ref={ref}
            placeholder={placeholder}
            onInvalid={handleInvalid}
            onInput={handleInput}
            onChange={handleChange}
            className={`w-full bg-gray-50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand text-gray-900 placeholder-gray-400 rounded-lg py-2.5 transition-all duration-300 outline-none ${
              icon ? 'pl-10' : 'pl-4'
            } ${rightIcon ? 'pr-10' : 'pr-4'} ${displayError ? 'border-red-500 focus:border-red-500/50 focus:ring-red-500/20' : ''} ${className}`}
            {...props}
          />
        )}
        {rightIcon && !isTextarea && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {displayError && (
        <p className="mt-1 text-xs text-red-500 font-medium pl-0.5 animate-in fade-in duration-200">
          {displayError}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
