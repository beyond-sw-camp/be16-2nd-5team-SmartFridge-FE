<template>
  <div class="dashboard-header">
    <div class="header-info">
      <div class="fridge-title-section">
        <h1 class="fridge-title">{{ fridge.fridgeName }}</h1>
        <div class="fridge-type-badge">
          <v-chip 
            :color="getTypeColor(fridge.type)" 
            size="small" 
            variant="elevated"
            class="type-chip"
          >
            <v-icon start size="16">{{ getTypeIcon(fridge.type) }}</v-icon>
            {{ getTypeText(fridge.type) }}
          </v-chip>
        </div>
      </div>
      <p class="fridge-subtitle">{{ fridge.description }}</p>
    </div>
    <div class="header-actions">
      <div class="notification-icon" @click="showNotificationModal = true">
        <div class="icon-container">
          <v-icon color="amber" size="28">
            mdi-bell-ring
          </v-icon>
          <div 
            v-if="notificationCount > 0" 
            class="notification-badge"
          >
            {{ notificationCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- 알림 모달 -->
    <v-dialog v-model="showNotificationModal" max-width="480" persistent>
      <v-card class="notification-modal">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <v-icon color="primary" size="20" class="mr-2">mdi-bell</v-icon>
            <span>최근 알림</span>
          </div>
          <v-btn 
            icon 
            variant="text" 
            size="small"
            @click="showNotificationModal = false"
            class="close-btn"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="modal-content">
          <div v-if="recentNotifications.length > 0" class="notifications-list">
            <div 
              v-for="(notification, index) in recentNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 'last-item': index === recentNotifications.length - 1, 'unread': !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <v-icon 
                  :color="getNotificationColor(notification.type)"
                  size="16"
                  class="notification-type-icon"
                >
                  {{ getNotificationIcon(notification.type) }}
                </v-icon>
              </div>
              <div class="notification-details">
                <div class="notification-header">
                  <span class="notification-type">{{ getNotificationTypeText(notification.type) }}</span>
                  <span class="notification-time">{{ formatTimeAgo(notification.createdAt || notification.timestamp) }}</span>
                </div>
                <div class="notification-content">
                  {{ notification.content || notification.contents || notification.message || '알림 내용' }}
                </div>
              </div>
              <!-- 읽지 않은 알림 표시 -->
              <div v-if="!notification.isRead" class="unread-indicator">
                <v-icon size="12" color="red">mdi-circle</v-icon>
              </div>
            </div>
          </div>
          <div v-else class="no-notifications">
            <v-icon size="40" color="grey-lighten-2">mdi-bell-off</v-icon>
            <p class="no-notifications-text">수신된 알림이 없습니다</p>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            variant="elevated"
            size="small"
            @click="goToNotificationList"
            :disabled="recentNotifications.length === 0"
            class="view-all-btn"
          >
            <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
            전체 보기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Props 정의
const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  }
});

const fridge = ref({});

const store = useStore();
const router = useRouter();

// 반응형 변수들
const showNotificationModal = ref(false);

// Props로 받은 fridgeId 사용
const notificationCount = computed(() => {
  const count = store.getters['notification/getFridgeNotificationCount'](props.fridgeId);
  console.log(`DashboardHeader - 냉장고 ${props.fridgeId} 알림 카운트:`, count);
  return count;
});
const recentNotifications = computed(() => {
  const notifications = store.getters['notification/getFridgeNotifications'](props.fridgeId);
  console.log(`DashboardHeader - 냉장고 ${props.fridgeId} 알림 목록:`, notifications);
  return notifications;
});

