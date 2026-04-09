import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationResult {
  valid: boolean;
  studentName?: string;
  universityName?: string;
  courseTitle?: string;
  fieldOfStudy?: string;
  issueDate?: string;
}

export default function LetterVerification() {
  const [serialCode, setSerialCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const normalizeSerialCode = (code: string): string => {
    // Remove spaces and hyphens, uppercase
    let normalized = code.trim().replace(/[\s-]/g, "").toUpperCase();
    
    // If it doesn't start with UNI, add it
    if (!normalized.startsWith("UNI")) {
      normalized = "UNI-" + normalized;
    } else if (!normalized.includes("-")) {
      // If it starts with UNI but no hyphen, add hyphen after UNI
      normalized = "UNI-" + normalized.substring(3);
    }
    
    return normalized;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialCode.trim()) {
      toast.error("Please enter a serial code");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const normalized = normalizeSerialCode(serialCode);
      
      const { data, error } = await supabase.functions.invoke("verify-letter", {
        body: { serial_code: normalized },
      });

      if (error) throw error;

      setResult(data);
      
      if (data.valid) {
        toast.success("Letter verified successfully");
      } else {
        toast.error("Invalid serial code");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
      setResult({ valid: false });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputBlur = () => {
    if (serialCode.trim()) {
      setSerialCode(normalizeSerialCode(serialCode));
    }
  };

  return (
    <section id="verify" className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Reference Letter Verification</h2>
          <p className="text-lg text-muted-foreground">
            Enter the serial code printed on the applicant's official letter to confirm authenticity.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            type="text"
            placeholder="UNI-XXXXXXXXXX"
            value={serialCode}
            onChange={(e) => setSerialCode(e.target.value)}
            onBlur={handleInputBlur}
            className="flex-1 text-lg"
            disabled={isVerifying}
            aria-label="Serial code"
          />
          <Button 
            type="submit" 
            size="lg" 
            disabled={isVerifying}
            className="bg-gradient-primary hover:shadow-glow"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        <div aria-live="polite" aria-atomic="true">
          {result && (
            <Card className={result.valid ? "border-green-500" : "border-destructive"}>
              <CardContent className="pt-6">
                {result.valid ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-8 w-8" />
                      <p className="text-lg font-semibold">
                        This reference letter is authentic and issued by NAMA Uni-Scholarship.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Student Name</p>
                        <p className="font-medium">{result.studentName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">University Name</p>
                        <p className="font-medium">{result.universityName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Course Title</p>
                        <p className="font-medium">{result.courseTitle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Field of Study</p>
                        <p className="font-medium">{result.fieldOfStudy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                        <p className="font-medium">{result.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="font-medium text-green-600 dark:text-green-400">Verified</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-destructive">
                    <XCircle className="h-8 w-8" />
                    <p className="text-lg font-semibold">
                      Invalid serial code. Please verify the code or contact NAMA support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
