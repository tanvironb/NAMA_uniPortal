import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import countries from "@/data/countries.json";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  firstName: string;
  lastName: string;
  nationality: string;
  gender: string;
}

interface University {
  id: string;
  university: string;
  country: string | null;
  field_of_study: string | null;
  level_of_study: string | null;
  ranking: string | null;
}

export default function RegisterWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nationalityOpen, setNationalityOpen] = useState(false);

  const [level, setLevel] = useState("");
  useEffect(() => {
    console.log("Selected level:", level);
  }, [level]);

  const [country, setCountry] = useState("");
  const [field, setField] = useState("");
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    firstName: "",
    lastName: "",
    nationality: "",
    gender: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (fieldName: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const { data: countriesData = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["student-countries", level],
    queryFn: async () => {
      let query = supabase
        .from("universities")
        .select("country")
        .not("country", "is", null);

      if (level === "Master’s Degree") {
        query = query.in("level_of_study", ["Master’s Degree", "Master"]);
      } else if (level) {
        query = query.eq("level_of_study", level);
      }

      const { data, error } = await query;
      console.log("Countries query level:", level);
      console.log("Countries query raw data:", data);
      console.log("Countries query error:", error);

      if (error) throw error;

      const uniqueCountries = Array.from(
        new Set((data ?? []).map((item) => item.country).filter(Boolean))
      ) as string[];

      return uniqueCountries.sort();
    },
    enabled: !!level,
  });

  const { data: fieldsData = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ["student-fields", level, country],
    queryFn: async () => {
      let query = supabase
        .from("universities")
        .select("field_of_study")
        .not("field_of_study", "is", null);

      if (level) query = query.eq("level_of_study", level);
      if (country) query = query.eq("country", country);

      const { data, error } = await query;

      if (error) throw error;

      const uniqueFields = Array.from(
        new Set((data ?? []).map((item) => item.field_of_study).filter(Boolean))
      ) as string[];

      return uniqueFields.sort();
    },
    enabled: !!level,
  });

  const { data: universitiesData = [], isLoading: universitiesLoading } = useQuery({
    queryKey: ["student-universities", level, country, field],
    queryFn: async () => {
      let query = supabase
        .from("universities")
        .select("id, university, country, field_of_study, level_of_study, ranking")
        .order("university", { ascending: true });

      if (level) query = query.eq("level_of_study", level);
      if (country) query = query.eq("country", country);
      if (field) query = query.eq("field_of_study", field);

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []) as unknown as University[];
    },
    enabled: !!level && !!country && !!field,
  });

  const availableUniversities = useMemo(() => {
    const rows = universitiesData ?? [];
    const uniqueMap = new Map<string, University>();

    for (const row of rows) {
      if (!uniqueMap.has(row.university)) {
        uniqueMap.set(row.university, row);
      }
    }

    return Array.from(uniqueMap.values());
  }, [universitiesData]);

  useEffect(() => {
    setField("");
    setSelectedUnis([]);
  }, [level, country]);

  useEffect(() => {
    setSelectedUnis([]);
  }, [field]);

  const handleLevelChange = (value: string) => {
    setLevel(value);
    setCountry("");
    setField("");
    setSelectedUnis([]);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setField("");
    setSelectedUnis([]);
  };

  const handleFieldChange = (value: string) => {
    setField(value);
    setSelectedUnis([]);
  };

  const handleUniversityToggle = (universityid: string) => {
    setSelectedUnis((prev) => {
      if (prev.includes(universityid)) {
        return prev.filter((id) => id !== universityid);
      }

      if (prev.length >= 3) {
        toast({
          title: "Maximum reached",
          description: "You can select up to 3 universities only.",
          variant: "destructive",
        });
        return prev;
      }

      return [...prev, universityid];
    });
  };

  const canSubmit = !!level && !!country && !!field && selectedUnis.length > 0;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Missing fields",
          description: "Please complete your account details before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (
        !formData.fullName ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.nationality ||
        !formData.gender
      ) {
        toast({
          title: "Missing fields",
          description: "Please complete your personal information before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

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
        description: "Please complete your academic preferences before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("selectedUnis before signup:", selectedUnis);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: "http://localhost:8081/login",
          data: {
            full_name: formData.fullName,
            first_name: formData.firstName,
            last_name: formData.lastName,
            nationality: formData.nationality,
            gender: formData.gender,
            level_of_study: level,
            preferred_country: country,
            field_of_study: field,
            selected_university_ids: selectedUnis,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User creation failed");

      const { error: studentError } = await supabase.from("students").insert({
        user_id: signUpData.user.id,
        full_name: formData.fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        nationality: formData.nationality,
        gender: formData.gender,
        level_of_study: level,
        preferred_country: country,
        field_of_study: field,
        status: "pending",
      });

      if (studentError) throw studentError;

      toast({
        title: "Please verify your email",
        description:
          "Your account has been created. We sent a verification link to your email address. Please verify your email before signing in.",
      });

      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);

      toast({
        title: "Registration failed",
        description: error?.message || "An error occurred during registration.",
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
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                placeholder="Full name"
                required
                disabled={loading}
              />
            </div>

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
                        {countries.map((countryName) => (
                          <CommandItem
                            key={countryName}
                            value={countryName}
                            onSelect={(currentValue) => {
                              updateFormData(
                                "nationality",
                                currentValue === formData.nationality ? "" : currentValue
                              );
                              setNationalityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.nationality === countryName ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {countryName}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Level of Study</Label>
              <Select value={level} onValueChange={handleLevelChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level of study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachelor’s Degree">Bachelor’s Degree</SelectItem>
                  <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Country</Label>
              <Select
                value={country}
                onValueChange={handleCountryChange}
                disabled={!level || countriesLoading || loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      countriesLoading ? "Loading countries..." : "Select preferred country"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {countriesData.map((countryName) => (
                    <SelectItem key={countryName} value={countryName}>
                      {countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Select
                value={field}
                onValueChange={handleFieldChange}
                disabled={!level || !country || fieldsLoading || loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={fieldsLoading ? "Loading fields..." : "Select field of study"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {fieldsData.map((fieldName) => (
                    <SelectItem key={fieldName} value={fieldName}>
                      {fieldName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select up to 3 Universities</Label>

              <div className="flex flex-wrap gap-2">
                {selectedUnis.length > 0 ? (
                  selectedUnis.map((selectedUniversityid) => {
                    const uni = availableUniversities.find((u) => u.id === selectedUniversityid);
                    if (!uni) return null;

                    return (
                      <Badge key={selectedUniversityid} variant="secondary" className="px-3 py-1">
                        {uni.id}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No universities selected yet.</p>
                )}
              </div>

              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-3">
                {universitiesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading universities...</p>
                ) : availableUniversities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No universities found for the selected preferences.
                  </p>
                ) : (
                  availableUniversities.map((uni) => (
                    <div key={uni.id} className="flex items-start space-x-3 rounded-md border p-3">
                      <Checkbox
                        id={uni.id}
                        checked={selectedUnis.includes(uni.id)}
                        onCheckedChange={() => handleUniversityToggle(uni.id)}
                        disabled={
                          loading || (!selectedUnis.includes(uni.id) && selectedUnis.length >= 3)
                        }
                      />

                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={uni.university} className="font-medium cursor-pointer">
                          {uni.university}
                        </Label>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            {uni.country ?? "Unknown country"} •{" "}
                            {uni.field_of_study ?? "Unknown field"}
                          </p>

                          {uni.ranking && <p className="text-primary font-medium">#{uni.ranking}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                You must choose at least 1 university and up to 3.
              </p>
            </div>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="wizard-card shadow-glow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        step === currentStep
                          ? "bg-primary text-primary-foreground"
                          : step < currentStep
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <CardTitle className="text-2xl font-bold">
                {stepTitles[currentStep - 1]}
              </CardTitle>

              <CardDescription>
                Step {currentStep} of 3 - Join NAMA Uni-Scholarship
              </CardDescription>
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
                      disabled={loading}
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