import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, email, phone, age: ageStr, password, confirmPassword } = formData;
    if (!firstName || !lastName || !email || !phone || !ageStr || !password || !confirmPassword) {
       return showNotification('Please fill out all required fields', 'error');
    }
    if (password !== confirmPassword) {
      return showNotification('Passwords do not match', "error");
    }
    if (password.length < 6) {
      return showNotification('Password must be at least 6 characters long', "error");
    }
    const age = parseInt(formData.age);
    if (age < 15 || age > 25) {
      return showNotification('Our services are designed for ages 15-25', "error");
    }

    const user = await register({ firstName, lastName, email, password, age, phone });

    if (user) {
      showNotification('Account created successfully! Redirecting...', "success");
      setTimeout(() => navigate('/account'), 1500);
    } else {
      showNotification('Registration failed. An account with this email may already exist.', "error");
    }
  };

  return (
    <div className="py-20 bg-grima-50 min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <UserPlus className="h-12 w-12 text-grima-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Become a client and start moving towards a better financial future</p>
          </div>
         
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="First Name *" name="firstName" value={formData.firstName} onChange={handleInputChange} icon={<User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>} />
              <InputField label="Last Name *" name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </div>
            
            <InputField label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={<Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>} />
            
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone Number *" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} icon={<Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>} />
                <InputField label="Age *" name="age" type="select" value={formData.age} onChange={handleInputChange}>
                    <option value="">Select age</option>
                    {Array.from({ length: 11 }, (_, i) => i + 15).map((age) => (<option key={age} value={age}>{age}</option>))}
                </InputField>
            </div>

            <InputField label="Password *" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} minLength={6} icon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>} button={<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>} />
            <InputField label="Confirm Password *" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleInputChange} icon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>} button={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>} />
            
            <button type="submit" disabled={isLoading} className="w-full bg-grima-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-grima-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-grima-primary font-medium hover:text-grima-dark">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, type = 'text', children, icon, button, ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
            {icon}
            {type === 'select' ? (
                <select {...props} className={`w-full p-3 border border-gray-300 rounded-lg bg-white ${icon ? 'pl-10' : ''}`}>{children}</select>
            ) : (
                <input type={type} {...props} className={`w-full p-3 border border-gray-300 rounded-lg ${icon ? 'pl-10' : ''} ${button ? 'pr-12' : ''}`} />
            )}
            {button}
        </div>
    </div>
);

export default RegisterPage;