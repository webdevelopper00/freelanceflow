// Shared types for FreelanceFlow client and server

export type Currency = 'MAD' | 'USD' | 'EUR' | 'GBP';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'PAYPAL' | 'STRIPE' | 'OTHER';

export type ExpenseCategory = 'SOFTWARE' | 'EQUIPMENT' | 'TRANSPORT' | 'MARKETING' | 'OFFICE' | 'TAX' | 'OTHER';

export type PlanType = 'TRIAL' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  currency: Currency;
  plan?: PlanType;
  trialStartDate?: string;
  trialEndDate?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  trialUsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatusResponse {
  plan: PlanType;
  status: SubscriptionStatus;
  trialDaysRemaining: number | null;
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
  trialUsed?: boolean;
  limits: {
    clientsUsed: number;
    clientsLimit: number;
    invoicesUsed: number;
    invoicesLimit: number;
  };
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  currency: Currency;
  status: ClientStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListItem extends Client {
  invoiceCount: number;
  totalPaid: number;
}

export interface ClientDetail extends Client {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    total: number;
    issueDate: string;
    dueDate: string;
    currency: Currency;
  }>;
  totalPaid: number;
  totalInvoiced: number;
  pendingAmount: number;
  lastInvoiceDate: string | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceListItem extends Omit<Invoice, 'items'> {
  client: { id: string; name: string; email: string };
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  client: Client;
}

export interface Payment {
  id: string;
  userId: string;
  clientId: string;
  invoiceId?: string | null;
  amount: number;
  currency: Currency;
  date: string;
  method: PaymentMethod;
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string | null;
  receipt?: string | null;
  createdAt: string;
}
