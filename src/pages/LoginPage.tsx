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

      if (data.user) {
        // Check admin status first via RPC
        const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
        
        if (!adminError && isAdminResult) {
          navigate('/admin');
          return;
        }

        // For non-admins, check student status
        const { data: profile, error: profileError } = await supabase
          .from('students')
          .select('status')
          .eq('user_id', data.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // No profile row yet - needs to register
          navigate('/register');
          return;
        }

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/register');
          return;
        }

        // Redirect based on student status
        if (profile?.status === 'approved') {
          navigate('/student');
        } else if (profile?.status === 'rejected') {
          navigate('/rejected');
        } else {
          navigate('/pending');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);

      const rawMsg = (error?.message || '').toLowerCase();
      const providerDisabled = rawMsg.includes('email logins are disabled') || error?.status === 422 || error?.error_code === 'email_provider_disabled';

      toast({
        title: providerDisabled ? 'Email/password sign-in is disabled' : 'Login failed',
        description: providerDisabled
          ? 'Enable the Email provider in Supabase Auth settings, run the admin seed, then try again.'
          : 'Invalid email or password.',
        variant: 'destructive',
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
              <CardDescription>
                Sign in to your account
              </CardDescription>
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