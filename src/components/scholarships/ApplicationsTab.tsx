import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationsTab() {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["scholarship-applications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("scholarship_applications")
        .select("*, certificates(*)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const downloadCertificate = async (application: any, retryCount = 0) => {
    let certificate = application.certificates?.[0];

    if (!certificate) {
      const { data: freshCert } = await supabase
        .from("certificates")
        .select("serial_code")
        .eq("application_id", application.id)
        .maybeSingle();
      if (freshCert) {
        certificate = freshCert;
      }
    }

    if (!certificate?.serial_code) {
      if (application.status === "approved") {
        toast.info("Your letter is being prepared. Please try again in a moment.");
      } else {
        toast.error("Your letter is not ready yet.");
      }
      return;
    }

    setDownloadingId(application.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to download");
        return;
      }

      const tryDownload = async () => {
        const response = await fetch(
          `https://zycysolzfzjkvwcjyyqv.supabase.co/functions/v1/generate-certificate?applicationId=${application.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Download error:", errorText);
          throw new Error("Failed to generate PDF");
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error("Empty file");
        
        const url = window.URL.createObjectURL(blob);
        const filename = `NAMA_Recommendation_${certificate.serial_code}.pdf`;
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      };

      try {
        await tryDownload();
        toast.success("Letter downloaded successfully");
      } catch (err) {
        if (retryCount === 0) {
          await downloadCertificate(application, 1);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Couldn't generate the letter. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No applications submitted yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{app.university_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{app.course_title}</p>
                </div>
                <Badge variant={getStatusColor(app.status)}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Level:</span>
                  <span>{app.level_of_study}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Country:</span>
                  <span>{app.country}</span>
                </div>
                {app.status === "approved" && app.certificates?.[0] && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-mono">{app.certificates[0].serial_code}</span>
                  </div>
                )}
                {app.status === "rejected" && app.admin_note && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive">Reason from Admin:</p>
                    <p className="text-sm text-muted-foreground mt-1">{app.admin_note}</p>
                  </div>
                )}
                {app.status === "approved" && app.admin_note && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-md">
                    <p className="text-sm font-medium">Admin Note:</p>
                    <p className="text-sm text-muted-foreground mt-1">{app.admin_note}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(app)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {app.status === "approved" && app.certificates?.[0] && (
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={() => downloadCertificate(app)}
                        disabled={downloadingId === app.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingId === app.id ? "Downloading..." : "Download Letter"}
                      </Button>
                      <p className="text-xs text-muted-foreground">PDF reference letter</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Course Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">University:</span>
                    <p>{selectedApplication.university_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Course:</span>
                    <p>{selectedApplication.course_title}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p>{selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passport/ID:</span>
                    <p>{selectedApplication.passport_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nationality:</span>
                    <p>{selectedApplication.nationality}</p>
                  </div>
                  {selectedApplication.gender && (
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <p>{selectedApplication.gender}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedApplication.status === "approved" && selectedApplication.certificates?.[0] && (
                <div>
                  <h4 className="font-semibold mb-2">Certificate</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Serial Code:</span>
                      <p className="font-mono">{selectedApplication.certificates[0].serial_code}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.status === "rejected" && selectedApplication.admin_note && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">Reason from Admin:</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedApplication.admin_note}</p>
                </div>
              )}

              {selectedApplication.status === "approved" && selectedApplication.admin_note && (
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-sm font-medium">Admin Note:</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedApplication.admin_note}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedApplication.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p>{selectedApplication.phone_number}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Education</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Level:</span>
                    <p>{selectedApplication.education_level}</p>
                  </div>
                  {selectedApplication.institution_name && (
                    <div>
                      <span className="text-muted-foreground">Institution:</span>
                      <p>{selectedApplication.institution_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
