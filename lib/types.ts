export interface Task {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  hours: number;
  deadline: string | null;
  requester: string | null;
  status: 'todo' | 'in_progress' | 'done';
  raw_input: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  hours: number;
  deadline: string | null;
  requester: string | null;
}

export interface Recommendation {
  taskId: number;
  title: string;
  reasoning: string;
  urgencyScore: number;
}
