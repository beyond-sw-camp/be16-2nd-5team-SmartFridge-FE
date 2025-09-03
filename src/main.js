import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from '@/router/index.js'
import store from '@/store/index.js'
import axios from 'axios';
import authService from '@/services/authService.js';
import tokenManager from '@/utils/tokenManager.js';
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App);

// store를 전역으로 노출 (라우터에서 접근용)
window.$store = store;
// tokenManager를 전역으로 노출 (로그인 페이지에서 접근용)
window.tokenManager = tokenManager;

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
let failedQueue = [];

// 실패한 요청들을 처리하는 함수
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axios.interceptors.request.use(
  config => {
    // 인증이 필요 없는 API 경로들
    const publicPaths = ['/api/v1/email/send', '/api/v1/email/verify', '/member/create', '/member/doLogin', '/member/refresh-at'];
    
    // 디버깅을 위한 로그
    console.log('Axios interceptor - 요청 URL:', config.url);
    
    // 현재 요청 URL이 public API인지 확인
    const isPublicAPI = publicPaths.some(path => {
      const urlPath = config.url || '';
      const isMatch = urlPath.includes(path);
      console.log(`URL "${urlPath}" includes "${path}": ${isMatch}`);
      return isMatch;
    });
    
    console.log('Public API 여부:', isPublicAPI);
    
    // public API가 아닌 경우에만 토큰 추가
    if (!isPublicAPI) {
      const token = localStorage.getItem("accessToken");
      if(token){
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('토큰 추가됨:', token.substring(0, 20) + '...');
      } else {
        console.log('토큰 없음');
      }
    } else {
      console.log('Public API - 토큰 추가하지 않음');
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 자동 갱신
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 401 에러이고, 토큰 갱신 요청이 아닌 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 토큰 갱신 중인 경우
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authService.refreshAccessToken();
        processQueue(null, newToken);
        
        // 원래 요청에 새로운 토큰 추가하고 재시도
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authService.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

app.use(store);
app.use(router);
app.use(vuetify);

// 앱 마운트 후 토큰 모니터링 시작
app.mount('#app');

// 로그인 상태인 경우 토큰 모니터링 시작
if (localStorage.getItem('accessToken')) {
  tokenManager.startMonitoring();
}