import React, { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  profile: { email: string } | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserInfo() {
    const res = await fetch("/api/user/profile");
    const user = await res.json();

    if (user && !user.error) {
      setProfile({ email: user.email });
    } else {
      setProfile(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUserInfo();
  }, []);

  const refreshProfile = async () => {
    setLoading(true);
    await loadUserInfo();
  };

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
