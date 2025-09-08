<template>
  <div class="notification-page">
    <!-- 헤더 영역 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">알림</h1>
          <p class="page-subtitle">새로운 소식과 중요한 알림을 확인하세요</p>
        </div>
        <div class="header-actions">
          <v-btn 
            @click="readAll()" 
            class="read-all-btn"
            color="primary"
            variant="elevated"
            prepend-icon="mdi-check-all"
            size="large"
          >
            모두 읽음
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <v-card class="main-content-card">
      <!-- 탭 네비게이션 -->
      <v-card-title class="notification-tabs-header">
        <v-tabs
          v-model="selectedTab"
          @update:model-value="filterByTab"
          class="notification-tabs"
          color="primary"
          density="compact"
        >
          <v-tab value="all" class="notification-tab">전체</v-tab>
          <v-tab value="food-register" class="notification-tab">식품등록</v-tab>
          <v-tab value="expiration" class="notification-tab">유통기한</v-tab>
          <v-tab value="post" class="notification-tab">게시글</v-tab>
          <v-tab value="comment" class="notification-tab">댓글</v-tab>
          <v-tab value="inquiry-reply" class="notification-tab">문의답변</v-tab>
          <v-tab value="group-chat" class="notification-tab">공동 구매 채팅</v-tab>
          <v-tab 
            v-if="userType === 'MANAGER'" 
            value="member"
            class="notification-tab"
          >
            멤버참여
          </v-tab>
        </v-tabs>
      </v-card-title>

      <!-- 알림 리스트 -->
      <v-card-text class="notification-list">
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
          'group-chat-border': getNotificationType(notification) === 'group-chat',
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

            <div v-if="getNotificationType(notification) === 'group-chat'" class="group-chat-info">
              <v-chip color="teal" size="small" variant="outlined" class="group-chat-chip">
                <v-icon size="16" class="mr-1">mdi-chat</v-icon>
                공동 구매 채팅
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
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="loading-text">알림을 불러오는 중...</p>
        </div>
        
        <div v-else-if="hasMoreData" class="load-more-section">
          <v-btn @click="loadMoreData" variant="outlined" color="primary" class="load-more-btn" size="large">
            더 보기
          </v-btn>
        </div>
        
        <div v-else-if="notificationList.length > 0" class="no-more-data">
          <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-check-circle</v-icon>
          <p class="no-more-text">모든 알림을 불러왔습니다</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card class="delete-dialog-card">
        <v-card-title class="delete-dialog-header">
          <v-icon left color="error" size="24">mdi-alert-circle</v-icon>
          알림 삭제 확인
        </v-card-title>
        <v-card-text class="delete-dialog-content">
          <p class="delete-warning-text">선택한 알림을 정말 삭제하시겠습니까?</p>
          <p class="delete-info-text">삭제된 알림은 복구할 수 없습니다.</p>
        </v-card-text>
        <v-card-actions class="delete-dialog-actions">
          <v-spacer></v-spacer>
          <v-btn 
            @click="deleteDialog = false" 
            variant="outlined" 
            color="grey"
            class="mr-3"
          >
            취소
          </v-btn>
          <v-btn 
            @click="deleteNotification" 
            color="error" 
            variant="elevated"
          >
            <v-icon left>mdi-delete</v-icon>
            삭제
          </v-btn>
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
  
  // 냉장고 Id 가 없으면 냉장고 목록으로 이동
  if (fridgeId.value === null) {
    router.push('/fridge/list');
    return;
  }

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
  else if (tab === "inquiry-reply") category = "ADMIN_REPLY";
  else if (tab === "group-chat") category = "ROOM_FULL,ROOM_CLOSED";
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
  if (notification.type === "ADMIN_REPLY") return "inquiry-reply";
  if (notification.type === "NEW_INQUIRY") return "inquiry-reply";
  if (notification.type === "NEW_MEMBER") return "member";
  if (notification.type === "ROOM_FULL" || notification.type === "ROOM_CLOSED") return "group-chat";
  return "other";
};

const getNotificationText = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return `${notification.content || '음식'}`;
  if (notification.type === "NEW_FOOD") return `${notification.content || '새로운 음식'}`;
  if (notification.type === "NEW_ANNOUNCEMENT") return `${notification.content || '새로운 공지사항'}`;
  if (notification.type === "NEW_COMMENT") return `${notification.content || '새로운 댓글'}`;
  if (notification.type === "INQUIRY_REPLY") return `${notification.content || '새로운 문의 답변'}`;
  if (notification.type === "ADMIN_REPLY") return `${notification.content || '새로운 문의 답변'}`;
  if (notification.type === "NEW_INQUIRY") return `${notification.content || '새로운 문의'}`;
  if (notification.type === "NEW_MEMBER") return `${notification.content || '새로운 멤버'}`;
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
  // 클릭 시 개별 읽음 처리 (서버 반영 + 로컬 즉시 반영)
  markAsRead(notification);

  const type = notification?.type;
  const extractPostId = (n) => (
    n?.targetId ?? n?.postId ?? n?.announceId ?? n?.announcementId ?? n?.boardId ?? n?.post?.id ?? n?.target?.id ?? null
  );
  const postId = extractPostId(notification);

  if (type === 'NEW_FOOD' || type === 'EXPIRATION_IMMINENT') {
    router.push('/fridge/food/shared');
    return;
  }

  if (type === 'NEW_MEMBER') {
    router.push('/fridge/member/list');
    return;
  }

  if (type === 'ADMIN_REPLY' || type === 'INQUIRY_REPLY' || type === 'NEW_INQUIRY') {
    router.push('/inquiry');
    return;
  }

  if (type === 'NEW_ANNOUNCEMENT' || type === 'NEW_COMMENT') {
    if (postId) {
      const commentId = notification?.commentId || notification?.targetCommentId || notification?.comment?.id;
      if (type === 'NEW_COMMENT' && commentId) {
        router.push({ path: `/fridge/post/${postId}`, query: { commentId } });
      } else if (type === 'NEW_COMMENT') {
        router.push({ path: `/fridge/post/${postId}`, query: { scrollTo: 'comments' } });
      } else {
        router.push(`/fridge/post/${postId}`);
      }
    } else {
      router.push('/fridge/community');
    }
    return;
  }

  // 기존 fallbacks (예방적 유지)
  if (notification.targetType === 'ANNOUNCE') {
    if (postId) router.push(`/fridge/post/${postId}`);
    else router.push('/fridge/community');
    return;
  }
  if (notification.targetType === 'FOOD') {
    router.push('/fridge/food/shared');
    return;
  }
};

