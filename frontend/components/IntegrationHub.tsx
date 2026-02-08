import React, { useMemo, useState } from 'react';
import { Github, Link2, MessageSquare } from 'lucide-react';
import { Project } from '../types';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface IntegrationHubProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

const IntegrationHub: React.FC<IntegrationHubProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const toggleSlack = () => {
    if (!activeProject) return;
    const enabled = !activeProject.integrations?.slack?.enabled;
    onUpdateProject(activeProject.id, {
      integrations: {
        ...activeProject.integrations,
        slack: {
          enabled,
          channel: activeProject.integrations?.slack?.channel || 'general'
        }
      }
    });
  };

  const cards = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send task updates to a Slack channel.',
      icon: <MessageSquare className="w-5 h-5" />,
      enabled: !!activeProject?.integrations?.slack?.enabled,
      actionLabel: activeProject?.integrations?.slack?.enabled ? 'Disconnect' : 'Connect',
      onClick: toggleSlack
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Link commits and pull requests to tasks.',
      icon: <Github className="w-5 h-5" />,
      enabled: false,
      actionLabel: 'Coming soon',
      onClick: () => window.alert('GitHub integration is not available yet.')
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Sync issue status between Jira and Velo.',
      icon: <Link2 className="w-5 h-5" />,
      enabled: false,
      actionLabel: 'Coming soon',
      onClick: () => window.alert('Jira integration is not available yet.')
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Integrations</h2>
            <p className="text-sm text-slate-600 mt-1">Connect your workspace with external tools.</p>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <article key={card.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">{card.icon}</div>
                <Badge variant={card.enabled ? 'emerald' : 'neutral'}>
                  {card.enabled ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              <div>
                <h3 className="text-base font-semibold">{card.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{card.description}</p>
              </div>
              <Button
                onClick={card.onClick}
                variant={card.enabled ? 'outline' : 'primary'}
                className="w-full"
              >
                {card.actionLabel}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationHub;
