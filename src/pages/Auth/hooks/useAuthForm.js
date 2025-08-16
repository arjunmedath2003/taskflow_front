import { useState, useEffect } from 'react';

const API_URL = 'https://taskflowback.netlify.app/.netlify/functions/api';

export default function useAuthForm({ isLogin, onAuthSuccess }) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (currentValues) => {
    const newErrors = {};

    if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValues.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (touched.password && currentValues.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!isLogin) {
      if (touched.name && !currentValues.name) {
        newErrors.name = 'Name is required.';
      }
      if (
        touched.confirmPassword &&
        currentValues.password !== currentValues.confirmPassword
      ) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    return newErrors;
  };

  useEffect(() => {
    setErrors(validate(values));
  }, [values, isLogin, touched]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setValues((prev) => ({ ...prev, [id]: value }));

    if (!touched[id]) {
      setTouched((prev) => ({ ...prev, [id]: true }));
    }
  };

  const isFormInvalid = () => {
    const requiredFields = isLogin
      ? ['email', 'password']
      : ['name', 'email', 'password', 'confirmPassword'];

    const currentErrors = validate(values);

    for (const field of requiredFields) {
      if (!values[field] || currentErrors[field]) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (isFormInvalid()) return;

    setIsLoading(true);
    setErrors({});

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const payload = isLogin
      ? { email: values.email, password: values.password }
      : { name: values.name, email: values.email, password: values.password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      onAuthSuccess(data);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setValues({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    isLoading,
    handleChange,
    handleSubmit,
    resetForm,
    isFormInvalid
  };
}
