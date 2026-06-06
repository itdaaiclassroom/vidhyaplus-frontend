import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { 
  fetchPrincipalStudents, 
  fetchPrincipalTeachers, 
  fetchPrincipalGrades, 
  fetchPrincipalSections, 
  fetchPrincipalProfile,
  PrincipalStudent, 
  PrincipalTeacher, 
  PrincipalGrade, 
  PrincipalSection,
  PrincipalProfile
} from "@/api/client";
import { useAuth } from "./AuthContext";

interface PrincipalContextType {
  students: PrincipalStudent[];
  teachers: PrincipalTeacher[];
  grades: PrincipalGrade[];
  sections: PrincipalSection[];
  profile: PrincipalProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchStudents: () => Promise<void>;
  refetchTeachers: () => Promise<void>;
  refetchSections: () => Promise<void>;
  schoolId: string | number | null;
}

const PrincipalContext = createContext<PrincipalContextType | undefined>(undefined);

export const PrincipalProvider: React.FC<{ children: ReactNode, schoolIdOverride?: string }> = ({ children, schoolIdOverride }) => {
  const { schoolId: authSchoolId } = useAuth();
  const schoolId = schoolIdOverride || authSchoolId;
  
  const [students, setStudents] = useState<PrincipalStudent[]>([]);
  const [teachers, setTeachers] = useState<PrincipalTeacher[]>([]);
  const [grades, setGrades] = useState<PrincipalGrade[]>([]);
  const [sections, setSections] = useState<PrincipalSection[]>([]);
  const [profile, setProfile] = useState<PrincipalProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const [sData, tData, gData, secData, pData] = await Promise.all([
        fetchPrincipalStudents(schoolId),
        fetchPrincipalTeachers(schoolId),
        fetchPrincipalGrades(),
        fetchPrincipalSections(undefined, schoolId),
        fetchPrincipalProfile(schoolId)
      ]);
      
      setStudents(sData);
      setTeachers(tData);
      setGrades(gData.grades);
      setSections(secData.sections);
      setProfile(pData);
    } catch (err: any) {
      console.error("Error fetching principal data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refetchStudents = async () => {
    if (!schoolId) return;
    try {
      const sData = await fetchPrincipalStudents(schoolId);
      setStudents(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchTeachers = async () => {
    if (!schoolId) return;
    try {
      const tData = await fetchPrincipalTeachers(schoolId);
      setTeachers(tData);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchSections = async () => {
    try {
      const secData = await fetchPrincipalSections(undefined, schoolId!);
      setSections(secData.sections);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [schoolId]);

  const value = useMemo(() => ({
    students,
    teachers,
    grades,
    sections,
    profile,
    loading,
    error,
    refetch: fetchAllData,
    refetchStudents,
    refetchTeachers,
    refetchSections,
    schoolId
  }), [students, teachers, grades, sections, profile, loading, error, schoolId]);

  return (
    <PrincipalContext.Provider value={value}>
      {children}
    </PrincipalContext.Provider>
  );
};

export const usePrincipal = () => {
  const context = useContext(PrincipalContext);
  if (context === undefined) {
    throw new Error("usePrincipal must be used within a PrincipalProvider");
  }
  return context;
};
