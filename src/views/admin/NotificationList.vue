<template>
  <div class="admin-layout">
    <div class="notification-list">
      <div class="header">
        <h1>알림 목록</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item active">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="typeFilter" @change="filterNotifications">
          <option value="">전체 타입</option>
          <option value="문의등록">문의등록</option>
          <option value="답변완료">답변완료</option>
          <option value="시스템">시스템</option>
          <option value="사용자">사용자</option>
          <option value="식품만료알림">식품만료알림</option>
          <option value="냉장고초대">냉장고초대</option>
        </select>
        <select v-model="readFilter" @change="filterNotifications">
          <option value="">전체 상태</option>
          <option value="읽지않음">읽지않음</option>
          <option value="읽음">읽음</option>
        </select>
        <button @click="markAllAsRead" class="mark-read-btn">모두 읽음 처리</button>
      </div>

      <div class="notification-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>타입</th>
              <th>제목</th>
              <th>내용</th>
              <th>상태</th>
              <th>생성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="notification in filteredNotifications" :key="notification.id" 
                :class="{ unread: notification.status === '읽지않음' }">
              <td>{{ notification.id }}</td>
              <td>
                <span :class="getTypeClass(notification.type)">
                  {{ notification.type }}
                </span>
              </td>
              <td>{{ notification.title }}</td>
              <td>{{ notification.content }}</td>
              <td>
                <span :class="notification.status === '읽음' ? 'read' : 'unread'">
                  {{ notification.status }}
                </span>
              </td>
              <td>{{ notification.createdAt }}</td>
              <td>
                <button @click="viewNotification(notification)" class="view-btn">보기</button>
                <button v-if="notification.status === '읽지않음'" @click="markAsRead(notification)" class="read-btn">읽음</button>
                <button @click="deleteNotification(notification)" class="delete-btn">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 알림 상세 보기 모달 -->
      <div v-if="selectedNotification" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedNotification.title }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="notification-detail">
              <p><strong>타입:</strong> {{ selectedNotification.type }}</p>
              <p><strong>생성일:</strong> {{ selectedNotification.createdAt }}</p>
              <p><strong>상태:</strong> {{ selectedNotification.status }}</p>
              <p><strong>내용:</strong></p>
              <div class="content">{{ selectedNotification.content }}</div>
              
              <div v-if="selectedNotification.relatedData" class="related-data">
                <h3>관련 정보</h3>
                <pre>{{ JSON.stringify(selectedNotification.relatedData, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="modal-actions">
              <button v-if="selectedNotification.status === '읽지않음'" @click="markAsRead(selectedNotification)" class="read-btn">읽음 처리</button>
              <button @click="closeModal" class="close-modal-btn">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'NotificationList',
  data() {
    return {
      notifications: [],
      filteredNotifications: [],
      typeFilter: '',
      readFilter: '',
      selectedNotification: null,
      loading: true
    }
  },
  mounted() {
    this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/notification/list`);
        
        if (response.data.status_code === 200) {
          this.notifications = response.data.result.map(notification => ({
            id: notification.notificationId,
            type: this.getNotificationTypeKorean(notification.type),
            title: notification.title || '알림',
            content: notification.message,
            status: notification.isRead ? '읽음' : '읽지않음',
            createdAt: notification.createdTime ? new Date(notification.createdTime).toLocaleString() : '-',
            relatedData: notification.relatedData || null
          }));
          this.filteredNotifications = [...this.notifications];
        }
      } catch (error) {
        console.error('알림 목록 로드 실패:', error);
        this.$store.dispatch('showSnackbar', {
          message: '알림 목록 로드에 실패했습니다.',
          color: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    getNotificationTypeKorean(type) {
      const typeMap = {
        'INQUIRY_CREATED': '문의등록',
        'ADMIN_REPLY': '답변완료',
        'SYSTEM': '시스템',
        'USER': '사용자',
        'FOOD_EXPIRY_WARNING': '식품만료알림',
        'FRIDGE_INVITATION': '냉장고초대'
      };
      return typeMap[type] || type;
    },
    
    filterNotifications() {
      let filtered = [...this.notifications];
      
      if (this.typeFilter) {
        filtered = filtered.filter(notification => notification.type === this.typeFilter);
      }
      
      if (this.readFilter) {
        filtered = filtered.filter(notification => notification.status === this.readFilter);
      }
      
      this.filteredNotifications = filtered;
    },
    
    getTypeClass(type) {
      const classes = {
        '문의등록': 'type-inquiry',
        '시스템': 'type-system',
        '사용자': 'type-user'
      };
      return classes[type] || '';
    },
    
    viewNotification(notification) {
      this.selectedNotification = notification;
    },
    
    async markAsRead(notification) {
      try {
        // 백엔드 알림 읽음 처리 API 호출
        const response = await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/notification/isRead`, [
          {
            notificationId: notification.id
          }
        ]);
        
        if (response.data.status_code === 200) {
          notification.status = '읽음';
          
          // 목록 업데이트
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index] = { ...notification };
          }
          
          this.filterNotifications();
          
          if (this.selectedNotification && this.selectedNotification.id === notification.id) {
            this.selectedNotification.status = '읽음';
          }
          
          this.$store.dispatch('showSnackbar', {
            message: '알림이 읽음 처리되었습니다.',
            color: 'success'
          });
        }
      } catch (error) {
        console.error('읽음 처리 실패:', error);
        console.error('Error details:', error.response?.data);
        this.$store.dispatch('showSnackbar', {
          message: '읽음 처리에 실패했습니다.',
          color: 'error'
        });
      }
    },
    
    async markAllAsRead() {
      try {
        // 읽지 않은 알림들만 필터링
        const unreadNotifications = this.notifications.filter(n => n.status === '읽지않음');
        
        if (unreadNotifications.length === 0) {
          this.$store.dispatch('showSnackbar', {
            message: '읽지 않은 알림이 없습니다.',
            color: 'info'
          });
          return;
        }
        
        // 읽지 않은 알림들의 ID 배열 생성
        const notificationReadList = unreadNotifications.map(notification => ({
          notificationId: notification.id
        }));
        
        // 백엔드 전체 읽음 처리 API 호출
        const response = await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/notification/isRead`, notificationReadList);
        
        if (response.data.status_code === 200) {
          // 모든 알림을 읽음으로 변경
          this.notifications.forEach(notification => {
            if (notification.status === '읽지않음') {
              notification.status = '읽음';
            }
          });
          
          this.filterNotifications();
          
          this.$store.dispatch('showSnackbar', {
            message: '모든 알림이 읽음 처리되었습니다.',
            color: 'success'
          });
        }
      } catch (error) {
        console.error('전체 읽음 처리 실패:', error);
        console.error('Error details:', error.response?.data);
        this.$store.dispatch('showSnackbar', {
          message: '전체 읽음 처리에 실패했습니다.',
          color: 'error'
        });
      }
    },
    
    async deleteNotification(notification) {
      if (confirm('이 알림을 삭제하시겠습니까?')) {
        try {
          // 백엔드 알림 삭제 API 호출
          const response = await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/notification/delete/${notification.id}`);
          
          if (response.data.status_code === 200) {
            // 목록에서 해당 알림 제거
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index !== -1) {
              this.notifications.splice(index, 1);
            }
            
            this.filterNotifications();
            
            // 현재 선택된 알림이 삭제된 알림과 같다면 모달 닫기
            if (this.selectedNotification && this.selectedNotification.id === notification.id) {
              this.closeModal();
            }
            
            this.$store.dispatch('showSnackbar', {
              message: '알림이 삭제되었습니다.',
              color: 'success'
            });
          }
        } catch (error) {
          console.error('알림 삭제 실패:', error);
          console.error('Error details:', error.response?.data);
          this.$store.dispatch('showSnackbar', {
            message: '알림 삭제에 실패했습니다.',
            color: 'error'
          });
        }
      }
    },
    
    closeModal() {
      this.selectedNotification = null;
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

.notification-list {
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

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.filters select {
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.filters select:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.mark-read-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.mark-read-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
}

.notification-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-table table {
  width: 100%;
  border-collapse: collapse;
}

.notification-table th, .notification-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-table th {
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notification-table td {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.notification-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notification-table tr.unread {
  background: rgba(251, 188, 4, 0.05);
  border-left: 4px solid #fbbc04;
}

.type-inquiry {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.type-system {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
}

.type-user {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 2px 8px rgba(234, 67, 53, 0.3);
}

.read {
  color: #34a853;
  font-weight: 600;
  background: rgba(52, 168, 83, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.unread {
  color: #fbbc04;
  font-weight: 600;
  background: rgba(251, 188, 4, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.view-btn, .read-btn, .delete-btn {
  margin: 0 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.3s ease;
}

.view-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.read-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
}

.read-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(234, 67, 53, 0.3);
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow-y: auto;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.content {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  margin: 16px 0;
  white-space: pre-wrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 1.6;
}

.related-data {
  margin-top: 24px;
}

.related-data h3 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.related-data pre {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .notification-list {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters select {
    width: 100%;
  }
  
  .notification-table {
    overflow-x: auto;
  }
  
  .notification-table th, .notification-table td {
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header h2 {
    font-size: 20px;
  }
}
</style>
