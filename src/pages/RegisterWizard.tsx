import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import countries from "@/data/countries.json";
const LEVELS_OF_STUDY = ["Foundation", "Diploma", "Bachelors Degree", "Masters Degree", "PhD"];
const FIXED_FIELDS = [
  "Arts and Humanities",
  "Social Science and Management",
  "Engineering and Technology",
  "Life Science and Medicine",
  "Business Administration",
  "Education",
];

// Level normalization for database queries
const LEVEL_KEYS: Record<string, string[]> = {
  Foundation: ["foundation"],
  Diploma: ["diploma"],
  "Bachelors Degree": ["bachelors degree", "bachelor degree", "bachelors", "bachelor"],
  "Masters Degree": ["masters degree", "master degree", "masters", "master"],
  PhD: ["phd", "doctorate", "doctoral"],
};

// Normalization helper for defensive string matching
const norm = (s?: string) => (s ?? "").toLowerCase().replace(/'/g, "").trim();
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  nationality: string;
  gender: string;
  preferredLevelOfStudy: string;
  countryPreference: string;
  fieldOfStudy: string;
}
interface University {
  university: string;
  country: string;
  ranking?: string;
  level_of_study?: string;
  field_of_study?: string;
}
export default function RegisterWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nationalityOpen, setNationalityOpen] = useState(false);

  // Step 3 state
  const [level, setLevel] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    nationality: "",
    gender: "",
    preferredLevelOfStudy: "",
    countryPreference: "",
    fieldOfStudy: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // React Query for countries
  const { data: countriesData = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["countries-by-level", level],
    enabled: !!level,
    queryFn: async () => {
      const orFilter = LEVEL_KEYS[level!].map((k) => `level_of_study.ilike.%${k}%`).join(",");
      const { data, error } = await supabase
        .from("universities")
        .select("country, level_of_study")
        .or(orFilter)
        .order("country", { ascending: true });

      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r) => (r.country ?? "").trim()).filter(Boolean)));
    },
  });

  // React Query for fields - only run after level and country selected
  const { data: fieldsData = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ["fields-by-level-country", level, country],
    enabled: !!level && !!country,
    queryFn: async () => {
      const orFilter = LEVEL_KEYS[level!].map((k) => `level_of_study.ilike.%${k}%`).join(",");
      const { data, error } = await supabase
        .from("universities")
        .select("field_of_study, level_of_study, country")
        .eq("country", country!)
        .or(orFilter)
        .order("field_of_study", { ascending: true });

      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r) => (r.field_of_study ?? "").trim()).filter(Boolean)));
    },
  });

  // React Query for universities - strictly enforce all three selections
  const { data: universitiesData = [], isLoading: universitiesLoading } = useQuery({
    queryKey: ["universities-by-lcf", level, country, field],
    enabled: !!level && !!country && !!field,
    queryFn: async () => {
      const orFilter = LEVEL_KEYS[level!].map((k) => `level_of_study.ilike.%${k}%`).join(",");
      const { data, error } = await supabase
        .from("universities")
        .select("university, country, ranking, level_of_study, field_of_study")
        .eq("country", country!)
        .eq("field_of_study", field!)
        .or(orFilter)
        .order("university", { ascending: true });

      if (error) throw error;
      // De-dupe by (university, country)
      return Array.from(new Map((data ?? []).map((r) => [`${r.university}__${r.country}`, r])).values());
    },
  });
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle level change
  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    setCountry(null);
    setField(null);
    setSelectedUnis([]);
    updateFormData("preferredLevelOfStudy", newLevel);
    updateFormData("countryPreference", "");
    updateFormData("fieldOfStudy", "");
  };

  // Handle country change
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setField(null);
    setSelectedUnis([]);
    updateFormData("countryPreference", newCountry);
    updateFormData("fieldOfStudy", "");
  };

  // Handle field change
  const handleFieldChange = (newField: string) => {
    setField(newField);
    setSelectedUnis([]);
    updateFormData("fieldOfStudy", newField);
  };
  const handleUniversityToggle = (universityName: string, universityCountry: string) => {
    const uniKey = `${universityName}|${universityCountry}`;
    setSelectedUnis((prev) => (prev.includes(uniKey) ? prev.filter((key) => key !== uniKey) : [...prev, uniKey]));
  };
  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) return;
    } else if (currentStep === 2) {
      if (!formData.firstName || !formData.lastName || !formData.nationality || !formData.gender) return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  // Calculate submit validation
  const canSubmit = !!level && !!country && !!field && selectedUnis.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    if (!canSubmit) {
      toast({
        title: "Complete all fields",
        description: "Please select level, country, field, and at least one university.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Create user with confirmed email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User creation failed");

      // Sign in the user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (signInError) throw signInError;

      // Insert student record
      const { error: studentError } = await supabase.from("students").upsert(
        {
          user_id: signUpData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          nationality: formData.nationality,
          gender: formData.gender,
          level_of_study: level!,
          preferred_country: country!,
          field_of_study: field!,
          status: "pending",
        },
        { onConflict: "user_id" },
      );

      if (studentError) throw studentError;

      // Insert university selections
      const selections = selectedUnis.map((uniKey) => {
        const [university_name, uniCountry] = uniKey.split("|");
        return {
          student_id: signUpData.user.id,
          university_name,
          country: uniCountry,
        };
      });

      // Clear existing selections first
      const { error: deleteError } = await supabase
        .from("student_university_selections")
        .delete()
        .eq("student_id", signUpData.user.id);

      const { error: selectionsError } = await supabase.from("student_university_selections").insert(selections);

      if (selectionsError) throw selectionsError;
      toast({
        title: "Registration successful!",
        description: "Your application has been submitted and is awaiting approval.",
      });
      navigate("/pending");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                placeholder="Create a password"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="First name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Last name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nationality</Label>
              <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={nationalityOpen}
                    className="w-full justify-between"
                    disabled={loading}
                  >
                    {formData.nationality || "Select your nationality..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search countries..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country}
                            value={country}
                            onSelect={(currentValue) => {
                              updateFormData("nationality", currentValue === formData.nationality ? "" : currentValue);
                              setNationalityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.nationality === country ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {country}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => updateFormData("gender", value)}
                className="flex space-x-2"
              >
                <div className="flex items-center justify-center border rounded-lg px-3 py-2 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <RadioGroupItem value="Male" id="male" className="sr-only" />
                  <Label htmlFor="male" className="cursor-pointer">
                    Male
                  </Label>
                </div>
                <div className="flex items-center justify-center border rounded-lg px-3 py-2 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <RadioGroupItem value="Female" id="female" className="sr-only" />
                  <Label htmlFor="female" className="cursor-pointer">
                    Female
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            {/* Level of Study */}
            <div className="space-y-2">
              <Label>Preferred Level of Study</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS_OF_STUDY.map((levelOption) => (
                  <Button
                    key={levelOption}
                    type="button"
                    variant={level === levelOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLevelChange(levelOption)}
                    disabled={loading}
                  >
                    {levelOption}
                  </Button>
                ))}
              </div>
            </div>

            {/* Country Preference */}
            <div className="space-y-2">
              <Label>Country Preference</Label>
              <Select
                value={country || ""}
                onValueChange={handleCountryChange}
                disabled={!level || countriesLoading || loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !level
                        ? "Select level first"
                        : countriesLoading
                          ? "Loading countries..."
                          : countriesData.length === 0
                            ? "No countries found for this level (check DB values)"
                            : "Select preferred country"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {countriesData.map((countryOption) => (
                    <SelectItem key={countryOption} value={countryOption}>
                      {countryOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field of Study */}
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Select
                value={field || ""}
                onValueChange={handleFieldChange}
                disabled={!country || fieldsLoading || loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !country
                        ? "Select country first"
                        : fieldsLoading
                          ? "Loading fields..."
                          : fieldsData.length === 0
                            ? "No fields found for this level and country"
                            : "Select field of study"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fieldsData.map((fieldOption) => (
                    <SelectItem key={fieldOption} value={fieldOption}>
                      {fieldOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Universities - only show after all three selections */}
            {field && (
              <div className="space-y-2">
                <Label>Available Universities</Label>
                <Card className="max-h-60 overflow-y-auto">
                  <CardContent className="p-3 space-y-2">
                    {universitiesLoading ? (
                      <p className="text-muted-foreground">Loading universities...</p>
                    ) : universitiesData.length === 0 ? (
                      <p className="text-muted-foreground">No universities match your selections.</p>
                    ) : (
                      universitiesData.map((university: any, index: number) => {
                        const universityKey = `${university.university}__${university.country}`;
                        return (
                          <div key={universityKey} className="flex items-start space-x-2">
                            <Checkbox
                              id={universityKey}
                              checked={selectedUnis.includes(`${university.university}|${university.country}`)}
                              onCheckedChange={() => handleUniversityToggle(university.university, university.country)}
                              disabled={loading}
                            />
                            <Label htmlFor={universityKey} className="text-sm cursor-pointer flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{university.university}</span>
                                {university.ranking && (
                                  <Badge variant="secondary" className="text-xs">
                                    #{university.ranking}
                                  </Badge>
                                )}
                              </div>
                            </Label>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
                {selectedUnis.length > 0 && (
                  <p className="text-sm text-muted-foreground">{selectedUnis.length} university(ies) selected</p>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  const stepTitles = ["Create Account", "Personal Information", "Academic Preferences"];
  return (
    <div className="wizard-container">
      <div className="max-w-md mx-auto w-full">
        <Link to="/" aria-label="Go to homepage">
          <Button 
            variant="ghost" 
            size="sm"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Button>
        </Link>
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <Card className="wizard-card shadow-glow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === currentStep ? "bg-primary text-primary-foreground" : step < currentStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{stepTitles[currentStep - 1]}</CardTitle>
              <CardDescription>Step {currentStep} of 3 - Join NAMA Uni-Scholarship</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStep()}

                <div className="flex justify-between space-x-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={loading}
                      className="ml-auto flex items-center gap-2 bg-gradient-primary hover:shadow-glow"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading || !canSubmit}
                      className="ml-auto bg-gradient-primary hover:shadow-glow"
                    >
                      {loading ? "Creating Account..." : "Complete Registration"}
                    </Button>
                  )}
                </div>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
