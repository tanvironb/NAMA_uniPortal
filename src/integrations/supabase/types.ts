export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string | null
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          application_id: string
          auth_signature: string
          created_at: string | null
          id: string
          serial_code: string
          storage_path: string
          student_id: string
        }
        Insert: {
          application_id: string
          auth_signature: string
          created_at?: string | null
          id?: string
          serial_code: string
          storage_path: string
          student_id: string
        }
        Update: {
          application_id?: string
          auth_signature?: string
          created_at?: string | null
          id?: string
          serial_code?: string
          storage_path?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      country_field_overrides: {
        Row: {
          country: string
          created_at: string | null
          field_of_study: string
          level_of_study: string
        }
        Insert: {
          country: string
          created_at?: string | null
          field_of_study: string
          level_of_study: string
        }
        Update: {
          country?: string
          created_at?: string | null
          field_of_study?: string
          level_of_study?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_title: string
          created_at: string | null
          duration: string | null
          field_of_study: string
          id: string
          level_of_study: string
          scholarship: string | null
          university_id: string
        }
        Insert: {
          course_title: string
          created_at?: string | null
          duration?: string | null
          field_of_study: string
          id?: string
          level_of_study: string
          scholarship?: string | null
          university_id: string
        }
        Update: {
          course_title?: string
          created_at?: string | null
          duration?: string | null
          field_of_study?: string
          id?: string
          level_of_study?: string
          scholarship?: string | null
          university_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_preference: string | null
          created_at: string | null
          email: string
          field_of_study: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          nationality: string
          preferred_level_of_study: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
        }
        Insert: {
          country_preference?: string | null
          created_at?: string | null
          email: string
          field_of_study?: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          nationality: string
          preferred_level_of_study?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
        }
        Update: {
          country_preference?: string | null
          created_at?: string | null
          email?: string
          field_of_study?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          nationality?: string
          preferred_level_of_study?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
        }
        Relationships: []
      }
      scholarship_applications: {
        Row: {
          admin_note: string | null
          city: string | null
          contact_country: string | null
          country: string
          course_duration: string | null
          course_title: string
          created_at: string | null
          date_of_birth: string | null
          decided_at: string | null
          education_field: string | null
          education_level: string
          email: string
          final_grade: string | null
          full_name: string
          gender: string | null
          id: string
          institution_country: string | null
          institution_name: string | null
          level_of_study: string
          nationality: string
          passport_id: string
          phone_number: string
          place_of_birth: string | null
          residence_address: string | null
          status: string
          student_id: string
          transcript_path: string | null
          university_name: string
          updated_at: string | null
          year_entered: number | null
          year_graduated: number | null
        }
        Insert: {
          admin_note?: string | null
          city?: string | null
          contact_country?: string | null
          country: string
          course_duration?: string | null
          course_title: string
          created_at?: string | null
          date_of_birth?: string | null
          decided_at?: string | null
          education_field?: string | null
          education_level: string
          email: string
          final_grade?: string | null
          full_name: string
          gender?: string | null
          id?: string
          institution_country?: string | null
          institution_name?: string | null
          level_of_study: string
          nationality: string
          passport_id: string
          phone_number: string
          place_of_birth?: string | null
          residence_address?: string | null
          status?: string
          student_id: string
          transcript_path?: string | null
          university_name: string
          updated_at?: string | null
          year_entered?: number | null
          year_graduated?: number | null
        }
        Update: {
          admin_note?: string | null
          city?: string | null
          contact_country?: string | null
          country?: string
          course_duration?: string | null
          course_title?: string
          created_at?: string | null
          date_of_birth?: string | null
          decided_at?: string | null
          education_field?: string | null
          education_level?: string
          email?: string
          final_grade?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          institution_country?: string | null
          institution_name?: string | null
          level_of_study?: string
          nationality?: string
          passport_id?: string
          phone_number?: string
          place_of_birth?: string | null
          residence_address?: string | null
          status?: string
          student_id?: string
          transcript_path?: string | null
          university_name?: string
          updated_at?: string | null
          year_entered?: number | null
          year_graduated?: number | null
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: string
          apply_click_count: number | null
          apply_url: string
          award_frequency: Database["public"]["Enums"]["award_frequency"]
          country_eligibility: string[] | null
          created_at: string | null
          deadline: string | null
          deadline_rolling: boolean | null
          education_levels: Database["public"]["Enums"]["education_level"][]
          featured: boolean | null
          funded_by: string
          id: string
          short_description: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount: string
          apply_click_count?: number | null
          apply_url: string
          award_frequency?: Database["public"]["Enums"]["award_frequency"]
          country_eligibility?: string[] | null
          created_at?: string | null
          deadline?: string | null
          deadline_rolling?: boolean | null
          education_levels: Database["public"]["Enums"]["education_level"][]
          featured?: boolean | null
          funded_by: string
          id?: string
          short_description: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: string
          apply_click_count?: number | null
          apply_url?: string
          award_frequency?: Database["public"]["Enums"]["award_frequency"]
          country_eligibility?: string[] | null
          created_at?: string | null
          deadline?: string | null
          deadline_rolling?: boolean | null
          education_levels?: Database["public"]["Enums"]["education_level"][]
          featured?: boolean | null
          funded_by?: string
          id?: string
          short_description?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_selected_universities: {
        Row: {
          created_at: string | null
          student_id: string
          university_id: string
        }
        Insert: {
          created_at?: string | null
          student_id: string
          university_id: string
        }
        Update: {
          created_at?: string | null
          student_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_selected_universities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_university_selections: {
        Row: {
          created_at: string | null
          id: string
          student_id: string
          university_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          student_id: string
          university_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          student_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_university_selections_university"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_university"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          email: string
          field_of_study: string
          first_name: string
          full_name: string | null
          gender: string
          last_name: string
          level_of_study: string
          nationality: string
          preferred_country: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          field_of_study: string
          first_name: string
          full_name?: string | null
          gender: string
          last_name: string
          level_of_study: string
          nationality: string
          preferred_country: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          field_of_study?: string
          first_name?: string
          full_name?: string | null
          gender?: string
          last_name?: string
          level_of_study?: string
          nationality?: string
          preferred_country?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          application_fee: string | null
          application_link: string | null
          awarding_body: string | null
          balance_tuition_fees_students_to_pay: string | null
          country: string | null
          course_title: string | null
          duration: string | null
          entry_requirement: string | null
          field_of_study: string | null
          id: string
          international_student_registration_and_admin_fees: string | null
          level_of_study: string | null
          ranking: string | null
          refundable_deposit: string | null
          resource_fees_and_others: string | null
          scholarship: string | null
          scholarship_percentage: number | null
          total_tuition_fee_before_scholarship: string | null
          university: string | null
          yearly_fee: string | null
        }
        Insert: {
          application_fee?: string | null
          application_link?: string | null
          awarding_body?: string | null
          balance_tuition_fees_students_to_pay?: string | null
          country?: string | null
          course_title?: string | null
          duration?: string | null
          entry_requirement?: string | null
          field_of_study?: string | null
          id?: string
          international_student_registration_and_admin_fees?: string | null
          level_of_study?: string | null
          ranking?: string | null
          refundable_deposit?: string | null
          resource_fees_and_others?: string | null
          scholarship?: string | null
          scholarship_percentage?: number | null
          total_tuition_fee_before_scholarship?: string | null
          university?: string | null
          yearly_fee?: string | null
        }
        Update: {
          application_fee?: string | null
          application_link?: string | null
          awarding_body?: string | null
          balance_tuition_fees_students_to_pay?: string | null
          country?: string | null
          course_title?: string | null
          duration?: string | null
          entry_requirement?: string | null
          field_of_study?: string | null
          id?: string
          international_student_registration_and_admin_fees?: string | null
          level_of_study?: string | null
          ranking?: string | null
          refundable_deposit?: string | null
          resource_fees_and_others?: string | null
          scholarship?: string | null
          scholarship_percentage?: number | null
          total_tuition_fee_before_scholarship?: string | null
          university?: string | null
          yearly_fee?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      api_get_countries_by_level: {
        Args: { level_in: string }
        Returns: {
          country: string
        }[]
      }
      api_get_fields: {
        Args: { country_in: string; level_in: string }
        Returns: {
          field: string
        }[]
      }
      api_get_fields_by_level_country: {
        Args: { country_in: string; level_in: string }
        Returns: {
          field_of_study: string
        }[]
      }
      api_list_universities: {
        Args: {
          country_in: string
          field_in: string
          level_in: string
          limit_in: number
          offset_in: number
          search_in: string
        }
        Returns: {
          id: string
          name: string
        }[]
      }
      compute_auth_signature: {
        Args: { app_id: string; serial: string }
        Returns: string
      }
      create_profile_with_selections: {
        Args: {
          p_country_preference: string
          p_email: string
          p_field_of_study: string
          p_first_name: string
          p_gender: string
          p_last_name: string
          p_level_of_study: string
          p_nationality: string
          p_university_ids: string[]
        }
        Returns: Json
      }
      generate_serial_code: { Args: never; Returns: string }
      grant_dev_admin: { Args: { dev_email: string }; Returns: boolean }
      is_admin: { Args: { uid?: string }; Returns: boolean }
      is_admin_email: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected"
      award_frequency: "One-time" | "Monthly" | "Yearly" | "Other"
      education_level:
        | "Foundation"
        | "Diploma"
        | "Bachelor"
        | "Master"
        | "PhD"
        | "Any"
      user_role: "admin" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["pending", "approved", "rejected"],
      award_frequency: ["One-time", "Monthly", "Yearly", "Other"],
      education_level: [
        "Foundation",
        "Diploma",
        "Bachelor",
        "Master",
        "PhD",
        "Any",
      ],
      user_role: ["admin", "student"],
    },
  },
} as const
