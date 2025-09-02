import React, { createContext, useContext, useState } from 'react';
import ModernProfilePage from './pages/ModernProfilePage';
import { mockRootProps } from './data/profileMockData';

// Mock Auth Context for preview
const MockAuthContext = createContext<any>(null);

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user] = useState(mockRootProps.user);
  const [loading] = useState(false);
  
  return (
    <MockAuthContext.Provider value={{ user, loading }}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Mock useAuth hook
const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    return { user: mockRootProps.user, loading: false };
  }
  return context;
};

// Mock Supabase client
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: mockRootProps.profileData,
          error: null
        })
      })
    }),
    update: () => ({
      eq: async () => ({ error: null })
    })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://i.pravatar.cc/150?img=2' } })
    })
  }
};

// Override the imports for preview
const MockedModernProfilePage = () => {
  // Mock the hooks and supabase client
  React.useEffect(() => {
    // Replace the useAuth hook globally for this component
    (window as any).useAuth = useAuth;
    (window as any).supabase = mockSupabase;
  }, []);

  return <ModernProfilePage />;
};

export default function App() {
  return (
    <MockAuthProvider>
      <div className="min-h-screen">
        <MockedModernProfilePage />
      </div>
    </MockAuthProvider>
  );
}