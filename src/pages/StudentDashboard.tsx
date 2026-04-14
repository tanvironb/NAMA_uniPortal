import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import {
  GraduationCap,
  MapPin,
  Book,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { UniversityCoursesModal } from "@/components/UniversityCoursesModal";
import { ApplicationsTab } from "@/components/scholarships/ApplicationsTab";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StudentProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  nationality: string;
  gender: string;
  level_of_study: string;
  preferred_country: string;
  field_of_study: string;
  status: "pending" | "approved" | "rejected";
};

type UniversityRow = {
  id: string;
  university: string | null;
  country: string | null;
  ranking: string | null;
  level_of_study: string | null;
  field_of_study: string | null;
};

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedUniversity, setSelectedUniversity] = useState<{
    name: string;
    country: string;
  } | null>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (loading) return;

      if (!user) {
        navigate("/login");
        return;
      }

      if (user.email === "admin@gmail.com") {
        navigate("/admin");
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      const { data: s } = await (supabase.from("students") as any)
        .select("status")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!s) {
        navigate("/register");
        return;
      }

      if (s.status === "rejected") {
        navigate("/rejected");
        return;
      }

      if (s.status !== "approved") {
        navigate("/pending");
      }
    };

    checkUserStatus();
  }, [user, loading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase.from("students") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as StudentProfile | null;
    },
    enabled: !!user?.id,
  });

  const { data: selectedUniversities, isLoading: universitiesLoading } = useQuery({
    queryKey: ["student-universities", user?.id],
    queryFn: async () => {
      if (!user?.id || !profile) return [];

      const { data: selections, error: selectionsError } = await (supabase
        .from("student_university_selections") as any)
        .select("university_id")
        .eq("student_id", user.id);

      if (selectionsError) throw selectionsError;
      if (!selections || selections.length === 0) return [];

      const universityIds = (selections as any[])
        .map((row) => row.university_id)
        .filter(Boolean)
        .map((id) => String(id).trim());

      if (universityIds.length === 0) return [];

      const { data: universitiesData, error: universitiesError } = await (supabase
        .from("universities") as any)
        .select("*")
        .in("id", universityIds);

      if (universitiesError) throw universitiesError;

      return ((universitiesData ?? []) as any[]).map((row) => ({
        id: String(row.id).trim(),
        university: row.university ?? null,
        country: row.country ?? null,
        ranking: row.ranking ?? null,
        level_of_study: row.level_of_study ?? null,
        field_of_study: row.field_of_study ?? null,
      })) as UniversityRow[];
    },
    enabled: !!user?.id && !!profile && profile.status === "approved",
  });

  const universitiesList = useMemo(
    () => selectedUniversities ?? [],
    [selectedUniversities]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const handleApplyCourse = (universityName: string, courseTitle: string) => {
    toast.success("Application Submitted", {
      description: `Your application for ${courseTitle} at ${universityName} has been submitted.`,
    });
    setSelectedUniversity(null);
  };

  if (loading || profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <GraduationCap className="h-4 w-4" />
          <AlertDescription>
            Profile not found. Please complete your registration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profile.status !== "approved") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile.first_name}!</h1>
            <p className="text-muted-foreground">Your student application status</p>
          </div>

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

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                {getStatusIcon(profile.status)}
                <span>Application {profile.status === "pending" ? "Pending" : "Status"}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              {profile.status === "pending" && (
                <div>
                  <p className="text-lg mb-4">
                    Your application is being reviewed by our admissions team.
                  </p>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Application submitted successfully. We&apos;ll notify you once a decision is made.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {profile.status === "rejected" && (
                <div>
                  <p className="text-lg mb-4">
                    Unfortunately, your application was not approved.
                  </p>
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700">
                      Please contact our support team for more information about your application.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile.first_name}!</h1>
          <p className="text-muted-foreground">Your selected universities and applications</p>
        </div>

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

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="px-3 py-1">
          <GraduationCap className="h-3 w-3 mr-1" />
          {profile.level_of_study}
        </Badge>

        <Badge variant="secondary" className="px-3 py-1">
          <MapPin className="h-3 w-3 mr-1" />
          {profile.preferred_country}
        </Badge>

        <Badge variant="secondary" className="px-3 py-1">
          <Book className="h-3 w-3 mr-1" />
          {profile.field_of_study}
        </Badge>
      </div>

      <Tabs defaultValue="universities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="universities">
          {universitiesLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : universitiesList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {universitiesList.map((university, index) => (
                <motion.div
                  key={university.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {university.university ?? "Unknown University"}
                          </CardTitle>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-primary/5 border-primary/20"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {university.country ?? "Unknown country"}
                            </Badge>

                            {university.ranking && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-accent-gold/10 text-accent-gold border-accent-gold/20"
                              >
                                #{university.ranking}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setSelectedUniversity({
                              name: university.university ?? "",
                              country: university.country ?? "",
                            })
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Courses
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Alert className="border-warning/20 bg-warning/5">
              <GraduationCap className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground">
                No universities selected. Please update your registration to select universities.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTab />
        </TabsContent>
      </Tabs>

      {selectedUniversity && profile && (
        <UniversityCoursesModal
          open={!!selectedUniversity}
          onOpenChange={(open) => !open && setSelectedUniversity(null)}
          universityName={selectedUniversity.name}
          country={selectedUniversity.country}
          levelOfStudy={profile.level_of_study}
          fieldOfStudy={profile.field_of_study}
          onApply={handleApplyCourse}
        />
      )}
    </div>
  );
}