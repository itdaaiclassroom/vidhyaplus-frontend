import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CoCurricularActivity {
  eventName: string;
  eventDetails: string;
  conductedDate: string;
  requirements: string;
  eligibilityCriteria: string;
  location: string;
  registrationDeadline: string;
}

const CoCurricularActivityRegistration: React.FC = () => {
  const [activities, setActivities] = useState<CoCurricularActivity[]>([]);
  const [form, setForm] = useState<CoCurricularActivity>({
    eventName: "",
    eventDetails: "",
    conductedDate: "",
    requirements: "",
    eligibilityCriteria: "",
    location: "",
    registrationDeadline: "",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleChange = (k: keyof CoCurricularActivity, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleAddActivity = () => {
    if (form.eventName.trim()) {
      if (editingIndex !== null) {
        const updatedActivities = [...activities];
        updatedActivities[editingIndex] = form;
        setActivities(updatedActivities);
        setEditingIndex(null);
      } else {
        setActivities([...activities, form]);
      }
      setForm({
        eventName: "",
        eventDetails: "",
        conductedDate: "",
        requirements: "",
        eligibilityCriteria: "",
        location: "",
        registrationDeadline: "",
      });
      setIsFormOpen(false);
    }
  };

  const handleEdit = (index: number) => {
    setForm(activities[index]);
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setForm({
      eventName: "",
      eventDetails: "",
      conductedDate: "",
      requirements: "",
      eligibilityCriteria: "",
      location: "",
      registrationDeadline: "",
    });
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end mb-4">
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>Add New Activity</Button>
        )}
      </div>

      {isFormOpen && (
        <Card className="border-2 border-primary/30">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-6">
              {editingIndex !== null ? "Edit Activity" : "New Co-Curricular Activity"}
            </h3>

            <div className="space-y-4 max-w-4xl">
              {/* Event Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event Name *
                </label>
                <Input
                  placeholder="Enter event name"
                  value={form.eventName}
                  onChange={(e) => handleChange("eventName", e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Event Details */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event Details
                </label>
                <Textarea
                  placeholder="Brief description of the event explaining the purpose, activities involved, and what participants can expect"
                  value={form.eventDetails}
                  onChange={(e) => handleChange("eventDetails", e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Conducted Date */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Conducted Date *
                  </label>
                  <Input
                    type="date"
                    value={form.conductedDate}
                    onChange={(e) => handleChange("conductedDate", e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* Registration Deadline */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Registration Deadline *
                  </label>
                  <Input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => handleChange("registrationDeadline", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Requirements for Event */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Requirements for Event
                </label>
                <Textarea
                  placeholder="List of materials, skills, or prerequisites needed to participate"
                  value={form.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                  className="min-h-20"
                />
              </div>

              {/* Eligibility Criteria */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Eligibility Criteria
                </label>
                <Textarea
                  placeholder="Specify which students can participate (e.g., class, age group, skills, or any specific conditions)"
                  value={form.eligibilityCriteria}
                  onChange={(e) => handleChange("eligibilityCriteria", e.target.value)}
                  className="min-h-20"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Location
                </label>
                <Input
                  placeholder="Venue where the event will take place (school campus, auditorium, online platform, etc.)"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity}>
                  {editingIndex !== null ? "Update Activity" : "Add Activity"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {activities.length === 0 && !isFormOpen && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No co-curricular activities added yet.</p>
            </CardContent>
          </Card>
        )}

        {activities.map((activity, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-lg text-primary">
                      {activity.eventName}
                    </h4>
                    <Badge variant="secondary">{activity.location}</Badge>
                  </div>

                  {activity.eventDetails && (
                    <div>
                      <p className="text-sm text-foreground">{activity.eventDetails}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Conducted Date:</span>
                      <p className="text-muted-foreground">{activity.conductedDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Registration Deadline:</span>
                      <p className="text-muted-foreground">{activity.registrationDeadline}</p>
                    </div>
                  </div>

                  {activity.requirements && (
                    <div>
                      <span className="font-medium text-sm text-foreground block mb-1">
                        Requirements:
                      </span>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.requirements}
                      </p>
                    </div>
                  )}

                  {activity.eligibilityCriteria && (
                    <div>
                      <span className="font-medium text-sm text-foreground block mb-1">
                        Eligibility Criteria:
                      </span>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.eligibilityCriteria}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(idx)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(idx)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoCurricularActivityRegistration;
