import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "./RegistrationForms";
import { useAppData } from "@/contexts/DataContext";

const TeacherRegistration: React.FC = () => {
  const { data, refetch } = useAppData();
  return (
    <DashboardLayout title="Teacher Registration">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Registration</CardTitle>
        </CardHeader>
        <div className="p-4">
          <TeacherForm schools={data.schools} onSuccess={() => refetch()} />
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherRegistration;
