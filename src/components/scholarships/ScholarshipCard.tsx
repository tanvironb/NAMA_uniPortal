import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, DollarSign, GraduationCap, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScholarshipCardProps {
  scholarship: {
    id: string;
    title: string;
    short_description: string;
    funded_by: string;
    education_levels: string[];
    amount: string;
    award_frequency: string;
    deadline: string | null;
    deadline_rolling: boolean;
    apply_url: string;
    tags?: string[];
    featured: boolean;
  };
}

export default function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const { toast } = useToast();

  const handleApplyClick = () => {
    // Open URL in new tab
    window.open(scholarship.apply_url, '_blank', 'noopener,noreferrer');
  };

  const formatDeadline = () => {
    if (scholarship.deadline_rolling) return "Rolling";
    if (!scholarship.deadline) return "Not specified";
    return new Date(scholarship.deadline).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary">
      <CardHeader>
        {scholarship.featured && (
          <Badge className="w-fit mb-2 bg-accent-gold text-white">Featured</Badge>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Funded by {scholarship.funded_by}</p>
            <CardTitle className="text-xl leading-tight">{scholarship.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="line-clamp-3 mt-2">
          {scholarship.short_description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Meta Row */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="truncate">{scholarship.education_levels.join(", ")}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="font-medium">{scholarship.amount}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Repeat className="h-4 w-4 text-accent-gold" />
            <span>{scholarship.award_frequency}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-warning" />
            <span>{formatDeadline()}</span>
          </div>
        </div>

        {/* Tags */}
        {scholarship.tags && scholarship.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scholarship.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Apply Button */}
        <Button 
          onClick={handleApplyClick}
          className="w-full mt-auto bg-gradient-primary hover:shadow-glow"
        >
          Apply Now
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
