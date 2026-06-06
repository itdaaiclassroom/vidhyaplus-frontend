import React, { useState } from "react";
import { useAppData } from "@/contexts/DataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrincipalProvider } from "@/contexts/PrincipalContext";
import { Card, CardContent } from "@/components/ui/card";
import { School } from "lucide-react";

interface AdminSchoolContextWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const AdminSchoolContextWrapper: React.FC<AdminSchoolContextWrapperProps> = ({ children, title, description }) => {
  const { data } = useAppData();
  const [selectedSchool, setSelectedSchool] = useState<string>("");

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm rounded-2xl bg-white">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title || "School Selection Required"}</h3>
            <p className="text-sm text-slate-500">{description || "Please select a school to manage its data."}</p>
          </div>
          <div className="w-full md:w-72">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Select School</label>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-teal-600" />
                  <SelectValue placeholder="Choose a school..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {data.schools.map((school) => (
                  <SelectItem key={school.id} value={String(school.id)}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSchool ? (
        <PrincipalProvider schoolIdOverride={selectedSchool}>
          {children}
        </PrincipalProvider>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <School className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium italic">Select a school above to continue</p>
        </div>
      )}
    </div>
  );
};
