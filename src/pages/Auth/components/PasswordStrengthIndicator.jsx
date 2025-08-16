import React from 'react';

export default function PasswordStrengthIndicator({ password }) {
  const getStrength = () => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthText = ['Weak', 'Mild', 'Strong', 'Very Strong'];
  const strengthColor = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500'
  ];

  return (
    <div className="w-full mt-2">
      <div className="flex h-2 rounded-full overflow-hidden bg-stone-700">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-1/4 h-full pr-1">
            <div
              className={`h-full rounded-full transition-colors duration-300 ${
                strength > i ? strengthColor[i] : ''
              }`}
            ></div>
          </div>
        ))}
      </div>
      <p
        className={`text-xs mt-1 text-right font-medium ${
          strength === 0
            ? 'text-stone-500'
            : strength === 1
            ? 'text-red-500'
            : strength === 2
            ? 'text-orange-500'
            : strength === 3
            ? 'text-yellow-500'
            : 'text-green-500'
        }`}
      >
        {password.length > 0 && strength > 0 ? strengthText[strength - 1] : ''}
      </p>
    </div>
  );
}
