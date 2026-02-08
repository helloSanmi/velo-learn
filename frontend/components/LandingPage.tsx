import React from 'react';
import { ArrowRight, CheckCircle2, Cloud, Layers3, Sparkles, Users } from 'lucide-react';
import Button from './ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const featureCards = [
    {
      title: 'Focused board',
      description: 'Keep priorities obvious with clear status lanes and less visual noise.',
      icon: <Layers3 className="w-4 h-4" />
    },
    {
      title: 'Team clarity',
      description: 'See ownership, deadlines, and progress in one place across projects.',
      icon: <Users className="w-4 h-4" />
    },
    {
      title: 'Smart support',
      description: 'Use AI tools when helpful without bloating your day-to-day workflow.',
      icon: <Sparkles className="w-4 h-4" />
    }
  ];

  const trustPoints = [
    'Professional layout with minimal noise',
    'Clear ownership and delivery tracking',
    'Fast setup for individuals and teams'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),transparent_42%),radial-gradient(circle_at_0%_35%,_rgba(14,165,233,0.08),transparent_36%)]" />

      <div className="relative z-10">
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Cloud className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Velo<span className="text-indigo-600">.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onLogin}>Sign in</Button>
              <Button variant="primary" size="sm" onClick={onGetStarted}>Get started</Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-8 md:space-y-10">
          <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 md:gap-6 items-stretch">
            <article className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 lg:p-10 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Built for focused execution
              </div>

              <h2 className="mt-5 text-4xl md:text-5xl font-semibold leading-[1.08] tracking-tight text-slate-900">
                Project management
                <span className="block text-slate-700">that stays clear and simple.</span>
              </h2>

              <p className="mt-4 text-slate-600 text-base leading-relaxed max-w-2xl">
                Velo keeps planning, delivery, and team coordination in one calm workspace with practical defaults and professional structure.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" onClick={onGetStarted}>
                  Start workspace <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin}>
                  Continue to sign in
                </Button>
              </div>
            </article>

            <aside className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Why teams choose Velo</h3>
                <div className="mt-4 space-y-3">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <p className="text-sm text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Typical setup time</p>
                <p className="text-2xl font-semibold mt-1 text-slate-900">Under 10 minutes</p>
                <p className="text-xs text-slate-500 mt-1">Create your workspace, first project, and invite collaborators.</p>
              </div>
            </aside>
          </section>

          <section className="grid md:grid-cols-3 gap-3 md:gap-4">
            {featureCards.map((card) => (
              <article key={card.title} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                  {card.icon}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{card.description}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
