import { useState } from 'react';
import { WorkExperience } from '../../types/cv.types';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import { rewriteWorkExperience, type AIRewriteSuggestion } from '../../lib/aiClient';

type AISuggestionState =
  | { status: 'loading' }
  | { status: 'ready'; suggestion: AIRewriteSuggestion }
  | { status: 'error'; message: string };

interface Props {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

export function WorkExperienceForm({ data, onChange }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [aiStates, setAiStates] = useState<Record<string, AISuggestionState>>({});

  const addExperience = () => {
    const newExperience: WorkExperience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      highlights: []
    };
    onChange([...data, newExperience]);
    setExpandedItems(new Set([...expandedItems, newExperience.id]));
  };

  const removeExperience = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateExperience = (id: string, updates: Partial<WorkExperience>) => {
    onChange(data.map(exp => 
      exp.id === id ? { ...exp, ...updates } : exp
    ));
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addHighlight = (id: string) => {
    const exp = data.find(e => e.id === id);
    if (exp) {
      updateExperience(id, { 
        highlights: [...exp.highlights, ''] 
      });
    }
  };

  const updateHighlight = (expId: string, index: number, value: string) => {
    const exp = data.find(e => e.id === expId);
    if (exp) {
      const newHighlights = [...exp.highlights];
      newHighlights[index] = value;
      updateExperience(expId, { highlights: newHighlights });
    }
  };

  const removeHighlight = (expId: string, index: number) => {
    const exp = data.find(e => e.id === expId);
    if (exp) {
      updateExperience(expId, { 
        highlights: exp.highlights.filter((_, i) => i !== index) 
      });
    }
  };

  const setAiState = (id: string, state?: AISuggestionState) => {
    setAiStates(prev => {
      const next = { ...prev };
      if (state) {
        next[id] = state;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const requestRewrite = async (exp: WorkExperience) => {
    if (!exp.description.trim()) {
      alert('Add a brief description before asking AI to improve it.');
      return;
    }

    setAiState(exp.id, { status: 'loading' });

    try {
      const suggestion = await rewriteWorkExperience({
        company: exp.company,
        position: exp.position,
        description: exp.description,
        highlights: exp.highlights,
      });
      setAiState(exp.id, { status: 'ready', suggestion });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate rewrite.';
      setAiState(exp.id, { status: 'error', message });
    }
  };

  const applySuggestion = (exp: WorkExperience) => {
    const state = aiStates[exp.id];
    if (!state || state.status !== 'ready') {
      return;
    }

    const dedupedHighlights = [...exp.highlights];
    for (const highlight of state.suggestion.highlights) {
      const trimmed = highlight.trim();
      if (!trimmed) {
        continue;
      }
      const exists = dedupedHighlights.some(existing => existing.trim().toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        dedupedHighlights.push(trimmed);
      }
    }

    updateExperience(exp.id, {
      description: state.suggestion.description,
      highlights: dedupedHighlights,
    });

    setAiState(exp.id);
  };

  const dismissSuggestion = (id: string) => {
    setAiState(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
        <button
          onClick={addExperience}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      <div className="space-y-3">
        {data.map((exp) => {
          const isExpanded = expandedItems.has(exp.id);
          const aiState = aiStates[exp.id];
          
          return (
            <div key={exp.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => toggleExpanded(exp.id)}
                  className="flex items-center gap-2 text-left flex-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {exp.position || 'Position'} at {exp.company || 'Company'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className={cn('space-y-3', !isExpanded && 'hidden')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      className="input-field"
                      placeholder="Company Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                      className="input-field"
                      placeholder="Job Title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="space-y-2">
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        disabled={exp.current}
                        className="input-field"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, { 
                            current: e.target.checked,
                            endDate: e.target.checked ? '' : exp.endDate
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Currently working here</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={() => requestRewrite(exp)}
                      disabled={aiState?.status === 'loading'}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                      <Sparkles className="w-4 h-4" />
                      {aiState?.status === 'loading' ? 'Rewriting...' : 'Rewrite with AI'}
                    </button>
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Describe your role and responsibilities..."
                  />

                  {aiState?.status === 'error' && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {aiState.message}
                      <button
                        type="button"
                        onClick={() => requestRewrite(exp)}
                        className="ml-2 font-medium text-amber-900 underline"
                      >
                        Try again
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissSuggestion(exp.id)}
                        className="ml-2 font-medium text-amber-900 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {aiState?.status === 'ready' && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                      <p className="font-semibold">Suggested description</p>
                      <p className="mt-1 whitespace-pre-line text-blue-900">
                        {aiState.suggestion.description}
                      </p>

                      {aiState.suggestion.highlights.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold">Suggested achievements</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {aiState.suggestion.highlights.map((highlight, index) => (
                              <li key={index}>{highlight}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applySuggestion(exp)}
                          className="btn-primary text-sm"
                        >
                          Accept suggestion
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissSuggestion(exp.id)}
                          className="btn-secondary text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Key Achievements
                    </label>
                    <button
                      onClick={() => addHighlight(exp.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add Achievement
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exp.highlights.map((highlight, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={highlight}
                          onChange={(e) => updateHighlight(exp.id, index, e.target.value)}
                          className="input-field flex-1"
                          placeholder="Achievement or responsibility"
                        />
                        <button
                          onClick={() => removeHighlight(exp.id, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
