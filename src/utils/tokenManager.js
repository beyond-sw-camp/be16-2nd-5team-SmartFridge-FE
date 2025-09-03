import authService from '@/services/authService.js';

/**
 * 토큰 관리 유틸리티
 * 주기적으로 토큰 상태를 확인하고 필요시 갱신
 */
class TokenManager {
  constructor() {
    this.checkInterval = null;
    this.checkIntervalMs = 5 * 60 * 1000; // 5분마다 체크
  }

  /**
   * 토큰 모니터링 시작
   */
  startMonitoring() {
    // 이미 모니터링 중이면 중복 시작하지 않음
    if (this.checkInterval) {
      return;
    }

    console.log('🔍 Starting token monitoring...');
    
    this.checkInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.checkIntervalMs);

    // 페이지 로드 시 즉시 한 번 체크
    this.checkAndRefreshToken();
  }

  /**
   * 토큰 모니터링 중지
   */
  stopMonitoring() {
    if (this.checkInterval) {
      console.log('🛑 Stopping token monitoring...');
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 토큰 상태 확인 및 필요시 갱신
   */
  async checkAndRefreshToken() {
    try {
      // 로그인 상태가 아니면 모니터링 중지
      if (!localStorage.getItem('accessToken')) {
        this.stopMonitoring();
        return;
      }

      // 토큰이 곧 만료될 예정인지 확인
      if (authService.isTokenExpiringSoon()) {
        console.log('⚠️ Token is expiring soon, refreshing...');
        
        try {
          await authService.refreshAccessToken();
          console.log('✅ Token refreshed successfully');
        } catch (error) {
          console.error('❌ Failed to refresh token:', error);
          // 토큰 갱신 실패 시 모니터링 중지
          this.stopMonitoring();
        }
      }
    } catch (error) {
      console.error('❌ Token check error:', error);
    }
  }

  /**
   * 토큰이 유효한지 확인
   */
  isTokenValid() {
    return authService.isTokenValid();
  }

  /**
   * 토큰이 곧 만료될 예정인지 확인
   */
  isTokenExpiringSoon() {
    return authService.isTokenExpiringSoon();
  }
}

// 싱글톤 인스턴스 생성
const tokenManager = new TokenManager();

export default tokenManager;
