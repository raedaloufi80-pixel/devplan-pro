export interface Project {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  created_at: string;
  updated_at: string;
  topic_count?: number;
  task_count?: number;
  completed_count?: number;
}

export interface Topic {
  id: string;
  project_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  files?: ProjectFile[];
}

export interface Task {
  id: string;
  project_id: string;
  topic_id?: string;
  title: string;
  topic: string;
  day: number;
  duration_minutes: number;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  topic_id: string;
  project_id: string;
  filename: string;
  original_name: string;
  size: number;
  created_at: string;
}

export interface ProjectDetail extends Project {
  topics: Topic[];
  tasks: Task[];
}
