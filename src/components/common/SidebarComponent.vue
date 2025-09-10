<template>
  <!-- v-card를 제거하고 v-navigation-drawer를 최상위 요소로 사용합니다. -->
  <!-- `app` 속성을 추가하여 Vuetify 레이아웃 시스템에 통합합니다. -->
  <v-navigation-drawer
    app
    permanent
    class="custom-drawer"
  > 
    <div class="header-container">
      <v-list-item class="pa-0">
        <template v-slot:prepend>
          <v-container class="d-flex flex-column align-center pa-0">
            <router-link to="/#" class="logo-link">
              <v-img
                :width="100"
                :height="100"
                :src="logoUrl"
                alt="SmartFridge Logo"
                class="mb-2"
              />
            </router-link>
          </v-container>
        </template>

        <v-list-item-title class="smartfridge-title gradient-text">SmartFridge</v-list-item-title>
        <v-list-item-subtitle class="mt-1 truncate-text"
          :title="fridgeName"  
        >{{ fridgeName }}</v-list-item-subtitle>
        
        <v-chip
          :prepend-icon="refrigeratorItem.icon"
          :color="refrigeratorItem.color"
          variant="tonal"
          size="small"
          label
          :to="refrigeratorItem.to"
          class="mt-3"
        >
          {{ refrigeratorItem.title }}
        </v-chip>
      </v-list-item>
    </div>

    <v-divider></v-divider>

    <v-list v-model:selected="selectedItem" density="compact" nav>
    <template v-for="item in menuItems" :key="item.value">
      <v-list-item
        v-if="item.title !== '유저관리' || userType === 'MANAGER'"
        :title="item.title"
        :value="item.value"
        :to="item.to"
        class="nav-link"
        rounded="lg"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon" :color="item.color"></v-icon>
        </template>
        <template v-slot:append v-if="item.badgeCount > 0">
          <div class="notification-indicator"></div>
        </template>
      </v-list-item>
    </template>
  </v-list>
    
    <template v-slot:append>
      <div class="user-info-wrapper">
        <div class="user-info-frame">
          <router-link to="/#" class="avatar-link">
            <div class="user-avatar-bg" v-if="!userProfileImage">
              <span class="user-avatar-initial">{{ userInitial }}</span>
            </div>
            <v-img
              v-else
              :src="userProfileImage"
              alt="Profile Image"
              class="user-avatar-image"
              width="40"
              height="40"
            />
          </router-link>  
          <div class="user-details">
            <div class="user-name">{{ displayUserName }}</div>
            <v-btn
                :color="inquiryItem.color"
                variant="text"
                size="x-small"
                class="inquiry-text-button"
            >
              {{ inquiryItem.title }}
            </v-btn>
          </div>
          <v-spacer></v-spacer>
          <v-btn class="logout-button" @click="doLogout" to="/#" variant="outlined" rounded="xl" size="x-small, y-small">
            로그아웃
          </v-btn>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';

const store = useStore();
const logoUrl = new URL('../../assets/images/SFlogo/smartFridge_logo.png', import.meta.url).href;

const selectedItem = ref(['dashboard']);

const refrigeratorItem = ref({ title: '냉장고목록', icon: 'mdi-fridge-outline', color: 'cyan-darken-2', to: "/fridge/list" });
const inquiryItem = ref({ title: '문의하기', icon: 'mdi-comment-question-outline', color: 'pink-darken-1', to: "/#" });

// Store에서 사용자 정보 가져오기
const userInfo = computed(() => store.getters.getUserInfo);
const userName = computed(() => store.getters.getUserName);
const userProfileImage = computed(() => store.getters.getUserProfileImage);
const userInitial = computed(() => store.getters.getUserInitial);

const userType = ref([]);

// 표시할 사용자 이름 (기본값 설정)
const displayUserName = computed(() => {
  if (userName.value) {
    return `${userName.value}님`;
  }
  return '사용자님';
});

// 냉장고 이름 (사용자 이름 기반)
const fridgeName = computed(() => {
  if (userName.value) {
    return `${userName.value}의 냉장고`;
  }
  return '나의 냉장고';
});

