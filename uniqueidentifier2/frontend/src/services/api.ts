import type { 
  Environment, 
  AnalysisRun, 
  JobStatus, 
  RunDetails, 
  PreviewResponse,
  CompareRequest,
  ComparisonSummary,
  ComparisonDataResponse,
  DataQualityReport
} from '../types';
import { getApiEndpoint } from '../hooks/useApiEndpoint';

class ApiService {
  private getBaseUrl(): string {
    // Always get fresh endpoint from localStorage
    return getApiEndpoint();
  }

  setBaseUrl(url: string) {
    // Update localStorage, which will be picked up by getBaseUrl()
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiEndpoint', url);
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('apiEndpointChanged'));
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.getBaseUrl()}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  async previewColumns(
    fileA: string,
    fileB: string,
    workingDirectory?: string,
    environment?: string
  ): Promise<PreviewResponse> {
    const params = new URLSearchParams({
      file_a: fileA,
      file_b: fileB,
    });
    if (workingDirectory) params.append('working_directory', workingDirectory);
    if (environment) params.append('environment', environment);

    const response = await fetch(`${this.getBaseUrl()}/api/preview-columns?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Preview failed');
    }
    return response.json();
  }

  async startComparison(request: CompareRequest): Promise<{ run_id: number; status: string }> {
    const formData = new FormData();
    formData.append('file_a', request.file_a);
    formData.append('file_b', request.file_b);
    formData.append('num_columns', request.num_columns.toString());
    
    if (request.max_rows) formData.append('max_rows', request.max_rows.toString());
    if (request.expected_combinations) formData.append('expected_combinations', request.expected_combinations);
    if (request.excluded_combinations) formData.append('excluded_combinations', request.excluded_combinations);
    if (request.working_directory) formData.append('working_directory', request.working_directory);
    if (request.data_quality_check) formData.append('data_quality_check', 'true');
    if (request.environment) formData.append('environment', request.environment);

    const response = await fetch(`${this.getBaseUrl()}/compare`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Comparison failed');
    }
    return response.json();
  }

  async getJobStatus(runId: number): Promise<JobStatus> {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/status/${runId}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Failed to fetch job status');
      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Status check timed out');
      }
      throw error;
    }
  }

  async getRuns(environment?: string, limit: number = 50): Promise<AnalysisRun[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (environment) params.append('environment', environment);

    const response = await fetch(`${this.getBaseUrl()}/api/runs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch runs');
    return response.json();
  }

  async getRunDetails(runId: number, queryParams?: string): Promise<RunDetails> {
    const baseUrl = this.getBaseUrl();
    const url = queryParams 
      ? `${baseUrl}/api/run/${runId}?${queryParams}`
      : `${baseUrl}/api/run/${runId}`;
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Failed to fetch run details');
      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - backend may be processing large data');
      }
      throw error;
    }
  }

  async getRunDetailsWithPagination(
    runId: number,
    page: number = 1,
    pageSize: number = 100,
    side?: 'A' | 'B'
  ): Promise<RunDetails> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (side) params.append('side', side);
    
    return this.getRunDetails(runId, params.toString());
  }

  async cloneRun(runId: number): Promise<CompareRequest> {
    const response = await fetch(`${this.getBaseUrl()}/api/clone/${runId}`);
    if (!response.ok) throw new Error('Failed to clone run');
    return response.json();
  }

  async downloadCSV(runId: number): Promise<void> {
    window.open(`${this.getBaseUrl()}/api/download/${runId}/csv`, '_blank');
  }

  async downloadExcel(runId: number): Promise<void> {
    window.open(`${this.getBaseUrl()}/api/download/${runId}/excel`, '_blank');
  }

  async getEnvironments(): Promise<Environment[]> {
    const response = await fetch(`${this.getBaseUrl()}/api/environments`);
    if (!response.ok) throw new Error('Failed to fetch environments');
    return response.json();
  }

  async createEnvironment(
    name: string,
    type: string,
    host: string,
    port: number,
    basePath: string,
    description: string
  ): Promise<{ status: string; env_id: number }> {
    const formData = new FormData();
    formData.append('env_name', name);
    formData.append('env_type', type);
    formData.append('host', host);
    formData.append('port', port.toString());
    formData.append('base_path', basePath);
    formData.append('description', description);

    const response = await fetch(`${this.getBaseUrl()}/api/environments`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create environment');
    }
    return response.json();
  }

  async getComparisonSummary(runId: number, columns: string): Promise<ComparisonSummary> {
    const response = await fetch(
      `${this.getBaseUrl()}/api/comparison-v2/${runId}/summary?columns=${encodeURIComponent(columns)}`
    );
    if (!response.ok) throw new Error('Failed to fetch comparison summary');
    const data = await response.json();
    // Return the summary object if wrapped, or the data itself
    return data.summary || data;
  }

  async getComparisonData(
    runId: number,
    columns: string,
    category: 'matched' | 'only_a' | 'only_b',
    offset: number = 0,
    limit: number = 100
  ): Promise<ComparisonDataResponse> {
    const response = await fetch(
      `${this.getBaseUrl()}/api/comparison-v2/${runId}/data?columns=${encodeURIComponent(columns)}&category=${category}&offset=${offset}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch comparison data');
    return response.json();
  }

  async getDataQualityResults(runId: number): Promise<DataQualityReport> {
    const response = await fetch(`${this.getBaseUrl()}/api/data-quality/${runId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No quality check data available');
      }
      throw new Error('Failed to fetch data quality results');
    }
    return response.json();
  }

  async cancelJob(runId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.getBaseUrl()}/api/run/${runId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel job');
    }
    return response.json();
  }

  async uploadFile(file: File): Promise<{ success: boolean; filename: string; file_path: string; file_size: number; file_size_mb: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.getBaseUrl()}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload file');
    }
    return response.json();
  }

  async listUploadedFiles(): Promise<{ files: Array<{ filename: string; file_size: number; file_size_mb: number; modified_time: string; file_path: string }>; count: number }> {
    const response = await fetch(`${this.getBaseUrl()}/api/uploaded-files`);
    if (!response.ok) throw new Error('Failed to list uploaded files');
    return response.json();
  }

  async deleteUploadedFile(filename: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.getBaseUrl()}/api/uploaded-files/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete file');
    }
    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
