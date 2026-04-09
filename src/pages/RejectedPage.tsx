import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { XCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function RejectedPage() {
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    navigate('/login', { replace: true });
    setLoggingOut(false);
  };

  return (
    <div className="wizard-container">
      <div className="max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="wizard-card shadow-glow">
            <CardHeader className="text-center">
              <Logo size={48} />
              <div className="flex justify-center mt-4 mb-2">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Application Not Approved</CardTitle>
              <CardDescription>
                Unfortunately, your application was not approved
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  We appreciate your interest in our program. Unfortunately, we were unable to approve your application at this time.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                  disabled={loggingOut}
                >
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </Button>
                
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Need help? </span>
                  <Link to="#" className="text-primary hover:underline font-medium">
                    Contact Support
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}