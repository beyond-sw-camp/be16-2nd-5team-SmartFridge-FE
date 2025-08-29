<template>
  <div class="notification-page">
    <!-- 헤더 영역 -->
    <div class="header-section">
      <h3 class="page-title">알림 목록</h3>
      <v-btn 
        @click="readAll()" 
        class="read-all-btn d-flex justify-center align-center"
        color="primary"
        variant="elevated"
      >
        모두 읽음
      </v-btn>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <v-tabs
        v-model="selectedTab"
        @update:model-value="filterByTab"
        class="custom-tabs"
        color="primary"
      >
        <v-tab value="all">전체</v-tab>
        <v-tab value="food-register">식품등록 알림</v-tab>
        <v-tab value="expiration">유통기한 알림</v-tab>
        <v-tab value="post">게시글 알림</v-tab>
        <v-tab value="comment">댓글알림</v-tab>
        <v-tab value="inquiry-reply">문의 답변</v-tab>
        <v-tab 
          v-if="userType === 'MANAGER'" 
          value="member"
        >
          멤버 참여
        </v-tab>
      </v-tabs>
    </div>

    <!-- 알림 리스트 -->
    <div class="notification-list">
      <div
        v-for="notification in sortedNotifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 
          'read': notification.read,
          'food-register-border': getNotificationType(notification) === 'food-register',
          'expiration-border': getNotificationType(notification) === 'expiration',
          'post-border': getNotificationType(notification) === 'post',
          'comment-border': getNotificationType(notification) === 'comment',
          'inquiry-reply-border': getNotificationType(notification) === 'inquiry-reply',
          'member-border': getNotificationType(notification) === 'member',
          'other-border': getNotificationType(notification) === 'other'
        }"
        @click="goToDetail(notification)"
        @mouseenter="handleMouseEnter(notification.id)"
        @mouseleave="handleMouseLeave()"
      >
        <!-- 좌측: 알림 내용 -->
        <div class="notification-content">
          <div class="notification-tags">
            <div v-if="getNotificationType(notification) === 'expiration'" class="expiration-info">
              <v-chip 
                :color="isUrgentExpiration(notification) ? 'red' : 'orange'"
                size="small"
                variant="outlined"
                class="expiration-chip"
              >
                <v-icon size="16" class="mr-1">
                  {{ isUrgentExpiration(notification) ? 'mdi-alert' : 'mdi-clock-outline' }}
                </v-icon>
                {{ getExpirationDays(notification) }}일 남음
              </v-chip>
            </div>
            
            <div v-if="getNotificationType(notification) === 'food-register'" class="food-info">
              <v-chip color="green" size="small" variant="outlined" class="food-chip">
                <v-icon size="16" class="mr-1">mdi-food</v-icon>
                새로운 음식 등록
              </v-chip>
            </div>

            <div v-if="getNotificationType(notification) === 'comment'" class="comment-info">
              <v-chip color="blue" size="small" variant="outlined" class="comment-chip">
                <v-icon size="16" class="mr-1">mdi-comment</v-icon>
                새로운 댓글
              </v-chip>
            </div>

            <div v-if="getNotificationType(notification) === 'inquiry-reply'" class="inquiry-reply-info">
              <v-chip color="blue" size="small" variant="outlined" class="inquiry-reply-chip">
                <v-icon size="16" class="mr-1">mdi-reply</v-icon>
                문의 답변
              </v-chip>
            </div>

            <div v-if="getNotificationType(notification) === 'post'" class="post-info">
              <v-chip color="purple" size="small" variant="outlined" class="post-chip">
                <v-icon size="16" class="mr-1">mdi-bullhorn</v-icon>
                새로운 공지
              </v-chip>
            </div>

            <div v-if="getNotificationType(notification) === 'member'" class="member-info">
              <v-chip color="teal" size="small" variant="outlined" class="member-chip">
                <v-icon size="16" class="mr-1">mdi-account-plus</v-icon>
                새로운 멤버
              </v-chip>
            </div>
          </div>
          
          <div class="notification-body">
            <div class="notification-message">
              {{ getNotificationText(notification) }}
            </div>
          </div>
        </div>

        <!-- 우측: 삭제 버튼과 시간 -->
        <div class="notification-right">
          <div class="delete-btn" @click.stop="confirmDelete(notification)">
            <v-icon size="small" color="grey" v-show="hoveredId === notification.id">
              mdi-close
            </v-icon>
          </div>
          <div class="notification-time">
            {{ formatTimeAgo(notification.createdAt) }}
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-indicator">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <span class="loading-text">알림을 불러오는 중...</span>
      </div>
      
      <div v-else-if="hasMoreData" class="load-more-section">
        <v-btn @click="loadMoreData" variant="outlined" color="primary" class="load-more-btn">
          더 보기
        </v-btn>
      </div>
      
      <div v-else-if="notificationList.length > 0" class="no-more-data">
        <span class="no-more-text">모든 알림을 불러왔습니다</span>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">알림 삭제</v-card-title>
        <v-card-text>정말 삭제하시겠습니까?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="red" @click="deleteNotification">삭제</v-btn>
          <v-btn text color="grey" @click="deleteDialog = false">취소</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from "axios";
