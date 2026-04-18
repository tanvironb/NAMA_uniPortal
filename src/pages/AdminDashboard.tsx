import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  Users,
  GraduationCap,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import ScholarshipsTab from "@/components/admin/ScholarshipsTab";
import { ScholarshipApplicationsTab } from "@/components/admin/ScholarshipApplicationsTab";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-gold))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: universityCount, isLoading: universityCountLoading } = useQuery({
    queryKey: ["admin-university-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("university")
        .not("university", "is", null);

      if (error) throw error;
      return new Set(data.map((u: any) => u.university?.trim()).filter(Boolean)).size;
    },
  });

  const { data: courseCount, isLoading: courseCountLoading } = useQuery({
    queryKey: ["admin-course-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("universities")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: countryCount, isLoading: countryCountLoading } = useQuery({
    queryKey: ["admin-country-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("country")
        .not("country", "is", null);

      if (error) throw error;
      return new Set(data.map((u: any) => u.country?.trim()).filter(Boolean)).size;
    },
  });

  const { data: nationalityData, isLoading: nationalityLoading } = useQuery({
    queryKey: ["admin-nationality-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("nationality")
        .not("nationality", "is", null);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.nationality] = (acc[student.nationality] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
  });

  const { data: genderData, isLoading: genderLoading } = useQuery({
    queryKey: ["admin-gender-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("gender")
        .not("gender", "is", null);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.gender] = (acc[student.gender] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: levelOfStudyData, isLoading: levelOfStudyLoading } = useQuery({
    queryKey: ["admin-level-of-study-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("level_of_study")
        .not("level_of_study", "is", null);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.level_of_study] = (acc[student.level_of_study] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
  });

  const [pendingPage, setPendingPage] = useState(0);
  const [selectedPendingStudent, setSelectedPendingStudent] = useState<any>(null);

  const { data: pendingApplications, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-applications", pendingPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "user_id, first_name, last_name, email, nationality, gender, level_of_study, preferred_country, field_of_study, created_at"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(pendingPage * 25, (pendingPage + 1) * 25 - 1);

      if (error) throw error;
      return data;
    },
  });

  const { data: selectedStudentUniversities } = useQuery({
    queryKey: ["student-universities", selectedPendingStudent?.user_id],
    queryFn: async () => {
      if (!selectedPendingStudent?.user_id) return [];

      const { data, error } = await supabase
        .from("student_university_selections")
        .select("university_name, country")
        .eq("student_id", selectedPendingStudent.user_id);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPendingStudent?.user_id,
  });

  const approveMutation = useMutation({
    mutationFn: async (student: any) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "approved" })
        .eq("user_id", student.user_id);

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-status-email", {
        body: {
          email: student.email,
          firstName: student.first_name,
          lastName: student.last_name,
          status: "approved",
        },
      });

      if (emailError) {
        console.error("Approval email error:", emailError);
      }
    },
    onSuccess: () => {
      toast({ title: "Application approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error) => {
      console.error("Approve mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (student: any) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "rejected" })
        .eq("user_id", student.user_id);

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-status-email", {
        body: {
          email: student.email,
          firstName: student.first_name,
          lastName: student.last_name,
          status: "rejected",
        },
      });

      if (emailError) {
        console.error("Rejection email error:", emailError);
      }
    },
    onSuccess: () => {
      toast({ title: "Application rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error) => {
      console.error("Reject mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  const [studentsStatus, setStudentsStatus] = useState<"approved" | "rejected">("approved");
  const [studentsSearch, setStudentsSearch] = useState("");
  const [studentsPage, setStudentsPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students", studentsStatus, studentsSearch, studentsPage],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select(
          "user_id, first_name, last_name, email, nationality, gender, level_of_study, preferred_country, field_of_study, created_at"
        )
        .eq("status", studentsStatus)
        .order("created_at", { ascending: false });

      if (studentsSearch.trim()) {
        query = query.or(
          `first_name.ilike.%${studentsSearch}%,last_name.ilike.%${studentsSearch}%,email.ilike.%${studentsSearch}%`
        );
      }

      const { data, error } = await query.range(studentsPage * 25, (studentsPage + 1) * 25 - 1);

      if (error) throw error;
      return data;
    },
  });

  const { data: selectedApprovedStudentUniversities } = useQuery({
    queryKey: ["approved-student-universities", selectedStudent?.user_id],
    queryFn: async () => {
      if (!selectedStudent?.user_id) return [];

      const { data, error } = await supabase
        .from("student_university_selections")
        .select("university_name, country")
        .eq("student_id", selectedStudent.user_id);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent?.user_id,
  });

  const [universitiesSearch, setUniversitiesSearch] = useState("");
  const [universitiesPage, setUniversitiesPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: universities, isLoading: universitiesLoading } = useQuery({
    queryKey: ["admin-universities", universitiesSearch, universitiesPage],
    queryFn: async () => {
      if (!hasSearched || !universitiesSearch.trim()) return [];

      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .or(`university.ilike.%${universitiesSearch}%,country.ilike.%${universitiesSearch}%`)
        .range(universitiesPage * 25, (universitiesPage + 1) * 25 - 1);

      if (error) throw error;

      const grouped = data.reduce((acc: Record<string, any>, uni: any) => {
        const key = `${uni.university}-${uni.country}`;
        if (!acc[key]) {
          acc[key] = {
            university_name: uni.university,
            country: uni.country,
            course_count: 0,
            courses: new Set(),
          };
        }
        if (uni.course_title) {
          acc[key].courses.add(uni.course_title);
          acc[key].course_count = acc[key].courses.size;
        }
        return acc;
      }, {});

      return Object.values(grouped).map((uni: any) => ({
        university_name: uni.university_name,
        country: uni.country,
        course_count: uni.course_count,
      }));
    },
    enabled: hasSearched && !!universitiesSearch.trim(),
  });

  const handleUniversitySearch = () => {
    setHasSearched(true);
    setUniversitiesPage(0);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <Shield className="h-4 w-4 mr-2" />
            Manage Admins
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              supabase.auth.signOut();
              navigate("/login");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="kpi-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Universities</p>
                      <p className="text-2xl font-bold">
                        {universityCountLoading ? <Skeleton className="h-8 w-16" /> : 185}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="kpi-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent-gold/10 rounded-full">
                      <Users className="h-6 w-6 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                      <p className="text-2xl font-bold">
                        {courseCountLoading ? <Skeleton className="h-8 w-16" /> : courseCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="kpi-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-success/10 rounded-full">
                      <Globe className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">University Countries</p>
                      <p className="text-2xl font-bold">
                        {countryCountLoading ? <Skeleton className="h-8 w-16" /> : 6}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferred Levels of Study</CardTitle>
                <CardDescription>Student count per level of study</CardDescription>
              </CardHeader>
              <CardContent>
                {levelOfStudyLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : levelOfStudyData && levelOfStudyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={levelOfStudyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No level of study data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Nationalities</CardTitle>
                <CardDescription>Top countries by student count</CardDescription>
              </CardHeader>
              <CardContent>
                {nationalityLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : nationalityData && nationalityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={nationalityData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {nationalityData.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No nationality data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Gender Distribution</CardTitle>
                <CardDescription>Gender breakdown of registered students</CardDescription>
              </CardHeader>
              <CardContent>
                {genderLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : genderData && genderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No gender data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>Review and approve or reject student applications</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingApplications && pendingApplications.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApplications.map((application) => (
                        <TableRow
                          key={application.user_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedPendingStudent(application)}
                        >
                          <TableCell>{`${application.first_name} ${application.last_name}`}</TableCell>
                          <TableCell>{application.email}</TableCell>
                          <TableCell>{application.nationality}</TableCell>
                          <TableCell>{application.gender}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{application.level_of_study}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{application.preferred_country}</Badge>
                          </TableCell>
                          <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(application)}
                                disabled={approveMutation.isPending}
                                className="bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive" disabled={rejectMutation.isPending}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Application</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to reject this application?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectMutation.mutate(application)}
                                    >
                                      Confirm Reject
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setPendingPage(Math.max(0, pendingPage - 1))}
                      disabled={pendingPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {pendingPage + 1}</span>
                    <Button
                      variant="outline"
                      onClick={() => setPendingPage(pendingPage + 1)}
                      disabled={!pendingApplications || pendingApplications.length < 25}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>No pending applications at this time.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Drawer open={!!selectedPendingStudent} onOpenChange={() => setSelectedPendingStudent(null)}>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle>
                  Application Details - {selectedPendingStudent?.first_name} {selectedPendingStudent?.last_name}
                </DrawerTitle>
                <DrawerDescription>
                  Complete registration information and university selections
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-6 space-y-6 overflow-y-auto">
                {selectedPendingStudent && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Name</label>
                          <p className="text-sm">
                            {selectedPendingStudent.first_name} {selectedPendingStudent.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-sm">{selectedPendingStudent.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                          <p className="text-sm">{selectedPendingStudent.nationality}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Gender</label>
                          <p className="text-sm">{selectedPendingStudent.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                          <p className="text-sm">
                            {new Date(selectedPendingStudent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Study Preferences</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Level of Study</label>
                          <Badge variant="outline" className="mt-1">
                            {selectedPendingStudent.level_of_study}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Preferred Country</label>
                          <Badge variant="secondary" className="mt-1">
                            {selectedPendingStudent.preferred_country}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Field of Study</label>
                          <Badge variant="outline" className="mt-1">
                            {selectedPendingStudent.field_of_study}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Selected Universities</h3>
                      {selectedStudentUniversities && selectedStudentUniversities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedStudentUniversities.map((uni: any, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <h4 className="font-medium">{uni.university_name}</h4>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {uni.country}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No university selections found.</p>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        onClick={() => {
                          approveMutation.mutate(selectedPendingStudent);
                          setSelectedPendingStudent(null);
                        }}
                        disabled={approveMutation.isPending}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve Application
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" disabled={rejectMutation.isPending}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject Application
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Application</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to reject {selectedPendingStudent.first_name}'s application?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="destructive"
                              onClick={() => {
                                rejectMutation.mutate(selectedPendingStudent);
                                setSelectedPendingStudent(null);
                              }}
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>View and manage student records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <Select
                  value={studentsStatus}
                  onValueChange={(value: "approved" | "rejected") => {
                    setStudentsStatus(value);
                    setStudentsPage(0);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search by name or email..."
                    value={studentsSearch}
                    onChange={(e) => {
                      setStudentsSearch(e.target.value);
                      setStudentsPage(0);
                    }}
                  />
                </div>
              </div>

              {studentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : students && students.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow
                          key={student.user_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.nationality}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.level_of_study}</Badge>
                          </TableCell>
                          <TableCell>{student.preferred_country}</TableCell>
                          <TableCell>{student.field_of_study}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setStudentsPage(Math.max(0, studentsPage - 1))}
                      disabled={studentsPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {studentsPage + 1}</span>
                    <Button
                      variant="outline"
                      onClick={() => setStudentsPage(studentsPage + 1)}
                      disabled={!students || students.length < 25}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>No {studentsStatus} students found.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Drawer open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle>
                  Student Profile - {selectedStudent?.first_name} {selectedStudent?.last_name}
                </DrawerTitle>
                <DrawerDescription>
                  Complete student information and university selections
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-6 space-y-6 overflow-y-auto">
                {selectedStudent && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Name</label>
                          <p className="text-sm">
                            {selectedStudent.first_name} {selectedStudent.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-sm">{selectedStudent.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                          <p className="text-sm">{selectedStudent.nationality}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Gender</label>
                          <p className="text-sm">{selectedStudent.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Badge variant={studentsStatus === "approved" ? "default" : "destructive"} className="mt-1">
                            {studentsStatus}
                          </Badge>
                        </div>
                        {selectedStudent.created_at && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                            <p className="text-sm">
                              {new Date(selectedStudent.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Study Preferences</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Level of Study</label>
                          <Badge variant="outline" className="mt-1">
                            {selectedStudent.level_of_study}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Preferred Country</label>
                          <Badge variant="secondary" className="mt-1">
                            {selectedStudent.preferred_country}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Field of Study</label>
                          <Badge variant="outline" className="mt-1">
                            {selectedStudent.field_of_study}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Selected Universities</h3>
                      {selectedApprovedStudentUniversities && selectedApprovedStudentUniversities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedApprovedStudentUniversities.map((uni: any, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <h4 className="font-medium">{uni.university_name}</h4>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {uni.country}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No university selections found.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </TabsContent>

        <TabsContent value="scholarships" className="space-y-6">
          <ScholarshipsTab />
        </TabsContent>

        <TabsContent value="universities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Universities</CardTitle>
              <CardDescription>Search universities and view course offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search universities by name or country..."
                    value={universitiesSearch}
                    onChange={(e) => setUniversitiesSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUniversitySearch()}
                  />
                </div>
                <Button onClick={handleUniversitySearch} disabled={universitiesLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {universitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : universities && universities.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {universities.map((university, index) => (
                      <Card key={index} className="university-card">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{university.university_name}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Globe className="h-4 w-4 mr-2" />
                              {university.country}
                            </div>
                            <div className="flex items-center text-sm">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              <Badge variant="outline">{university.course_count} courses</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setUniversitiesPage(Math.max(0, universitiesPage - 1))}
                      disabled={universitiesPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {universitiesPage + 1}</span>
                    <Button
                      variant="outline"
                      onClick={() => setUniversitiesPage(universitiesPage + 1)}
                      disabled={!universities || universities.length < 25}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : hasSearched ? (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>No universities found matching your search criteria.</AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>Enter a search term to find universities.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <ScholarshipApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}