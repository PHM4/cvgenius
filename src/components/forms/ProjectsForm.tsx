import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Project } from '../../types/cv.types';

interface Props {
  data: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsForm({ data, onChange }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      link: ''
    };
    onChange([...data, newProject]);
    setExpandedItems((current) => new Set([...current, newProject.id]));
  };

  const removeProject = (id: string) => {
    onChange(data.filter((project) => project.id !== id));
    setExpandedItems((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange(data.map((project) => project.id === id ? { ...project, ...updates } : project));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
        <button
          onClick={addProject}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      <div className="space-y-3">
        {data.map((project) => {
          const isExpanded = expandedItems.has(project.id);

          return (
            <div key={project.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => toggleExpanded(project.id)}
                  className="flex items-center gap-2 text-left flex-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {project.name || 'Project name'}
                    </div>
                    {project.link && (
                      <div className="text-sm text-blue-600 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        {project.link}
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => removeProject(project.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className={cn('space-y-3', !isExpanded && 'hidden')}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(event) => updateProject(project.id, { name: event.target.value })}
                    placeholder="e.g. Marketing Automation Dashboard"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={project.description}
                    onChange={(event) => updateProject(project.id, { description: event.target.value })}
                    placeholder="What problem did it solve? What impact did it have?"
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={project.link ?? ''}
                    onChange={(event) => updateProject(project.id, { link: event.target.value })}
                    placeholder="https://example.com/project"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {!data.length && (
          <p className="text-sm text-gray-500">
            Showcase standout personal or team projects. Add details about your role, impact, and outcomes.
          </p>
        )}
      </div>
    </div>
  );
}
