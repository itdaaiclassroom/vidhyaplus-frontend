import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "teacher" | "admin" | "student" | "principal" | null;


interface AuthContextType {
  role: Role;
  userName: string;
  studentId: string | null;
  teacherId: string | null;
  schoolId: string | null;
  login: (role: Role, name?: string, studentId?: string, teacherId?: string, schoolId?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  studentId: null,
  teacherId: null,
  schoolId: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("auth.role");
    return (saved === "teacher" || saved === "admin" || saved === "student" || saved === "principal") ? saved : null;

  });
  const [userName, setUserName] = useState(() => localStorage.getItem("auth.userName") || "");
  const [studentId, setStudentId] = useState<string | null>(() => localStorage.getItem("auth.studentId"));
  const [teacherId, setTeacherId] = useState<string | null>(() => localStorage.getItem("auth.teacherId"));
  const [schoolId, setSchoolId] = useState<string | null>(() => localStorage.getItem("auth.schoolId"));

  const login = (r: Role, name = "", sId?: string, tId?: string, schId?: string) => {
    setRole(r);
    setUserName(name || (r === "admin" ? "Administrator" : r === "student" ? "Student" : r === "principal" ? "Principal" : "Teacher"));

    setStudentId(sId || null);
    setTeacherId(tId || null);
    setSchoolId(schId || null);
  };

  const logout = () => {
    setRole(null);
    setUserName("");
    setStudentId(null);
    setTeacherId(null);
    setSchoolId(null);
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

  useEffect(() => {
    if (schoolId) localStorage.setItem("auth.schoolId", schoolId);
    else localStorage.removeItem("auth.schoolId");
  }, [schoolId]);

  return (
    <AuthContext.Provider value={{ role, userName, studentId, teacherId, schoolId, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  );
};
