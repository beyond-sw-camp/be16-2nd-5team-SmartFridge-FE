<template>
  <v-app>
    <div class="login-page-wrapper">
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
                  함께 나누는<br>
                  스마트 냉장고
                </h1>
                <p class="promotion-subtitle">
                  가족, 룸메이트, 동료들과 냉장고 속 식재료를 효율적으로 공유하고 관리하세요.
                </p>
                <p class="promotion-description">
                  음식을 낭비를 줄이고 더 건강한 식생활을 만들어보세요.
                </p>
              </div>
              
              <!-- 기능 카드들 -->
              <div class="feature-cards">
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-clock-outline</v-icon>
                  <span class="feature-text">실시간 재고 관리</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-account-group-outline</v-icon>
                  <span class="feature-text">유통기한 알림</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-chart-line</v-icon>
                  <span class="feature-text">그룹 공유 기능</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-heart-outline</v-icon>
                  <span class="feature-text">함께 나누어 더 즐거운 식생활</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 로그인 콘텐츠 영역 -->
          <div class="login-content-area">
            <div class="login-wrapper">
              <!-- 로그인 카드 -->
              <v-card class="login-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 로그인 헤더 -->
                  <div class="login-header mb-6">
                    <h2 class="login-title">로그인</h2>
                    <p class="login-subtitle">스마트 냉장고 관리를 시작해보세요</p>
                  </div>

                  <!-- 에러 메시지 표시 -->
                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mb-6"
                    :text="errorMessage"
                    closable
                    @click:close="errorMessage = ''"
                  ></v-alert>

                  <!-- 로그인 폼 -->
                  <v-form @submit.prevent="doLogin" ref="loginForm">
                    <div class="form-group mb-4">
                      <label class="form-label">이메일</label>
                      <v-text-field
                        v-model="email"
                        type="email"
                        variant="outlined"
                        placeholder="이메일을 입력하세요"
                        :rules="emailRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>
                    
                    <div class="form-group mb-6">
                      <label class="form-label">비밀번호</label>
                      <v-text-field
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        placeholder="비밀번호를 입력하세요"
                        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        @click:append-inner="showPassword = !showPassword"
                        :rules="passwordRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>
                    
                    <v-btn 
                      type="submit" 
                      color="primary" 
                      block 
                      size="large"
                      :loading="isLoading"
                      class="login-btn mb-6"
                      elevation="0"
                    >
                      로그인
                    </v-btn>
                  </v-form>

                  <!-- 소셜 로그인 구분선 -->
                  <div class="divider-section mb-6">
                    <span class="divider-text">또는</span>
                  </div>

                  <!-- 소셜 로그인 버튼들 -->
                  <div class="social-login-section mb-6">
                    <div class="social-buttons-row">
                      <v-btn
                        variant="outlined"
                        class="social-btn google-btn"
                        @click="googleLogin()"
                        :loading="socialLoading.google"
                        size="small"
                      >
                        <v-icon class="social-icon google-icon">mdi-google</v-icon>
                        Google
                      </v-btn>
                      
                      <v-btn
                        variant="outlined"
                        class="social-btn kakao-btn"
                        @click="kakaoLogin()"
                        :loading="socialLoading.kakao"
                        size="small"
                      >
                        <span class="social-icon kakao-icon">K</span>
                        Kakao
                      </v-btn>
                      
                      <v-btn
                        variant="outlined"
                        class="social-btn naver-btn"
                        @click="naverLogin()"
                        :loading="socialLoading.naver"
                        size="small"
                      >
                        <span class="social-icon naver-icon">N</span>
                        Naver
                      </v-btn>
                    </div>
                  </div>

                  <!-- 회원가입 링크 -->
                  <div class="signup-section text-center">
                    <router-link to="/member/create" class="signup-text signup-link">회원가입</router-link>
                    <span class="signup-divider">|</span>
                    <router-link to="/member/forgot-password" class="signup-text signup-link">비밀번호 찾기</router-link>
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
  name: 'LoginPage',
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
      isLoading: false,
      errorMessage: "",
      
      // 폼 유효성 검사 규칙
      emailRules: [
        v => !!v || '이메일을 입력해주세요.',
        v => /.+@.+\..+/.test(v) || '올바른 이메일 형식을 입력해주세요.'
      ],
      passwordRules: [
        v => !!v || '비밀번호를 입력해주세요.',
        v => v.length >= 4 || '비밀번호는 최소 4자 이상이어야 합니다.'
      ],
      
      // 소셜 로그인 로딩 상태
      socialLoading: {
        google: false,
        kakao: false,
        naver: false
      },
      
      // OAuth 설정
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId: "374485739574-jumcdbdoujbiibr15dhncieme5t1n3vb.apps.googleusercontent.com",
      googleRedirectUrl: "http://localhost:3000/oauth/google/redirect",
      googleScope: "openid email profile",
      
      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId: "1db026f5c4d2e11d7e597cdd4488d193",
      kakaoRedirectUrl: "http://localhost:3000/oauth/kakao/redirect",
      
      naverUrl: "https://nid.naver.com/oauth2.0/authorize",
      naverClientId: "GbQ_01jKVCMgOVze1pio",
      naverRedirectUrl: "http://localhost:3000/oauth/naver/redirect",
    }
  },
  
  methods: {
    async doLogin() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.loginForm.validate();
      if (!valid) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      const loginData = {
        email: this.email,
        password: this.password
      };

      try {
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/doLogin`, loginData);
        
        // 백엔드 응답 구조에 맞춰 데이터 추출
        if (response.data.status_code === 200 && response.data.result) {
          const { accessToken, refreshToken } = response.data.result;
          
          // JWT 토큰에서 사용자 정보 추출
          const decodedToken = jwtDecode(accessToken);
          const role = decodedToken.role;
          const email = decodedToken.sub;
          
          // 토큰과 사용자 정보를 localStorage에 저장
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("role", role);
          localStorage.setItem("email", email);
          
          // 토큰 모니터링 시작
          if (window.tokenManager) {
            window.tokenManager.startMonitoring();
          }
          
          // 로그인 성공 후 FridgeList로 이동
          this.$nextTick(async () => {
            await this.checkUserFridgeStatus();
          });
        } else {
          this.errorMessage = response.data.status_message || "로그인에 실패했습니다.";
        }
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response) {
          // 서버에서 응답을 받은 경우
          const errorData = error.response.data;
          this.errorMessage = errorData.status_message || "로그인에 실패했습니다.";
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        } else {
          // 요청 설정 중 오류가 발생한 경우
          this.errorMessage = "로그인 중 오류가 발생했습니다.";
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    googleLogin() {
      this.socialLoading.google = true;
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}`;
      window.location.href = auth_uri;
    },

    kakaoLogin() {
      this.socialLoading.kakao = true;
      const auth_uri = `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    },

    naverLogin() {
      this.socialLoading.naver = true;
      const auth_uri = `${this.naverUrl}?client_id=${this.naverClientId}&redirect_uri=${this.naverRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    },
    
    async checkUserFridgeStatus() {
      try {
        // 사용자 역할에 따라 다른 페이지로 이동
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          // 관리자인 경우 관리자 대시보드로 이동
          this.$router.push('/admin').catch(() => {
            window.location.href = "/admin";
          });
        } else {
          // 일반 사용자인 경우 냉장고 목록으로 이동
          this.$router.push('/fridge/list').catch(() => {
            window.location.href = "/fridge/list";
          });
        }
      } catch (error) {
        console.error('페이지 이동 오류:', error);
        // 오류 발생 시 역할에 따라 이동
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/fridge/list";
        }
      }
    }
  },
  
  // 컴포넌트가 마운트될 때 이미 로그인된 사용자인지 확인
  async mounted() {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // 토큰이 만료되지 않았다면 역할에 따라 적절한 페이지로 리다이렉트
        if (decodedToken.exp > currentTime) {
          await this.checkUserFridgeStatus();
        } else {
          // 만료된 토큰 제거
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
          localStorage.removeItem("email");
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // 잘못된 토큰 제거
        localStorage.clear();
      }
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.login-page-wrapper {
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

/* 로그인 콘텐츠 영역 */
.login-content-area {
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
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.promotion-description {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 48px;
  color: rgba(255, 255, 255, 0.8);
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

/* 기존 섹션 스타일 제거됨 - 통합된 배경 사용 */

.login-wrapper {
  width: 100%;
  max-width: 400px;
}

/* 로그인 카드 */
.login-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 로그인 헤더 */
.login-header {
  text-align: center;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

/* 입력 필드 */
.v-text-field .v-field {
  border-radius: 8px !important;
  background-color: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
}

.v-text-field .v-field--focused {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.v-text-field input::placeholder {
  color: #adb5bd !important;
  font-size: 14px;
}

/* 로그인 버튼 */
.login-btn {
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  background: #20B2AA !important;
  color: white !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.login-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

/* 구분선 */
.divider-section {
  position: relative;
  text-align: center;
}

.divider-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e9ecef;
}

.divider-text {
  background: white;
  color: #7f8c8d;
  font-size: 14px;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* 소셜 로그인 버튼들 */
.social-buttons-row {
  display: flex;
  gap: 8px;
}

.social-btn {
  flex: 1;
  height: 36px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  border: 1px solid #e9ecef !important;
  transition: all 0.3s ease !important;
}

.social-icon {
  margin-right: 4px;
  font-size: 14px;
  font-weight: 700;
}

.google-btn {
  color: #4285f4 !important;
  border-color: #e9ecef !important;
}

.google-btn:hover {
  background-color: #4285f4 !important;
  color: white !important;
  border-color: #4285f4 !important;
}

.google-icon {
  color: #4285f4;
}

.google-btn:hover .google-icon {
  color: white !important;
}

.kakao-btn {
  color: #3c1e1e !important;
  background-color: #fee500 !important;
  border-color: #fee500 !important;
}

.kakao-btn:hover {
  background-color: #fdd835 !important;
  border-color: #fdd835 !important;
}

.kakao-icon {
  background: #3c1e1e;
  color: #fee500;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

.naver-btn {
  color: white !important;
  background-color: #03c75a !important;
  border-color: #03c75a !important;
}

.naver-btn:hover {
  background-color: #02b050 !important;
  border-color: #02b050 !important;
}

.naver-icon {
  background: white;
  color: #03c75a;
  border-radius: 2px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

/* 회원가입 섹션 */
.signup-section {
  margin-top: 8px;
}

.signup-text {
  font-size: 14px;
  color: #7f8c8d;
  cursor: pointer;
  transition: color 0.3s ease;
}

.signup-text:hover {
  color: #667eea;
}

.signup-link {
  text-decoration: none !important;
  font-weight: 500;
}

.signup-link:hover {
  color: #667eea !important;
  text-decoration: underline !important;
}

.signup-divider {
  margin: 0 12px;
  color: #e9ecef;
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
  
  .login-content-area {
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
  
  .login-content-area {
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
  
  .social-buttons-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .social-btn {
    height: 40px !important;
    font-size: 14px !important;
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

.login-card {
  animation: slideInRight 0.6s ease-out;
}

.promotion-content {
  animation: slideInLeft 0.6s ease-out;
}

/* 포커스 상태 */
.v-btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.v-text-field input:focus {
  outline: none;
}
</style>