import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogleHandler = useCallback(async () => {
    if (!auth) {
      throw new Error('Firebase is not configured.');
    }
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutHandler = useCallback(async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isFirebaseReady: isFirebaseConfigured && Boolean(auth),
    signInWithGoogle: signInWithGoogleHandler,
    signOut: signOutHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
