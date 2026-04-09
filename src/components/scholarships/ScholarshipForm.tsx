import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

const EDUCATION_LEVELS = ['Foundation', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Any'];
const AWARD_FREQUENCIES = ['One-time', 'Monthly', 'Yearly', 'Other'];

const scholarshipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  short_description: z.string().min(1, "Description is required").max(280, "Max 280 characters"),
  funded_by: z.string().min(1, "Funded by is required"),
  education_levels: z.array(z.string()).min(1, "Select at least one education level"),
  amount: z.string().min(1, "Amount is required"),
  award_frequency: z.enum(['One-time', 'Monthly', 'Yearly', 'Other']),
  deadline: z.date().optional().nullable(),
  deadline_rolling: z.boolean(),
  apply_url: z.string().url("Must be a valid URL").startsWith("https://", "URL must start with https://"),
  country_eligibility: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean(),
  status: z.enum(['active', 'hidden'])
});

type ScholarshipFormValues = z.infer<typeof scholarshipSchema>;

interface ScholarshipFormProps {
  defaultValues?: Partial<ScholarshipFormValues>;
  onSubmit: (values: ScholarshipFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function ScholarshipForm({ defaultValues, onSubmit, onCancel }: ScholarshipFormProps) {
  const [newCountry, setNewCountry] = useState("");
  const [newTag, setNewTag] = useState("");

  const form = useForm<ScholarshipFormValues>({
    resolver: zodResolver(scholarshipSchema),
    defaultValues: {
      title: "",
      short_description: "",
      funded_by: "",
      education_levels: [],
      amount: "",
      award_frequency: "One-time",
      deadline: null,
      deadline_rolling: false,
      apply_url: "",
      country_eligibility: [],
      tags: [],
      featured: false,
      status: "active",
      ...defaultValues
    }
  });

  const handleSubmit = async (values: ScholarshipFormValues) => {
    await onSubmit(values);
  };

  const addCountry = () => {
    if (newCountry.trim()) {
      const current = form.getValues("country_eligibility") || [];
      form.setValue("country_eligibility", [...current, newCountry.trim()]);
      setNewCountry("");
    }
  };

  const removeCountry = (country: string) => {
    const current = form.getValues("country_eligibility") || [];
    form.setValue("country_eligibility", current.filter(c => c !== country));
  };

  const addTag = () => {
    if (newTag.trim()) {
      const current = form.getValues("tags") || [];
      form.setValue("tags", [...current, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    const current = form.getValues("tags") || [];
    form.setValue("tags", current.filter(t => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Merit Scholarship 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Funded By */}
          <FormField
            control={form.control}
            name="funded_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funded By *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., University Foundation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Short Description */}
        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description * (Max 280 chars)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the scholarship..." 
                  className="resize-none" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/280 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Education Levels */}
        <FormField
          control={form.control}
          name="education_levels"
          render={() => (
            <FormItem>
              <FormLabel>Education Levels *</FormLabel>
              <div className="flex flex-wrap gap-3">
                {EDUCATION_LEVELS.map((level) => (
                  <FormField
                    key={level}
                    control={form.control}
                    name="education_levels"
                    render={({ field }) => (
                      <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(level)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, level])
                                : field.onChange(field.value?.filter((value) => value !== level));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">{level}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., $2,000 or Full or 50%" {...field} />
                </FormControl>
                <FormDescription>Support text like $2,000, RM 8,000, Full, 50%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Award Frequency */}
          <FormField
            control={form.control}
            name="award_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Award Frequency *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AWARD_FREQUENCIES.map(freq => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Deadline</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={form.watch("deadline_rolling")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline_rolling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Rolling Deadline</FormLabel>
                  <FormDescription>No fixed deadline</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Apply URL */}
        <FormField
          control={form.control}
          name="apply_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apply URL *</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/apply" {...field} />
              </FormControl>
              <FormDescription>Must start with https://</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Country Eligibility */}
        <FormField
          control={form.control}
          name="country_eligibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country/Region Eligibility (Optional)</FormLabel>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Add country..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCountry())}
                />
                <Button type="button" variant="secondary" onClick={addCountry}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {field.value?.map((country, idx) => (
                  <Badge key={idx} variant="secondary">
                    {country}
                    <X
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onClick={() => removeCountry(country)}
                    />
                  </Badge>
                ))}
              </div>
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., STEM, Need-based..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {field.value?.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                    <X
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured */}
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Featured</FormLabel>
                  <FormDescription>Show at top of lists</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Scholarship</Button>
        </div>
      </form>
    </Form>
  );
}
