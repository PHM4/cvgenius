import { useState, useCallback, useEffect } from 'react';
import { CVData, type SavedCVSummary } from './types/cv.types';
import { PersonalInfoForm } from './components/forms/PersonalInfoForm';
import { WorkExperienceForm } from './components/forms/WorkExperienceForm';
import { EducationForm } from './components/forms/EducationForm';
import { SkillsForm } from './components/forms/SkillsForm';
import { CVPreview } from './components/preview/CVPreview';
import { Download, FileText } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './context/AuthContext';
import { listUserCVs, loadUserCV, saveUserCV } from './lib/cvStore';

const initialCVData: CVData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: ''
  },
  workExperience: [],
  education: [],
  skills: []
};

function App() {
  const [cvData, setCVData] = useLocalStorage<CVData>('cvgenius-data', initialCVData);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { user, isLoading: isAuthLoading, isFirebaseReady, signInWithGoogle, signOut: signOutUser } = useAuth();
  const [savedCVs, setSavedCVs] = useState<SavedCVSummary[]>([]);
  const [currentCvId, setCurrentCvId] = useState<string | null>(null);
  const [isFetchingCVs, setIsFetchingCVs] = useState(false);
  const [isLoadingRemoteCV, setIsLoadingRemoteCV] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  
  const updatePersonalInfo = useCallback((personalInfo: CVData['personalInfo']) => {
    setCVData(prev => ({ ...prev, personalInfo }));
  }, [setCVData]);

  const updateWorkExperience = useCallback((workExperience: CVData['workExperience']) => {
    setCVData(prev => ({ ...prev, workExperience }));
  }, [setCVData]);

  const updateEducation = useCallback((education: CVData['education']) => {
    setCVData(prev => ({ ...prev, education }));
  }, [setCVData]);

  const updateSkills = useCallback((skills: CVData['skills']) => {
    setCVData(prev => ({ ...prev, skills }));
  }, [setCVData]);

  const refreshSavedCVs = useCallback(async (showFeedback = false) => {
    const uid = user?.uid;

    if (!uid) {
      setSavedCVs([]);
      setCurrentCvId(null);
      return;
    }

    setIsFetchingCVs(true);
    try {
      const cvEntries = await listUserCVs(uid);
      setSavedCVs(cvEntries);
      setCurrentCvId((prev) => (prev && cvEntries.some((entry) => entry.id === prev) ? prev : null));
    } catch (error) {
      console.error('Error loading saved CVs:', error);
      if (showFeedback) {
        alert('Failed to load saved CVs. Please try again.');
      }
    } finally {
      setIsFetchingCVs(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedCVs([]);
      setCurrentCvId(null);
      return;
    }

    void refreshSavedCVs();
  }, [user, refreshSavedCVs]);

  const currentSavedCv = currentCvId ? savedCVs.find((entry) => entry.id === currentCvId) ?? null : null;
  const isCloudActionInFlight = isSavingToCloud || isFetchingCVs || isLoadingRemoteCV;

  const cloudStatusLabel = (() => {
    if (isLoadingRemoteCV) {
      return 'Loading from cloud...';
    }
    if (isSavingToCloud) {
      return 'Saving to cloud...';
    }
    if (isFetchingCVs) {
      return 'Syncing saved CVs...';
    }
    if (currentSavedCv?.updatedAt) {
      return `Cloud saved · ${currentSavedCv.updatedAt.toLocaleString()}`;
    }
    if (currentSavedCv) {
      return 'Cloud saved';
    }
    return 'Auto-saved locally';
  })();

  const handleSignIn = useCallback(async () => {
    if (!isFirebaseReady) {
      alert('Cloud sync is unavailable until Firebase is configured.');
      return;
    }

    try {
      await signInWithGoogle();
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode && ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(errorCode)) {
        return;
      }
      console.error('Google sign-in failed:', error);
      alert('Google sign-in failed. Please try again.');
    }
  }, [isFirebaseReady, signInWithGoogle]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      setCurrentCvId(null);
      setSavedCVs([]);
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    }
  }, [signOutUser]);

  const attemptSaveToCloud = useCallback(async (options?: { createCopy?: boolean }) => {
    if (!isFirebaseReady) {
      alert('Cloud sync is unavailable until Firebase is configured.');
      return;
    }

    if (!user) {
      await handleSignIn();
      return;
    }

    const baseName = options?.createCopy
      ? (currentSavedCv?.name ? `${currentSavedCv.name} Copy` : (cvData.personalInfo.fullName || 'Untitled CV'))
      : (currentSavedCv?.name || cvData.personalInfo.fullName || 'Untitled CV');

    const nameInput = window.prompt('Name this CV for cloud storage', baseName);
    if (!nameInput) {
      return;
    }

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      alert('CV name cannot be empty.');
      return;
    }

    setIsSavingToCloud(true);
    try {
      const savedId = await saveUserCV(user.uid, {
        id: options?.createCopy ? undefined : currentSavedCv?.id,
        name: trimmedName,
        data: cvData,
      });
      setCurrentCvId(savedId);
      await refreshSavedCVs();
    } catch (error) {
      console.error('Error saving CV:', error);
      alert('Failed to save CV to the cloud. Please try again.');
    } finally {
      setIsSavingToCloud(false);
    }
  }, [isFirebaseReady, user, currentSavedCv, cvData, refreshSavedCVs, handleSignIn]);

  const handleSelectSavedCv = useCallback(async (cvId: string) => {
    if (!user) {
      return;
    }

    const shouldLoad = window.confirm('Loading a saved CV will replace your current changes. Continue?');
    if (!shouldLoad) {
      return;
    }

    setIsLoadingRemoteCV(true);
    try {
      const saved = await loadUserCV(user.uid, cvId);
      if (!saved) {
        alert('The selected CV could not be found. Refresh and try again.');
        await refreshSavedCVs(true);
        return;
      }

      setCVData(saved.data);
      setCurrentCvId(saved.id);
    } catch (error) {
      console.error('Error loading CV:', error);
      alert('Failed to load CV from the cloud. Please try again.');
    } finally {
      setIsLoadingRemoteCV(false);
    }
  }, [user, refreshSavedCVs, setCVData]);

  const handleSaveToCloud = useCallback(() => {
    void attemptSaveToCloud();
  }, [attemptSaveToCloud]);

  const handleSaveCopyToCloud = useCallback(() => {
    void attemptSaveToCloud({ createCopy: true });
  }, [attemptSaveToCloud]);

  const handleRefreshSavedList = useCallback(() => {
    void refreshSavedCVs(true);
  }, [refreshSavedCVs]);

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setCVData(initialCVData);
      setCurrentCvId(null);
    }
  };

  const loadSampleData = () => {
    const sampleData: CVData = {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe',
        portfolio: 'johndoe.dev',
        summary: 'Experienced full-stack developer with 5+ years building scalable web applications. Passionate about clean code, user experience, and emerging technologies.'
      },
      workExperience: [
        {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Full-Stack Developer',
          startDate: '2021-03',
          endDate: '',
          current: true,
          description: 'Lead developer for enterprise SaaS platform serving 10,000+ users.',
          highlights: [
            'Architected microservices reducing system latency by 40%',
            'Mentored team of 5 junior developers',
            'Implemented CI/CD pipeline improving deployment frequency by 3x'
          ]
        },
        {
          id: '2',
          company: 'StartupXYZ',
          position: 'Full-Stack Developer',
          startDate: '2019-06',
          endDate: '2021-02',
          current: false,
          description: 'Built core features for B2B marketplace platform.',
          highlights: [
            'Developed React component library used across 3 products',
            'Optimized database queries improving page load times by 60%',
            'Led migration from monolith to microservices architecture'
          ]
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of Hull',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2023-09',
          endDate: '2026-05',
          grade: '3.8 / 4.0'
        }
      ],
      skills: [
        { id: '1', name: 'JavaScript', level: 'expert' },
        { id: '2', name: 'TypeScript', level: 'advanced' },
        { id: '3', name: 'React', level: 'expert' },
        { id: '4', name: 'Node.js', level: 'advanced' },
        { id: '5', name: 'Python', level: 'intermediate' },
        { id: '6', name: 'PostgreSQL', level: 'advanced' },
        { id: '7', name: 'AWS', level: 'intermediate' },
        { id: '8', name: 'Docker', level: 'intermediate' },
      ]
    };
    setCVData(sampleData);
    setCurrentCvId(null);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { CVDocument } = await import('./components/pdf/CVDocument');
      
      const blob = await pdf(<CVDocument data={cvData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cvData.personalInfo.fullName || 'cv'}-resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CVGenius</h1>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:items-end w-full md:w-auto">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="text-sm text-gray-500 text-right md:text-left">
                  {cloudStatusLabel}
                </span>

                <button
                  onClick={loadSampleData}
                  className="btn-secondary text-sm"
                >
                  Load Sample
                </button>

                <button
                  onClick={clearData}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear All
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {!isFirebaseReady && (
                  <span className="text-sm text-amber-600 text-right max-w-xs">
                    Add Firebase configuration to enable cloud sync.
                  </span>
                )}

                {isFirebaseReady && !user && (
                  <button
                    onClick={handleSignIn}
                    disabled={isAuthLoading}
                    className="btn-primary text-sm"
                  >
                    {isAuthLoading ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                )}

                {isFirebaseReady && user && (
                  <>
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName ?? user.email ?? 'User avatar'}
                          className="h-9 w-9 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">
                          {user.displayName ?? 'My Account'}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <label className="sr-only" htmlFor="saved-cv-select">
                        Saved CVs
                      </label>
                      <select
                        id="saved-cv-select"
                        value={currentCvId ?? ''}
                        onChange={(event) => {
                          const selectedId = event.target.value;
                          if (selectedId) {
                            void handleSelectSavedCv(selectedId);
                          }
                        }}
                        disabled={!savedCVs.length || isLoadingRemoteCV || isFetchingCVs}
                        className="w-48 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">
                          {savedCVs.length ? 'Select saved CV' : 'No saved CVs yet'}
                        </option>
                        {savedCVs.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleRefreshSavedList}
                        disabled={isFetchingCVs}
                        className="btn-secondary text-sm"
                      >
                        {isFetchingCVs ? 'Refreshing...' : 'Refresh'}
                      </button>

                      <button
                        onClick={handleSaveToCloud}
                        disabled={!isFirebaseReady || isCloudActionInFlight}
                        className="btn-primary text-sm"
                      >
                        {isSavingToCloud ? 'Saving...' : currentSavedCv ? 'Update Cloud Save' : 'Save to Cloud'}
                      </button>

                      <button
                        onClick={handleSaveCopyToCloud}
                        disabled={!isFirebaseReady || isCloudActionInFlight}
                        className="btn-secondary text-sm"
                      >
                        Save as Copy
                      </button>

                      <button
                        onClick={handleSignOut}
                        disabled={isAuthLoading || isCloudActionInFlight}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'personal'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'experience'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Experience
                  </button>
                  <button
                    onClick={() => setActiveTab('education')}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'education'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'skills'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Skills
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'personal' && (
                  <PersonalInfoForm 
                    data={cvData.personalInfo} 
                    onChange={updatePersonalInfo} 
                  />
                )}
                {activeTab === 'experience' && (
                  <WorkExperienceForm 
                    data={cvData.workExperience} 
                    onChange={updateWorkExperience} 
                  />
                )}
                {activeTab === 'education' && (
                  <EducationForm 
                    data={cvData.education} 
                    onChange={updateEducation} 
                  />
                )}
                {activeTab === 'skills' && (
                  <SkillsForm 
                    data={cvData.skills} 
                    onChange={updateSkills} 
                  />
                )}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <CVPreview data={cvData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
