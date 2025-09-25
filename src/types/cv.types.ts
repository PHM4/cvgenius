export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CVData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  templateId?: string;
  colorScheme?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export interface SavedCVSummary {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedCVDocument extends SavedCVSummary {
  data: CVData;
}
