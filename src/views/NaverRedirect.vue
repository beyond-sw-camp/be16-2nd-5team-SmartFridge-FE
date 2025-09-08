<template>
  <v-app>
    <div class="redirect-page-wrapper">
      <!-- 상단 로고 -->
      <div class="top-logo">
        <img 
          src="@/assets/images/SFlogo/smartFridge_logo.png" 
          alt="SmartFridge Logo"
          class="top-logo-image"
        />
        <span class="top-logo-text">SmartFridge</span>
      </div>

      <!-- 통합된 배경 컨테이너 -->
      <div class="unified-background">
        <div class="content-wrapper">
          <!-- 프로모션 콘텐츠 영역 -->
          <div class="promotion-content-area">
            <div class="promotion-content">
              <div class="promotion-text">
                <h1 class="promotion-title">
                  네이버 로그인<br>
                  진행 중
                </h1>
                <p class="promotion-subtitle">
                  잠시만 기다려주세요.<br>
                  안전하게 로그인을 처리하고 있습니다.
                </p>
              </div>
              
              <!-- 기능 카드들 -->
              <div class="feature-cards">
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-shield-check-outline</v-icon>
                  <span class="feature-text">보안 인증</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-account-check-outline</v-icon>
                  <span class="feature-text">계정 확인</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-refresh</v-icon>
                  <span class="feature-text">자동 로그인</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-web</v-icon>
                  <span class="feature-text">Naver 연동</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 로딩 콘텐츠 영역 -->
          <div class="loading-content-area">
            <div class="loading-wrapper">
              <!-- 로딩 카드 -->
              <v-card class="loading-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 로딩 헤더 -->
                  <div class="loading-header mb-6">
                    <div class="loading-icon-container">
                      <v-progress-circular
                        :size="60"
                        :width="4"
                        color="primary"
                        indeterminate
                        class="loading-spinner"
                      ></v-progress-circular>
                    </div>
                    <h2 class="loading-title">네이버 로그인 처리 중</h2>
                    <p class="loading-subtitle">잠시만 기다려주세요...</p>
                  </div>

                  <!-- 로딩 단계 표시 -->
                  <div class="loading-steps">
                    <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
                      <div class="step-icon">
                        <v-icon v-if="currentStep > 1" color="white" size="16">mdi-check</v-icon>
                        <span v-else class="step-number">1</span>
                      </div>
                      <span class="step-text">인증 코드 확인</span>
                    </div>
                    
                    <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
                      <div class="step-icon">
                        <v-icon v-if="currentStep > 2" color="white" size="16">mdi-check</v-icon>
                        <span v-else class="step-number">2</span>
                      </div>
                      <span class="step-text">서버 인증 처리</span>
                    </div>
                    
                    <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
                      <div class="step-icon">
                        <v-icon v-if="currentStep > 3" color="white" size="16">mdi-check</v-icon>
                        <span v-else class="step-number">3</span>
                      </div>
                      <span class="step-text">로그인 완료</span>
                    </div>
                  </div>

                  <!-- 진행률 표시 -->
                  <div class="progress-section mt-6">
                    <v-progress-linear
                      :model-value="progressValue"
                      color="primary"
                      height="6"
                      rounded
                      class="progress-bar"
                    ></v-progress-linear>
                    <div class="progress-text">{{ Math.round(progressValue) }}%</div>
                  </div>

                  <!-- 상태 메시지 -->
                  <div class="status-message mt-4">
                    <v-icon class="status-icon" color="primary" size="16">mdi-information-outline</v-icon>
                    <span class="status-text">{{ statusMessage }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
    name: 'NaverRedirect',
    data() {
        return {
            currentStep: 1,
            progressValue: 0,
            statusMessage: '네이버 인증 코드를 확인하고 있습니다...',
            progressInterval: null
        }
    },
    created() {
        console.log("Naver OAuth redirect created");
        const urlParams = new URL(window.location.href).searchParams;
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        
        // 로딩 애니메이션 시작
        this.startLoadingAnimation();
        
        // 서버로 코드 전송
        this.sendCodeToServer(code, state);
    },
    beforeUnmount() {
        // 컴포넌트가 언마운트되기 전에 인터벌 정리
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    },
    methods: {
        startLoadingAnimation() {
            // 진행률 애니메이션 시작
            this.progressInterval = setInterval(() => {
                if (this.progressValue < 90) {
                    this.progressValue += Math.random() * 10;
                }
            }, 200);
        },
        
        updateStep(step, message) {
            this.currentStep = step;
            this.statusMessage = message;
        },
        
        async sendCodeToServer(code, state) {
            try {
                console.log("서버로 코드 전송 중...");
                this.updateStep(1, '네이버 인증 코드를 확인하고 있습니다...');
                
                // 1단계 완료
                await new Promise(resolve => setTimeout(resolve, 500));
                this.updateStep(2, '서버에서 인증을 처리하고 있습니다...');
                
                // 백엔드 컨트롤러에 맞춰 code와 state를 전송 (NaverRedirectDto)
                const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/naver/doLogin`, {
                    code: code,
                    state: state
                });
                
                // 백엔드 응답 구조: { result: { id, token }, status_code: 200, status_message: "네이버 로그인 성공" }
                if (response.data.status_code === 200 && response.data.result) {
                    const { token } = response.data.result;
                    
                    // JWT 토큰에서 사용자 정보 추출
                    const decodedToken = jwtDecode(token);
                    const role = decodedToken.role;
                    const email = decodedToken.sub;
                    
                    // 일반 로그인과 동일한 방식으로 토큰 저장
                    localStorage.setItem("accessToken", token);
                    localStorage.setItem("role", role);
                    localStorage.setItem("email", email);
                    
                    // 사용자 정보를 store에 로드
                    try {
                        await this.$store.dispatch('fetchUserInfo');
                    } catch (error) {
                        console.warn('Failed to fetch user info:', error);
                    }
                    
                    console.log("네이버 로그인 성공, 냉장고 상태 확인");
                    
                    // 3단계 완료
                    this.updateStep(3, '대시보드로 이동중...');
                    this.progressValue = 100;
                    
                    // FridgeList로 리다이렉트
                    await this.checkUserFridgeStatus();
                } else {
                    throw new Error(response.data.status_message || "네이버 로그인에 실패했습니다.");
                }
                
            } catch (error) {
                console.error('Naver OAuth 에러:', error);
                
                this.statusMessage = "로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
                this.progressValue = 0;
                
                // 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            }
        },
        
        async checkUserFridgeStatus() {
            try {
                // 로그인 성공 후 바로 FridgeList 페이지로 이동
                this.$router.push('/fridge/list').catch(() => {
                    window.location.href = "/fridge/list";
                });
            } catch (error) {
                console.error('페이지 이동 오류:', error);
                // 오류 발생 시에도 FridgeList로 이동
                window.location.href = "/fridge/list";
            }
        }
    }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.redirect-page-wrapper {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
}

/* 상단 로고 */
.top-logo {
  position: absolute;
  top: 24px;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.top-logo-image {
  height: 32px;
  width: auto;
}

.top-logo-text {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

/* 통합된 배경 컨테이너 */
.unified-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  overflow-x: hidden;
  position: relative;
}

/* 콘텐츠 래퍼 */
.content-wrapper {
  display: flex;
  width: 100%;
  max-width: 1400px;
  min-height: 100vh;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
  padding: 0 20px;
}

/* 프로모션 콘텐츠 영역 */
.promotion-content-area {
  flex: 1;
  max-width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 40px 80px 60px;
  color: white;
}

/* 로딩 콘텐츠 영역 */
.loading-content-area {
  flex: 0 0 auto;
  width: 100%;
  max-width: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.promotion-content {
  max-width: 500px;
}

.promotion-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: white;
}

.promotion-subtitle {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 48px;
  color: rgba(255, 255, 255, 0.9);
}

/* 기능 카드들 */
.feature-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.feature-icon {
  opacity: 0.9;
}

.feature-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.loading-wrapper {
  width: 100%;
  max-width: 400px;
}

/* 로딩 카드 */
.loading-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 로딩 헤더 */
.loading-header {
  text-align: center;
}

.loading-icon-container {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.loading-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
}

/* 로딩 단계 */
.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.step-item.active {
  background-color: #f8f9fa;
}

.step-item.completed {
  background-color: #e8f5e8;
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step-item.active .step-icon {
  background-color: #667eea;
  color: white;
}

.step-item.completed .step-icon {
  background-color: #28a745;
  color: white;
}

.step-item:not(.active):not(.completed) .step-icon {
  background-color: #e9ecef;
  color: #6c757d;
}

.step-number {
  font-size: 12px;
  font-weight: 600;
}

.step-text {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* 진행률 섹션 */
.progress-section {
  position: relative;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-text {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

/* 상태 메시지 */
.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.status-icon {
  flex-shrink: 0;
}

.status-text {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .content-wrapper {
    padding: 0 15px;
  }
  
  .promotion-content-area {
    padding: 60px 30px 60px 40px;
  }
  
  .promotion-title {
    font-size: 40px;
  }
}

@media (max-width: 960px) {
  .content-wrapper {
    flex-direction: column;
    justify-content: center;
    padding: 0;
  }
  
  .promotion-content-area {
    display: none;
  }
  
  .loading-content-area {
    flex: 1;
    width: 100%;
    max-width: 500px;
    padding: 40px 20px;
  }
  
  .top-logo {
    position: relative;
    top: 0;
    left: 0;
    justify-content: center;
    padding: 24px 0;
  }
  
  .unified-background {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .top-logo {
    padding: 16px 0;
  }
  
  .top-logo-image {
    height: 28px;
  }
  
  .top-logo-text {
    font-size: 18px;
  }
  
  .loading-content-area {
    padding: 20px;
  }
  
  .promotion-title {
    font-size: 36px;
  }
  
  .promotion-subtitle {
    font-size: 16px;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
}

/* 애니메이션 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-card {
  animation: slideInRight 0.6s ease-out;
}

.promotion-content {
  animation: slideInLeft 0.6s ease-out;
}

.step-item {
  animation: fadeIn 0.4s ease-out;
}

/* 포커스 상태 */
.v-btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* 로딩 스피너 커스텀 */
.v-progress-circular {
  animation: spin 1s linear infinite;
}

/* 진행률 바 커스텀 */
.v-progress-linear {
  border-radius: 3px !important;
}

/* 카드 호버 효과 */
.loading-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease;
}
</style>