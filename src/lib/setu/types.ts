export type RoleId =
  | "employee"
  | "hr_officer"
  | "dept_officer"
  | "security_officer"
  | "admin";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Classification = "Public" | "Internal" | "Restricted" | "Confidential";

export interface DemoUser {
  employeeId: string;
  username: string;
  password: string;
  name: string;
  department: string;
  role: RoleId;
  roleLabel: string;
  clearance: 1 | 2 | 3 | 4 | 5;
  deviceTrust: "Trusted" | "Managed" | "Unverified";
}

export interface Passport {
  user: DemoUser;
  sessionRisk: RiskLevel;
  allowed: string[];
  restricted: string[];
  categories: string[];
  maxClassification: Classification;
  issuedAt: string;
}

export interface PolicyVersion {
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: "Current" | "Superseded" | "Draft";
  summary: string;
  content: string;
}

export interface PolicyDoc {
  id: string;
  title: string;
  department: string;
  category: string;
  classification: Classification;
  accessRoles: RoleId[];
  minClearance: number;
  circular: string;
  section: string;
  lastUpdated: string;
  expiryDate: string | null;
  source: string;
  keywords: string[];
  conflict?: { old: string; current: string; note: string };
  versions: PolicyVersion[];
}

export interface Finding {
  type: string;
  label: string;
  severity: RiskLevel;
  count: number;
}

export interface GatewayTrace {
  step: string;
  status: "pass" | "warn" | "block" | "info";
  detail: string;
}

export interface Citation {
  docId: string;
  title: string;
  circular: string;
  section: string;
  version: string;
  lastUpdated: string;
  classification: Classification;
  excerpt: string;
}

export interface GatewayResult {
  id: string;
  outcome: "answered" | "blocked" | "denied" | "no_source";
  answer: string;
  sanitizedQuery: string;
  redactions: Finding[];
  credentials: Finding[];
  injection: boolean;
  risk: { score: number; level: RiskLevel; reasons: string[] };
  citations: Citation[];
  confidence: number;
  humanApprovalRequired: boolean;
  outputFiltered: boolean;
  conflict?: { old: string; current: string; note: string } | null;
  trace: GatewayTrace[];
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  result?: GatewayResult;
  pending?: boolean;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  department: string;
  action: string;
  riskLevel: RiskLevel;
  result: "ALLOWED" | "BLOCKED" | "REDACTED" | "DENIED" | "ESCALATED";
  reason: string;
}

export interface ReviewTicket {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  question: string;
  riskLevel: RiskLevel;
  aiAnswer: string;
  sources: string[];
  createdAt: string;
  status: "Pending" | "Assigned" | "Under Review" | "Resolved" | "Rejected";
  officerNote?: string;
}
