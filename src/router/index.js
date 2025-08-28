import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";
import { AdminRouter } from "./AdminRouter";
import MainDashboard from "@/views/MainDashboard.vue";
import LoginPage from "@/views/LoginPage.vue";
import MyPage from "@/views/MyPage.vue";
import { InquiryRouter } from "./InquiryRouter";
import { FridgeRouter } from "./FridgeRouter";
import { CommunityRouter } from "./CommunityRouter";

const routes = [
  {
    path: '/', // 기본 경로 - 로그인 페이지
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/dashboard', // 메인 대시보드
    name: 'MainDashboard', 
    component: MainDashboard
  },
  {
    path: '/mypage', // 마이페이지
    name: 'MyPage',
    component: MyPage,
    meta: { requiresAuth: true }
  },
  ...MemberRouter,
  ...ChatRouter,
  ...NotificationRouter,
  ...InquiryRouter,
  ...FridgeRouter,
  ...CommunityRouter,
  ...AdminRouter
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

// 라우터 가드 - 인증이 필요한 페이지 접근 제어
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const isAuthenticated = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('role') || 'USER';
  
  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    next('/');
  } 
  // 관리자 권한이 필요한 페이지인데 관리자가 아닌 경우
  else if (requiresAdmin && userRole !== 'ADMIN') {
    next('/dashboard');
  }
  // 이미 로그인된 사용자가 로그인/회원가입 페이지에 접근하려는 경우
  else if ((to.path === '/' || to.path === '/member/create') && isAuthenticated) {
    // 관리자인 경우 관리자 대시보드로, 일반 사용자인 경우 냉장고 목록으로
    if (userRole === 'ADMIN') {
      next('/admin');
    } else {
      next('/fridge/list');
    }
  } 
  else {
    next();
  }
  
  // SSE 연결 상태 확인 및 필요시 재연결 (next() 호출 후)
  const store = window.$store || window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.Vue?.prototype?.$store;
  if (store && isAuthenticated) {
    const isConnected = store.getters['notification/isSSEConnected'];
    if (!isConnected) {
      store.dispatch('notification/initSSE', store);
    }
  }
});

export default router;