import { getFridgeId } from '@/utils/commonDataHandler';

// Vue Router와 Vuex Store 인스턴스 가져오기
const store = useStore();
const router = useRouter();

// reactive 상태 변수 정의
const notificationList = ref([]);
const selectedTab = ref("all");
const selectedCategory = ref("ALL");
const fridgeId = ref(getFridgeId(store));
const hoveredId = ref(null);
const deleteDialog = ref(false);
const deleteTarget = ref(null);
const userType = ref('COMMON');
const currentPage = ref(0);
const pageSize = ref(20);
const hasMoreData = ref(true);
const isLoading = ref(false);

// methods를 일반 함수로 변환
const fetchNotifications = async (isLoadMore = false) => {
  if (isLoading.value) return;
  isLoading.value = true;
  
  try {
    let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/notification/list`;
    const params = new URLSearchParams();
    if (selectedCategory.value !== "ALL") {
      if (selectedCategory.value.includes(',')) {
        selectedCategory.value.split(',').forEach(type => {
          params.append('notificationType', type.trim());
        });
      } else {
        params.append('notificationType', selectedCategory.value);
      }
    }
    params.append('page', currentPage.value.toString());
    params.append('size', pageSize.value.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await axios.get(url);
    const newNotifications = response.data.result.content;

    if (isLoadMore) {
      notificationList.value = [...notificationList.value, ...newNotifications];
    } else {
      notificationList.value = newNotifications;
      setUserType();
    }

    hasMoreData.value = newNotifications.length === pageSize.value;
  } catch (error) {
    console.error('알림 조회 실패:', error);
  } finally {
    isLoading.value = false;
  }
};

const setUserType = () => {
  if (notificationList.value.length > 0) {
    const memberType = notificationList.value[0].fridgeMemberType;
    if (!memberType) userType.value = 'ADMIN';
    else userType.value = memberType === 'MANAGER' ? 'MANAGER' : 'COMMON';
  }
};

const filterByTab = (tab) => {
  selectedTab.value = tab;
  if (tab === "qa") {
    return;
  }
  let category = "ALL";
  if (tab === "food-register") category = "NEW_FOOD";
  else if (tab === "expiration") category = "EXPIRATION_IMMINENT";
  else if (tab === "post") category = "NEW_ANNOUNCEMENT";
  else if (tab === "comment") category = "NEW_COMMENT";
  else if (tab === "inquiry-reply") category = "INQUIRY_REPLY,NEW_INQUIRY";
  else if (tab === "member") category = "NEW_MEMBER";
  selectedCategory.value = category;
  resetPagination();
  fetchNotifications();
};

const getNotificationType = (notification) => {
  if (notification.type === "NEW_FOOD") return "food-register";
  if (notification.type === "EXPIRATION_IMMINENT") return "expiration";
  if (notification.type === "NEW_ANNOUNCEMENT") return "post";
  if (notification.type === "NEW_COMMENT") return "comment";
  if (notification.type === "INQUIRY_REPLY") return "inquiry-reply";
  if (notification.type === "NEW_INQUIRY") return "inquiry-reply";
  if (notification.type === "NEW_MEMBER") return "member";
  return "other";
};

const getNotificationText = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return `${notification.content || '음식'}의 유통기한이 곧 만료됩니다`;
  if (notification.type === "NEW_FOOD") return `${notification.content || '새로운 음식'}이 냉장고에 등록되었습니다`;
  if (notification.type === "NEW_ANNOUNCEMENT") return `${notification.content || '새로운 공지사항'}이 게시되었습니다`;
  if (notification.type === "NEW_COMMENT") return `${notification.content || '새로운 댓글'}이 등록되었습니다`;
  if (notification.type === "INQUIRY_REPLY") return `${notification.content || '새로운 문의 답변'}이 등록되었습니다`;
  if (notification.type === "NEW_INQUIRY") return `${notification.content || '새로운 문의'}가 등록되었습니다`;
  if (notification.type === "NEW_MEMBER") return `${notification.content || '새로운 멤버'}가 냉장고에 참여했습니다`;
  return notification.content || '새로운 알림이 있습니다';
};

const getExpirationDays = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") {
    const today = new Date();
    const expirationDate = new Date(notification.expirationDate || notification.createdAt);
    return Math.max(0, Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24)));
  }
  return 0;
};

const isUrgentExpiration = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return getExpirationDays(notification) <= 3;
  return false;
};

const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays}일 전`;
  else if (diffHours > 0) return `${diffHours}시간 전`;
  return "방금 전";
};

const goToDetail = (notification) => {
  if (notification.targetType === "ANNOUNCE") router.push(`/fridge/${fridgeId.value}/post/${notification.targetId}`);
  else if (notification.targetType === "FOOD") router.push(`/food/${notification.targetId}`);
};

const confirmDelete = (notification) => {
  deleteTarget.value = notification;
  deleteDialog.value = true;
};

const deleteNotification = async () => {
  if (!deleteTarget.value) return;
  try {
    await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/notification/delete/${deleteTarget.value.id}`);
    notificationList.value = notificationList.value.filter(n => n.id !== deleteTarget.value.id);
    deleteDialog.value = false;
    deleteTarget.value = null;
  } catch (error) {
    console.error('알림 삭제 실패:', error);
  }
};

const handleMouseEnter = (notificationId) => { hoveredId.value = notificationId; };
const handleMouseLeave = () => { hoveredId.value = null; };

const resetPagination = () => { 
  currentPage.value = 0;
  hasMoreData.value = true;
  notificationList.value = [];
};

const loadMoreData = async () => { 
  if (!hasMoreData.value || isLoading.value) return;
  currentPage.value++;
  await fetchNotifications(true);
};

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  if (scrollTop + windowHeight >= documentHeight - 100) loadMoreData();
};

const readAll = async () => {
  try {
    const readNotification = notificationList.value.map(n => ({ notificationId: n.id }));
    await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/notification/isRead`, readNotification);
    await fetchNotifications();
  } catch (error) { console.error('모두 읽음 처리 실패:', error); }
};

