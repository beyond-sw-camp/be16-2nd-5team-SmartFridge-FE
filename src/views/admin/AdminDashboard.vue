<template>
  <div class="admin-layout">
    <div class="admin-dashboard">
      <div class="header">
        <h1>관리자 대시보드</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item active">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>
      
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>총 문의 수</h3>
          <p>{{ inquiryCount }}</p>
        </div>
        <div class="stat-card">
          <h3>미답변 문의</h3>
          <p>{{ unansweredCount }}</p>
        </div>
        <div class="stat-card">
          <h3>총 사용자 수</h3>
          <p>{{ userCount }}</p>
        </div>
        <div class="stat-card">
          <h3>새 알림</h3>
          <p>{{ newNotificationCount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      inquiryCount: 0,
      unansweredCount: 0,
      userCount: 0,
      newNotificationCount: 0,
      loading: true
    }
  },
  mounted() {
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/dashboard`);
        
        if (response.data.status_code === 200) {
          const data = response.data.result;
          this.inquiryCount = data.inquiryCount || 0;
          this.unansweredCount = data.unansweredCount || 0;
          this.userCount = data.userCount || 0;
          this.newNotificationCount = data.newNotification || 0;
        }
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        this.$store.dispatch('showSnackbar', {
          message: '대시보드 데이터 로드에 실패했습니다.',
          color: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-dashboard {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logout-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.3);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234, 67, 53, 0.4);
}

.navigation-menu {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item {
  padding: 12px 24px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

.nav-item.active {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 40px 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px 24px;
  border-radius: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4285f4, #34a853, #fbbc04, #ea4335);
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-card h3 {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card p {
  font-size: 48px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.quick-actions {
  margin: 40px 0;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-btn {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  padding: 16px 32px;
  text-decoration: none;
  border-radius: 16px;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(66, 133, 244, 0.4);
}

.recent-inquiries {
  margin: 40px 0;
}

.inquiry-item {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  margin: 8px 0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.inquiry-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(8px);
}

.inquiry-item span {
  flex: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .dashboard-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card p {
    font-size: 36px;
  }
  
  .navigation-menu {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .nav-item {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
