import type { ApplicationStatus, DomainId } from "../../shared/domains";
export interface ApplicationRecord {
  id: string;
  application_reference: string;
  full_name: string;
  email: string;
  study_stream: string;
  college_university: string;
  domain_id: DomainId;
  joining_reason: string;
  resume_original_filename: string;
  resume_identifier: string;
  resume_mime_type: string;
  resume_size: number;
  consent_accepted_at: string;
  created_at: string;
  status: ApplicationStatus;
}
export interface ApplicationPage {
  applications: ApplicationRecord[];
  total: number;
  page: number;
  pageSize: number;
}
export interface DashboardData {
  total: number;
  domains: { id: DomainId; title: string; count: number }[];
  recent: ApplicationRecord[];
}
export interface AdminSession {
  authenticated: boolean;
  csrfToken: string;
}
