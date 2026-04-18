import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ScholarshipApplicationsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-scholarship-applications", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("scholarship_applications")
        .select("*, certificates(*)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,university_name.ilike.%${search}%,course_title.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ appId, note }: { appId: string; note: string }) => {
      const { data: app, error: appError } = await supabase
        .from("scholarship_applications")
        .select("*")
        .eq("id", appId)
        .single();

      if (appError) throw appError;
      if (!app) throw new Error("Application not found");

      const { data: serialData, error: serialError } = await supabase.rpc("generate_serial_code");
      if (serialError || !serialData) throw new Error("Failed to generate serial code");
      const serialCode = serialData as string;

      const { data: signatureData, error: signatureError } = await supabase.rpc(
        "compute_auth_signature",
        { serial: serialCode, app_id: appId }
      );
      if (signatureError || !signatureData) throw new Error("Failed to compute signature");
      const authSignature = signatureData as string;

      const { error: certError } = await supabase
        .from("certificates")
        .insert({
          application_id: appId,
          student_id: app.student_id,
          serial_code: serialCode,
          auth_signature: authSignature,
          storage_path: "",
        });

      if (certError) throw certError;

      const { error: updateError } = await supabase
        .from("scholarship_applications")
        .update({
          status: "approved",
          admin_note: note,
          decided_at: new Date().toISOString(),
        })
        .eq("id", appId);

      if (updateError) throw updateError;

      const { error: emailError } = await supabase.functions.invoke("send-status-email", {
        body: {
          email: app.email,
          firstName: app.full_name?.split(" ")[0] || "",
          lastName: app.full_name?.split(" ").slice(1).join(" ") || "",
          status: "scholarship_approved",
        },
      });

      if (emailError) {
        console.error("Scholarship approval email error:", emailError);
      }
    },
    onSuccess: () => {
      toast.success("Application approved");
      queryClient.invalidateQueries({ queryKey: ["admin-scholarship-applications"] });
      setSelectedApp(null);
      setAdminNote("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to approve application");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ appId, note }: { appId: string; note: string }) => {
      const { data: app, error: appError } = await supabase
        .from("scholarship_applications")
        .select("*")
        .eq("id", appId)
        .single();

      if (appError) throw appError;
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("scholarship_applications")
        .update({
          status: "rejected",
          admin_note: note,
          decided_at: new Date().toISOString(),
        })
        .eq("id", appId);

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-status-email", {
        body: {
          email: app.email,
          firstName: app.full_name?.split(" ")[0] || "",
          lastName: app.full_name?.split(" ").slice(1).join(" ") || "",
          status: "scholarship_rejected",
        },
      });

      if (emailError) {
        console.error("Scholarship rejection email error:", emailError);
      }
    },
    onSuccess: () => {
      toast.success("Application rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-scholarship-applications"] });
      setSelectedApp(null);
      setAdminNote("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to reject application");
    },
  });

  const downloadTranscript = async (transcriptPath: string) => {
    const { data, error } = await supabase.storage
      .from("scholarship-documents")
      .createSignedUrl(transcriptPath, 60);

    if (error) {
      toast.error("Failed to download transcript");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search by student, university, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{app.full_name}</TableCell>
                  <TableCell>{app.university_name}</TableCell>
                  <TableCell>{app.course_title}</TableCell>
                  <TableCell>{app.level_of_study}</TableCell>
                  <TableCell>{app.country}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    {app.status === "approved" && app.certificates?.[0]?.serial_code ? (
                      <span className="font-mono text-xs">{app.certificates[0].serial_code}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setAdminNote(app.admin_note || "");
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Application Details</SheetTitle>
          </SheetHeader>

          {selectedApp && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="font-semibold mb-2">Application Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                  </div>
                  {selectedApp.status === "approved" && selectedApp.certificates?.[0]?.serial_code && (
                    <div>
                      <span className="text-muted-foreground">Serial:</span>
                      <p className="mt-1 font-mono text-xs">{selectedApp.certificates[0].serial_code}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Course Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">University:</span>
                    <p>{selectedApp.university_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Course:</span>
                    <p>{selectedApp.course_title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Level:</span>
                    <p>{selectedApp.level_of_study}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country:</span>
                    <p>{selectedApp.country}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p>{selectedApp.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passport/ID:</span>
                    <p>{selectedApp.passport_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nationality:</span>
                    <p>{selectedApp.nationality}</p>
                  </div>
                  {selectedApp.gender && (
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <p>{selectedApp.gender}</p>
                    </div>
                  )}
                  {selectedApp.date_of_birth && (
                    <div>
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <p>{new Date(selectedApp.date_of_birth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedApp.place_of_birth && (
                    <div>
                      <span className="text-muted-foreground">Place of Birth:</span>
                      <p>{selectedApp.place_of_birth}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p>{selectedApp.phone_number}</p>
                  </div>
                  {selectedApp.contact_country && (
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <p>{selectedApp.contact_country}</p>
                    </div>
                  )}
                  {selectedApp.city && (
                    <div>
                      <span className="text-muted-foreground">City:</span>
                      <p>{selectedApp.city}</p>
                    </div>
                  )}
                  {selectedApp.residence_address && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <p>{selectedApp.residence_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Education</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Level:</span>
                    <p>{selectedApp.education_level}</p>
                  </div>
                  {selectedApp.education_field && (
                    <div>
                      <span className="text-muted-foreground">Field:</span>
                      <p>{selectedApp.education_field}</p>
                    </div>
                  )}
                  {selectedApp.institution_name && (
                    <div>
                      <span className="text-muted-foreground">Institution:</span>
                      <p>{selectedApp.institution_name}</p>
                    </div>
                  )}
                  {selectedApp.final_grade && (
                    <div>
                      <span className="text-muted-foreground">Grade:</span>
                      <p>{selectedApp.final_grade}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedApp.transcript_path && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript(selectedApp.transcript_path)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Transcript
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="adminNote">Admin Note</Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Enter reason for approval/rejection..."
                  className="mt-2"
                />
              </div>

              {selectedApp.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => approveMutation.mutate({ appId: selectedApp.id, note: adminNote })}
                    disabled={approveMutation.isPending || !adminNote}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate({ appId: selectedApp.id, note: adminNote })}
                    disabled={rejectMutation.isPending || !adminNote}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}