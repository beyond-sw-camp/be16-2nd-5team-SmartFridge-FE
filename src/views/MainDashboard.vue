<template>
  <div class="main-dashboard">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="gradient-text">SmartFridge</span>
              <br>스마트한 냉장고 관리의 시작
            </h1>
            <p class="hero-subtitle">
               공용냉장고를 스마트하게 관리하여 음식 낭비를 줄이고, 함께 사용하는 공간을 효율적으로 운영해보세요
             </p>
            <div class="cta-content">
              <h2 class="cta-title">지금 바로 시작해보세요</h2>
              <p class="cta-subtitle">
                SmartFridge와 함께 더 스마트한 냉장고 관리 경험을 만들어보세요
              </p>
              <v-btn
                size="x-large"
                color="primary"
                class="cta-button-large"
                :to="'/login'"
                elevation="8"
                rounded="xl"
              >
                <v-icon start icon="mdi-rocket-launch"></v-icon>
                무료로 시작하기
              </v-btn>
            </div>
          </div>
          <div class="hero-image">
            <div class="hero-img-container">
              <img
                :src="heroImageUrl"
                alt="SmartFridge Hero"
                class="hero-img"
              />
              <div class="hero-img-glow"></div>
            </div>
          </div>
        </div>
      </v-container>
    </section>

    <!-- Features Section -->
    <section class="features-section" ref="featuresSection">
      <v-container>
        <div class="section-header">
          <h2 class="section-title">SmartFridge의 핵심 기능</h2>
          <p class="section-subtitle">더 스마트하고 효율적인 냉장고 관리</p>
        </div>
        
        <v-row class="features-grid">
          <v-col cols="12" md="6" v-for="feature in features" :key="feature.title">
            <v-card class="feature-card" elevation="4" rounded="xl">
              <div class="feature-icon-wrapper">
                <v-icon :icon="feature.icon" size="56" :color="feature.color"></v-icon>
              </div>
              <v-card-title class="feature-title">{{ feature.title }}</v-card-title>
              <v-card-text class="feature-description">
                {{ feature.description }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <v-container>
        <v-row class="stats-grid">
          <v-col cols="12" sm="6" md="3" v-for="stat in stats" :key="stat.label">
            <div class="stat-item">
              <div class="stat-number">{{ stat.number }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section">
      <v-container>
        <div class="section-header">
          <h2 class="section-title">사용 방법</h2>
          <p class="section-subtitle">간단한 3단계로 시작하세요</p>
        </div>
        
        <v-row class="steps-grid">
          <v-col cols="12" md="4" v-for="(step, index) in steps" :key="step.title">
            <div class="step-item">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-description">{{ step.description }}</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const featuresSection = ref(null);

// Hero 이미지 URL (로고 이미지 사용)
const heroImageUrl = new URL('../assets/images/SFlogo/smartFridge_logo.png', import.meta.url).href;

// 핵심 기능 데이터
const features = ref([
  {
    title: '실시간 공유',
    description: '기숙사, 회사 등 공용공간 사용자들과 냉장고 내용을 실시간으로 공유하고 협력하여 관리할 수 있습니다.',
    icon: 'mdi-account-group',
    color: 'green'
  },
  {
    title: '스마트 알림',
    description: '유통기한 임박, 재료 부족 등 중요한 정보를 적시에 알려주어 음식 낭비를 방지합니다.',
    icon: 'mdi-bell-ring',
    color: 'orange'
  },
  {
    title: '커뮤니티',
    description: '다른 사용자들과 요리 팁과 레시피를 공유하고 소통할 수 있습니다.',
    icon: 'mdi-chat',
    color: 'teal'
  },
  {
    title: '데이터 분석',
    description: '식품 소비 패턴을 분석하여 더 효율적인 장보기와 식단 계획을 도와드립니다.',
    icon: 'mdi-chart-line',
    color: 'indigo'
  }
]);

// 통계 데이터
const stats = ref([
  { number: '10,000+', label: '활성 사용자' },
  { number: '50,000+', label: '관리된 식품' },
  { number: '95%', label: '사용자 만족도' },
  { number: '30%', label: '음식 낭비 감소' }
]);

// 사용 방법 단계
const steps = ref([
  {
    title: '회원가입',
    description: '간단한 회원가입으로 SmartFridge 계정을 만드세요.'
  },
     {
     title: '냉장고 설정',
     description: '공용공간 사용자들을 초대하고 냉장고를 설정하세요.'
   },
  {
    title: '식품 관리',
    description: '모든 음식의 유통기한을 등록하고 냉장고에서 유통기한 관리를 해보세요.'
  }
]);

// 기능 섹션으로 스크롤

</script>

<style scoped>
.main-dashboard {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 100vh;
  min-height: 100vh;
  padding: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.hero-container {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 60px;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cta-button {
  background: linear-gradient(45deg, #ffd700, #ffed4e) !important;
  color: #333 !important;
  font-weight: 700;
  padding: 16px 32px;
  text-transform: none;
  font-size: 1.1rem;
}

.learn-more-button {
  border: 2px solid white;
  padding: 16px 32px;
  text-transform: none;
  font-size: 1.1rem;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-img-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-img {
  max-width: 500px;
  height: auto;
  border-radius: 50%;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4));
  transition: all 0.3s ease;
  animation: float 6s ease-in-out infinite;
}

.hero-img:hover {
  transform: scale(1.05) rotate(5deg);
  filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5));
}

.hero-img-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 40%, transparent 70%);
  border-radius: 50%;
  animation: glow 4s ease-in-out infinite alternate;
  z-index: -1;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes glow {
  0% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* Features Section */
.features-section {
  padding: 100px 0;
  background: #f8f9fa;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  margin-top: 40px;
}

.feature-card {
  height: 100%;
  min-height: 280px;
  padding: 50px 30px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: none;
  background: white;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
}

.feature-icon-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
}

.feature-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.feature-description {
  color: #666;
  line-height: 1.6;
  font-size: 1.1rem;
}

/* Stats Section */
.stats-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-grid {
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-label {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 500;
}

/* How It Works Section */
.how-it-works-section {
  padding: 100px 0;
  background: white;
}

.steps-grid {
  margin-top: 60px;
}

.step-item {
  text-align: center;
  padding: 20px;
}

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 auto 24px;
}

.step-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.step-description {
  color: #666;
  line-height: 1.6;
}

/* CTA Content in Hero Section */
.cta-content {
  text-align: left;
  margin-top: 40px;
  width: 100%;
  max-width: 600px;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: white;
}

.cta-subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
  color: white;
}

.cta-button-large {
  background: linear-gradient(45deg, #ffd700, #ffed4e) !important;
  color: #333 !important;
  font-weight: 700;
  padding: 16px 24px;
  text-transform: none;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: fit-content;
}

/* Responsive Design */
@media (max-width: 960px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .cta-title {
    font-size: 2rem;
  }
  
  .cta-content {
    margin-top: 30px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    height: 100vh;
    min-height: 100vh;
    padding: 0;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .features-section,
  .how-it-works-section {
    padding: 60px 0;
  }
  
  .stats-section {
    padding: 60px 0;
  }
  
  .stat-number {
    font-size: 2.5rem;
  }
  
  .cta-title {
    font-size: 1.8rem;
  }
  
  .cta-subtitle {
    font-size: 1rem;
  }
  
  .cta-content {
    margin-top: 20px;
    padding: 0 20px;
  }
}
</style>