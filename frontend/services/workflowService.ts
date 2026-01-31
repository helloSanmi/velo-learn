
import { WorkflowRule, WorkflowTrigger, WorkflowAction, Task, ProjectTemplate, TaskPriority, TaskStatus } from '../types';

const WORKFLOWS_KEY = 'velo_workflows';

export const workflowService = {
  getRules: (orgId: string): WorkflowRule[] => {
    const data = localStorage.getItem(WORKFLOWS_KEY);
    const all: WorkflowRule[] = data ? JSON.parse(data) : [];
    return all.filter(r => r.orgId === orgId);
  },

  saveRule: (rule: Omit<WorkflowRule, 'id'>): WorkflowRule => {
    const all: WorkflowRule[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
    const newRule = { ...rule, id: crypto.randomUUID() };
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify([...all, newRule]));
    return newRule;
  },

  deleteRule: (id: string) => {
    const all: WorkflowRule[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(all.filter(r => r.id !== id)));
  },

  toggleRule: (id: string) => {
    const all: WorkflowRule[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(all.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)));
  },

  getTemplates: (): ProjectTemplate[] => [
    {
      id: 'tmpl-dev',
      name: 'Software Lifecycle',
      description: 'Standard Agile sprint board with QA and Deploy readiness.',
      icon: 'Terminal',
      tasks: [
        { title: 'Environment Setup', description: 'Configure dev clusters', priority: TaskPriority.HIGH, status: TaskStatus.TODO, tags: ['Ops'] },
        { title: 'Sprint Backlog Review', description: 'Define Q2 goals', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, tags: ['Planning'] },
        { title: 'API Documentation', description: 'Swagger UI sync', priority: TaskPriority.LOW, status: TaskStatus.TODO, tags: ['Docs'] }
      ]
    },
    {
      id: 'tmpl-mkt',
      name: 'Marketing Launch',
      description: 'Coordinated campaign tracking from design to PR.',
      icon: 'Zap',
      tasks: [
        { title: 'Brand Kit Audit', description: 'Check color contrast', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, tags: ['Design'] },
        { title: 'Press Release Draft', description: 'Coordinate with PR agency', priority: TaskPriority.HIGH, status: TaskStatus.TODO, tags: ['PR'] },
        { title: 'Social Asset Creation', description: 'Export Figma assets', priority: TaskPriority.LOW, status: TaskStatus.TODO, tags: ['Design'] }
      ]
    },
    {
      id: 'tmpl-hr',
      name: 'Executive Onboarding',
      description: 'Streamline the first 30 days for new senior hires.',
      icon: 'Users',
      tasks: [
        { title: 'Access Provisioning', description: 'SAML and SSO setup', priority: TaskPriority.HIGH, status: TaskStatus.TODO, tags: ['Security'] },
        { title: 'Team Introduction', description: 'Schedule 1-on-1s', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, tags: ['HR'] }
      ]
    }
  ]
};
