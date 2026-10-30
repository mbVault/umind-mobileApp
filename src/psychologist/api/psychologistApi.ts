import { staffRequest } from "./staffClient";

export type StaffMe = {
  id: string;
  email: string | null;
  status: string;
  roles: string[];
  hasPsychologistProfile: boolean;
  hasAdminMembership: boolean;
};

export type PsychologistCheckDto = {
  id: string;
  type: string;
  status: string;
  reason: string | null;
  reviewedAt: string | null;
};

export type PsychologistProfileDto = {
  id: string;
  accountId: string;
  legalFullName: string | null;
  visibilityMode: string;
  displayName: string | null;
  hasPublicPhoto: boolean;
  avatarColor: string | null;
  avatarInitials: string | null;
  rciRegistrationNumber: string | null;
  highestDegree: string | null;
  yearsPractising: number | null;
  idDocumentType: string | null;
  aadhaarLast4: string | null;
  onboardingStep: string;
  applicationSubmittedAt?: string | null;
  hrApprovalStatus: string;
  hrRejectionReason?: string | null;
  /** WAIT | RESUBMIT | UPLOAD_DOC | CLARIFY | CONTACT_SUPPORT | NONE */
  applicantNextAction?: string;
  applicantMessage?: string | null;
  identityOnboardingBlocked?: boolean;
  finalRejectionAt?: string | null;
  publicationStatus: string;
  accountStatus: string;
  publishedAt?: string | null;
  presence?: string;
  acceptingNewClients?: boolean;
  maxSessionsPerDay?: number | null;
  sessionModes?: string[];
  weeklyHours?: unknown;
  specialisations: string[];
  languages: string[];
  checks?: PsychologistCheckDto[];
};

export const fetchStaffMe = () => staffRequest<StaffMe>("/me");

export type StaffAccessKind = "PSYCHOLOGIST" | "APPLICANT" | "IDENTITY_ONLY";

export type StaffAccessDto = {
  access: StaffAccessKind;
  staff: StaffMe | null;
  profile: PsychologistProfileDto | null;
};

export const fetchStaffAccess = () => staffRequest<StaffAccessDto>("/access");

export const startOnboardSession = (body?: { email?: string }) =>
  staffRequest<StaffAccessDto>("/access/onboard/start", { method: "POST", body: body ?? {} });

export const fetchPsychologistMe = () => staffRequest<PsychologistProfileDto>("/psychologist/me");

export const putPsychologistApplication = (body: {
  legalFullName?: string;
  rciRegistrationNumber?: string;
  highestDegree?: string;
  yearsPractising?: number;
  specialisations?: string[];
  languages?: string[];
  idDocumentType?: string;
  aadhaarLast4?: string;
}) => staffRequest<PsychologistProfileDto>("/psychologist/me/application", { method: "PUT", body });

export const patchPsychologistProfile = (body: {
  visibilityMode?: "REAL_NAME_AND_PHOTO" | "DISPLAY_NAME_AND_AVATAR";
  displayName?: string;
  avatarColor?: string;
  avatarInitials?: string;
  publicPhotoObjectKey?: string | null;
}) => staffRequest<PsychologistProfileDto>("/psychologist/me/profile", { method: "PATCH", body });

export const submitPsychologistApplication = () =>
  staffRequest<PsychologistProfileDto>("/psychologist/me/application/submit", { method: "POST" });

/** Pre-HR screening submit (hrApprovalStatus stays PENDING_APPROVAL). */
export const submitForHrReview = () =>
  staffRequest<PsychologistProfileDto>("/psychologist/me/application/submit-hr", { method: "POST" });

/** F4 — applicant response when nextAction is CLARIFY. */
export const submitClarificationResponse = (message: string) =>
  staffRequest<PsychologistProfileDto>("/psychologist/me/application/clarification-response", {
    method: "POST",
    body: { message },
  });

