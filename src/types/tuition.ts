export interface Tutee {
  id: string;
  name: string;
  pin: string; // 4-digit PIN
  colorScheme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  icon: string; // Lucide icon name
  description?: string;
}

export interface QuizRecord {
  date: string;
  timestamp?: string;
  score: number;
  total: number;
  percentage: number;
  student?: string;
  timeSpent?: number;
  quizType: 'spelling' | 'chemistry';
}

export interface AvailableDate {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format (24-hour)
  endTime: string; // HH:mm format (24-hour)
  isAvailable: boolean;
  bookedBy?: string; // tutee id if booked
  tuteeId?: string; // tutee id this slot is for
  notes?: string;
  eventType?: 'time_slot' | 'exam' | 'test'; // Type of event
}

export interface BookingRequest {
  id: string;
  tuteeId: string;
  requestedDate: string; // ISO date string
  requestedStartTime: string; // HH:mm format
  requestedEndTime: string; // HH:mm format
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminNotes?: string;
  tuteeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TuitionSession {
  id: string;
  tuteeId: string;
  sessionDate: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  durationHours: number;
  amount: number;
  earningsRecordId?: string;
  availableDateId?: string; // Links to available_dates table
  createdAt: string;
  updatedAt: string;
}

export interface EarningsSettings {
  id: string;
  tuteeId: string;
  messageTemplate: string;
  feePerHour: number;
  feePerSession?: number;
  calculationType: 'hourly' | 'per_session';
  createdAt: string;
  updatedAt: string;
}

export interface EarningsRecord {
  id: string;
  tuteeId: string;
  year: number;
  month: number;
  totalSessions: number;
  totalHours: number;
  totalAmount: number;
  generatedMessage?: string;
  createdAt: string;
  updatedAt: string;
  sessions?: TuitionSession[];
}