// 단건 읽음 처리 함수
const markAsRead = async (notification) => {
  try {
    if (!notification || !notification.id) return;
    // 로컬 즉시 반영 (UI 반응성 보장)
    notification.read = true;
    notification.isRead = true;
    // 서버 반영
    await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/notification/isRead`,
      [{ notificationId: notification.id }]
    );
  } catch (error) {
    // 실패하더라도 네비게이션은 진행하므로 조용히 로깅만
    console.error('단건 읽음 처리 실패:', error);
  }
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
    const types = new Set(selectedCategory.value.split(',').map(t => t.trim()));
    filteredNotifications = filteredNotifications.filter(n => types.has(n.type));
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
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.notification-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
  z-index: -1;
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.read-all-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.read-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.main-content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.notification-tabs-header {
  padding: 20px 24px 0;
  background: transparent;
  border-bottom: none;
  margin-bottom: 0;
}

.notification-tabs {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

.notification-tab {
  font-weight: 500;
  color: #666;
  text-transform: none;
  font-size: 14px;
  padding: 12px 16px;
  border-radius: 0;
  margin: 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.notification-tab:hover {
  background-color: transparent;
  color: #333;
}

.notification-tab.v-tab--active {
  background-color: transparent;
  color: #1976d2;
  font-weight: 600;
  border-bottom: 2px solid #1976d2;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-left: 4px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.notification-item.group-chat-border {
  border-left-color: #009688;
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
  border-color: rgba(25, 118, 210, 0.3);
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.95);
}

.notification-item.read {
  background: rgba(248, 249, 250, 0.8);
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.delete-btn:hover {
  background-color: rgba(255, 235, 238, 0.9);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
}

.delete-btn .v-icon {
  transition: color 0.3s ease;
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
  padding: 4px 12px;
  background-color: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.3);
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
.inquiry-reply-chip,
.post-chip,
.group-chat-chip,
.member-chip {
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 16px;
  height: 28px;
  backdrop-filter: blur(5px);
  transition: all 0.2s ease;
}

.expiration-chip {
  border-color: #ff9800;
  color: #e65100;
  background: rgba(255, 152, 0, 0.1);
}

.food-chip {
  border-color: #4caf50;
  color: #2e7d32;
  background: rgba(76, 175, 80, 0.1);
}

.comment-chip {
  border-color: #2196f3;
  color: #1565c0;
  background: rgba(33, 150, 243, 0.1);
}

.inquiry-reply-chip {
  border-color: #4285f4;
  color: #1a73e8;
  background: rgba(66, 133, 244, 0.1);
}

.post-chip {
  border-color: #9c27b0;
  color: #6a1b9a;
  background: rgba(156, 39, 176, 0.1);
}

.group-chat-chip {
  border-color: #009688;
  color: #00695c;
  background: rgba(0, 150, 136, 0.1);
}

.member-chip {
  border-color: #009688;
  color: #00695c;
  background: rgba(0, 150, 136, 0.1);
}

/* Vuetify 탭 스타일 오버라이드 */
:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  color: #6c757d;
  flex: 1;
  min-width: 0;
  transition: all 0.2s ease;
}

:deep(.v-tab--selected) {
  color: #1976d2;
  font-weight: 600;
  background-color: transparent;
}

:deep(.v-tab__slider) {
  background: #1976d2;
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
  padding: 60px 20px;
  color: #888;
}

.loading-text {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
  color: #666;
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.load-more-btn {
  min-width: 140px;
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
}

.no-more-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
  text-align: center;
}

.no-more-text {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #666;
}

/* 삭제 확인 모달 스타일 */
.delete-dialog-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.delete-dialog-header {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #d32f2f;
  font-size: 18px;
  font-weight: 600;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(211, 47, 47, 0.1);
}

.delete-dialog-content {
  padding: 24px;
}

.delete-warning-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.delete-info-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.delete-dialog-actions {
  padding: 16px 24px 24px;
  background: #f8f9fa;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .notification-page {
    padding: 24px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .notification-list {
    padding: 16px 20px;
  }
  
  .notification-item {
    padding: 16px;
  }
  
  .notification-content {
    margin-right: 12px;
    margin-left: 12px;
  }
  
  .notification-right {
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .notification-page {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
  
  .notification-list {
    padding: 12px 16px;
  }
  
  .notification-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .notification-content {
    margin: 0;
    width: 100%;
  }
  
  .notification-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  
  .notification-tabs {
    overflow-x: auto;
  }
  
  .notification-tab {
    min-width: 80px;
    flex-shrink: 0;
  }
}
</style>