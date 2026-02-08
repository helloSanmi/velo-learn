import React from 'react';
import { ArrowRight, CheckCircle2, Cloud, Sparkles } from 'lucide-react';
import Button from './ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const highlights = [
    'Simple workspace for teams and solo builders',
    'Task board with clear priorities and ownership',
    'Optional AI tools for drafting and planning'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight">Velo</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onLogin}>Sign in</Button>
            <Button variant="primary" size="sm" onClick={onGetStarted}>Get started</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Built for focused execution
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Project management that stays clear and calm.
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-xl">
              Velo gives your team a clean board, clear ownership, and straightforward workflows without dashboard noise.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onGetStarted} className="rounded-xl">
                Start workspace <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onLogin} className="rounded-xl">
                Continue to sign in
              </Button>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Why teams choose this setup</h2>
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600" />
                <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
