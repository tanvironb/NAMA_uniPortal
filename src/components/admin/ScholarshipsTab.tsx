import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ScholarshipForm from "@/components/scholarships/ScholarshipForm";

export default function ScholarshipsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<any>(null);

  // Fetch scholarships
  const { data: scholarships, isLoading } = useQuery({
    queryKey: ['admin-scholarships', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1);
      if (error) throw error;
      return data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from('scholarships').insert({
        title: values.title,
        short_description: values.short_description,
        funded_by: values.funded_by,
        education_levels: values.education_levels,
        amount: values.amount,
        award_frequency: values.award_frequency,
        deadline: values.deadline ? values.deadline.toISOString().split('T')[0] : null,
        deadline_rolling: values.deadline_rolling,
        apply_url: values.apply_url,
        country_eligibility: values.country_eligibility || [],
        tags: values.tags || [],
        featured: values.featured,
        status: values.status
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Scholarship created successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error creating scholarship", description: error.message, variant: "destructive" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase.from('scholarships').update({
        title: values.title,
        short_description: values.short_description,
        funded_by: values.funded_by,
        education_levels: values.education_levels,
        amount: values.amount,
        award_frequency: values.award_frequency,
        deadline: values.deadline ? values.deadline.toISOString().split('T')[0] : null,
        deadline_rolling: values.deadline_rolling,
        apply_url: values.apply_url,
        country_eligibility: values.country_eligibility || [],
        tags: values.tags || [],
        featured: values.featured,
        status: values.status
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Scholarship updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] });
      setIsFormOpen(false);
      setEditingScholarship(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating scholarship", description: error.message, variant: "destructive" });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
      const { error } = await supabase
        .from('scholarships')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] });
      toast({ title: "Status updated" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scholarships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] });
      toast({ title: "Scholarship deleted" });
    }
  });

  const handleSubmit = async (values: any) => {
    if (editingScholarship) {
      await updateMutation.mutateAsync({ id: editingScholarship.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleEdit = (scholarship: any) => {
    setEditingScholarship({
      ...scholarship,
      deadline: scholarship.deadline ? new Date(scholarship.deadline) : null
    });
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scholarships</CardTitle>
            <CardDescription>Manage scholarship opportunities</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingScholarship(null);
          }}>
            <DialogTrigger asChild>
              <Button>Add Scholarship</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingScholarship ? 'Edit Scholarship' : 'Add Scholarship'}</DialogTitle>
              </DialogHeader>
              <ScholarshipForm
                defaultValues={editingScholarship}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingScholarship(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : scholarships && scholarships.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Funded By</TableHead>
                  <TableHead>Education Levels</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scholarships.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell className="font-medium">
                      {scholarship.title}
                      {scholarship.featured && (
                        <Badge className="ml-2" variant="secondary">Featured</Badge>
                      )}
                    </TableCell>
                    <TableCell>{scholarship.funded_by}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {scholarship.education_levels.slice(0, 2).map((level: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{level}</Badge>
                        ))}
                        {scholarship.education_levels.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{scholarship.education_levels.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{scholarship.amount}</TableCell>
                    <TableCell>
                      {scholarship.deadline_rolling ? 'Rolling' : 
                        scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={scholarship.status === 'active' ? 'default' : 'secondary'}>
                        {scholarship.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(scholarship)}>
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleStatusMutation.mutate({ 
                            id: scholarship.id, 
                            currentStatus: scholarship.status 
                          })}
                        >
                          {scholarship.status === 'active' ? 'Hide' : 'Unhide'}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive">Delete</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{scholarship.title}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {}}>Cancel</Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => deleteMutation.mutate(scholarship.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!scholarships || scholarships.length < 20}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No scholarships yet</p>
            <Button onClick={() => setIsFormOpen(true)}>Add Scholarship</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