export type PsychologistDocumentKind =
  | "ID_FRONT"
  | "ID_BACK"
  | "LIVE_SELFIE"
  | "PASSPORT_PHOTO"
  | "DEGREE_CERTIFICATE"
  | "RCI_CERTIFICATE"
  | "EXPERIENCE_LETTER";

export type PsychologistDocumentDto = {
  id: string;
  kind: PsychologistDocumentKind | string;
  contentType: string;
  byteSize: number;
  status: string;
  uploadedAt: string | null;
  replacedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type DocumentUploadUrlDto = {
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
};

export const REQUIRED_DOCUMENT_KINDS: PsychologistDocumentKind[] = [
  "ID_FRONT",
  "ID_BACK",
  "LIVE_SELFIE",
  "PASSPORT_PHOTO",
  "DEGREE_CERTIFICATE",
  "RCI_CERTIFICATE",
  "EXPERIENCE_LETTER",
];

export const fetchPsychologistDocuments = () =>
  staffRequest<{ documents: PsychologistDocumentDto[] }>("/psychologist/me/documents");

export const requestDocumentUploadUrl = (body: {
  kind: PsychologistDocumentKind;
  contentType: string;
  byteSize: number;
}) =>
  staffRequest<DocumentUploadUrlDto>("/psychologist/me/documents/upload-url", {
    method: "POST",
    body,
  });

export const confirmDocumentUpload = (body: {
  kind: PsychologistDocumentKind;
  objectKey: string;
  contentType: string;
  byteSize: number;
}) =>
  staffRequest<PsychologistDocumentDto>("/psychologist/me/documents/confirm", {
    method: "POST",
    body,
  });

export const requestDocumentReplacementUploadUrl = (
  documentId: string,
  body: { contentType: string; byteSize: number }
) =>
  staffRequest<DocumentUploadUrlDto>(
    `/psychologist/me/documents/${documentId}/replacement-upload-url`,
    { method: "POST", body }
  );

export const confirmDocumentReplacement = (
  documentId: string,
  body: { objectKey: string; contentType: string; byteSize: number }
) =>
  staffRequest<PsychologistDocumentDto>(
    `/psychologist/me/documents/${documentId}/replacement-confirm`,
    { method: "POST", body }
  );

export type DashboardBooking = {
  bookingId: string;
  sessionId: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  communicationMode: string;
  bookingStatus: string;
  sessionStatus: string | null;
  shareSaathiSummary?: boolean;
  shareMoodHistory?: boolean;
  sessionNumber?: number;
  hasSafetyFlag?: boolean;
  client: {
    clientRef: string;
    alias: string;
    avatarId: string;
  };
};

export type PsychologistDashboard = {
  date: string;
  presence: string;
  acceptingNewClients: boolean;
  displayName: string | null;
  avatarInitials: string | null;
  avatarColor: string | null;
  todaySessionCount: number;
  monthSessionCount: number;
  nextBooking: DashboardBooking | null;
  todayBookings: DashboardBooking[];
  safetyAlerts: {
    bookingId: string;
    scheduledStartAt: string;
    clientAlias: string;
    message: string;
  }[];
  monthEarnings: {
    currency: string;
    psychologistShareMinorUnits: number;
    pendingMinorUnits: number;
    paidMinorUnits: number;
    sessionCount: number;
  };
};

export type BookingBrief = {
  bookingId: string;
  sessionId: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  communicationMode: string;
  bookingStatus: string;
  sessionNumber: number;
  client: {
    clientRef: string;
    alias: string;
    avatarId: string;
    lifeStage?: string;
    gender?: string;
    startingFeelings?: string[];
  };
  shareSaathiSummary: boolean;
  saathiSummary: string | null;
  shareMoodHistory: boolean;
  moodHistory: { date: string; moodName: string }[];
};

export const fetchPsychologistDashboard = (date?: string) => {
  const q = date ? `?date=${encodeURIComponent(date)}` : "";
  return staffRequest<PsychologistDashboard>(`/psychologist/me/dashboard${q}`);
};

export const patchPsychologistPresence = (presence: "ONLINE" | "AWAY") =>
  staffRequest<PsychologistProfileDto>("/psychologist/me/presence", {
    method: "PATCH",
    body: { presence },
  });

export const fetchBookingBrief = (bookingId: string) =>
  staffRequest<BookingBrief>(`/psychologist/me/bookings/${bookingId}/brief`);

export const joinPsychologistSession = (sessionId: string) =>
  staffRequest<{
    recorded: boolean;
    sessionStatus: string;
    media: { status: string; provider: null; joinToken: null; reason?: string };
  }>(`/psychologist/me/sessions/${sessionId}/join`, { method: "POST" });

export type WeeklyHoursDto = Record<string, { start: string; end: string }[]>;

export type StaffAvailabilityItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "OPEN" | "HELD" | "BOOKED";
};

