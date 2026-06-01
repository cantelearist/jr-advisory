export type UserRole = "client" | "advisor" | "admin";
export type EngagementStatus = "screening" | "active" | "paused" | "closed";
export type DocumentClassification = "endorsement" | "inspection" | "report" | "contract" | "invoice";

export type EngagementRecord = {
  id: string;
  clientId: string;
  status: EngagementStatus;
  jurisdiction: string;
  scope: string;
  primaryAdvisorId: string;
  createdAt: string;
};

export type PortalAccessBoundary = {
  engagementId: string;
  userId: string;
  role: UserRole;
  canViewDocuments: boolean;
  canCreateRequests: boolean;
};

export type AuditEvent = {
  id: string;
  actorId: string;
  action: string;
  resourceType: "engagement" | "document" | "invoice" | "message" | "request" | "ai";
  resourceId: string;
  ipHash: string;
  userAgentHash: string;
  createdAt: string;
};
