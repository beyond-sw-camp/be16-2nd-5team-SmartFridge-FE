<template>
  <v-app>
    <div class="reset-password-page-wrapper">
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
          <!-- 비밀번호 재설정 콘텐츠 영역 -->
          <div class="reset-password-content-area">
            <div class="reset-password-wrapper">
              <!-- 비밀번호 재설정 카드 -->
              <v-card class="reset-password-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 헤더 -->
                  <div class="reset-password-header mb-6">
                    <h2 class="reset-password-title">새 비밀번호 설정</h2>
                    <p class="reset-password-subtitle">새로운 비밀번호를 입력해주세요</p>
                  </div>

                  <!-- 성공 메시지 표시 -->
                  <v-alert
                    v-if="successMessage"
                    type="success"
                    variant="tonal"
                    class="mb-6"
                    :text="successMessage"
                    closable
                    @click:close="successMessage = ''"
                  ></v-alert>

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

                  <!-- 비밀번호 재설정 폼 -->
                  <v-form @submit.prevent="resetPassword" ref="resetPasswordForm" v-if="!successMessage">
                    <div class="form-group mb-4">
                      <label class="form-label">새 비밀번호</label>
                      <v-text-field
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        placeholder="새 비밀번호를 입력하세요"
                        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        @click:append-inner="showPassword = !showPassword"
                        :rules="passwordRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="form-group mb-6">
                      <label class="form-label">새 비밀번호 확인</label>
                      <v-text-field
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        variant="outlined"
                        placeholder="새 비밀번호를 다시 입력하세요"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword"
                        :rules="confirmPasswordRules"
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
                      class="reset-btn mb-6"
                      elevation="0"
                    >
                      비밀번호 변경
                    </v-btn>
                  </v-form>

                  <!-- 로그인 페이지로 이동 -->
                  <div class="back-to-login text-center" v-if="successMessage">
                    <router-link to="/" class="back-link">로그인 페이지로 이동</router-link>
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

export default {
  name: 'ResetPasswordPage',
  data() {
    return {
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      isLoading: false,
      errorMessage: "",
      successMessage: "",
      userEmail: "",
      isVerified: false,
      
      // 폼 유효성 검사 규칙
      passwordRules: [
        v => !!v || '비밀번호를 입력해주세요.',
        v => v.length >= 8 || '비밀번호는 최소 8자 이상이어야 합니다.',
        v => /(?=.*[a-z])/.test(v) || '소문자를 포함해야 합니다.',
        v => /(?=.*[A-Z])/.test(v) || '대문자를 포함해야 합니다.',
        v => /(?=.*\d)/.test(v) || '숫자를 포함해야 합니다.'
      ],
      confirmPasswordRules: [
        v => !!v || '비밀번호 확인을 입력해주세요.',
        v => v === this.password || '비밀번호가 일치하지 않습니다.'
      ]
    }
  },
  
  mounted() {
    // URL에서 이메일과 인증 상태 확인
    this.userEmail = this.$route.query.email;
    this.isVerified = this.$route.query.verified === 'true';
    
    // 임시 인증 토큰 확인
    const tempAuth = sessionStorage.getItem('tempResetAuth');
    const tempEmail = sessionStorage.getItem('tempResetEmail');
    const tempTime = sessionStorage.getItem('tempResetTime');
    
    // 30분(1800000ms) 이내 인증만 유효
    const isTokenValid = tempAuth && tempEmail && tempTime && 
                        (Date.now() - parseInt(tempTime)) < 1800000 &&
                        tempEmail === this.userEmail;
    
    if (!this.userEmail || !this.isVerified || !isTokenValid) {
      this.errorMessage = "유효하지 않은 접근이거나 인증이 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.";
      
      // 세션 정리
      sessionStorage.removeItem('tempResetAuth');
      sessionStorage.removeItem('tempResetEmail');
      sessionStorage.removeItem('tempResetTime');
      
      // 3초 후 비밀번고 찾기 페이지로 리다이렉트
      setTimeout(() => {
        this.$router.push('/member/forgot-password');
      }, 3000);
    }
  },
  
  methods: {
    async resetPassword() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.resetPasswordForm.validate();
      if (!valid) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";
      this.successMessage = "";

      const resetData = {
        email: this.userEmail,
        newPassword: this.password,
        newPasswordConfirm: this.confirmPassword
      };

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        // 임시 토큰 생성 (비밀번호 찾기용)
        const tempToken = btoa(JSON.stringify({
          email: this.userEmail,
          purpose: 'password-reset',
          timestamp: Date.now(),
          verified: true
        }));
        
        // 비밀번호 변경 API 호출 (임시 토큰 포함)
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`
          }
        }).put(`${apiBaseUrl}/member/forgot-password/updatepw`, resetData);
        
        // 백엔드 응답 구조에 맞춰 처리 (CommonDto 구조)
        if (response.data.status_code === 200) {
          this.successMessage = response.data.status_message || "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.";
          this.password = "";
          this.confirmPassword = "";
          
          // 임시 인증 정보 제거
          sessionStorage.removeItem('tempResetAuth');
          sessionStorage.removeItem('tempResetEmail');
          sessionStorage.removeItem('tempResetTime');
          
          // 3초 후 로그인 페이지로 이동
          setTimeout(() => {
            this.$router.push('/');
          }, 3000);
        } else {
          this.errorMessage = response.data.status_message || "비밀번호 변경에 실패했습니다.";
        }
      } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.response) {
          // 서버에서 응답을 받은 경우
          const errorData = error.response.data;
          if (errorData.status_code === 400) {
            this.errorMessage = errorData.status_message || "비밀번호를 확인해 주세요.";
          } else if (errorData.status_code === 401) {
            this.errorMessage = "인증이 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.";
          } else {
            this.errorMessage = errorData.status_message || "비밀번호 변경에 실패했습니다.";
          }
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        } else {
          // 요청 설정 중 오류가 발생한 경우
          this.errorMessage = "요청 처리 중 오류가 발생했습니다.";
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
/* ForgotPasswordPage.vue와 동일한 스타일 적용 */
.reset-password-page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

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

.unified-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.content-wrapper {
  display: flex;
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
}

.reset-password-content-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.reset-password-wrapper {
  width: 100%;
  max-width: 400px;
}

.reset-password-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

.reset-password-header {
  text-align: center;
}

.reset-password-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.reset-password-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
}

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

.reset-btn {
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

.reset-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

.back-to-login {
  margin-top: 8px;
}

.back-link {
  font-size: 14px;
  color: #7f8c8d;
  text-decoration: none !important;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #667eea !important;
  text-decoration: underline !important;
}

@media (max-width: 600px) {
  .top-logo {
    position: relative;
    top: 0;
    left: 0;
    justify-content: center;
    padding: 16px 0;
  }
  
  .top-logo-image {
    height: 28px;
  }
  
  .top-logo-text {
    font-size: 18px;
  }
  
  .reset-password-content-area {
    padding: 20px;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reset-password-card {
  animation: slideInUp 0.6s ease-out;
}

.v-btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.v-text-field input:focus {
  outline: none;
}
</style>
