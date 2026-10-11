export type PayoutRequest = {
  id: string;
  ownerType: "USER" | "ORGANIZATION";
  ownerId: string;
  ownerName: string;
  amount: number;
  note: string | null;
  status: "OPEN" | "PROCESSING" | "DECLINED";
  decisionReason: string | null;
  createdAt: string;
  transfer: { id: string; status: string } | null;
};
