import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import countries from "@/data/countries.json";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  passportId: z.string().min(1, "Passport/National ID is required"),
  nationality: z.string().min(1, "Nationality is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  contactCountry: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  residenceAddress: z.string().min(1, "Residence address is required"),
  
  educationLevel: z.string().min(1, "Education level is required"),
  educationField: z.string().min(1, "Field/Major is required"),
  institutionName: z.string().min(1, "Institution name is required"),
  institutionCountry: z.string().min(1, "Institution country is required"),
  yearEntered: z.string().min(4, "Year entered is required"),
  yearGraduated: z.string().min(4, "Year graduated is required"),
  finalGrade: z.string().min(1, "Final grade is required"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ScholarshipApplicationFormProps {
  universityName: string;
  courseTitle: string;
  levelOfStudy: string;
  country: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScholarshipApplicationForm({
  universityName,
  courseTitle,
  levelOfStudy,
  country,
  onClose,
  onSuccess,
}: ScholarshipApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 1MB");
      setTranscriptFile(null);
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError("Only PDF, JPG, and PNG files are allowed");
      setTranscriptFile(null);
      return;
    }

    setTranscriptFile(file);
  };

  const removeFile = () => {
    setTranscriptFile(null);
    setFileError("");
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!transcriptFile) {
      toast.error("Please upload a transcript");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit an application");
        return;
      }

      let transcriptPath = null;

      // Upload transcript if provided
      if (transcriptFile) {
        const fileExt = transcriptFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `transcripts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("scholarship-documents")
          .upload(filePath, transcriptFile);

        if (uploadError) {
          toast.error("Failed to upload transcript");
          console.error(uploadError);
          return;
        }

        transcriptPath = filePath;
      }

      // Create application
      const { error: insertError } = await supabase
        .from("scholarship_applications")
        .insert({
          student_id: user.id,
          university_name: universityName,
          course_title: courseTitle,
          level_of_study: levelOfStudy,
          country: country,
          full_name: `${data.firstName} ${data.lastName}`,
          passport_id: data.passportId,
          nationality: data.nationality,
          gender: data.gender,
          date_of_birth: data.dateOfBirth,
          place_of_birth: data.placeOfBirth,
          email: data.email,
          phone_number: data.phoneNumber,
          contact_country: data.contactCountry,
          city: data.city,
          residence_address: data.residenceAddress,
          education_level: data.educationLevel,
          education_field: data.educationField,
          institution_name: data.institutionName,
          institution_country: data.institutionCountry,
          year_entered: parseInt(data.yearEntered),
          year_graduated: parseInt(data.yearGraduated),
          final_grade: data.finalGrade,
          transcript_path: transcriptPath,
          status: "pending",
        });

      if (insertError) {
        toast.error("Failed to submit application");
        console.error(insertError);
        return;
      }

      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting the application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Read-only course info */}
        <div className="space-y-2">
          <h3 className="font-semibold">Application Details</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{universityName}</Badge>
            <Badge variant="secondary">{courseTitle}</Badge>
            <Badge variant="secondary">{levelOfStudy}</Badge>
            <Badge variant="secondary">{country}</Badge>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>}
            </div>

            <div>
              <Label htmlFor="passportId">Passport/National ID *</Label>
              <Input id="passportId" {...register("passportId")} />
              {errors.passportId && <p className="text-sm text-destructive mt-1">{errors.passportId.message}</p>}
            </div>

            <div>
              <Label htmlFor="nationality">Nationality *</Label>
              <Select onValueChange={(value) => setValue("nationality", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-sm text-destructive mt-1">{errors.nationality.message}</p>}
            </div>

            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select onValueChange={(value) => setValue("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label htmlFor="placeOfBirth">Place of Birth *</Label>
              <Input id="placeOfBirth" {...register("placeOfBirth")} />
              {errors.placeOfBirth && <p className="text-sm text-destructive mt-1">{errors.placeOfBirth.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b pb-2">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input id="phoneNumber" type="tel" {...register("phoneNumber")} placeholder="+60123456789" />
              {errors.phoneNumber && <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>}
            </div>

            <div>
              <Label htmlFor="contactCountry">Country *</Label>
              <Select onValueChange={(value) => setValue("contactCountry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contactCountry && <p className="text-sm text-destructive mt-1">{errors.contactCountry.message}</p>}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="residenceAddress">Residence Address *</Label>
              <Textarea id="residenceAddress" {...register("residenceAddress")} />
              {errors.residenceAddress && <p className="text-sm text-destructive mt-1">{errors.residenceAddress.message}</p>}
            </div>
          </div>
        </div>

        {/* Highest Education */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b pb-2">Highest Education</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="educationLevel">Study Level *</Label>
              <Select onValueChange={(value) => setValue("educationLevel", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior High School">Senior High School</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="Professional Certificate">Professional Certificate</SelectItem>
                </SelectContent>
              </Select>
              {errors.educationLevel && <p className="text-sm text-destructive mt-1">{errors.educationLevel.message}</p>}
            </div>

            <div>
              <Label htmlFor="educationField">Field/Major *</Label>
              <Input id="educationField" {...register("educationField")} />
              {errors.educationField && <p className="text-sm text-destructive mt-1">{errors.educationField.message}</p>}
            </div>

            <div>
              <Label htmlFor="institutionName">Institution Name *</Label>
              <Input id="institutionName" {...register("institutionName")} />
              {errors.institutionName && <p className="text-sm text-destructive mt-1">{errors.institutionName.message}</p>}
            </div>

            <div>
              <Label htmlFor="institutionCountry">Institution Country *</Label>
              <Select onValueChange={(value) => setValue("institutionCountry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institutionCountry && <p className="text-sm text-destructive mt-1">{errors.institutionCountry.message}</p>}
            </div>

            <div>
              <Label htmlFor="yearEntered">Year Entered (YYYY) *</Label>
              <Input id="yearEntered" type="number" {...register("yearEntered")} placeholder="2020" />
              {errors.yearEntered && <p className="text-sm text-destructive mt-1">{errors.yearEntered.message}</p>}
            </div>

            <div>
              <Label htmlFor="yearGraduated">Year Graduated (YYYY) *</Label>
              <Input id="yearGraduated" type="number" {...register("yearGraduated")} placeholder="2024" />
              {errors.yearGraduated && <p className="text-sm text-destructive mt-1">{errors.yearGraduated.message}</p>}
            </div>

            <div>
              <Label htmlFor="finalGrade">Final Grade/CGPA *</Label>
              <Input id="finalGrade" {...register("finalGrade")} placeholder="3.5" />
              {errors.finalGrade && <p className="text-sm text-destructive mt-1">{errors.finalGrade.message}</p>}
            </div>

            <div>
              <Label htmlFor="transcript">Transcript Upload * (PDF/JPG/PNG, max 1MB)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="transcript"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="transcript">
                  <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    {transcriptFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{transcriptFile.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          PDF, JPG, PNG (max 1MB)
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              {fileError && <p className="text-sm text-destructive mt-1">{fileError}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