const doLogout = () => {
  store.dispatch('logout');
  window.location.href = '/login';
};

const fetchUserType = async (fridgeId) => {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/member/type`);
    userType.value = getResultData(response);
    console.log('userType', userType.value);
  } catch (error) {
    console.error('Failed to load user type:', error);
  }
}

// 채팅방 상태 동기화 함수 (MANAGER_CHAT은 유저 관리 탭에서 별도 관리)
const syncChatBadgeStatus = async () => {
  // 냉장고 ID가 있을 때만 채팅 배지 상태 동기화
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (currentFridgeId) {
    // 그룹 채팅 배지만 동기화 (MANAGER_CHAT은 유저 관리 페이지에서 관리)
    await store.dispatch('notification/updateGroupChatBadgeOnly', currentFridgeId);
    
    // MANAGER_CHAT 배지는 유저 관리 페이지에서만 관리 (사이드바에서는 건드리지 않음)
    console.log('🔄 syncChatBadgeStatus - MANAGER_CHAT 배지 상태 유지:', {
      currentBadge: store.getters['notification/typeCounts']?.MANAGER_CHAT || 0,
      message: 'MANAGER_CHAT 배지는 유저 관리 페이지에서만 관리'
    });
  }
};

// 전역 MANAGER_CHAT 알림 처리 함수
const handleGlobalManagerChatNotification = (event) => {
  const notification = event.detail;
  if (notification.type === 'MANAGER_CHAT') {
    console.log('📨 사이드바에서 전역 MANAGER_CHAT 알림 수신:', notification);
    
    // 유저 관리 페이지에서 설정한 배지 상태가 있으면 업데이트
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    if (userManagementState?.isSetByUserManagement) {
      // hasUnreadMessages를 true로 설정하고 배지 표시
      store.commit('notification/setUserManagementBadgeState', {
        hasUnreadMessages: true,
        isSetByUserManagement: true
      });
      store.commit('notification/setAdminChatCount', 1);
    }
  }
};

// 컴포넌트 마운트 시 사용자 정보 로드 및 냉장고 ID 확인
onMounted(async () => {
  const token = localStorage.getItem('accessToken');
  if (token && !userInfo.value) {
    try {
      await store.dispatch('fetchUserInfo');
    } catch (error) {
      console.error('Failed to load user info:', error);
      // 에러가 발생해도 기본값으로 표시되도록 함
    }
  }
  
  // 냉장고 ID가 없으면 냉장고 목록 페이지로 리다이렉트
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (!currentFridgeId && window.location.pathname !== '/fridge/list') {
    window.location.href = '/fridge/list';
  }
  await fetchUserType(currentFridgeId);
  
  // sessionStorage에서 배지 상태 복원 (페이지 이동 시에도 유지)
  await store.dispatch('notification/restoreBadgeStateFromStorage');
  
  // 채팅 배지 상태 동기화 (초기 로드 시) - MANAGER_CHAT 배지는 제외
  await syncChatBadgeStatus();
  
  // 유저 관리 배지 초기 설정 (관리자인 경우) - 냉장고 진입 시 배지 상태 초기화
  if (userType.value === 'MANAGER') {
    // 냉장고 진입 시 채팅 배지 상태 동기화 (그룹 채팅만, MANAGER_CHAT 배지 보호)
    await store.dispatch('notification/updateChatBadgesOnFridgeEnter', currentFridgeId);
    console.log('🔍 사이드바 초기 로드 - 냉장고 진입 시 배지 상태 초기화 (MANAGER_CHAT 배지 보호):', {
      currentBadge: store.getters['notification/typeCounts']?.MANAGER_CHAT || 0,
      userType: userType.value,
      fridgeId: currentFridgeId,
      userManagementState: store.getters['notification/userManagementBadgeState']
    });
  }
  
  // 전역 MANAGER_CHAT 알림 이벤트 리스너 등록
  window.addEventListener('admin-chat-notification', handleGlobalManagerChatNotification);
  
  // 주기적으로 채팅 배지 상태 동기화 (10분마다로 변경하여 배지가 너무 자주 사라지는 문제 방지)
  const syncInterval = setInterval(syncChatBadgeStatus, 600000);
  
  // 컴포넌트 언마운트 시 인터벌 정리
  onUnmounted(() => {
    clearInterval(syncInterval);
    window.removeEventListener('admin-chat-notification', handleGlobalManagerChatNotification);
    
    // 사이드바 종료 시 배지 상태를 sessionStorage에 저장하여 로그아웃 후에도 유지
    const currentBadgeState = store.getters['notification/typeCounts']?.MANAGER_CHAT || 0;
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('managerChatBadgeState', JSON.stringify({
        count: currentBadgeState,
        timestamp: Date.now()
      }));
      
      sessionStorage.setItem('userManagementBadgeState', JSON.stringify({
        hasUnreadMessages: userManagementState?.hasUnreadMessages || false,
        isSetByUserManagement: userManagementState?.isSetByUserManagement || false,
        timestamp: Date.now()
      }));
      
      console.log('💾 사이드바 종료 시 배지 상태 저장:', {
        managerChatBadge: currentBadgeState,
        userManagementState
      });
    }
  });
});

const menuItems = computed(() => {
  const inquiryBadgeCount = store.getters['notification/inquiryBadgeCount'];
  const chatBadgeCount = store.getters['notification/chatBadgeCount'];

  const fridgeInfo = store.getters.getCurrentFridgeInfo;
  
  let isManager = false;
  let isUser = false;
  
  if (fridgeInfo && fridgeInfo.type) {
    isManager = fridgeInfo.type === 'MANAGER';
    isUser = fridgeInfo.type === 'USER' || fridgeInfo.type === 'COMMON';
  } else {
    isUser = true;
    isManager = false;
  }
  
  // 유저 관리 탭 배지 (실제 채팅방 unReadCount 기반)
  let userManagementBadgeCount = 0;
  if (isManager) {
    // 유저 관리 탭은 실제 채팅방의 unReadCount를 기반으로 배지 표시
    // store에서 관리자 채팅 배지 상태를 가져옴 (실시간 동기화됨)
    const adminChatBadge = store.getters['notification/typeCounts']?.MANAGER_CHAT || 0;
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    
    // 배지 표시 로직 단순화: MANAGER_CHAT 배지가 있으면 표시
    userManagementBadgeCount = adminChatBadge > 0 ? 1 : 0;
    
    console.log('📱 사이드바 유저 관리 탭 배지:', { 
      adminChatBadge, 
      userManagementBadgeCount,
      userManagementState,
      typeCounts: store.getters['notification/typeCounts'],
      currentPath: window.location.pathname,
      isManager
    });
  }
  
  let finalChatBadgeCount = 0;
  if (isUser) {
    // 사용자는 MANAGER_CHAT 알림을 받지 않음 (관리자용 알림)
    const hasGroupChat = store.getters['notification/typeCounts']?.GROUP_CHAT > 0;
    const hasRoomFull = store.getters['notification/typeCounts']?.ROOM_FULL > 0;
    finalChatBadgeCount = (hasGroupChat || hasRoomFull) ? 1 : 0;
  } else if (isManager) {
    const hasGroupChat = store.getters['notification/typeCounts']?.GROUP_CHAT > 0;
    const hasRoomFull = store.getters['notification/typeCounts']?.ROOM_FULL > 0;
    finalChatBadgeCount = (hasGroupChat || hasRoomFull) ? 1 : 0;
  } else {
    finalChatBadgeCount = chatBadgeCount > 0 ? 1 : 0;
  }
  

  
  const baseMenuItems = [
    { 
      title: '대시보드', icon: 'mdi-view-dashboard-outline', value: 'dashboard', color: 'blue-darken-1', 
      to: "/fridge/dashboard"
    },
    { title: '식품목록', icon: 'mdi-food-fork-drink', value: 'sharedfoodlist', color: 'green-darken-2', to: "/fridge/food/shared", badgeCount: 0 },
    
    { title: '알림목록', icon: 'mdi-bell-outline', value: 'notifications', color: 'orange-darken-2', to: '/notification/list'},
    { title: '커뮤니티', icon: 'mdi-account-group-outline', value: 'community', color: 'purple-darken-1', to: "/fridge/community" },
    { 
      title: '채팅', icon: 'mdi-chat-outline', value: 'chat', color: 'teal-darken-1', to: "/chatpage",  
      badgeCount: finalChatBadgeCount
    },
    { title: '마이페이지', icon: 'mdi-account', value: 'mypage', color: 'indigo-darken-1', to: "/mypage" },
    { 
      title: '문의하기', icon: 'mdi-email-outline', value: 'inquiry', color: 'cyan-darken-1', 
      to: "/inquiry", 
      badgeCount: inquiryBadgeCount > 0 ? 1 : 0
    }
  ];

  // 관리자(MANAGER)인 경우에만 유저관리 탭 추가
  if (isManager) {
    baseMenuItems.splice(-1, 0, {
      title: '유저관리', icon: 'mdi-account-cog-outline', value: 'usermanagement', color: 'red-darken-2', to: "/fridge/member/list",
      badgeCount: userManagementBadgeCount
    });
  }

  return baseMenuItems;
});
</script>

<style scoped>
:root {
  --font-title: clamp(20px, 1.8vw, 22.125px);
  --font-subtitle: clamp(12px, 1.2vw, 14px);
  --font-nav: clamp(14px, 1.3vw, 15px);
  --font-user: clamp(11px, 1.3vw, 14px);
  --font-button-size: clamp(12px, 1.1vw, 13.3px);
}
.truncate-text {
  white-space: nowrap;      
  overflow: hidden;        
  text-overflow: ellipsis; 
  max-width: 100%;          
}
.logo-link {
  text-decoration: none; 
  color: inherit;
  height: 100px;
  
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: inline-block; 
}
.custom-font-family { 
  font-family: 'Arial', sans-serif; 
}
.responsive-card, .custom-drawer {
  width: clamp(256px) !important;
}
.custom-drawer {
  background: rgba(255, 255, 255, 0.95);
  /* box-shadow: 2px 0px 20px rgba(0, 0, 0, 0.1); */
  backdrop-filter: blur(5px);
  /* border-right: none !important; */
}
.header-container {
  padding: 19px 20px;
}
.smartfridge-title {
  font-weight: 700;
  font-size: var(--font-title);
  line-height: 1.2;
}
.dashboard-subtitle {
  font-weight: 400;
  font-size: 13px;
  line-height: 1.2;
  padding: 0;
  color: #666;
}
.gradient-text {
  background: linear-gradient(96.94deg, #667EEA 0%, #764BA2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nav-link { 
  height: 51px;
  margin: 0 12px;
}
.nav-link .v-list-item-title {
  font-weight: 400;
  font-size: var(--font-nav);
  color: #333;
}
.nav-link.v-list-item--active .v-list-item-title { 
  color: #000;
  font-weight: 700;
}
.user-info-wrapper {
  padding: 0px;
}
.user-info-frame {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  width: 100%;
  border: 1px solid #E9ECEF;
}
.user-avatar-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(180deg, #0468FF 0%, #789DFB 100%);
  border-radius: 20px;
}
.user-avatar-initial {
  font-weight: 700;
  font-size: 16px;
  color: #FFF;
}
.user-avatar-image {
  border-radius: 20px;
  object-fit: cover;
}
.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.3;
  flex-grow: 1; 
  min-width: 0;  
}
.user-name {
  font-weight: 400;
  font-size: var(--font-user);
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.inquiry-text-button.v-btn {
  padding: 0;
  height: auto;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  margin-top: 2px;
  opacity: 0.7;
}
.logout-button.v-btn {
  border: 2px solid #667EEA;
  padding: 6px 12px;
  color: #667EEA;
  font-size: 13px;
  font-weight: 400;
  text-transform: none;
  flex-shrink: 0;
}

.notification-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
  flex-shrink: 0;
}
</style>