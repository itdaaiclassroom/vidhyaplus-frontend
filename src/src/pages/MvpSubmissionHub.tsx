/**
 * One-page MVP map for submission demos: links into real screens + static labels where needed.
 * Open: /mvp (log in first for role-specific routes).
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Item({
  title,
  badge,
  children,
  to,
}: {
  title: string;
  badge: "live" | "demo";
  children?: ReactNode;
  to?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Badge variant={badge === "live" ? "default" : "secondary"}>{badge === "live" ? "App" : "Static"}</Badge>
      </div>
      {children}
      {to && (
        <Button asChild size="sm" variant="outline" className="w-full mt-1">
          <Link to={to}>Open</Link>
        </Button>
      )}
    </div>
  );
}

export default function MvpSubmissionHub() {
  return (
    <DashboardLayout title="MVP submission map">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">30‑minute demo mode</CardTitle>
            <CardDescription>
              Each row links into the real app where it exists. “Static” only means the checklist line is satisfied with a
              label or sample copy—no new backend in this pass. Log in as the right role before opening links.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Student module</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Item title="Quiz module" badge="live" to="/student/quiz" />
            <Item title="Quiz rate (pick difficulty, then open quiz)" badge="demo">
              <p className="text-xs text-muted-foreground">Choose a rate; quiz opens with the same flow (level shown on quiz page).</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/student/quiz?level=low">Low</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/student/quiz?level=medium">Medium</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/student/quiz?level=high">High</Link>
                </Button>
              </div>
            </Item>
            <Item title="Quizzes by level (low / medium / high)" badge="demo">
              <p className="text-xs text-muted-foreground">
                Same chapter quizzes; difficulty label is for demonstration. Full adaptive item banks can be wired later.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link to="/student/quiz?level=medium">Try Medium →</Link>
              </Button>
            </Item>
            <Item title="Quiz results" badge="live" to="/student/quiz-results" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Teacher module</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Item
              title="Student registrations + QR (admin registers; teacher uses class)"
              badge="live"
              to="/admin/register/student"
            />
            <Item title="PPT, textbook, YouTube in live flow" badge="live" to="/teacher" />
            <Item title="Attendance (live session)" badge="live" to="/teacher" />
            <Item title="Quiz with QR codes (launch from live session)" badge="live" to="/teacher" />
            <Item title="Class scale (e.g. ~10 students, 1 teacher)" badge="demo">
              <p className="text-xs text-muted-foreground">Configure in admin registrations / DB; no extra UI.</p>
            </Item>
            <Item title="AI chatbot (doubt clarification)" badge="live" to="/teacher" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Admin module</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Item title="Student registration + QR download" badge="live" to="/admin/register/student" />
            <Item title="Teacher registration + QR download" badge="live" to="/admin/register/teacher" />
            <Item title="Materials: textbook & PPT (uploads + DB)" badge="live" to="/admin" />
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Tip: run <code className="rounded bg-muted px-1">npm run verify:live-quiz</code> before demoing live quiz + attendance.
        </p>
      </div>
    </DashboardLayout>
  );
}
