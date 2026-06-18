import React, { useState } from "react";
import { useAppData } from "@/contexts/DataContext";
import { PrincipalProvider } from "@/contexts/PrincipalContext";
import { Card, CardContent } from "@/components/ui/card";
import { School, Check, ChevronsUpDown, Search, Users, GraduationCap, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminSchoolContextWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  type?: "students" | "teachers";
}

export const AdminSchoolContextWrapper: React.FC<AdminSchoolContextWrapperProps> = ({ children, title, description, type }) => {
  const { data } = useAppData();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [open, setOpen] = useState(false);

  const selectedSchoolData = data.schools.find(s => String(s.id) === selectedSchool);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
        <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-emerald-500"></div>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title || "School Selection Required"}</h3>
            <p className="text-sm text-slate-500 mt-1">{description || "Please search and select a school from the directory."}</p>
          </div>
          <div className="w-full md:w-[320px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
              Directory Search
            </label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all font-medium text-left shadow-sm h-12"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-7 h-7 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                      <School className="w-4 h-4 text-teal-700" />
                    </div>
                    <span className="truncate">
                      {selectedSchoolData ? selectedSchoolData.name : "Search for a school..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 shadow-lg border-slate-100 rounded-xl overflow-hidden bg-white z-50" align="end">
                <Command>
                  <div className="flex items-center border-b px-3 bg-slate-50/50">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput placeholder="Type a school name to search..." className="h-12 border-0 focus:ring-0 outline-hidden w-full bg-transparent text-sm text-slate-850" />
                  </div>
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">No school found.</CommandEmpty>
                    <CommandGroup heading="Available Schools" className="text-slate-500">
                      {data.schools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name} // CommandItem filters against value
                          onSelect={() => {
                            setSelectedSchool(String(school.id));
                            setOpen(false);
                          }}
                          className="cursor-pointer flex items-center py-2.5 px-3 mb-1 last:mb-0 rounded-lg aria-selected:bg-teal-50 aria-selected:text-teal-900 text-sm"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                              <School className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="font-medium text-sm text-slate-800 truncate">{school.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">ID: {school.id}</p>
                            </div>
                            <Check
                              className={cn(
                                "h-4 w-4 text-teal-600 transition-all duration-200",
                                selectedSchool === String(school.id) ? "opacity-100 scale-100" : "opacity-0 scale-75"
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {selectedSchool ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PrincipalProvider schoolIdOverride={selectedSchool}>
            {children}
          </PrincipalProvider>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-500">
            {type === "teachers" ? (
              <>
                <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Registered Teachers</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-0.5">{data.teachers?.length || 0}</h3>
                  </div>
                </Card>
                <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Classrooms</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-0.5">{data.classes?.length || 0}</h3>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Registered Students</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-0.5">{data.students?.length || 0}</h3>
                  </div>
                </Card>
                <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarded Classes</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-0.5">{data.classes?.length || 0}</h3>
                  </div>
                </Card>
              </>
            )}
            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-5 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <School className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarded Schools</p>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">{data.schools?.length || 0}</h3>
              </div>
            </Card>
          </div>

          {/* School Selection Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-in fade-in duration-500 delay-100 fill-mode-both">
            <div>
              <h4 className="text-base font-bold text-slate-800">Quick School Directory Selector</h4>
              <p className="text-xs text-slate-500 mt-0.5">Click directly on any school below to select it and manage registrations.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.schools.map((school) => {
                const schoolStudents = (data.students || []).filter(st => String(st.schoolId) === String(school.id)).length;
                const schoolTeachers = (data.teachers || []).filter(t => String(t.schoolId) === String(school.id)).length;
                const schoolClasses = (data.classes || []).filter(c => String(c.schoolId) === String(school.id)).length;
                
                return (
                  <div 
                    key={school.id}
                    onClick={() => setSelectedSchool(String(school.id))}
                    className="border border-slate-150 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-sm text-slate-800 group-hover:text-teal-600 transition-colors">{school.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{school.district ? `${school.district} District` : "Main District"}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      {type === "teachers" ? (
                        <>
                          <Badge variant="outline" className="bg-emerald-50/55 text-emerald-700 hover:bg-emerald-50 border-emerald-100 text-[9px] font-bold px-2 py-0.5">
                            {schoolTeachers} Teachers
                          </Badge>
                          <Badge variant="outline" className="bg-indigo-50/55 text-indigo-700 hover:bg-indigo-50 border-indigo-100 text-[9px] font-bold px-2 py-0.5">
                            {schoolClasses} Classes
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="bg-indigo-50/55 text-indigo-700 hover:bg-indigo-50 border-indigo-100 text-[9px] font-bold px-2 py-0.5">
                            {schoolStudents} Students
                          </Badge>
                          <Badge variant="outline" className="bg-emerald-50/55 text-emerald-700 hover:bg-emerald-50 border-emerald-100 text-[9px] font-bold px-2 py-0.5">
                            {schoolClasses} Classes
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
