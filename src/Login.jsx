import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Main Login Component - Manages auth and redirects
export default function Login() {
    const navigate = useNavigate();
    // Check for token on initial render
    const [token, setToken] = useState(localStorage.getItem('token'));

    // This effect checks if the user is already logged in and redirects them.
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            navigate('/app'); // Redirect to main app page if already logged in
        }
    }, [token, navigate]);

    // This function is called upon successful authentication
    const handleAuthSuccess = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        navigate('/app'); // Redirect to main app page after login/signup
    };

    // While checking for a token or redirecting, we can render nothing or a loading spinner
    if (token) {
        return null; // Or a loading component
    }

    return (
        <div className="antialiased text-stone-300 bg-stone-900 min-h-screen">
            <AuthPage onAuthSuccess={handleAuthSuccess} />
        </div>
    );
}


// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }) => {
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
    const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

    return (
        <div className="w-full mt-2">
            <div className="flex h-2 rounded-full overflow-hidden bg-stone-700">
                 {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-1/4 h-full pr-1">
                        <div className={`h-full rounded-full transition-colors duration-300 ${strength > i ? strengthColor[i] : ''}`}></div>
                    </div>
                ))}
            </div>
            <p className={`text-xs mt-1 text-right font-medium ${
                strength === 0 ? 'text-stone-500' :
                strength === 1 ? 'text-red-500' :
                strength === 2 ? 'text-orange-500' :
                strength === 3 ? 'text-yellow-500' : 'text-green-500'
            }`}>
                {password.length > 0 && strength > 0 ? strengthText[strength - 1] : ''}
            </p>
        </div>
    );
};

// Custom Input Field Component
const InputField = ({ id, label, type, value, onChange, placeholder, error, touched }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPasswordField = type === 'password';
    
    const hasError = touched && error;
    const isValid = touched && !error && value.length > 0;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type}
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
                {isValid && !isPasswordField && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />}
                {hasError && !isPasswordField && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />}
            </div>
            {hasError && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};


// Authentication Page Component (Login and Signup)
const AuthPage = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [values, setValues] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = 'https://taskflowback.netlify.app/.netlify/functions/api/'; // Your backend URL

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
            if (touched.confirmPassword && currentValues.password !== currentValues.confirmPassword) {
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
        setValues(prev => ({ ...prev, [id]: value }));
        if (!touched[id]) {
            setTouched(prev => ({ ...prev, [id]: true }));
        }
    };

    const isFormInvalid = () => {
        const requiredFields = isLogin ? ['email', 'password'] : ['name', 'email', 'password', 'confirmPassword'];
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
        
        const allFieldsTouched = { name: true, email: true, password: true, confirmPassword: true };
        setTouched(allFieldsTouched);

        if (isFormInvalid()) {
            return;
        }

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

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-400">TaskFlow</h1>
                    <p className="text-stone-400 mt-2">Stay Organized, Stay Productive</p>
                </div>

                <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-stone-700">
                    <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Login to your Account' : 'Create a New Account'}</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <InputField id="name" label="Name" type="text" value={values.name} onChange={handleChange} placeholder="Full Name" error={errors.name} touched={touched.name}/>
                        )}
                        <InputField id="email" label="Email" type="email" value={values.email} onChange={handleChange} placeholder="Email" error={errors.email} touched={touched.email}/>
                        <div>
                            <InputField id="password" label="Password" type="password" value={values.password} onChange={handleChange} placeholder="Password" error={errors.password} touched={touched.password}/>
                            {!isLogin && <PasswordStrengthIndicator password={values.password} />}
                        </div>
                        {!isLogin && (
                           <InputField id="confirmPassword" label="Confirm Password" type="password" value={values.confirmPassword} onChange={handleChange} placeholder="Confirm Password" error={errors.confirmPassword} touched={touched.confirmPassword}/>
                        )}
                        
                        {errors.form && (
                            <div className="flex items-center p-3 text-sm text-red-400 bg-red-900/20 rounded-md">
                                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span>{errors.form}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading || isFormInvalid()}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-stone-900 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-sm text-stone-400 mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => { setIsLogin(!isLogin); setTouched({}); setValues({name: '', email: '', password: '', confirmPassword: ''}); setErrors({}); }} className="font-medium text-green-400 hover:text-green-300 ml-1">
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};