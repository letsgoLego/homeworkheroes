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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          child_id: string
          created_at: string | null
          emoji: string | null
          end_time: string | null
          id: string
          specific_date: string | null
          start_time: string | null
          title: string
          weekdays: number[] | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          emoji?: string | null
          end_time?: string | null
          id?: string
          specific_date?: string | null
          start_time?: string | null
          title: string
          weekdays?: number[] | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          emoji?: string | null
          end_time?: string | null
          id?: string
          specific_date?: string | null
          start_time?: string | null
          title?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      adhoc_tasks: {
        Row: {
          child_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          task_date: string
          title: string
        }
        Insert: {
          child_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_date: string
          title: string
        }
        Update: {
          child_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "adhoc_tasks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          avatar_url: string | null
          color: string
          created_at: string
          family_id: string
          has_account: boolean | null
          id: string
          last_seen_at: string | null
          name: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          family_id: string
          has_account?: boolean | null
          id?: string
          last_seen_at?: string | null
          name: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          family_id?: string
          has_account?: boolean | null
          id?: string
          last_seen_at?: string | null
          name?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          name: string
          subscription_checked_at: string | null
          subscription_end: string | null
          subscription_interval: string | null
          subscription_override: string | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          name: string
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_interval?: string | null
          subscription_override?: string | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          name?: string
          subscription_checked_at?: string | null
          subscription_end?: string | null
          subscription_interval?: string | null
          subscription_override?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      homework: {
        Row: {
          bring_to_school: string[] | null
          child_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          homework_type: string
          id: string
          is_recurring: boolean
          needs_more_practice: boolean | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          reminder_date: string | null
          reminder_sent: boolean
          subject: string
          submission_day: number | null
          title: string
          updated_at: string
        }
        Insert: {
          bring_to_school?: string[] | null
          child_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          homework_type?: string
          id?: string
          is_recurring?: boolean
          needs_more_practice?: boolean | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          reminder_date?: string | null
          reminder_sent?: boolean
          subject?: string
          submission_day?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          bring_to_school?: string[] | null
          child_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          homework_type?: string
          id?: string
          is_recurring?: boolean
          needs_more_practice?: boolean | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          reminder_date?: string | null
          reminder_sent?: boolean
          subject?: string
          submission_day?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          created_at: string
          delivered: boolean
          family_id: string
          from_user_id: string
          id: string
          message: string
          to_child_id: string
          tone: string
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          family_id: string
          from_user_id: string
          id?: string
          message: string
          to_child_id: string
          tone?: string
        }
        Update: {
          created_at?: string
          delivered?: boolean
          family_id?: string
          from_user_id?: string
          id?: string
          message?: string
          to_child_id?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudges_to_child_id_fkey"
            columns: ["to_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          last_homework_notify: string | null
          last_reminder_notify: string | null
          last_unfinished_notify: string | null
          notify_new_homework: boolean
          notify_reminder: boolean
          notify_unfinished: boolean
          p256dh: string
          timezone: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          last_homework_notify?: string | null
          last_reminder_notify?: string | null
          last_unfinished_notify?: string | null
          notify_new_homework?: boolean
          notify_reminder?: boolean
          notify_unfinished?: boolean
          p256dh: string
          timezone?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_homework_notify?: string | null
          last_reminder_notify?: string | null
          last_unfinished_notify?: string | null
          notify_new_homework?: boolean
          notify_reminder?: boolean
          notify_unfinished?: boolean
          p256dh?: string
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_pack_items: {
        Row: {
          child_id: string
          created_at: string
          id: string
          item_name: string
          weekdays: number[]
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          item_name: string
          weekdays?: number[]
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          item_name?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_pack_items_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          homework_id: string
          id: string
          snoozed_until: string | null
          task_date: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          homework_id: string
          id?: string
          snoozed_until?: string | null
          task_date: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          homework_id?: string
          id?: string
          snoozed_until?: string | null
          task_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          blocked: boolean
          child_id: string | null
          created_at: string
          family_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          blocked?: boolean
          child_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          blocked?: boolean
          child_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_family_with_role: {
        Args: { _family_name: string }
        Returns: string
      }
      get_family_members: {
        Args: { _family_id: string }
        Returns: {
          blocked: boolean
          child_id: string
          child_name: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_family: {
        Args: {
          _family_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_family_with_invite_code: { Args: { _code: string }; Returns: string }
      lookup_family_by_invite_code: {
        Args: { code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      nudges_remaining_today: { Args: { _child_id: string }; Returns: number }
      update_child_last_seen: {
        Args: { _child_id: string }
        Returns: undefined
      }
      user_belongs_to_family: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "parent" | "child"
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
      app_role: ["parent", "child"],
    },
  },
} as const
