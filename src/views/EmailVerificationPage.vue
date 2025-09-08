<template>
  <v-app>
    <div class="verification-page-wrapper">
      <!-- 상단 로고 -->
      <div class="top-logo">
        <img 
          src="@/assets/images/SFlogo/smartFridge_logo.png" 
          alt="SmartFridge Logo"
          class="top-logo-image"
        />
        <span class="top-logo-text">SmartFridge</span>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="verification-content">
        <v-container class="fill-height">
          <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" sm="8" md="6" lg="4">
              <v-card class="verification-card elevation-12">
                <v-card-text class="pa-8">
                  
                  <!-- 이메일 인증 단계 표시 -->
                  <div class="verification-steps mb-6">
                    <div class="step-indicator">
                      <div class="step completed">
                        <v-icon color="success" size="20">mdi-check</v-icon>
                        <span class="step-text">회원정보 입력</span>
                      </div>
                      <div class="step-line"></div>
                      <div class="step active">
                        <v-icon color="primary" size="20">mdi-email-outline</v-icon>
                        <span class="step-text">이메일 인증</span>
                      </div>
                      <div class="step-line"></div>
                      <div class="step">
                        <v-icon color="grey-lighten-1" size="20">mdi-account-check</v-icon>
                        <span class="step-text">가입완료</span>
                      </div>
                    </div>
                  </div>

                  <!-- 인증 코드 입력 상태 -->
                  <div v-if="!isVerifying && !verificationResult" class="text-center">
                    <v-icon 
                      class="verification-icon mb-4" 
                      color="primary" 
                      size="80"
                    >
                      mdi-email-lock-outline
                    </v-icon>
                    
                    <h2 class="verification-title mb-4">이메일 인증</h2>
                    <p class="verification-subtitle mb-6">
                      {{ userEmail }}로<br>
                      인증 코드를 발송했습니다.
                    </p>
                    
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

                    <!-- 인증 코드 입력 폼 -->
                    <v-form @submit.prevent="verifyEmailCode" ref="verificationForm" class="mb-6">
                      <div class="code-input-section mb-4">
                        <label class="code-label mb-3">인증 코드</label>
                        <v-text-field
                          v-model="verificationCode"
                          variant="outlined"
                          placeholder="6자리 인증 코드를 입력하세요 (영문자+숫자)"
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
                        :loading="isCodeVerifying"
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
                      @click="resendVerificationEmail"
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
                      @click="goToSignup"
                    >
                      <v-icon left>mdi-arrow-left</v-icon>
                      회원가입으로 돌아가기
                    </v-btn>
                  </div>

                  <!-- 이메일 인증 진행 중 -->
                  <div v-if="isVerifying" class="text-center">
                    <v-progress-circular
                      class="mb-4"
                      color="primary"
                      indeterminate
                      size="64"
                    ></v-progress-circular>
                    
                    <h2 class="verification-title mb-4">인증 처리 중...</h2>
                    <p class="verification-subtitle">
                      인증 코드를 확인하고 있습니다.<br>
                      잠시만 기다려주세요.
                    </p>
                  </div>

                  <!-- 인증 결과 표시 -->
                  <div v-if="verificationResult" class="text-center">
                    <!-- 인증 성공 -->
                    <div v-if="verificationResult.success">
                      <v-icon 
                        class="verification-icon mb-4" 
                        color="success" 
                        size="80"
                      >
                        mdi-check-circle-outline
                      </v-icon>
                      
                      <h2 class="verification-title success--text mb-4">
                        이메일 인증 완료!
                      </h2>
                      <p class="verification-subtitle mb-6">
                        회원가입이 성공적으로 완료되었습니다.<br>
                        이제 SmartFridge를 이용하실 수 있습니다.
                      </p>
                      
                      <v-btn 
                        color="success" 
                        block 
                        size="large"
                        class="mb-4"
                        @click="goToLogin"
                      >
                        <v-icon left>mdi-login</v-icon>
                        로그인하기
                      </v-btn>
                    </div>

                    <!-- 인증 실패 -->
                    <div v-else>
                      <v-icon 
                        class="verification-icon mb-4" 
                        color="error" 
                        size="80"
                      >
                        mdi-close-circle-outline
                      </v-icon>
                      
                      <h2 class="verification-title error--text mb-4">
                        인증 실패
                      </h2>
                      <p class="verification-subtitle mb-6">
                        {{ verificationResult.message || '인증 코드가 올바르지 않습니다.' }}
                      </p>
                      
                      <v-btn 
                        color="primary" 
                        variant="outlined"
                        block 
                        size="large"
                        class="mb-4"
                        @click="resetVerification"
                      >
                        <v-icon left>mdi-refresh</v-icon>
                        다시 인증하기
                      </v-btn>
                      
                      <v-btn 
                        color="grey" 
                        variant="text"
                        block 
                        size="large"
                        @click="goToSignup"
                      >
                        회원가입 다시하기
                      </v-btn>
                    </div>
                  </div>

                  <!-- 에러 메시지 -->
                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mt-4"
                    :text="errorMessage"
                    closable
                    @click:close="errorMessage = ''"
                  ></v-alert>

                  <!-- 성공 메시지 -->
                  <v-alert
                    v-if="successMessage"
                    type="success"
                    variant="tonal"
                    class="mt-4"
                    :text="successMessage"
                    closable
                    @click:close="successMessage = ''"
                  ></v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </div>
  </v-app>
