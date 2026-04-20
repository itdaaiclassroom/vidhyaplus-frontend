import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "teacher" | "admin" | "student" | null;

interface AuthContextType {
  role: Role;
  userName: string;
  studentId: string | null;
  teacherId: string | null;
  login: (role: Role, name?: string, studentId?: string, teacherId?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  studentId: null,
  teacherId: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("auth.role");
    return (saved === "teacher" || saved === "admin" || saved === "student") ? saved : null;
  });
  const [userName, setUserName] = useState(() => localStorage.getItem("auth.userName") || "");
  const [studentId, setStudentId] = useState<string | null>(() => localStorage.getItem("auth.studentId"));
  const [teacherId, setTeacherId] = useState<string | null>(() => localStorage.getItem("auth.teacherId"));

  const login = (r: Role, name = "", sId?: string, tId?: string) => {
    setRole(r);
    setUserName(name || (r === "admin" ? "Administrator" : r === "student" ? "Student" : "Teacher"));
    setStudentId(sId || null);
    setTeacherId(tId || null);
  };

  const logout = () => {
    setRole(null);
    setUserName("");
    setStudentId(null);
    setTeacherId(null);
  };

  useEffect(() => {
    if (role) localStorage.setItem("auth.role", role);
    else localStorage.removeItem("auth.role");
  }, [role]);
  useEffect(() => {
    if (userName) localStorage.setItem("auth.userName", userName);
    else localStorage.removeItem("auth.userName");
  }, [userName]);
  useEffect(() => {
    if (studentId) localStorage.setItem("auth.studentId", studentId);
    else localStorage.removeItem("auth.studentId");
  }, [studentId]);
  useEffect(() => {
    if (teacherId) localStorage.setItem("auth.teacherId", teacherId);
    else localStorage.removeItem("auth.teacherId");
  }, [teacherId]);

  return (
    <AuthContext.Provider value={{ role, userName, studentId, teacherId, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  );
};
