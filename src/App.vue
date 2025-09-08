<template>
  <v-app>
    <SidebarComponent v-if="!isLoginPage"/>
    <v-main>
      <router-view/>
    </v-main>
    <CommonSnackbar />
  </v-app>
</template>

<script>
import SidebarComponent from './components/common/SidebarComponent.vue'
import CommonSnackbar from './components/common/CommonSnackbar.vue'
import { useStore } from 'vuex';
import { onMounted, onUnmounted, watch } from 'vue';

export default {
  name: 'App',
  components: {
    SidebarComponent,
    CommonSnackbar
  },
  computed: {
    isLoginPage() {
      // 로그인 관련 페이지들, NoFridgePage, FridgeList, 이메일 인증 페이지, 관리자 페이지에서는 사이드바를 숨김
      const hideSidebarRoutes = [
        '/', 
        '/login', 
        '/member/create', 
        '/member/verify-email',
        '/member/forgot-password',
        '/reset-password',
        '/no-fridge', 
        '/fridge/list', 
        '/dashboard',
        '/oauth/google/redirect', 
        '/oauth/kakao/redirect', 
        '/oauth/naver/redirect',
        '/admin',
        '/admin/inquiry',
        '/admin/notification',
        '/admin/users'
      ];
      return hideSidebarRoutes.includes(this.$route.path);
    }
  },
  setup() {
    const store = useStore();

    onMounted(() => {
      // 초기 SSE 연결 (store 인스턴스 전달)
      store.dispatch('notification/initSSE', store);

      // 배지 카운트 복원
      store.dispatch('notification/hydrateTypeCounts');
      
      // 연결 상태 모니터링 (더 자주 확인)
      const checkConnection = setInterval(() => {
        const isConnected = store.getters['notification/isSSEConnected'];
        if (!isConnected) {
          store.dispatch('notification/initSSE', store);
        }
      }, 15000); // 15초마다 연결 상태 확인

      // cleanup 함수 저장
      window.sseCheckInterval = checkConnection;
    });

    // 냉장고 변경 감지하여 알림 초기화
    watch(() => store.getters.getCurrentFridgeId, (newFridgeId, oldFridgeId) => {
      if (newFridgeId && oldFridgeId && newFridgeId !== oldFridgeId) {
        store.dispatch('notification/refreshSSEOnFridgeChange', newFridgeId);
      }
    });

    onUnmounted(() => {
      // 컴포넌트 언마운트 시 정리
      if (window.sseCheckInterval) {
        clearInterval(window.sseCheckInterval);
      }
    });
  }
}
</script>

<style>
</style>
