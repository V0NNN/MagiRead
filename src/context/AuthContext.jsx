import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("magiread-user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (username) => {
    setUser({ username });
    localStorage.setItem("magiread-user", JSON.stringify({ username }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("magiread-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
