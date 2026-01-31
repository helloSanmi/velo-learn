
import React, { useState } from 'react';
import { Cloud, ArrowRight } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      const user = userService.login(identifier);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('User not found. Try registering!');
      }
    } else {
      const user = userService.register(identifier);
      onAuthSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 p-3 rounded-2xl text-white mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">CloudTasks</h1>
          <p className="text-slate-500 font-medium">{isLogin ? 'Welcome back!' : 'Create an account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username or Email</label>
            <input
              required
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              placeholder="e.g. alex or alex@cloudtasks.io"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            {isLogin ? 'Sign In' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
