export interface Environment {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  description: string;
}

export interface AnalysisRun {
  id: number;
  label: string;
  timestamp: string;
  file_a: string;
  file_b: string;
  num_columns: number;
  status: 'queued' | 'running' | 'completed' | 'error';
  environment: string;
}

export interface JobStage {
  name: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobStatus {
  run_id: number;
  status: 'queued' | 'running' | 'completed' | 'error';
  current_stage: string;
  progress: number;
  error: string | null;
  file_a: string;
  file_b: string;
  num_columns: number;
  environment: string;
  stages: JobStage[];
}

export interface AnalysisResult {
  columns: string;
  total_rows: number;
  unique_rows: number;
  duplicate_rows: number;
  duplicate_count: number;
  uniqueness_score: number;
  is_unique_key: boolean;
}

export interface RunDetails {
  run_id: number;
  timestamp: string;
  file_a: string;
  file_b: string;
  num_columns: number;
  file_a_rows: number;
  file_b_rows: number;
  status: string;
  environment: string;
  results_a: AnalysisResult[];
  results_b: AnalysisResult[];
  summary: {
    total_combinations: number;
    unique_keys_a: number;
    unique_keys_b: number;
    best_score_a: number;
    best_score_b: number;
  };
}

export interface PreviewResponse {
  columns: string[];
  column_count: number;
  file_a_rows: number;
  file_b_rows: number;
  file_a_size_mb: number;
  file_b_size_mb: number;
  files_compatible: boolean;
  warnings: string[];
  performance_level: string;
  estimated_time: string;
}

export interface CompareRequest {
  file_a: string;
  file_b: string;
  num_columns: number;
  max_rows?: number;
  expected_combinations?: string;
  excluded_combinations?: string;
  working_directory?: string;
  data_quality_check?: boolean;
  environment?: string;
}

export interface ComparisonSummary {
  matched_count: number;
  only_a_count: number;
  only_b_count: number;
  total_a: number;
  total_b: number;
  match_rate: number;
  columns: string;
  file_a: string;
  file_b: string;
  file_a_rows: number;
  file_b_rows: number;
}

export interface ComparisonDataResponse {
  records: Record<string, any>[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface DataQualityReport {
  summary: {
    status: string;
    status_message: string;
    total_issues: number;
    high_severity_count: number;
    medium_severity_count: number;
    file1_issues: number;
    file2_issues: number;
    cross_file_issues: number;
  };
  file1_report: {
    file_name: string;
    total_rows: number;
    total_columns: number;
    columns: Record<string, ColumnQuality>;
    overall_issues: Issue[];
  };
  file2_report: {
    file_name: string;
    total_rows: number;
    total_columns: number;
    columns: Record<string, ColumnQuality>;
    overall_issues: Issue[];
  };
  discrepancies: Discrepancy[];
}

export interface ColumnQuality {
  pattern_type: string;
  consistency: number;
  total_values: number;
  non_null_values: number;
  null_count: number;
  null_percentage: number;
  pattern_distribution: Record<string, number>;
  sample_values: any[];
  issues: string[];
}

export interface Issue {
  column: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Discrepancy {
  type: string;
  column?: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}