// computed 속성
const sortedNotifications = computed(() => {
  let filteredNotifications = notificationList.value;
  if (selectedCategory.value !== "ALL") {
    filteredNotifications = filteredNotifications.filter(n => n.type === selectedCategory.value);
  }
  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);
  const sortedUnread = unreadNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedRead = readNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return [...sortedUnread, ...sortedRead];
});

// 라이프사이클 훅
onMounted(async () => {
  await fetchNotifications();
  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>


<style scoped>
.notification-page {
  width: 100%;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f4ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 40px 50px 20px 50px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.read-all-btn {
  background: #667eea;
  color: white;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
  text-transform: none;
  border: none;
  transition: background-color 0.2s ease;
}

.read-all-btn:hover {
  background: #5a6fd8;
}

.tab-navigation {
  margin-bottom: 30px;
  padding: 0 50px;
}

.custom-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 50px 30px 50px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-left: 4px solid transparent;
}

/* 알림 타입별 왼쪽 테두리 색상 */
.notification-item.food-register-border {
  border-left-color: #61d02d;
}

.notification-item.expiration-border {
  border-left-color: #eb3c4e;
}

.notification-item.post-border {
  border-left-color: #28a745;
}

.notification-item.comment-border {
  border-left-color: #17a2b8;
}

.notification-item.inquiry-reply-border {
  border-left-color: #4285f4;
}

.notification-item.qa-border {
  border-left-color: #6f42c1;
}

.notification-item.member-border {
  border-left-color: #fd7e14;
}

.notification-item.admin-reply-border {
  border-left-color: #007bff;
}

.notification-item.other-border {
  border-left-color: #6c757d;
}

.notification-item:nth-child(even) {
  background: #fff;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.notification-item.read {
  background: #f8f9fa;
  opacity: 0.8;
}

.notification-item.read .notification-title {
  color: #6c757d;
  font-weight: 500;
}

.notification-item.read .notification-message {
  color: #6c757d;
  font-weight: 400;
}

.notification-item.read .notification-time {
  background-color: #e9ecef;
  color: #6c757d;
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
  background-color: #ffebee;
  transform: scale(1.1);
}

.delete-btn .v-icon {
  transition: color 0.2s ease;
}

.delete-btn:hover .v-icon {
  color: #d32f2f !important;
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-right: 16px;
  margin-left: 16px;
}

.notification-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 32px;
  flex-shrink: 0;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;
  flex: 1;
}

.notification-time {
  font-size: 0.75rem;
  color: #6c757d;
  white-space: nowrap;
  padding: 2px 8px;
  background-color: #f8f9fa;
  border-radius: 12px;
  font-weight: 500;
}

.notification-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 2px 0;
}

