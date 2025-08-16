import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function InputField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  touched
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';

  const hasError = touched && error;
  const isValid = touched && !error && value.length > 0;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={
            isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-md bg-transparent focus:ring-2 focus:outline-none transition ${
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : isValid
              ? 'border-green-500 focus:ring-green-500'
              : 'border-stone-600 focus:ring-green-500 focus:border-green-500'
          }`}
          required
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {isValid && !isPasswordField && (
          <CheckCircle
            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
            size={20}
          />
        )}
        {hasError && !isPasswordField && (
          <AlertCircle
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
            size={20}
          />
        )}
      </div>
      {hasError && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
