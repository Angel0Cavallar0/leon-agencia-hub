export interface Client {
  id: string;
  name: string;
  email?: string;
  status?: "active" | "inactive" | "pending";
  createdAt?: string;
}

export interface SocialMetrics {
  followers: number;
  engagements: number;
  impressions?: number;
  period?: string;
}

export interface ContentApproval {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  requestedAt?: string;
  approvedBy?: string | null;
  notes?: string;
}