.notification-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-message {
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.5;
  font-weight: 400;
}

.expiration-info,
.food-info,
.comment-info,
.inquiry-reply-info {
  display: flex;
  align-items: center;
}

.expiration-chip,
.food-chip,
.comment-chip,
.inquiry-reply-chip {
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 16px;
  height: 24px;
}

.expiration-chip {
  border-color: #ff9800;
  color: #e65100;
}

.food-chip {
  border-color: #4caf50;
  color: #2e7d32;
}

.comment-chip {
  border-color: #2196f3;
  color: #1565c0;
}

.inquiry-reply-chip {
  border-color: #4285f4;
  color: #1a73e8;
}

.post-chip {
  border-color: #9c27b0;
  color: #6a1b9a;
}

.qa-chip {
  border-color: #3f51b5;
  color: #283593;
}

.member-chip {
  border-color: #009688;
  color: #00695c;
}

.admin-reply-chip {
  border-color: #2196f3;
  color: #1565c0;
}

/* Vuetify 탭 스타일 오버라이드 */
:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  color: #6c757d;
  flex: 1;
  min-width: 0;
}

:deep(.v-tab--selected) {
  color: #2c3e50;
  font-weight: 600;
}

:deep(.v-tab__slider) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.v-tabs__wrapper) {
  width: 100%;
}

:deep(.v-tabs__bar) {
  width: 100%;
}

/* 로딩 및 더 보기 관련 스타일 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.loading-text {
  color: #6c757d;
  font-size: 0.875rem;
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 30px 20px;
}

.load-more-btn {
  min-width: 120px;
}

.no-more-data {
  display: flex;
  justify-content: center;
  padding: 30px 20px;
}

.no-more-text {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}
</style>