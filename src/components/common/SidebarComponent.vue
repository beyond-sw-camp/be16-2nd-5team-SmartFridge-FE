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
      <v-list-item
        v-for="item in menuItems"
        :key="item.value"
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

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
});

const menuItems = computed(() => {
  const inquiryBadgeCount = store.getters['notification/inquiryBadgeCount'];
  const chatBadgeCount = store.getters['notification/chatBadgeCount'];
  const adminChatCount = store.getters['notification/typeCounts']?.ADMIN_CHAT || 0;
  
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
  

  
  const userManagementBadgeCount = isManager && adminChatCount > 0 ? 1 : 0;
  
  let finalChatBadgeCount = 0;
  if (isUser) {
    finalChatBadgeCount = (adminChatCount > 0 ? 1 : 0) + 
                         (store.getters['notification/typeCounts']?.GROUP_CHAT > 0 ? 1 : 0) + 
                         (store.getters['notification/typeCounts']?.ROOM_FULL > 0 ? 1 : 0);
  } else if (isManager) {
    finalChatBadgeCount = (store.getters['notification/typeCounts']?.GROUP_CHAT > 0 ? 1 : 0) + 
                         (store.getters['notification/typeCounts']?.ROOM_FULL > 0 ? 1 : 0);
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