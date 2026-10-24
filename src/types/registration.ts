import type { DomainId } from "./internship";
export interface RegistrationFields {
  fullName: string;
  email: string;
  stream: string;
  college: string;
  reason: string;
  consent: boolean;
  resume: File | null;
}
export interface RegistrationPayload extends Omit<
  RegistrationFields,
  "resume"
> {
  domainId: DomainId;
  resume: File;
}
export interface RegistrationResult {
  applicationReference: string;
  domainId: DomainId;
  domainTitle: string;
  receivedAt: string;
}
export interface RegistrationApi {
  submit(
    payload: RegistrationPayload,
    signal?: AbortSignal,
  ): Promise<RegistrationResult>;
}
export type FieldErrors = Partial<Record<keyof RegistrationFields, string>>;
