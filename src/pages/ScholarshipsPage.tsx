import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import Logo from "@/components/Logo";

const EDUCATION_LEVELS = ['Foundation', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Any'];
const PAGE_SIZE = 12;

export default function ScholarshipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ['scholarships', searchTerm, selectedLevels, page],
    queryFn: async () => {
      let query = supabase
        .from('scholarships')
        .select('*')
        .eq('status', 'active')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // Search filter
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,funded_by.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
      }

      // Education level filter
      if (selectedLevels.length > 0) {
        query = query.overlaps('education_levels', selectedLevels);
      }

      // Sort by deadline (soonest first), then featured
      query = query.order('deadline', { ascending: true, nullsFirst: false })
                   .order('featured', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <Logo />
          </Link>
          <Button variant="outline" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
            All Scholarships
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover scholarship opportunities to fund your education
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scholarships..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>

          {/* Education Level Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">Filter by level:</span>
            {EDUCATION_LEVELS.map(level => (
              <Badge
                key={level}
                variant={selectedLevels.includes(level) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleLevel(level)}
              >
                {level}
              </Badge>
            ))}
            {selectedLevels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLevels([]);
                  setPage(0);
                }}
                className="h-6"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : scholarships && scholarships.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {scholarships.map((scholarship) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!scholarships || scholarships.length < PAGE_SIZE}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              No scholarships found matching your criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedLevels([]);
                setPage(0);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
