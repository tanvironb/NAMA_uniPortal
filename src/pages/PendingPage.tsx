import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Mail, Phone } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PendingPage() {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    // ignore error here, always route to login
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
                <Clock className="h-16 w-16 text-warning" />
              </div>
              <CardTitle className="text-2xl font-bold">Application Submitted</CardTitle>
              <CardDescription>
                Your application is awaiting admin approval
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Application successfully submitted</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Clock className="h-5 w-5 text-warning flex-shrink-0" />
                  <span>Currently under review by our admin team</span>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You will receive an email notification once your application has been reviewed. 
                  This process typically takes 1-2 business days.
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
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href="mailto:info@namafoundation.org" 
                    className="text-sm text-primary hover:underline"
                  >
                    info@namafoundation.org
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Phone / WhatsApp</p>
                  <a 
                    href="tel:+60321816646" 
                    className="text-sm text-primary hover:underline"
                  >
                    +60 3 2181 6646 / 48
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mon–Fri, 9:00–17:00 (GMT+8)
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowContactModal(false)} 
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}