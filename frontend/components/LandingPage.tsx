
import React from 'react';
import { Cloud, ArrowRight, Zap, Sparkles, Terminal, Users, Globe, Check } from 'lucide-react';
import Button from './ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Ideal for independent developers and tiny clusters.',
      seats: 3,
      features: ['Core Kanban Board', 'Global Backlog', 'Standard Telemetry'],
      color: 'border-slate-200',
      btn: 'Deploy Starter'
    },
    {
      name: 'Professional',
      price: '$29',
      description: 'The definitive standard for high-velocity teams.',
      seats: 10,
      features: ['Velo AI Strategy Core', 'Voice Commander', 'Real-time Neural Sync', 'Strategic Velocity Center'],
      color: 'border-indigo-500 ring-2 ring-indigo-100',
      popular: true,
      btn: 'Deploy Professional'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Massive scale for distributed global networks.',
      seats: 'Unlimited',
      features: ['Dedicated VPC Node', 'Hardware Security Keys', 'SSO/SAML Orchestration', '24/7 Priority Ops'],
      color: 'border-slate-900 bg-slate-900 text-white',
      btn: 'Contact Ops'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-slate-900 p-2 rounded-xl">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">Velo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Pricing</button>
            <button onClick={onLogin} className="text-sm font-bold text-slate-900 hover:opacity-70 transition-opacity">Sign In</button>
            <Button size="sm" className="rounded-xl px-6" onClick={onGetStarted}>Initialize Workspace</Button>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-8">
            <Sparkles className="w-3 h-3" /> Powered by Velo AI Core 3.0
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-8">
            Accelerate your organization at <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">the speed of Velo.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            High-performance strategic orchestrator for teams that demand sub-second execution and absolute clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-[2rem] px-10 shadow-indigo-200" onClick={onGetStarted}>
              Initialize Velo Node <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <button onClick={() => scrollToSection('features')} className="px-10 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors">Explore Capabilities</button>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 bg-slate-50 border-y border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-indigo-600">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Velo AI Commander</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Query your cluster using natural language. Get instant project health reports with our Velo Core integration.</p>
            </div>
            <div className="space-y-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-indigo-600">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Isolated Clusters</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Tenant-specific encryption for every node. Secure your organization's intellectual property with Velo Shield.</p>
            </div>
            <div className="space-y-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-indigo-600">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Global Sync Fabric</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Sub-100ms synchronization across all global personnel. Monitor velocity and node status in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Strategic Licensing</h2>
            <p className="text-slate-500 font-medium text-lg">Choose your deployment tier for Velo Enterprise.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative p-10 rounded-[3.5rem] border transition-all duration-500 hover:shadow-2xl flex flex-col ${plan.color}`}>
                {plan.popular && (
                  <span className="absolute top-0 right-12 -translate-y-1/2 px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Most Popular</span>
                )}
                <div className="mb-10">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-sm font-bold opacity-60">/month</span>}
                  </div>
                  <p className="mt-5 text-sm font-medium opacity-70 leading-relaxed">{plan.description}</p>
                </div>
                <div className="flex-1 space-y-5 mb-12">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-indigo-500/10 rounded-lg"><Check className="w-4 h-4 text-indigo-500" /></div>
                    <span className="text-sm font-bold">{plan.seats} Identity Nodes</span>
                  </div>
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="p-1 bg-slate-500/10 rounded-lg"><Check className="w-4 h-4 text-slate-400" /></div>
                      <span className="text-sm font-medium opacity-80">{f}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={onGetStarted} variant={plan.name === 'Enterprise' ? 'secondary' : plan.popular ? 'primary' : 'outline'} className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                  {plan.btn}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-24 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <Cloud className="w-6 h-6 text-slate-900" />
              <span className="text-xl font-black tracking-tighter">Velo</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Enterprise Strategic Orchestration v3.0.1</p>
          </div>
          <div className="flex gap-16 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <p className="hover:text-indigo-600 cursor-pointer">Legal</p>
            <p className="hover:text-indigo-600 cursor-pointer">Security</p>
            <p className="hover:text-indigo-600 cursor-pointer">Contact</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
