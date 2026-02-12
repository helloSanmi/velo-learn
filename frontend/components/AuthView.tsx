import React, { useState } from 'react';
import { ArrowLeft, Cloud, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import Button from './ui/Button';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  onBackToHome?: () => void;
  onOpenPricing?: () => void;
  onOpenSupport?: () => void;
}

type Tier = 'free' | 'pro' | 'enterprise';

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, initialMode = 'login', onBackToHome }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const plans: Array<{ id: Tier; label: string; seats: string }> = [
    { id: 'free', label: 'Free', seats: '3 seats' },
    { id: 'pro', label: 'Basic', seats: '15 seats' },
    { id: 'enterprise', label: 'Pro', seats: '100 seats' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) return setError('Enter your username or email.');
    if (!password.trim()) return setError('Enter your password.');
    if (password !== 'Password') return setError('Invalid password. Use "Password" for demo access.');

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
    const orgs = JSON.parse(localStorage.getItem('velo_orgs') || '[]');
    localStorage.setItem(
      'velo_orgs',
      JSON.stringify(orgs.map((o: any) => (o.id === user.orgId ? { ...o, totalSeats: seatsMap[selectedTier] } : o)))
    );
    onAuthSuccess(user);
  };

  return (
    <div className="min-h-screen bg-[#efefef] px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_1fr]">
          <aside className="hidden border-r border-[#ead4df] bg-[#f6eaf0] p-8 lg:block">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Workspace access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Sign in or create a workspace.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Use the demo password to access existing users or create a new workspace with an initial plan.
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Demo access</p>
              <p className="mt-1">Password: <span className="font-semibold">Password</span></p>
              <p className="mt-2 text-xs text-slate-500">Use admin, alex, sarah, or mike as username.</p>
            </div>
          </aside>

          <section className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-slate-900 p-2 text-white"><Cloud className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Velo<span className="text-[#76003f]">.</span></p>
                  <p className="text-xs text-slate-500">{isLogin ? 'Sign in to continue' : 'Create your workspace'}</p>
                </div>
              </div>
              {onBackToHome ? (
                <Button variant="ghost" size="sm" onClick={onBackToHome}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />Home
                </Button>
              ) : null}
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`h-10 rounded-lg text-sm font-medium ${isLogin ? 'bg-white text-[#76003f] shadow-sm' : 'text-slate-500'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`h-10 rounded-lg text-sm font-medium ${!isLogin ? 'bg-white text-[#76003f] shadow-sm' : 'text-slate-500'}`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Username or email</label>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3.5 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3.5 pr-11 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-500">Organization</label>
                    <input
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Inc"
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-slate-500">Plan</label>
                    <div className="grid gap-2">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedTier(plan.id)}
                          className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                            selectedTier === plan.id ? 'border-[#76003f] bg-[#76003f] text-white' : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{plan.label}</p>
                            <p className={`text-xs ${selectedTier === plan.id ? 'text-slate-200' : 'text-slate-500'}`}>{plan.seats}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

              <Button type="submit" className="h-11 w-full bg-[#76003f] hover:bg-[#640035]" isLoading={loading}>
                {isLogin ? 'Sign in' : 'Create workspace'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-500">
              {isLogin ? 'New workspace? Switch to Sign up.' : 'Already registered? Switch to Sign in.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
