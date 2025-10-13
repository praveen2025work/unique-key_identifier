import axios from 'axios';
import { PreviewResponse, AnalysisRequest, AnalysisResponse, Run } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Preview columns from files
  async previewColumns(
    fileA: string,
    fileB: string,
    workingDirectory?: string
  ): Promise<PreviewResponse> {
    const params = new URLSearchParams({
      file_a: fileA,
      file_b: fileB,
    });
    
    if (workingDirectory) {
      params.append('working_directory', workingDirectory);
    }

    const response = await api.get(`/api/preview-columns?${params.toString()}`);
    return response.data;
  },

  // Submit analysis request
  async submitAnalysis(data: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const response = await api.post('/compare', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get previous runs
  async getRuns(): Promise<Run[]> {
    const response = await api.get('/api/runs');
    return response.data;
  },

  // Clone a run
  async cloneRun(runId: string): Promise<Run> {
    const response = await api.get(`/api/clone/${runId}`);
    return response.data;
  },

  // Get run details
  async getRunDetails(runId: string): Promise<any> {
    const response = await api.get(`/api/run/${runId}`);
    return response.data;
  },
};

export default apiService;