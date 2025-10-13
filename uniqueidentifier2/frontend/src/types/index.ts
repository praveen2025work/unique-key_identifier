// API Types
export interface FileInfo {
  rowsA: number;
  rowsB: number;
  columns: string[];
  fileASize?: string;
  fileBSize?: string;
  warnings?: string[];
  estimatedTime?: string;
}

export interface PreviewResponse {
  columns: string[];
  column_count: number;
  file_a_rows: number;
  file_b_rows: number;
  file_a_size_mb?: number;
  file_b_size_mb?: number;
  warnings?: string[];
  estimated_time?: string;
  error?: string;
}

export interface AnalysisRequest {
  file_a: string;
  file_b: string;
  num_columns: number;
  max_rows: number;
  expected_combinations: string;
  excluded_combinations: string;
  working_directory: string;
  data_quality_check: boolean;
}

export interface AnalysisResponse {
  run_id?: string;
  error?: string;
}

export interface Run {
  id: string;
  label: string;
  file_a: string;
  file_b: string;
  num_columns: number;
  max_rows: number;
  working_directory?: string;
  data_quality_check: boolean;
  expected_combinations?: string;
  excluded_combinations?: string;
}

// UI Types
export interface Toast {
  show: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface ProgressStep {
  name: string;
  status: 'pending' | 'active' | 'completed';
}

// Form Types
export interface FormData {
  fileA: string;
  fileB: string;
  workingDirectory: string;
  numColumns: number;
  maxRows: number;
  dataQualityCheck: boolean;
}

// Column Builder Types
export type BuilderMode = 'include' | 'exclude';

export interface ColumnBuilderState {
  activeBuilder: BuilderMode;
  includeBuilder: string[];
  excludeBuilder: string[];
  includedCombinations: string[];
  excludedCombinations: string[];
}