</template>

<script>
import emailVerificationService from '@/services/emailVerificationService';

export default {
  name: 'EmailVerificationPage',
  data() {
    return {
      userEmail: '',
      verificationCode: '',
      isVerifying: false,
      isCodeVerifying: false,
      isResending: false,
      verificationResult: null,
      errorMessage: '',
      successMessage: '',
      resendCooldown: 0,
      cooldownTimer: null,
      hasInitialEmailSent: false, // 초기 이메일 발송 여부 체크
      
      // 폼 유효성 검사 규칙
      codeRules: [
        v => !!v || '인증 코드를 입력해주세요.',
        v => /^[A-Za-z0-9]{6}$/.test(v) || '6자리 영문자와 숫자 조합을 입력해주세요.'
      ]
    }
  },
  
  async created() {
    // URL에서 이메일 파라미터 확인
    const { email } = this.$route.query;
    
    if (email) {
      this.userEmail = email;
      
      // 세션 스토리지에서 이미 발송했는지 확인
      const emailSentKey = `email_sent_${email}`;
      const hasAlreadySent = sessionStorage.getItem(emailSentKey);
      
      if (!hasAlreadySent && !this.hasInitialEmailSent) {
        this.hasInitialEmailSent = true;
        // 페이지 진입 시 한 번만 자동으로 인증 코드 발송
        await this.sendVerificationEmail();
        // 발송 완료 표시
        sessionStorage.setItem(emailSentKey, 'true');
      } else {
        console.log('이미 이메일이 발송되었습니다.');
        this.successMessage = '이미 인증 코드가 발송되었습니다. 이메일을 확인해주세요.';
      }
    } else {
      // 이메일이 없으면 회원가입 페이지로 리다이렉트
      this.$router.push('/member/create');
    }
  },
  
  beforeUnmount() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    
    // 페이지를 떠날 때 이메일 발송 상태 초기화 (선택적)
    // const emailSentKey = `email_sent_${this.userEmail}`;
    // sessionStorage.removeItem(emailSentKey);
  },
  
  methods: {
    async sendVerificationEmail() {
      this.isResending = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        const response = await emailVerificationService.sendVerificationCode(this.userEmail);
        
        // 백엔드 응답이 문자열인 경우 처리
        if (typeof response === 'string' && response.includes('발송')) {
          this.successMessage = response;
          this.startResendCooldown();
        } else if (response && response.status_code === 200) {
          this.successMessage = response.status_message || '인증 코드가 발송되었습니다.';
          this.startResendCooldown();
        } else {
          // 기본 성공 처리
          this.successMessage = '인증 코드가 발송되었습니다.';
          this.startResendCooldown();
        }
        
      } catch (error) {
        console.error('인증 코드 발송 에러:', error);
        console.error('에러 상세:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        let errorMessage = '인증 코드 발송에 실패했습니다.';
        if (error.response) {
          if (error.response.status === 400) {
            errorMessage = '잘못된 이메일 주소입니다.';
          } else if (error.response.status === 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
        }
        
        this.errorMessage = error.message || errorMessage;
      } finally {
        this.isResending = false;
      }
    },
    
    async verifyEmailCode() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.verificationForm.validate();
      if (!valid) {
        return;
      }
      
      this.isCodeVerifying = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        
        const response = await emailVerificationService.verifyEmailCode(this.userEmail, this.verificationCode);
        
        // 다양한 응답 형태에 대응
        let isVerificationSuccess = false;
        
        if (typeof response === 'string') {
          // 문자열 응답인 경우 - 더 유연한 체크
          console.log('문자열 응답 처리');
          
          // 실패 응답이 아닌 경우 성공으로 처리 (임시)
          const failureKeywords = ['실패', '실패하셨습니다', '틀렸습니다', '올바르지', 'error', 'fail'];
          const hasFailureKeyword = failureKeywords.some(keyword => 
            response.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (!hasFailureKeyword) {
            // 실패 키워드가 없으면 성공으로 처리
            isVerificationSuccess = true;
          } else {
            // 기존 성공 키워드 체크
            isVerificationSuccess = response.includes('인증이 완료되었습니다') || 
                                  response.includes('인증 완료') ||
                                  response.includes('완료') ||
                                  response.includes('성공') ||
                                  response === '인증이 완료되었습니다.' ||
                                  response === '인증 완료' ||
                                  response === '성공';
          }
          
          console.log('문자열 매칭 결과:', {
            '실패 키워드 포함': hasFailureKeyword,
            '인증이 완료되었습니다': response.includes('인증이 완료되었습니다'),
            '인증 완료': response.includes('인증 완료'),
            '완료': response.includes('완료'),
            '성공': response.includes('성공'),
            '최종 결과': isVerificationSuccess
          });
        } else if (response && typeof response === 'object') {
          // 객체 응답인 경우
          console.log('객체 응답 처리');
          isVerificationSuccess = response.success === true || 
                                response.status_code === 200 ||
                                response.statusCode === 200 ||
                                (response.message && response.message.includes('완료')) ||
                                (response.status_message && response.status_message.includes('완료'));
          console.log('객체 매칭 결과:', {
            'success': response.success,
            'status_code': response.status_code,
            'statusCode': response.statusCode,
            'message': response.message,
            'status_message': response.status_message
          });
        }
        
        console.log('최종 인증 성공 여부:', isVerificationSuccess);
        
        if (isVerificationSuccess) {
          // 인증 성공 시 실제 회원가입 처리
          await this.completeSignup();
        } else {
          console.log('인증 실패 - 에러 표시');
          this.verificationResult = {
            success: false,
            message: '인증 코드가 올바르지 않습니다.'
          };
        }
        
      } catch (error) {
        console.error('인증 코드 검증 에러:', error);
        
        this.verificationResult = {
          success: false,
          message: error.message || '인증 처리 중 오류가 발생했습니다.'
        };
      } finally {
        this.isCodeVerifying = false;
      }
    },
    
    async completeSignup() {
      this.isVerifying = true;
      
      try {
        // 세션 스토리지에서 회원가입 정보 가져오기
        const signupDataString = sessionStorage.getItem('pendingSignupData');
        const signupData = JSON.parse(signupDataString || '{}');
        
        // 더 엄격한 null/undefined 체크
        if (!signupData || 
            !signupData.name || 
            !signupData.email || 
            !signupData.password || 
            !signupData.passwordConfirm ||
            signupData.name.trim() === '' ||
            signupData.email.trim() === '' ||
            signupData.password.trim() === '' ||
            signupData.passwordConfirm.trim() === '') {
          console.error('회원가입 정보 누락 또는 빈 값:', { 
            name: signupData?.name, 
            email: signupData?.email,
            password: signupData?.password ? '[설정됨]' : '[누락]',
            passwordConfirm: signupData?.passwordConfirm ? '[설정됨]' : '[누락]'
          });
          throw new Error('회원가입 정보가 누락되었거나 올바르지 않습니다. 회원가입을 다시 진행해주세요.');
        }
        
        // 데이터 정리 (공백 제거)
        const cleanedSignupData = {
          name: signupData.name.trim(),
          email: signupData.email.trim(),
          password: signupData.password.trim(),
          passwordConfirm: signupData.passwordConfirm.trim()
        };
        
        console.log('정리된 회원가입 데이터:', {
          name: cleanedSignupData.name,
          email: cleanedSignupData.email,
          password: '[보안상 숨김]',
          passwordConfirm: '[보안상 숨김]'
        });

        const response = await emailVerificationService.completeMemberSignup(cleanedSignupData);

        
        // 다양한 응답 형태에 대응
        let isSignupSuccess = false;
        let successMessage = '회원가입이 완료되었습니다!';
        
        if (response && typeof response === 'object') {
          isSignupSuccess = response.status_code === 201 || 
                           response.status === 201 ||
                           response.success === true;
          successMessage = response.status_message || response.message || successMessage;
        } else if (typeof response === 'string') {
          isSignupSuccess = response.includes('성공') || response.includes('완료');
          successMessage = response;
        }
        
        
        if (isSignupSuccess) {
          this.verificationResult = {
            success: true,
            message: successMessage
          };
          
          // 임시 데이터 제거
          sessionStorage.removeItem('pendingSignupData');
        } else {
          console.log('회원가입 실패 처리');
          this.verificationResult = {
            success: false,
            message: successMessage || '회원가입 처리에 실패했습니다.'
          };
        }
        
      } catch (error) {
        console.error('회원가입 완료 에러:', error);
        
        this.verificationResult = {
          success: false,
          message: error.message || '회원가입 처리 중 오류가 발생했습니다.'
        };
      } finally {
        this.isVerifying = false;
      }
    },
    
    async resendVerificationEmail() {
      if (this.resendCooldown > 0) {
        return;
      }
      
      // 재발송 시 세션 스토리지 키 업데이트
      const emailSentKey = `email_sent_${this.userEmail}`;
      sessionStorage.removeItem(emailSentKey); // 기존 키 제거
      
      await this.sendVerificationEmail();
      
      // 재발송 완료 후 다시 설정
      sessionStorage.setItem(emailSentKey, 'true');
    },
    
    resetVerification() {
      this.verificationResult = null;
      this.verificationCode = '';
      this.errorMessage = '';
      this.successMessage = '';
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
    
    goToLogin() {
      this.$router.push('/').catch(() => {
        window.location.href = "/";
      });
    },
    
    goToSignup() {
      this.$router.push('/member/create').catch(() => {
        window.location.href = "/member/create";
      });
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.verification-page-wrapper {
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

/* 인증 콘텐츠 */
.verification-content {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 인증 카드 */
.verification-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  max-width: 500px;
  width: 100%;
}

/* 단계 표시 */
.verification-steps {
  margin-bottom: 32px;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.step.completed .v-icon {
  background: #4caf50;
  color: white;
  border-radius: 50%;
  padding: 4px;
}

.step.active .v-icon {
  background: #667eea;
  color: white;
  border-radius: 50%;
  padding: 4px;
}

.step-text {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step.completed .step-text {
  color: #4caf50;
}

.step.active .step-text {
  color: #667eea;
}

.step-line {
  height: 2px;
  background: #e0e0e0;
  flex: 1;
  margin: 0 8px;
  margin-top: -10px;
}

/* 인증 아이콘 */
.verification-icon {
  opacity: 0.9;
}

/* 인증 제목 */
.verification-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
}

/* 인증 부제목 */
.verification-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  font-weight: 400;
  line-height: 1.6;
  margin-bottom: 24px;
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
  font-size: 24px !important;
  font-weight: 600 !important;
  letter-spacing: 4px;
}

/* 버튼 스타일 */
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

.verify-btn {
  background: #20B2AA !important;
  color: white !important;
}

.verify-btn:hover {
  background: #1a9b94 !important;
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

/* 성공 상태 */
.success--text {
  color: #4caf50 !important;
}

/* 에러 상태 */
.error--text {
  color: #f44336 !important;
}

/* 프로그레스 서클 */
.v-progress-circular {
  margin: 20px 0;
}

/* 알림 */
.v-alert {
  border-radius: 8px !important;
  font-size: 14px;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .top-logo {
    position: relative;
    top: 0;
    left: 0;
    justify-content: center;
    padding: 24px 0;
  }
  
  .top-logo-image {
    height: 28px;
  }
  
  .top-logo-text {
    font-size: 18px;
  }
  
  .verification-content {
    padding: 20px;
  }
  
  .verification-title {
    font-size: 24px;
  }
  
  .verification-subtitle {
    font-size: 14px;
  }
  
  .instruction-text {
    font-size: 13px;
  }
  
  .step-text {
    font-size: 10px;
  }
  
  .step-line {
    margin: 0 4px;
  }
}

/* 애니메이션 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.verification-card {
  animation: fadeInUp 0.6s ease-out;
}

/* 포커스 상태 */
.v-btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
</style>
