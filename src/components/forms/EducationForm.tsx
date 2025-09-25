// src/components/forms/EducationForm.tsx
import { useCallback, useEffect } from 'react';
import { Education } from '../../types/cv.types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: Props) {
  const normalizeEducation = useCallback((entry: Education): Education => {
    const { gpa, ...rest } = entry as Education & { gpa?: string };
    if (rest.grade || !gpa) {
      return rest as Education;
    }
    return { ...rest, grade: gpa };
  }, []);

  useEffect(() => {
    const needsNormalization = data.some((entry) => (entry as Education & { gpa?: string }).gpa && !entry.grade);
    if (!needsNormalization) {
      return;
    }

    const normalized = data.map(normalizeEducation);
    onChange(normalized);
  }, [data, onChange, normalizeEducation]);

  const addEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      grade: ''
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    onChange(data.map(edu => {
      const normalized = normalizeEducation(edu);
      if (normalized.id !== id) {
        return normalized;
      }
      return { ...normalized, ...updates };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
        <button
          onClick={addEducation}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </button>
      </div>

      <div className="space-y-3">
        {data.map((edu) => {
          const normalizedEdu = normalizeEducation(edu);

          return (
            <div key={normalizedEdu.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium">
                    {normalizedEdu.degree || 'Degree'} in {normalizedEdu.field || 'Field'}
                  </div>
                <div className="text-sm text-gray-500">
                  {normalizedEdu.institution || 'Institution'}
                </div>
              </div>
              <button
                onClick={() => removeEducation(normalizedEdu.id)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  value={normalizedEdu.institution}
                  onChange={(e) => updateEducation(normalizedEdu.id, { institution: e.target.value })}
                  className="input-field"
                  placeholder="University Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree
                </label>
                <input
                  value={normalizedEdu.degree}
                  onChange={(e) => updateEducation(normalizedEdu.id, { degree: e.target.value })}
                  className="input-field"
                  placeholder="Bachelor of Science"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field of Study
                </label>
                <input
                  value={normalizedEdu.field}
                  onChange={(e) => updateEducation(normalizedEdu.id, { field: e.target.value })}
                  className="input-field"
                  placeholder="Computer Science"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="month"
                  value={normalizedEdu.startDate}
                  onChange={(e) => updateEducation(normalizedEdu.id, { startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="month"
                  value={normalizedEdu.endDate}
                  onChange={(e) => updateEducation(normalizedEdu.id, { endDate: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade / Result (Optional)
                </label>
                <input
                  value={normalizedEdu.grade ?? ''}
                  onChange={(e) => updateEducation(normalizedEdu.id, { grade: e.target.value })}
                  className="input-field"
                  placeholder="First Class Honours / 3.8 GPA"
                />
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
