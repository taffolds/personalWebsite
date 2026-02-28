import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  id: number;
  nickname: string | null;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserInfo() {
    const res = await fetch("/api/user/profile");

    if (!res.ok) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const user = await res.json();

    if (user && !user.error) {
      setProfile({
        id: user.id,
        nickname: user.nickname || null,
      });
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
