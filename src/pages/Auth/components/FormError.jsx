import React from 'react';
import { XCircle } from 'lucide-react';

export default function FormError({ message }) {
  return (
    <div className="flex items-center p-3 text-sm text-red-400 bg-red-900/20 rounded-md">
      <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
