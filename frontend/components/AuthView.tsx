
import React, { useState } from 'react';
import { Cloud, ArrowRight, Building2, UserCircle, ShieldCheck, CheckCircle2, Zap, LayoutGrid, ArrowLeft } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import Button from './ui/Button';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [step, setStep] = useState(1); 
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [identifier, setIdentifier] = useState('');
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      setLoading(true);
      const user = userService.login(identifier);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('Global identity node not found.');
        setLoading(false);
      }
    } else {
      if (!orgName.trim()) {
        setError('Organization identifier is required.');
        return;
      }
      setStep(2); 
    }
  };

  const handleFinalRegister = () => {
    setLoading(true);
    const user = userService.register(identifier, orgName);
    const seatsMap = { free: 3, pro: 15, enterprise: 100 };
    const orgsStr = localStorage.getItem('velo_orgs') || '[]';
    const orgs = JSON.parse(orgsStr);
    const updatedOrgs = orgs.map((o: any) => o.id === user.orgId ? { ...o, totalSeats: (seatsMap as any)[selectedTier] } : o);
    localStorage.setItem('velo_orgs', JSON.stringify(updatedOrgs));
    onAuthSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="p-10 md:p-14">
          <div className="flex flex-col items-center mb-12">
            <div className="bg-slate-900 p-4 rounded-2xl text-white mb-6 shadow-xl shadow-slate-900/10 transition-transform hover:scale-110">
              <Cloud className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Velo</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Enterprise Orchestration</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Identity Access</label>
                <div className="relative group">
                   <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                     required
                     type="text"
                     value={identifier}
                     onChange={(e) => setIdentifier(e.target.value)}
                     className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-800"
                     placeholder="Username or Work Email"
                   />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Workspace Entity</label>
                  <div className="relative group">
                     <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                     <input
                       required
                       type="text"
                       value={orgName}
                       onChange={(e) => setOrgName(e.target.value)}
                       className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-800"
                       placeholder="Company Name"
                     />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-rose-500 text-xs font-black uppercase tracking-tighter px-1 animate-pulse">{error}</p>
              )}

              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-5 rounded-[1.75rem] shadow-xl shadow-slate-900/10 active:scale-[0.98] font-black text-xs uppercase tracking-widest"
              >
                {isLogin ? 'Establish Session' : 'Continue to Licensing'}
                {!loading && <ArrowRight className="ml-3 w-5 h-5" />}
              </Button>

              <div className="pt-8 text-center border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {isLogin ? "Provision new workspace cluster?" : "Return to existing identity?"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-4">
                 <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 leading-tight">Cluster Licensing</h3>
                   <p className="text-xs text-slate-500 font-medium">Select a tier for "{orgName}"</p>
                 </div>
               </div>

               <div className="grid gap-3">
                  {[
                    { id: 'free', name: 'Starter', price: '$0', seats: 3, icon: <LayoutGrid className="w-5 h-5" /> },
                    { id: 'pro', name: 'Professional', price: '$29', seats: 15, icon: <Zap className="w-5 h-5" /> },
                    { id: 'enterprise', name: 'Enterprise', price: '$99', seats: 100, icon: <ShieldCheck className="w-5 h-5" /> }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id as any)}
                      className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group ${
                        selectedTier === tier.id 
                        ? 'border-indigo-600 bg-indigo-50/20' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${selectedTier === tier.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 group-hover:text-indigo-600 shadow-sm'}`}>
                          {tier.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900">{tier.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tier.seats} Seat Licenses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">{tier.price}</p>
                        {selectedTier === tier.id && <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 inline" />}
                      </div>
                    </button>
                  ))}
               </div>

               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Deployment Summary</p>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    By confirming, you are initializing a secure Velo tenant on the {selectedTier.toUpperCase()} tier. Licenses are provisioned instantly.
                  </p>
               </div>

               <Button
                onClick={handleFinalRegister}
                isLoading={loading}
                variant="secondary"
                className="w-full py-5 rounded-[1.75rem] shadow-xl shadow-indigo-100 active:scale-[0.98] font-black text-xs uppercase tracking-widest"
              >
                Confirm Licensing & Initialize
              </Button>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">Secure Velo Cluster v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
