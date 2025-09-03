import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';

/**
 * 토큰 관리 서비스
 */
export const authService = {
  /**
   * refresh token을 사용하여 새로운 access token 발급
   * @returns {Promise<string>} 새로운 access token
   */
  async refreshAccessToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      console.log('🔄 Refreshing access token...');
      
      const response = await axios.post(`${API_BASE_URL}/member/refresh-at`, {
        refreshToken: refreshToken
      });

      if (response.data.status_code === 200 && response.data.result) {
        const newAccessToken = response.data.result.accessToken;
        
        // 새로운 access token을 localStorage에 저장
        localStorage.setItem('accessToken', newAccessToken);
        
        console.log('✅ Access token refreshed successfully');
        return newAccessToken;
      } else {
        throw new Error(response.data.status_message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // refresh token도 만료되었거나 유효하지 않은 경우
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🚪 Refresh token expired, redirecting to login');
        this.logout();
      }
      
      throw error;
    }
  },

  /**
   * 로그아웃 처리
   */
  logout() {
    // 토큰 모니터링 중지
    if (window.tokenManager) {
      window.tokenManager.stopMonitoring();
    }
    
    localStorage.clear();
    window.location.href = '/';
  },

  /**
   * 현재 access token이 유효한지 확인
   * @returns {boolean} 토큰 유효성
   */
  isTokenValid() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      // JWT 토큰의 만료 시간 확인
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },

  /**
   * 토큰이 곧 만료될 예정인지 확인 (5분 이내)
   * @returns {boolean} 토큰이 곧 만료될 예정인지
   */
  isTokenExpiringSoon() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60; // 5분
      
      return (payload.exp - currentTime) < fiveMinutes;
    } catch (error) {
      console.error('Token expiration check error:', error);
      return false;
    }
  }
};

export default authService;
