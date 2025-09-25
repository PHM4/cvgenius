// src/components/forms/PersonalInfoForm.tsx
import { useForm } from 'react-hook-form';
import { PersonalInfo } from '../../types/cv.types';
import { useEffect } from 'react';

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export function PersonalInfoForm({ data, onChange }: Props) {
  const { register, watch } = useForm<PersonalInfo>({
    defaultValues: data
  });

  useEffect(() => {
    const subscription = watch((values) => {
      // Ensure all fields are non-undefined strings
      const safeValues: PersonalInfo = {
        fullName: values.fullName ?? '',
        email: values.email ?? '',
        phone: values.phone ?? '',
        location: values.location ?? '',
        linkedin: values.linkedin ?? '',
        github: values.github ?? '',
        portfolio: values.portfolio ?? '',
        summary: values.summary ?? '',
      };
      onChange(safeValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            {...register('fullName')}
            className="input-field"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            className="input-field"
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            {...register('phone')}
            className="input-field"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            {...register('location')}
            className="input-field"
            placeholder="New York, NY"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn
          </label>
          <input
            {...register('linkedin')}
            className="input-field"
            placeholder="linkedin.com/in/johndoe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub
          </label>
          <input
            {...register('github')}
            className="input-field"
            placeholder="github.com/johndoe"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Professional Summary
        </label>
        <textarea
          {...register('summary')}
          rows={4}
          className="input-field resize-none"
          placeholder="Brief summary of your professional background and objectives..."
        />
      </div>
    </div>
  );
}