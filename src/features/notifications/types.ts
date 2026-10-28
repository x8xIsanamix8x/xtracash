export type NotificationItem = Readonly<{
  id: string;
  subject: string;
  message: string;
  occurredAt: string;
  isRead: boolean;
  amountBs: string | null;
  type: string | null;
  operationId: string | null;
}>;

export type NotificationsPage = Readonly<{
  items: readonly NotificationItem[];
  page: number;
  size: number;
  total: number;
}>;

export type NotificationsQuery = Readonly<{
  page: number;
  size: number;
}>;
