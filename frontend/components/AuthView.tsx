import React, { useState } from 'react';
import { Check, Cloud, ShieldCheck, Sparkles } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import Button from './ui/Button';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

type Tier = 'free' | 'pro' | 'enterprise';

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [identifier, setIdentifier] = useState('');
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const plans: Array<{ id: Tier; label: string; seats: string; helper: string }> = [
    { id: 'free', label: 'Starter', seats: '3 seats', helper: 'For early testing' },
    { id: 'pro', label: 'Professional', seats: '15 seats', helper: 'Best for most teams' },
    { id: 'enterprise', label: 'Enterprise', seats: '100 seats', helper: 'For larger operations' }
  ];

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
    const updatedOrgs = orgs.map((o: any) =>
      o.id === user.orgId ? { ...o, totalSeats: seatsMap[selectedTier] } : o
    );
    localStorage.setItem('velo_orgs', JSON.stringify(updatedOrgs));
    onAuthSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),transparent_42%),radial-gradient(circle_at_0%_30%,_rgba(14,165,233,0.08),transparent_34%)]" />

      <div className="relative z-10 min-h-[calc(100vh-2rem)] flex items-center justify-center">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <aside className="hidden lg:flex flex-col justify-between p-8 bg-slate-50 border-r border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-xs text-indigo-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure workspace access
              </div>

              <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-slate-900">
                Welcome to a
                <span className="block text-slate-700">cleaner way to run projects.</span>
              </h1>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Keep planning, execution, and collaboration in one minimal workspace with professional defaults.
              </p>

              <div className="mt-6 space-y-3">
                {['Fast setup', 'Professional board UI', 'Simple team onboarding'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Average activation time</p>
              <p className="text-2xl font-semibold mt-1 text-slate-900">8 minutes</p>
            </div>
          </aside>

          <section className="p-6 md:p-8 lg:p-10 bg-white text-slate-900">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Velo<span className="text-indigo-600">.</span>
                </h2>
                <p className="text-xs text-slate-500">{isLogin ? 'Sign in to your workspace' : 'Create a new workspace'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`h-10 rounded-lg text-sm font-medium transition-colors ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`h-10 rounded-lg text-sm font-medium transition-colors ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Username or email</label>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300"
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
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Acme Inc"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-2">Plan</label>
                    <div className="grid gap-2">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedTier(plan.id)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${selectedTier === plan.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{plan.label}</p>
                            <span className={`text-xs ${selectedTier === plan.id ? 'text-slate-200' : 'text-slate-500'}`}>{plan.seats}</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${selectedTier === plan.id ? 'text-slate-300' : 'text-slate-500'}`}>{plan.helper}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" isLoading={loading}>
                {isLogin ? 'Sign in' : 'Create workspace'}
              </Button>
            </form>

            <p className="text-xs text-slate-500 mt-5 text-center">
              {isLogin ? 'New here? Switch to Sign up above.' : 'Already have an account? Switch to Sign in above.'}
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5" />
              Workspace setup and seat limits are configured automatically.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
