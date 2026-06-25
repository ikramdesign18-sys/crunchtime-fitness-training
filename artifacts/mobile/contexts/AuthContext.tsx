import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "trainer";
}

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => null,
  logout: async () => {},
});

const DUMMY_USERS: { email: string; password: string; user: AppUser }[] = [
  {
    email: "user@test.com",
    password: "password123",
    user: { id: "u1", name: "Alex Johnson", email: "user@test.com", role: "user" },
  },
  {
    email: "trainer@test.com",
    password: "password123",
    user: { id: "t1", name: "Coach Marcus", email: "trainer@test.com", role: "trainer" },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("authUser")
      .then((data) => {
        if (data) setUser(JSON.parse(data) as AppUser);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AppUser | null> => {
    const match = DUMMY_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );
    if (!match) return null;
    await AsyncStorage.setItem("authUser", JSON.stringify(match.user));
    setUser(match.user);
    return match.user;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["authUser"]);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
