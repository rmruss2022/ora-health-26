// Temporary mock authentication for development
// In production, this will use real auth flow

import { API_CONFIG } from '../../config/api';

export const mockAuth = {
  // For now, we'll create a test user on first use
  async getOrCreateTestUser() {
    const testEmail = 'test@shadow-ai.com';
    const testPassword = 'test1234';
    const baseURL = API_CONFIG.api.baseURL;

    try {
      // Try to sign in first
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mock auth: Successfully signed in');
        return data.accessToken || data.token || null;
      }

      // If sign in fails, try to sign up
      const signupResponse = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Matthew',
        }),
      });

      if (signupResponse.ok) {
        const data = await signupResponse.json();
        console.log('Mock auth: Successfully signed up');
        return data.accessToken || data.token || null;
      }

      // If both fail, just return null (we disabled auth middleware)
      console.warn('Mock auth: Could not authenticate, proceeding without token');
      return null;
    } catch (error) {
      console.error('Mock auth error:', error);
      // Don't throw - just return null to allow unauthenticated access
      return null;
    }
  },
};
