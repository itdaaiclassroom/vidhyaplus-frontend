import React, { useState } from "react";
import { useAppData } from "@/contexts/DataContext";
import { PrincipalProvider } from "@/contexts/PrincipalContext";
import { Card, CardContent } from "@/components/ui/card";
import { School, Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSchoolContextWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const AdminSchoolContextWrapper: React.FC<AdminSchoolContextWrapperProps> = ({ children, title, description }) => {
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
              <PopoverContent className="w-[320px] p-0 shadow-lg border-slate-100 rounded-xl overflow-hidden" align="end">
                <Command>
                  <div className="flex items-center border-b px-3 bg-slate-50/50">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput placeholder="Type a school name to search..." className="h-12 border-0 focus:ring-0 outline-none w-full bg-transparent text-sm" />
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
                          className="cursor-pointer flex items-center py-2.5 px-3 mb-1 last:mb-0 rounded-lg aria-selected:bg-teal-50 aria-selected:text-teal-900"
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
        <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 transition-all hover:bg-slate-50/80 hover:border-slate-300">
          <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-5 relative animate-in zoom-in duration-500 delay-100 fill-mode-both">
            <School className="w-8 h-8 text-slate-300" />
            <div className="absolute -bottom-1 -right-1 bg-teal-100 rounded-full p-1.5 border-2 border-white shadow-sm">
              <Search className="w-3.5 h-3.5 text-teal-600" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-slate-700 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">No School Selected</h4>
          <p className="text-slate-400 text-sm max-w-[250px] text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
            Use the directory search above to select a school and load its data.
          </p>
        </div>
      )}
    </div>
  );
};
