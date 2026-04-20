import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "./RegistrationForms";
import { useAppData } from "@/contexts/DataContext";

const StudentRegistration: React.FC = () => {
  const { data, refetch } = useAppData();
  const schools = data.schools ?? [];
  const classes = data.classes ?? [];

  return (
    <DashboardLayout title="Student Registration">
      <Card>
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
        </CardHeader>
        <div className="p-4">
          <StudentForm
            schools={schools}
            classes={classes}
            onSuccess={() => refetch()}
          />
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default StudentRegistration;
