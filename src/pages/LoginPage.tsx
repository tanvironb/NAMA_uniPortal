import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      console.log("LOGIN USER ID:", data.user.id);

      const meta = data.user.user_metadata || {};
      console.log("user metadata:", meta);

      let selectedUniversityIds: string[] = Array.isArray(meta.selected_university_ids)
        ? meta.selected_university_ids
        : [];

      if (selectedUniversityIds.length === 0 && Array.isArray(meta.selected_universities)) {
        const selectedUniversityNames = meta.selected_universities as string[];
        console.log("Old university names found in metadata:", selectedUniversityNames);

        const { data: matchedUniversities, error: matchError } = await supabase
          .from("universities")
          .select("*");

        if (matchError) {
          console.error("Matching error:", matchError);
        } else {
          const matchedRows = ((matchedUniversities ?? []) as any[]).filter((row) =>
            selectedUniversityNames.includes(row.university)
          );

          const uniqueMap = new Map<string, string>();

          for (const row of matchedRows) {
            if (!row?.university || !row?.id) continue;
            if (!uniqueMap.has(row.university)) {
              uniqueMap.set(row.university, row.id);
            }
          }

          selectedUniversityIds = Array.from(uniqueMap.values());
        }
      }

      console.log("selectedUniversityIds:", selectedUniversityIds);

      const { data: isAdminResult, error: adminError } = await supabase.rpc("is_admin");

      if (!adminError && isAdminResult) {
        navigate("/admin");
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from("students")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({
          title: "Login failed",
          description: profileError.message || "Could not load your profile.",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        const { error: createStudentError } = await supabase.from("students").insert({
          user_id: data.user.id,
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          email: data.user.email || email,
          nationality: meta.nationality || "",
          gender: meta.gender || "",
          level_of_study: meta.level_of_study || "",
          preferred_country: meta.preferred_country || "",
          field_of_study: meta.field_of_study || "",
          status: "pending",
        });

        if (createStudentError) {
          console.error("Error creating student profile:", createStudentError);
          toast({
            title: "Login failed",
            description: createStudentError.message || "Could not create student profile.",
            variant: "destructive",
          });
          return;
        }

        const { data: newProfile, error: newProfileError } = await supabase
          .from("students")
          .select("status")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (newProfileError) {
          console.error("Error fetching new profile:", newProfileError);
          toast({
            title: "Login failed",
            description: "Could not load your student profile.",
            variant: "destructive",
          });
          return;
        }

        profile = newProfile;
      }

      if (selectedUniversityIds.length > 0) {
        console.log("Rebuilding university selections for student:", data.user.id);

        const { error: deleteSelectionsError } = await supabase
          .from("student_university_selections")
          .delete()
          .eq("student_id", data.user.id);

        console.log("deleteSelectionsError:", deleteSelectionsError);

        const payload = selectedUniversityIds.map((universityId) => ({
          student_id: data.user.id,
          university_id: universityId,
        }));

        console.log("Inserting selections:", payload);

        const { error: insertSelectionsError } = await (supabase
          .from("student_university_selections") as any)
          .insert(payload as any);

        console.log("insertSelectionsError:", insertSelectionsError);

        if (insertSelectionsError) {
          console.error("Error inserting university selections:", insertSelectionsError);
        } else {
          console.log("University selections inserted successfully");
        }
      }

      if (profile?.status === "approved") {
        navigate("/student");
      } else if (profile?.status === "rejected") {
        navigate("/rejected");
      } else {
        navigate("/pending");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      const rawMsg = (error?.message || "").toLowerCase();
      const providerDisabled =
        rawMsg.includes("email logins are disabled") ||
        error?.status === 422 ||
        error?.error_code === "email_provider_disabled";

      const emailNotConfirmed = rawMsg.includes("email not confirmed");

      toast({
        title: providerDisabled
          ? "Email/password sign-in is disabled"
          : emailNotConfirmed
          ? "Please verify your email"
          : "Login failed",
        description: providerDisabled
          ? "Enable the Email provider in Supabase Auth settings, then try again."
          : emailNotConfirmed
          ? "Check your inbox and verify your email before signing in."
          : "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-glow"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Register here
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