export type StaffAvailabilityResponse = {
  weeklyHours: WeeklyHoursDto | null;
  presence: string;
  acceptingNewClients: boolean;
  maxSessionsPerDay: number | null;
  sessionModes: string[];
  items: StaffAvailabilityItem[];
  deletedOpenCount?: number;
  createdCount?: number;
  protectedSlots?: { id: string; startsAt: string; endsAt: string; status: "HELD" | "BOOKED" }[];
};

export const patchPsychologistHours = (body: {
  acceptingNewClients?: boolean;
  maxSessionsPerDay?: number | null;
  sessionModes?: ("CHAT" | "VOICE" | "VIDEO")[];
  weeklyHours?: WeeklyHoursDto | null;
}) => staffRequest<PsychologistProfileDto>("/psychologist/me/hours", { method: "PATCH", body });

export const fetchStaffAvailability = (fromIso: string, toIso: string) =>
  staffRequest<StaffAvailabilityResponse>(
    `/psychologist/me/availability?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
  );

export const putStaffAvailability = (replaceOpenSlots: { startsAt: string; endsAt: string }[]) =>
  staffRequest<StaffAvailabilityResponse>("/psychologist/me/availability", {
    method: "PUT",
    body: { replaceOpenSlots },
  });

export type PsychologistClientItem = {
  clientRef: string;
  alias: string;
  avatarId: string;
  lifeStage?: string;
  startingFeelings?: string[];
  sessionCount: number;
  lastSessionAt: string | null;
  nextSessionAt: string | null;
  relationship: "ACTIVE" | "PAST";
  trend: "IMPROVING" | "STEADY" | "WATCH" | null;
};

export const fetchPsychologistClients = () =>
  staffRequest<{ items: PsychologistClientItem[] }>("/psychologist/me/clients");

export type EarningsSummary = {
  month: string;
  eligibleSessionCount: number;
  grossMinorUnits: number;
  psychologistShareMinorUnits: number;
  platformShareMinorUnits: number;
  splitPercent: number;
  pendingMinorUnits: number;
  paidMinorUnits: number;
  currency: string;
};

export type EarningsWeekItem = {
  weekStart: string;
  weekEnd: string;
  sessionCount: number;
  psychologistShareMinorUnits: number;
};

export type PayoutListItem = {
  id: string;
  sessionId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  grossAmountMinorUnits: number;
  psychologistShareMinorUnits: number;
  status: string;
  currency: string;
  createdAt: string;
  paidAt: string | null;
};

export const fetchEarningsSummary = (month: string) =>
  staffRequest<EarningsSummary>(
    `/psychologist/me/earnings/summary?month=${encodeURIComponent(month)}`
  );

export const fetchEarningsWeekly = (month: string) =>
  staffRequest<{ month: string; items: EarningsWeekItem[] }>(
    `/psychologist/me/earnings/weekly?month=${encodeURIComponent(month)}`
  );

export const fetchPsychologistPayouts = (page = 1, pageSize = 100) =>
  staffRequest<{
    page: number;
    pageSize: number;
    total: number;
    items: PayoutListItem[];
  }>(`/psychologist/me/payouts?page=${page}&pageSize=${pageSize}`);
