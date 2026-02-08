import React, { useState } from 'react';
import { Cloud } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import Button from './ui/Button';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [identifier, setIdentifier] = useState('');
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Enter your username or email.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const user = userService.login(identifier.trim());
      if (!user) {
        setError('Account not found.');
        setLoading(false);
        return;
      }
      onAuthSuccess(user);
      return;
    }

    if (!orgName.trim()) {
      setError('Enter your organization name.');
      setLoading(false);
      return;
    }

    const user = userService.register(identifier.trim(), orgName.trim());
    const seatsMap = { free: 3, pro: 15, enterprise: 100 };
    const orgsStr = localStorage.getItem('velo_orgs') || '[]';
    const orgs = JSON.parse(orgsStr);
    const updatedOrgs = orgs.map((o: any) => (
      o.id === user.orgId ? { ...o, totalSeats: seatsMap[selectedTier] } : o
    ));
    localStorage.setItem('velo_orgs', JSON.stringify(updatedOrgs));
    onAuthSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-slate-900 text-white"><Cloud className="w-4 h-4" /></div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Velo</h1>
            <p className="text-xs text-slate-500">Simple workspace access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Username or email</label>
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="you@company.com"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Organization</label>
                <input
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Acme Inc"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Plan</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                >
                  <option value="free">Starter (3 seats)</option>
                  <option value="pro">Professional (15 seats)</option>
                  <option value="enterprise">Enterprise (100 seats)</option>
                </select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-rose-700">{error}</p>}

          <Button type="submit" className="w-full" isLoading={loading}>
            {isLogin ? 'Sign in' : 'Create workspace'}
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {isLogin ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
