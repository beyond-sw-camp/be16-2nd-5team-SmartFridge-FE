<template>
  <v-app>
    <div class="forgot-password-page-wrapper">
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
          <!-- 비밀번호 찾기 콘텐츠 영역 -->
          <div class="forgot-password-content-area">
            <div class="forgot-password-wrapper">
              <!-- 비밀번호 찾기 카드 -->
              <v-card class="forgot-password-card elevation-12">
                <v-card-text class="pa-8">
                  
                  <!-- 이메일 입력 단계 -->
                  <div v-if="currentStep === 'email'" class="email-step">
                    <!-- 헤더 -->
                    <div class="forgot-password-header mb-6">
                      <v-icon 
                        class="forgot-password-icon mb-4" 
                        color="primary" 
                        size="80"
                      >
                        mdi-lock-reset
                      </v-icon>
                      <h2 class="forgot-password-title">비밀번호 찾기</h2>
                      <p class="forgot-password-subtitle">
                        가입하신 이메일 주소를 입력하시면<br>
                        비밀번호 재설정 링크를 보내드립니다.
                      </p>
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

                    <!-- 이메일 입력 폼 -->
                    <v-form @submit.prevent="sendVerificationCode" ref="emailForm">
                      <div class="form-group mb-6">
                        <label class="form-label">이메일 주소</label>
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
                          prepend-inner-icon="mdi-email-outline"
                        ></v-text-field>
                      </div>
                      
                      <v-btn 
                        type="submit" 
                        color="primary" 
                        block 
                        size="large"
                        :loading="isLoading"
                        class="send-btn mb-6"
                        elevation="0"
                      >
                        <v-icon left>mdi-email-send</v-icon>
                        인증 코드 발송
                      </v-btn>
                    </v-form>

                    <!-- 로그인 페이지로 이동 -->
                    <div class="back-to-login text-center">
                      <router-link to="/" class="back-link">로그인 페이지로 돌아가기</router-link>
                    </div>
                  </div>

                  <!-- 이메일 인증 단계 -->
                  <div v-if="currentStep === 'verification'" class="verification-step">
                    <!-- 헤더 -->
                    <div class="verification-header mb-6">
                      <v-icon 
                        class="verification-icon mb-4" 
                        color="primary" 
                        size="80"
                      >
                        mdi-email-lock-outline
                      </v-icon>
                      <h2 class="verification-title">이메일 인증</h2>
                      <p class="verification-subtitle">
                        {{ email }}로<br>
                        인증 코드를 발송했습니다.
                      </p>
                    </div>

                    <div class="verification-instructions mb-6">
                      <p class="instruction-text mb-2">
                        📧 이메일을 확인하여 6자리 인증 코드를 입력해주세요.
                      </p>
                      <p class="instruction-text mb-2">
                        🔤 인증 코드는 영문자(대소문자)와 숫자의 조합입니다.
                      </p>
                      <p class="instruction-text mb-2">
                        ⏰ 인증 코드는 30분 후 만료됩니다.
                      </p>
                      <p class="instruction-text">
                        📭 이메일이 오지 않았다면 스팸함을 확인해주세요.
                      </p>
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

                    <!-- 인증 코드 입력 폼 -->
                    <v-form @submit.prevent="verifyCode" ref="verificationForm" class="mb-6">
                      <div class="code-input-section mb-4">
                        <label class="code-label mb-3">인증 코드</label>
                        <v-text-field
                          v-model="verificationCode"
                          variant="outlined"
                          placeholder="6자리 인증 코드를 입력하세요"
                          :rules="codeRules"
                          maxlength="6"
                          class="code-input"
                          color="primary"
                          bg-color="grey-lighten-5"
                          hide-details="auto"
                          autocomplete="off"
                        >
                          <template v-slot:append-inner>
                            <v-icon v-if="verificationCode && verificationCode.length === 6" color="success">
                              mdi-check-circle
                            </v-icon>
                          </template>
                        </v-text-field>
                      </div>

                      <v-btn 
                        type="submit"
                        color="primary" 
                        block 
                        size="large"
                        class="verify-btn mb-4"
                        :loading="isVerifying"
                        :disabled="!verificationCode || verificationCode.length !== 6"
                      >
                        <v-icon left>mdi-check-circle</v-icon>
                        인증 확인
                      </v-btn>
                    </v-form>

                    <!-- 이메일 재발송 버튼 -->
                    <v-btn 
                      color="grey" 
                      variant="outlined"
                      block 
                      size="large"
                      class="mb-4"
                      @click="resendVerificationCode"
                      :loading="isResending"
                      :disabled="resendCooldown > 0"
                    >
                      <v-icon left>mdi-email-sync</v-icon>
                      {{ resendCooldown > 0 ? `${resendCooldown}초 후 재발송 가능` : '인증 코드 재발송' }}
                    </v-btn>

                    <!-- 뒤로 가기 버튼 -->
                    <v-btn 
                      color="grey" 
                      variant="text"
                      block 
                      size="large"
                      @click="goBackToEmail"
                    >
                      <v-icon left>mdi-arrow-left</v-icon>
                      이메일 입력으로 돌아가기
                    </v-btn>
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
  name: 'ForgotPasswordPage',
  data() {
    return {
      currentStep: 'email', // 'email' 또는 'verification'
      email: "",
      verificationCode: "",
      isLoading: false,
      isVerifying: false,
      isResending: false,
      errorMessage: "",
      successMessage: "",
      resendCooldown: 0,
      cooldownTimer: null,
      
      // 폼 유효성 검사 규칙
      emailRules: [
        v => !!v || '이메일을 입력해주세요.',
        v => /.+@.+\..+/.test(v) || '올바른 이메일 형식을 입력해주세요.'
      ],
      codeRules: [
        v => !!v || '인증 코드를 입력해주세요.',
        v => /^[A-Za-z0-9]{6}$/.test(v) || '6자리 영문자와 숫자 조합을 입력해주세요.'
      ]
    }
  },
  
  beforeUnmount() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  },
  
  methods: {
    async sendVerificationCode() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.emailForm.validate();
      if (!valid) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }).post(`${apiBaseUrl}/member/forgot-password/send-code`, {
          mail: this.email
        });
        
        // 백엔드 응답 구조에 맞춰 처리 (CommonDto 구조)
        if (response.data.result === "OK" && response.data.status_code === 200) {
          this.successMessage = response.data.status_message || "인증코드가 발송되었습니다.";
          this.currentStep = 'verification';
          this.startResendCooldown();
        } else {
          this.errorMessage = response.data.status_message || "인증 코드 발송에 실패했습니다.";
        }
      } catch (error) {
        console.error('Send verification code error:', error);
        
        if (error.response) {
          const errorData = error.response.data;
          if (errorData.status_code === 400) {
            this.errorMessage = "등록되지 않은 이메일입니다.";
          } else {
            this.errorMessage = errorData.status_message || "인증 코드 발송에 실패했습니다.";
          }
        } else if (error.request) {
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        } else {
          this.errorMessage = "요청 처리 중 오류가 발생했습니다.";
        }
      } finally {
        this.isLoading = false;
      }
    },

    async verifyCode() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.verificationForm.validate();
      if (!valid) {
        return;
      }

      this.isVerifying = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }).post(`${apiBaseUrl}/member/forgot-password/verify-code`, {
          mail: this.email,
          verifyCode: this.verificationCode
        });
        
        // 백엔드 응답 구조에 맞춰 처리 (CommonDto 구조)
        if (response.data.result === "VERIFIED" && response.data.status_code === 200) {
          this.successMessage = response.data.status_message || "이메일 인증이 완료되었습니다.";
          
          // 인증 성공 시 임시 토큰 생성 및 저장
          const tempAuthToken = btoa(`${this.email}:${Date.now()}:verified`);
          sessionStorage.setItem('tempResetAuth', tempAuthToken);
          sessionStorage.setItem('tempResetEmail', this.email);
          sessionStorage.setItem('tempResetTime', Date.now().toString());
          
          // 비밀번호 재설정 페이지로 이동
          setTimeout(() => {
            this.$router.push({
              path: '/reset-password',
              query: {
                email: this.email,
                verified: 'true'
              }
            });
          }, 1500);
          
        } else if (response.data.result === "UNVERIFIED") {
          this.errorMessage = response.data.status_message || "인증 코드가 올바르지 않습니다.";
        } else {
          this.errorMessage = "인증 처리 중 오류가 발생했습니다.";
        }
      } catch (error) {
        console.error('Verify code error:', error);
        
        if (error.response) {
          const errorData = error.response.data;
          if (errorData.status_code === 400) {
            this.errorMessage = errorData.status_message || "인증 코드가 올바르지 않거나 만료되었습니다.";
          } else {
            this.errorMessage = errorData.status_message || "인증 처리에 실패했습니다.";
          }
        } else if (error.request) {
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        } else {
          this.errorMessage = "요청 처리 중 오류가 발생했습니다.";
        }
      } finally {
        this.isVerifying = false;
      }
    },

    async resendVerificationCode() {
      if (this.resendCooldown > 0) {
        return;
      }
      
      this.isResending = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }).post(`${apiBaseUrl}/member/forgot-password/send-code`, {
          mail: this.email
        });
        
        if (response.data.result === "OK" && response.data.status_code === 200) {
          this.successMessage = response.data.status_message || "인증코드가 재발송되었습니다.";
          this.startResendCooldown();
        } else {
          this.errorMessage = response.data.status_message || "인증 코드 재발송에 실패했습니다.";
        }
      } catch (error) {
        console.error('Resend verification code error:', error);
        this.errorMessage = "인증 코드 재발송에 실패했습니다.";
      } finally {
        this.isResending = false;
      }
    },

    startResendCooldown() {
      this.resendCooldown = 60; // 60초 쿨다운
      this.cooldownTimer = setInterval(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          clearInterval(this.cooldownTimer);
          this.cooldownTimer = null;
        }
      }, 1000);
    },

    goBackToEmail() {
      this.currentStep = 'email';
      this.verificationCode = '';
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.forgot-password-page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
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

.forgot-password-content-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.forgot-password-wrapper {
  width: 100%;
  max-width: 400px;
}

.forgot-password-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 헤더 스타일 */
.forgot-password-header,
.verification-header {
  text-align: center;
}

.forgot-password-icon,
.verification-icon {
  opacity: 0.9;
}

.forgot-password-title,
.verification-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.forgot-password-subtitle,
.verification-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
}

/* 인증 안내사항 */
.verification-instructions {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #667eea;
}

.instruction-text {
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.5;
  margin: 0;
}

/* 폼 스타일 */
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

/* 코드 입력 섹션 */
.code-input-section {
  text-align: left;
}

.code-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.code-input .v-field {
  border-radius: 8px !important;
  background-color: #f8f9fa !important;
  border: 2px solid #e9ecef !important;
  text-align: center;
}

.code-input .v-field--focused {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.code-input input {
  text-align: center;
  font-size: 20px !important;
  font-weight: 600 !important;
  letter-spacing: 3px;
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

/* 버튼 스타일 */
.send-btn,
.verify-btn {
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

.send-btn:hover,
.verify-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

.v-btn {
  text-transform: none !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  height: 48px !important;
  transition: all 0.3s ease !important;
}

.v-btn:hover {
  transform: translateY(-1px);
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

/* 반응형 디자인 */
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
  
  .forgot-password-content-area {
    padding: 20px;
  }

  .forgot-password-title,
  .verification-title {
    font-size: 20px;
  }

  .instruction-text {
    font-size: 13px;
  }
}

/* 애니메이션 */
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

.forgot-password-card {
  animation: slideInUp 0.6s ease-out;
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