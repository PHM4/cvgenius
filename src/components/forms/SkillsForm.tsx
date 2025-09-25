// src/components/forms/SkillsForm.tsx
import { useState } from 'react';
import { Skill } from '../../types/cv.types';
import { X } from 'lucide-react';

interface Props {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

export function SkillsForm({ data, onChange }: Props) {
  const [inputValue, setInputValue] = useState('');

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newSkill: Skill = {
        id: crypto.randomUUID(),
        name: inputValue.trim(),
        level: 'intermediate'
      };
      onChange([...data, newSkill]);
      setInputValue('');
    }
  };

  const removeSkill = (id: string) => {
    onChange(data.filter(skill => skill.id !== id));
  };

  const updateSkillLevel = (id: string, level: Skill['level']) => {
    onChange(data.map(skill => 
      skill.id === id ? { ...skill, level } : skill
    ));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Skills (Press Enter to add)
        </label>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={addSkill}
          className="input-field"
          placeholder="Type a skill and press Enter"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {data.map((skill) => (
          <div
            key={skill.id}
            className="group flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full"
          >
            <span className="text-sm font-medium">{skill.name}</span>
            <select
              value={skill.level}
              onChange={(e) => updateSkillLevel(skill.id, e.target.value as Skill['level'])}
              className="text-xs bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <button
              onClick={() => removeSkill(skill.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}