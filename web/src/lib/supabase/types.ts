// Hand-written to match supabase/migrations/*.sql. Once a real Supabase
// project is linked, replace this file with the generated version:
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
// Keep the shape (Row/Insert/Update/Relationships per table) so generated
// output is a drop-in replacement with no call-site changes.
//
// Relationships is deliberately left empty everywhere: postgrest-js's
// GenericTable requires the key to exist (its absence makes the whole
// table type fail its structural constraint and collapse to `never`), but
// this codebase avoids embedded-resource selects (`table(col1,col2)`) in
// favor of plain queries + manual joins in application code (see
// src/lib/dashboard/session.ts, overview.ts), so no relationship metadata
// is actually needed for anything to work correctly.

type AuditColumns = {
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: AuditColumns & {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          level: number;
          is_system: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
        Relationships: [];
      };
      permissions: {
        Row: AuditColumns & {
          id: string;
          key: string;
          name: string;
          description: string | null;
          category: string;
        };
        Insert: Partial<Database["public"]["Tables"]["permissions"]["Row"]> & { key: string; name: string };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Row"]>;
        Relationships: [];
      };
      role_permissions: {
        Row: AuditColumns & { id: string; role_id: string; permission_id: string };
        Insert: Partial<Database["public"]["Tables"]["role_permissions"]["Row"]> & {
          role_id: string;
          permission_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_permissions"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: AuditColumns & {
          id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          country: string | null;
          state: string | null;
          city: string | null;
          avatar_url: string | null;
          language: string;
          timezone: string;
          currency: string;
          status: "active" | "invited" | "suspended" | "deactivated";
          last_login_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: AuditColumns & { id: string; user_id: string; role_id: string; is_primary: boolean };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> & { user_id: string; role_id: string };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: AuditColumns & {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & { action: string };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditColumns & {
          id: string;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          changed_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: AuditColumns & {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: "info" | "success" | "warning" | "error";
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { user_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      files: {
        Row: AuditColumns & {
          id: string;
          bucket: string;
          object_key: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          public_url: string | null;
          is_public: boolean;
          owner_type: string | null;
          owner_id: string | null;
          uploaded_by: string | null;
          folder_path: string | null;
          extension: string | null;
          checksum: string | null;
          thumbnail_key: string | null;
          status: "active" | "processing" | "failed" | "archived";
          metadata: Record<string, unknown>;
          version: number;
          previous_version_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["files"]["Row"]> & {
          bucket: string;
          object_key: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Row"]>;
        Relationships: [];
      };
      properties: {
        Row: AuditColumns & {
          id: string;
          name: string;
          slug: string;
          type_id: string | null;
          status_id: string | null;
          category_id: string | null;
          country: string;
          state: string | null;
          city: string | null;
          address: string | null;
          district: string | null;
          area: string | null;
          street: string | null;
          landmark: string | null;
          pin_code: string | null;
          latitude: number | null;
          longitude: number | null;
          google_maps_url: string | null;
          what3words: string | null;
          timezone: string;
          currency: string;
          owner_id: string | null;
          primary_investor_id: string | null;
          managed_by: string | null;
          internal_code: string | null;
          short_name: string | null;
          description: string | null;
          short_description: string | null;
          highlights: string[] | null;
          usp: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          toilets: number | null;
          living_rooms: number | null;
          dining_rooms: number | null;
          has_kitchen: boolean;
          has_study_room: boolean;
          has_balcony: boolean;
          has_terrace: boolean;
          has_garden: boolean;
          has_swimming_pool: boolean;
          has_parking: boolean;
          has_garage: boolean;
          floor_number: string | null;
          building_name: string | null;
          has_lift: boolean;
          property_area_sqft: number | null;
          built_up_area_sqft: number | null;
          plot_area_sqft: number | null;
          max_guests: number | null;
          min_guests: number;
          year_built: number | null;
          last_renovated_year: number | null;
          check_in_time: string | null;
          check_out_time: string | null;
          security_deposit_amount: number | null;
          security_deposit_currency: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
        Relationships: [];
      };
      property_types: {
        Row: AuditColumns & {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          is_system: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["property_types"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["property_types"]["Row"]>;
        Relationships: [];
      };
      property_status: {
        Row: AuditColumns & {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          is_system: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["property_status"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["property_status"]["Row"]>;
        Relationships: [];
      };
      property_categories: {
        Row: AuditColumns & {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["property_categories"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["property_categories"]["Row"]>;
        Relationships: [];
      };
      amenity_master: {
        Row: AuditColumns & { id: string; slug: string; name: string; category: string; icon: string | null; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["amenity_master"]["Row"]> & { slug: string; name: string; category: string };
        Update: Partial<Database["public"]["Tables"]["amenity_master"]["Row"]>;
        Relationships: [];
      };
      property_amenities: {
        Row: AuditColumns & { id: string; property_id: string; amenity_id: string; notes: string | null };
        Insert: Partial<Database["public"]["Tables"]["property_amenities"]["Row"]> & { property_id: string; amenity_id: string };
        Update: Partial<Database["public"]["Tables"]["property_amenities"]["Row"]>;
        Relationships: [];
      };
      property_photos: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          file_id: string;
          room_id: string | null;
          caption: string | null;
          tags: string[];
          sort_order: number;
          is_cover: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["property_photos"]["Row"]> & { property_id: string; file_id: string };
        Update: Partial<Database["public"]["Tables"]["property_photos"]["Row"]>;
        Relationships: [];
      };
      property_rules: {
        Row: AuditColumns & { id: string; property_id: string; rule_key: string; rule_text: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["property_rules"]["Row"]> & {
          property_id: string;
          rule_key: string;
          rule_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_rules"]["Row"]>;
        Relationships: [];
      };
      property_pricing: {
        Row: {
          property_id: string;
          base_price: number;
          weekend_price: number | null;
          monthly_price: number | null;
          weekly_discount_percent: number;
          monthly_discount_percent: number;
          extra_guest_fee: number;
          extra_guest_after: number | null;
          cleaning_fee: number;
          management_fee_percent: number;
          currency: string;
          weekday_price: number | null;
          min_nightly_price: number | null;
          max_nightly_price: number | null;
          standard_occupancy: number | null;
          child_fee: number;
          infant_fee: number;
          pet_fee: number;
          visitor_fee: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["property_pricing"]["Row"]> & { property_id: string; base_price: number };
        Update: Partial<Database["public"]["Tables"]["property_pricing"]["Row"]>;
        Relationships: [];
      };
      property_settings: {
        Row: {
          property_id: string;
          min_stay_nights: number;
          max_stay_nights: number | null;
          advance_notice_hours: number;
          preparation_time_hours: number;
          check_in_method: string;
          has_smart_lock: boolean;
          instant_book: boolean;
          currency_override: string | null;
          requires_government_id: boolean;
          requires_good_reviews: boolean;
          requires_host_approval: boolean;
          same_day_booking_allowed: boolean;
          same_day_cutoff_time: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["property_settings"]["Row"]> & { property_id: string };
        Update: Partial<Database["public"]["Tables"]["property_settings"]["Row"]>;
        Relationships: [];
      };
      property_discounts: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          discount_type: string;
          value_percent: number;
          coupon_code: string | null;
          conditions: Record<string, unknown>;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["property_discounts"]["Row"]> & {
          property_id: string;
          discount_type: string;
          value_percent: number;
        };
        Update: Partial<Database["public"]["Tables"]["property_discounts"]["Row"]>;
        Relationships: [];
      };
      property_fees: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          fee_type: string;
          amount: number;
          is_percentage: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["property_fees"]["Row"]> & {
          property_id: string;
          fee_type: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["property_fees"]["Row"]>;
        Relationships: [];
      };
      property_taxes: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          tax_name: string;
          tax_type: string;
          rate_percent: number;
          is_inclusive: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["property_taxes"]["Row"]> & {
          property_id: string;
          tax_name: string;
          tax_type: string;
          rate_percent: number;
        };
        Update: Partial<Database["public"]["Tables"]["property_taxes"]["Row"]>;
        Relationships: [];
      };
      property_rooms: {
        Row: AuditColumns & { id: string; property_id: string; room_type_id: string; name: string };
        Insert: Partial<Database["public"]["Tables"]["property_rooms"]["Row"]> & {
          property_id: string;
          room_type_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_rooms"]["Row"]>;
        Relationships: [];
      };

      property_videos: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          file_id: string;
          video_type: string;
          caption: string | null;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["property_videos"]["Row"]> & {
          property_id: string;
          file_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_videos"]["Row"]>;
        Relationships: [];
      };
      property_documents: {
        Row: AuditColumns & {
          id: string;
          property_id: string;
          file_id: string;
          document_type: string;
          expiry_date: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["property_documents"]["Row"]> & {
          property_id: string;
          file_id: string;
          document_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_documents"]["Row"]>;
        Relationships: [];
      };
      room_types: {
        Row: AuditColumns & { id: string; slug: string; name: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["room_types"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["room_types"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      user_permissions: {
        Row: { user_id: string; permission_key: string };
        Relationships: [];
      };
    };
    Functions: {
      authorize: { Args: { permission_key: string }; Returns: boolean };
      create_property_photo: {
        Args: { p_property_id: string; p_file_id: string; p_sort_order: number };
        Returns: string;
      };
      has_role: { Args: { role_slug: string }; Returns: boolean };
    };
  };
};
