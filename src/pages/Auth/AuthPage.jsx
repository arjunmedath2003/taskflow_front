import React, { useState } from 'react';
import InputField from './components/InputField';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';
import FormError from './components/FormError';
import useAuthForm from './hooks/useAuthForm';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const {
    values,
    errors,
    touched,
    isLoading,
    handleChange,
    handleSubmit,
    resetForm,
    isFormInvalid
  } = useAuthForm({ isLogin, onAuthSuccess });

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400">TaskFlow</h1>
          <p className="text-stone-400 mt-2">Stay Organized, Stay Productive</p>
        </div>

        <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-stone-700">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isLogin ? 'Login to your Account' : 'Create a New Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <InputField
                id="name"
                label="Name"
                type="text"
                value={values.name}
                onChange={handleChange}
                placeholder="Full Name"
                error={errors.name}
                touched={touched.name}
              />
            )}
            <InputField
              id="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              placeholder="Email"
              error={errors.email}
              touched={touched.email}
            />
            <div>
              <InputField
                id="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                placeholder="Password"
                error={errors.password}
                touched={touched.password}
              />
              {!isLogin && (
                <PasswordStrengthIndicator password={values.password} />
              )}
            </div>
            {!isLogin && (
              <InputField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
              />
            )}

            {errors.form && <FormError message={errors.form} />}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isFormInvalid()}
                className="w-full flex justify-center py-3 px-4 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition"
              >
                {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              resetForm();
            }}
            className="font-medium text-green-400 hover:text-green-300 ml-1"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
