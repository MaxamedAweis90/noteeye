import { apiClient } from './client';
import type { UserSession } from '../types';

export interface SessionsResponse {
  sessions: UserSession[];
  total: number;
}

export const sessionsApi = {
  /**
   * Fetch all active login sessions for the authenticated user
   */
  getSessions: async (): Promise<UserSession[]> => {
    const res = await apiClient.get<SessionsResponse>('/sessions');
    return res.data.sessions || [];
  },

  /**
   * Revoke a specific session (logs out device)
   */
  deleteSession: async (id: string): Promise<{ message: string; revokedId: string; isCurrentRevoked?: boolean }> => {
    const res = await apiClient.delete<{ message: string; revokedId: string; isCurrentRevoked?: boolean }>(
      `/sessions/${id}`
    );
    return res.data;
  },

  /**
   * Revoke all other active sessions except the current one
   */
  revokeOtherSessions: async (): Promise<{ message: string; revokedCount: number }> => {
    const res = await apiClient.post<{ message: string; revokedCount: number }>('/sessions/revoke-others');
    return res.data;
  },
};

export default sessionsApi;
