import { apiClient } from './client';

export interface SubmitFeedbackPayload {
  templateType: 'bug' | 'feature' | 'sync' | 'general' | 'custom';
  subject: string;
  message: string;
  userEmail?: string;
  systemMeta?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    screenResolution?: string;
    appVersion?: string;
  };
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
}

export const feedbackApi = {
  /**
   * Submit user feedback, bug report, or feature request
   */
  submitFeedback: async (payload: SubmitFeedbackPayload): Promise<FeedbackResponse> => {
    const res = await apiClient.post<FeedbackResponse>('/feedback', payload);
    return res.data;
  },
};

export default feedbackApi;
