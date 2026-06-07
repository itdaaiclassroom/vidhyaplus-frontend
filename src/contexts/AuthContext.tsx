import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "teacher" | "admin" | "superadmin" | "student" | "principal" | null;


interface AuthContextType {
  role: Role;
  userName: string;
  studentId: string | null;
  teacherId: string | null;
  schoolId: string | null;
  token: string | null;
  permissions: Record<string, 'none' | 'read' | 'write'> | null;
  login: (role: Role, name?: string, studentId?: string, teacherId?: string, schoolId?: string, token?: string, permissions?: Record<string, any>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  studentId: null,
  teacherId: null,
  schoolId: null,
  token: null,
  permissions: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

/** Static helper to get token outside of React components (e.g. in API client) */
export function getStoredToken(): string | null {
  return localStorage.getItem("auth.token");
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("auth.role");
    return (saved === "teacher" || saved === "admin" || saved === "superadmin" || saved === "student" || saved === "principal" || saved === "team") ? saved as Role : null;
  });
  const [userName, setUserName] = useState(() => localStorage.getItem("auth.userName") || "");
  const [studentId, setStudentId] = useState<string | null>(() => localStorage.getItem("auth.studentId"));
  const [teacherId, setTeacherId] = useState<string | null>(() => localStorage.getItem("auth.teacherId"));
  const [schoolId, setSchoolId] = useState<string | null>(() => {
    const s = localStorage.getItem("auth.schoolId");
    return s === "undefined" || s === "null" ? null : s;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth.token"));
  const [permissions, setPermissions] = useState<Record<string, 'none' | 'read' | 'write'> | null>(() => {
    const saved = localStorage.getItem("auth.permissions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (r: Role, name = "", sId?: string, tId?: string, schId?: string, tkn?: string, perms?: Record<string, any>) => {
    setRole(r);
    setUserName(name || (r === "superadmin" ? "Super Admin" : r === "admin" ? "Administrator" : r === "student" ? "Student" : r === "principal" ? "Principal" : "Teacher"));
    setStudentId(sId || null);
    setTeacherId(tId || null);
    setSchoolId(schId || null);
    setToken(tkn || null);
    setPermissions(perms || null);

    // Sync to localStorage immediately so API client sees it before navigate()
    if (r) localStorage.setItem("auth.role", r);
    if (name) localStorage.setItem("auth.userName", name);
    if (sId) localStorage.setItem("auth.studentId", sId);
    if (tId) localStorage.setItem("auth.teacherId", tId);
    if (schId) localStorage.setItem("auth.schoolId", schId);
    if (tkn) localStorage.setItem("auth.token", tkn);
    if (perms) localStorage.setItem("auth.permissions", JSON.stringify(perms));
  };

  const logout = () => {
    setRole(null);
    setUserName("");
    setStudentId(null);
    setTeacherId(null);
    setSchoolId(null);
    setToken(null);
    setPermissions(null);
    localStorage.clear();
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

  useEffect(() => {
    if (token) localStorage.setItem("auth.token", token);
    else localStorage.removeItem("auth.token");
  }, [token]);

  return (
    <AuthContext.Provider value={{ role, userName, studentId, teacherId, schoolId, token, permissions, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  );
};