// 냉장고 정보 가져오기 (props로 받은 fridgeId 사용)
const fetchFridgeInfo = async () => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }
    
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${props.fridgeId}/detail`);
    if (response.data.result) {
      fridge.value = response.data.result;
      console.log('냉장고 정보 로딩 완료:', fridge.value);
    }
  } catch (error) {
    console.error('냉장고 정보 로딩 실패:', error);
  }
};

onMounted(() => {
  // 전역 SSE 연결이 이미 App.vue에서 관리되므로 여기서는 별도 연결하지 않음
  console.log('DashboardHeader 마운트됨 - 전역 SSE 연결 사용');
  fetchFridgeInfo();
});

// 전역 SSE 연결이 App.vue에서 관리되므로 별도 연결 코드 제거

// 냉장고 타입 관련 함수들
const getTypeColor = (type) => {
  switch (type) {
    case 'MANAGER': return 'success';  // 관리자: 초록색
    case 'COMMON': return 'info';      // 일반: 파란색
    default: return 'grey';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'MANAGER': return 'mdi-account-cog';  // 관리자: 설정 아이콘
    case 'COMMON': return 'mdi-account';       // 일반: 사용자 아이콘
    default: return 'mdi-account';
  }
};

const getTypeText = (type) => {
  switch (type) {
    case 'MANAGER': return '관리자';  // 관리자
    case 'COMMON': return '일반';     // 일반 멤버
    default: return '멤버';
  }
};

// 알림 관련 함수들

const handleNotificationClick = (notification) => {
  // 알림 클릭 시 읽음 처리
  if (!notification.isRead) {
    store.commit('notification/markFridgeNotificationAsRead', {
      fridgeId: props.fridgeId,
      notificationId: notification.id
    });
  }
};

const goToNotificationList = () => {
  // 알림 목록 페이지로 이동
  router.push('/notification/list');
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '방금 전';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return time.toLocaleDateString();
};

const getNotificationTypeText = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return '관리자 답변';
    case 'NEW_FOOD': return '새로운 음식';
    case 'EXPIRATION_IMMINENT': return '유통기한 임박';
    case 'NEW_ANNOUNCEMENT': return '새로운 공지';
    case 'NEW_COMMENT': return '새로운 댓글';
    case 'NEW_INQUIRY': return '새로운 문의';
    case 'NEW_MEMBER': return '새로운 멤버';
    default: return '알림';
  }
};

// 알림 타입별 아이콘
const getNotificationIcon = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return 'mdi-account-cog';
    case 'NEW_FOOD': return 'mdi-food';
    case 'EXPIRATION_IMMINENT': return 'mdi-clock-alert';
    case 'NEW_ANNOUNCEMENT': return 'mdi-bullhorn';
    case 'NEW_COMMENT': return 'mdi-comment';
    case 'NEW_INQUIRY': return 'mdi-help-circle';
    case 'NEW_MEMBER': return 'mdi-account-plus';
    default: return 'mdi-bell';
  }
};

// 알림 타입별 색상
const getNotificationColor = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return 'blue';
    case 'NEW_FOOD': return 'green';
    case 'EXPIRATION_IMMINENT': return 'red';
    case 'NEW_ANNOUNCEMENT': return 'purple';
    case 'NEW_COMMENT': return 'orange';
    case 'NEW_INQUIRY': return 'indigo';
    case 'NEW_MEMBER': return 'teal';
    default: return 'grey';
  }
};
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-info {
  flex: 1;
}

.fridge-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.fridge-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.fridge-type-badge {
  flex-shrink: 0;
}

.type-chip {
  font-weight: 600;
}

.fridge-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.notification-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: rgba(255, 193, 7, 0.1);
}

.notification-icon:hover {
  background: rgba(255, 193, 7, 0.2);
  transform: translateY(-2px);
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
  border: 2px solid white;
}

.notification-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    align-self: flex-end;
  }
  
  .fridge-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .fridge-title {
    font-size: 24px;
  }
}

/* 알림 모달 스타일 */
.notification-modal {
  border-radius: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  color: #6c757d;
}

.modal-content {
  padding: 24px;
}

.notifications-list {
  max-height: 300px; /* 스크롤 가능한 최대 높이 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* 스크롤 부드럽게 */
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer; /* 클릭 가능하도록 커서 변경 */
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
  padding: 12px;
}

.notification-item:hover {
  background-color: #f8f9fa;
  transform: translateX(4px);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #f0f9eb; /* 읽지 않은 알림 배경색 */
  border-left: 4px solid #4caf50; /* 읽지 않은 알림 테두리 */
}

.notification-item.unread:hover {
  background-color: #e8f5e8;
}

.notification-icon-wrapper {
  flex-shrink: 0;
  margin-right: 12px;
}

.notification-type-icon {
  font-weight: 600;
}

.notification-details {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-type {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.notification-time {
  font-size: 12px;
  color: #6c757d;
}

.notification-content {
  font-size: 14px;
  color: #212529;
  line-height: 1.4;
}

.unread-indicator {
  margin-left: 10px;
  flex-shrink: 0;
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
}

.no-notifications-text {
  margin-top: 16px;
  font-size: 16px;
}

.modal-actions {
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.view-all-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}
.modal-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 16px 24px;

  background-color: #f8f9fa;

  border-bottom: 1px solid #e9ecef;

}



.modal-title {

  display: flex;

  align-items: center;

  font-size: 18px;

  font-weight: 600;

  color: #333;

}



.close-btn {

  color: #6c757d;

}



.modal-content {

  padding: 24px;

}



.notifications-list {

  max-height: 300px; /* 스크롤 가능한 최대 높이 */

  overflow-y: auto;

  -webkit-overflow-scrolling: touch; /* 스크롤 부드럽게 */

}



.notification-item {

  display: flex;

  align-items: center;

  padding: 12px 0;

  border-bottom: 1px solid #e9ecef;

  cursor: pointer; /* 클릭 가능하도록 커서 변경 */
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
  padding: 12px;
}

.notification-item:hover {
  background-color: #f8f9fa;
  transform: translateX(4px);
}



.notification-item:last-child {

  border-bottom: none;

}


.notification-item.unread {
  background-color: #f0f9eb; /* 읽지 않은 알림 배경색 */
  border-left: 4px solid #4caf50; /* 읽지 않은 알림 테두리 */
}

.notification-item.unread:hover {
  background-color: #e8f5e8;
}


.notification-icon-wrapper {

  flex-shrink: 0;

  margin-right: 12px;

}



.notification-type-icon {

  font-weight: 600;

}



.notification-details {

  flex: 1;

}



.notification-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 4px;

}



.notification-type {

  font-size: 14px;

  font-weight: 600;

  color: #495057;

}



.notification-time {

  font-size: 12px;

  color: #6c757d;

}



.notification-content {

  font-size: 14px;

  color: #212529;

  line-height: 1.4;

}


.unread-indicator {
  margin-left: 10px;
  flex-shrink: 0;
}


.no-notifications {

  text-align: center;

  padding: 40px 20px;

}



.no-notifications-text {

  margin-top: 16px;

  font-size: 16px;

}



.modal-actions {

  padding: 16px 24px;

  background-color: #f8f9fa;

  border-top: 1px solid #e9ecef;

}



.view-all-btn {

  font-weight: 600;

  text-transform: none;

  letter-spacing: normal;

}

</style>
