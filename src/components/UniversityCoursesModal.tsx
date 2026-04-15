import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScholarshipApplicationForm } from "@/components/scholarships/ScholarshipApplicationForm";
import {
  GraduationCap,
  MapPin,
  Book,
  Clock,
  Award,
  Search,
  AlertCircle,
  Info,
} from "lucide-react";

interface Course {
  course_title: string;
  duration: string | null;
  scholarship_percentage: number | null;
  level_of_study: string | null;
  field_of_study: string | null;
}

interface UniversityCoursesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  country: string;
  levelOfStudy: string;
  fieldOfStudy: string;
  onApply: (universityName: string, courseTitle: string) => void;
}

// Normalization helper for fuzzy matching
const normalize = (str: string | null): string => {
  if (!str) return "";

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&]/g, "")
    .replace(/\band\b/g, "&")
    .replace(/&/g, "and");
};

// Check if two normalized strings match, accounting for common variations
const fuzzyMatch = (value: string | null, target: string): boolean => {
  if (!value) return false;

  const normalizedValue = normalize(value);
  const normalizedTarget = normalize(target);

  // Exact match after normalization
  if (normalizedValue === normalizedTarget) return true;

  // Handle common degree variations
  const degreeVariations: Record<string, string[]> = {
    bachelor: ["bachelors", "bachelors degree", "bachelor degree", "undergraduate", "bsc", "ba"],
    master: ["masters", "masters degree", "master degree", "postgraduate", "msc", "ma"],
    phd: ["doctorate", "doctoral", "doctoral degree", "phd degree"],
  };

  // Check if either value matches any variation group
  for (const [canonical, variations] of Object.entries(degreeVariations)) {
    const allVariants = [canonical, ...variations];
    const valueMatch = allVariants.some(
      (v) => normalizedValue.includes(v) || v.includes(normalizedValue)
    );
    const targetMatch = allVariants.some(
      (v) => normalizedTarget.includes(v) || v.includes(normalizedTarget)
    );

    if (valueMatch && targetMatch) return true;
  }

  // Handle field variations
  return normalizedValue.includes(normalizedTarget) || normalizedTarget.includes(normalizedValue);
};

export function UniversityCoursesModal({
  open,
  onOpenChange,
  universityName,
  country,
  levelOfStudy,
  fieldOfStudy,
  onApply,
}: UniversityCoursesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Two-step fetch: Query by university + country, then client-filter by level + field
  const { data: allCourses, isLoading, error } = useQuery({
    queryKey: ["university-courses", universityName, country],
    queryFn: async () => {
      const trimmedUniversity = universityName.trim();
      const trimmedCountry = country.trim();

      const { data, error } = await supabase
        .from("universities")
        .select("course_title, duration, scholarship_percentage, level_of_study, field_of_study")
        .ilike("university", trimmedUniversity)
        .ilike("country", trimmedCountry)
        .order("course_title");

      if (error) throw error;
      return data as unknown as Course[];
    },
    enabled: open && !!universityName,
  });

  // Client-side filtering with normalization
  const { filteredCourses, hasExactMatches } = useMemo(() => {
    if (!allCourses) return { filteredCourses: [], hasExactMatches: true };

    const exactMatches = allCourses.filter(
      (course) =>
        fuzzyMatch(course.level_of_study, levelOfStudy) &&
        fuzzyMatch(course.field_of_study, fieldOfStudy)
    );

    const uniqueCourses = Array.from(
      new Map(
        (exactMatches.length > 0 ? exactMatches : allCourses).map((course) => [
          `${course.course_title?.trim().toLowerCase() || ""}-${course.duration?.trim().toLowerCase() || ""}-${course.scholarship_percentage ?? "null"}`,
          course,
        ])
      ).values()
    );

    return {
      filteredCourses: uniqueCourses as Course[],
      hasExactMatches: exactMatches.length > 0,
    };
  }, [allCourses, levelOfStudy, fieldOfStudy]);

  // Filter courses based on search query
  const displayedCourses = useMemo(() => {
    if (!searchQuery) return filteredCourses;

    return filteredCourses.filter((course) =>
      course.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredCourses, searchQuery]);

  const formatScholarshipPercentage = (percentage: number | null): string => {
    if (percentage === null || percentage === undefined) {
      return "Not specified";
    }

    const rounded = Math.round(percentage);
    return `${rounded}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="sticky top-0 bg-background border-b z-10 px-6 py-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold mb-2">
                  {universityName}
                </DialogTitle>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20">
                    <MapPin className="h-3 w-3 mr-1" />
                    {country}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary" className="px-2 py-1">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {levelOfStudy}
                  </Badge>

                  <Badge variant="secondary" className="px-2 py-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {country}
                  </Badge>

                  <Badge variant="secondary" className="px-2 py-1">
                    <Book className="h-3 w-3 mr-1" />
                    {fieldOfStudy}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!hasExactMatches && filteredCourses.length > 0 && (
            <Alert className="bg-muted/50 border-muted-foreground/20 mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                No exact matches for your selections. Showing all courses at this university.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We could not load courses right now. Please try again.
              </AlertDescription>
            </Alert>
          ) : displayedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Book className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No courses match your search" : "No courses found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "This university may not have courses in our database"}
              </p>

              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedCourses.slice(0, 20).map((course, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md hover:border-primary/40 transition-all bg-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base leading-tight mb-2">
                        {course.course_title}
                      </h4>

                      <div className="flex flex-wrap gap-2">
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs"
                          aria-label={`Duration: ${course.duration || "Not specified"}`}
                        >
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">Duration:</span>
                          <span className="text-muted-foreground">
                            {course.duration || "Not specified"}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs"
                          aria-label={`Scholarship: ${formatScholarshipPercentage(course.scholarship_percentage)}`}
                        >
                          <Award className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">Scholarship:</span>
                          <span className="text-muted-foreground">
                            {formatScholarshipPercentage(course.scholarship_percentage)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="shrink-0 sm:self-start w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setSelectedCourse(course)}
                      aria-label={`Apply to ${course.course_title}`}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}

              {displayedCourses.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing first 20 of {displayedCourses.length} courses
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scholarship Application</DialogTitle>
          </DialogHeader>

          {selectedCourse && (
            <ScholarshipApplicationForm
              universityName={universityName}
              courseTitle={selectedCourse.course_title}
              levelOfStudy={levelOfStudy}
              country={country}
              courseDuration={selectedCourse.duration || "Not specified"}
              onClose={() => setSelectedCourse(null)}
              onSuccess={() => {
                setSelectedCourse(null);
                onOpenChange(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}