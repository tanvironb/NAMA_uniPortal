import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { GraduationCap, MapPin, Book, Clock, CheckCircle, XCircle, DollarSign, Award, FileText, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { UniversityCoursesModal } from "@/components/UniversityCoursesModal";
import { ApplicationsTab } from "@/components/scholarships/ApplicationsTab";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState<{
    name: string;
    country: string;
  } | null>(null);
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(new Set());

  // Access control and route guard
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!loading) {
        if (!user) {
          navigate('/login');
        } else if (user.email === 'admin@gmail.com') {
          navigate('/admin');
        } else {
          // Route guard - ensure user is approved
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) return navigate('/login');
          const { data: s } = await supabase.from('students').select('status').eq('user_id', authUser.id).single();
          if (!s) return navigate('/register');
          if (s.status === 'rejected') return navigate('/rejected');
          if (s.status !== 'approved') return navigate('/pending');
        }
      }
    };
    checkUserStatus();
  }, [user, loading, navigate]);

  // Get student profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: selectedUniversities, isLoading: universitiesLoading } = useQuery({
    queryKey: ['student-universities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get student preferences
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('level_of_study, preferred_country, field_of_study')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (studentError) throw studentError;
      if (!student) return [];
      
      // Get selected universities
      const { data: selections, error: selectionsError } = await supabase
        .from('student_university_selections')
        .select('university_name, country')
        .eq('student_id', user.id);
      
      if (selectionsError) throw selectionsError;
      if (!selections?.length) return [];

      // Get rankings for each university
      const universitiesData = await Promise.all(
        selections.map(async (selection: any) => {
          const { data: uniData } = await supabase
            .from('universities')
            .select('ranking')
            .ilike('university', selection.university_name.trim())
            .ilike('country', selection.country.trim())
            .limit(1)
            .maybeSingle();

          return {
            university_name: selection.university_name,
            country: selection.country,
            ranking: uniData?.ranking || null,
          };
        })
      );
      
      return universitiesData;
    },
    enabled: !!user?.id && profile?.status === 'approved'
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const toggleUniversityExpansion = (universityName: string) => {
    const newExpanded = new Set(expandedUniversities);
    if (newExpanded.has(universityName)) {
      newExpanded.delete(universityName);
    } else {
      newExpanded.add(universityName);
    }
    setExpandedUniversities(newExpanded);
  };

  const handleApplyCourse = (universityName: string, courseTitle: string) => {
    toast.success("Application Submitted", {
      description: `Your application for ${courseTitle} at ${universityName} has been submitted.`
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

  // Show pending/rejected state
  if (profile.status !== 'approved') {
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
              navigate('/login');
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
                <span>Application {profile.status === 'pending' ? 'Pending' : 'Status'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {profile.status === 'pending' && (
                <div>
                  <p className="text-lg mb-4">Your application is being reviewed by our admissions team.</p>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Application submitted successfully. We'll notify you once a decision is made.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {profile.status === 'rejected' && (
                <div>
                  <p className="text-lg mb-4">Unfortunately, your application was not approved.</p>
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
            navigate('/login');
          }}
        >
          Sign Out
        </Button>
      </div>

      {/* Summary chips */}
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
      {/* University Cards */}
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
      ) : selectedUniversities && selectedUniversities.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {selectedUniversities.map((university: any, index) => (
            <motion.div
              key={`${university.university_name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{university.university_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                          <MapPin className="h-3 w-3 mr-1" />
                          {university.country}
                        </Badge>
                        {university.ranking && (
                          <Badge variant="secondary" className="text-xs bg-accent-gold/10 text-accent-gold border-accent-gold/20">
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
                      onClick={() => setSelectedUniversity({ 
                        name: university.university_name, 
                        country: university.country 
                      })}
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

      {/* University Courses Modal */}
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