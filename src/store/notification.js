// src/store/modules/notification.js
import { EventSourcePolyfill } from 'event-source-polyfill';

// 전역 SSE 연결 관리 (모듈 외부에서 관리하여 페이지 이동 시에도 유지)
let globalEventSource = null;
let reconnectTimer = null;
let connectionCheckInterval = null;
let isInitialized = false;
let isForceClosing = false; // 강제 종료 여부

// SSE 연결 상태를 전역으로 관리
const sseState = {
  isConnected: false,
  connectionAttempts: 0,
  maxReconnectAttempts: 5,
  lastConnectionTime: null
};

// 전역 SSE 연결 함수
function createSSEConnection(store) {
  // 강제 종료 중이면 연결하지 않음
  if (isForceClosing) {
    return;
  }

  if (globalEventSource && globalEventSource.readyState === EventSource.OPEN) {
    return;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return;
  }

  // 기존 연결 정리
  if (globalEventSource) {
    globalEventSource.close();
    globalEventSource = null;
  }

  // 재연결 타이머 정리
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    
    globalEventSource = new EventSourcePolyfill(
      `${process.env.VUE_APP_API_BASE_URL}/sse/connect/notification`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 60000,
        retryTimeout: 5000
      }
    );

    // 연결 성공
    globalEventSource.onopen = () => {
      sseState.isConnected = true;
      sseState.connectionAttempts = 0;
      sseState.lastConnectionTime = Date.now();
      
      // store 상태 업데이트
      store.commit('notification/setSSEConnectionStatus', true);
      store.commit('notification/resetConnectionAttempts');
      
      // 연결 상태 모니터링 시작
      startConnectionMonitoring(store);
    };

    // 메시지 수신
    globalEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        store.commit('notification/addNotification', data);
      } catch (error) {
        console.error('SSE 메시지 파싱 오류:', error);
      }
    };

    // 타입별 커스텀 이벤트 리스너 등록 (전역 처리)
    const notificationTypes = [
      'ADMIN_REPLY', 'NEW_FOOD', 'EXPIRATION_IMMINENT', 
      'NEW_ANNOUNCEMENT', 'NEW_COMMENT', 'NEW_INQUIRY', 'NEW_MEMBER',
      'ADMIN_CHAT', 'GROUP_CHAT', 'INQUIRY_REPLY'
    ];

    notificationTypes.forEach(type => {
      globalEventSource.addEventListener(type, (event) => {
        try {
          const data = JSON.parse(event.data);
          
          store.commit('notification/addNotification', data);
        } catch (error) {
          console.error(`SSE [${type}] 메시지 파싱 오류:`, error);
        }
      });
    });

    // 에러 처리 및 재연결
    globalEventSource.onerror = (error) => {
      console.error('SSE 연결 오류 발생:', error);
      
      sseState.isConnected = false;
      store.commit('notification/setSSEConnectionStatus', false);
      
      // 강제 종료 중이면 재연결하지 않음
      if (isForceClosing) {
        return;
      }
      
      // 재연결 시도
      if (sseState.connectionAttempts < sseState.maxReconnectAttempts) {
        sseState.connectionAttempts++;
        const delay = Math.min(5000 * Math.pow(2, sseState.connectionAttempts - 1), 30000);
        
        reconnectTimer = setTimeout(() => {
          if (!sseState.isConnected && !isForceClosing) {
            createSSEConnection(store);
          }
        }, delay);
      } else {
        // 1분 후 다시 시도
        reconnectTimer = setTimeout(() => {
          if (!isForceClosing) {
            sseState.connectionAttempts = 0;
            createSSEConnection(store);
          }
        }, 60000);
      }
    };

    // 연결 종료 시 정리 (강제 종료가 아닌 경우에만)
    globalEventSource.onclose = () => {
      if (!isForceClosing) {
        sseState.isConnected = false;
        store.commit('notification/setSSEConnectionStatus', false);
        globalEventSource = null;
      }
    };

  } catch (error) {
    console.error('SSE 연결 생성 오류:', error);
    sseState.isConnected = false;
    store.commit('notification/setSSEConnectionStatus', false);
  }
}

// 연결 상태 모니터링
function startConnectionMonitoring(store) {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }

  connectionCheckInterval = setInterval(() => {
    if (globalEventSource && globalEventSource.readyState === EventSource.OPEN) {
      if (!sseState.isConnected) {
        sseState.isConnected = true;
        store.commit('notification/setSSEConnectionStatus', true);
      }
    } else {
      if (sseState.isConnected) {
        console.log('연결 재시도');
        sseState.isConnected = false;
        store.commit('notification/setSSEConnectionStatus', false);
        createSSEConnection(store);
      }
    }
  }, 30000);
}

// 전역 SSE 연결 종료
function closeSSEConnection(store) {
  isForceClosing = true; // 강제 종료 플래그 설정
  if (globalEventSource) {
    globalEventSource.close();
    globalEventSource = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  
  sseState.isConnected = false;
  store.commit('notification/setSSEConnectionStatus', false);
  console.log('SSE 연결 수동 종료');
}

export default {
  namespaced: true,
  state: {
    notifications: [],
    notificationCount: 0,
    isSSEConnected: false,
    connectionAttempts: 0,
    maxReconnectAttempts: 5,
    // 냉장고별 알림 관리
    fridgeNotifications: {}, // { fridgeId: [notifications] }
    fridgeNotificationCounts: {}, // { fridgeId: count }
    typeCounts: {
      ADMIN_REPLY: 0,
      NEW_FOOD: 0,
      EXPIRATION_IMMINENT: 0,
      NEW_ANNOUNCEMENT: 0,
      NEW_COMMENT: 0,
      NEW_INQUIRY: 0,
      NEW_MEMBER: 0,
      ADMIN_CHAT: 0,
      GROUP_CHAT: 0,
      INQUIRY_REPLY: 0
    }
  },
  mutations: {
    addNotification(state, notification) {
      // 전체 알림 리스트에는 무조건 추가 (최근 5개 유지)
      state.notifications.unshift(notification);
      if (state.notifications.length > 5) {
        state.notifications = state.notifications.slice(0, 5);
      }
       
      state.notificationCount = state.notifications.filter(n => !n.isRead).length;
   
      // typeCounts 업데이트 (사이드바 배지용)
      if (notification.type && notification.type in state.typeCounts) {
        state.typeCounts[notification.type]++;
      }
  
      // 냉장고 알림 처리
      const fridgeId = notification.fridgeId;
      if (fridgeId !== undefined && fridgeId !== null) {
        const numericFridgeId = typeof fridgeId === 'string' ? parseInt(fridgeId, 10) : fridgeId;
   
        if (!state.fridgeNotifications[numericFridgeId]) {
          state.fridgeNotifications[numericFridgeId] = [];
        }
   
        // 냉장고별 알림 리스트에 추가 (최대 5개)
        state.fridgeNotifications[numericFridgeId].unshift(notification);
        if (state.fridgeNotifications[numericFridgeId].length > 5) {
          state.fridgeNotifications[numericFridgeId] = state.fridgeNotifications[numericFridgeId].slice(0, 5);
        }
   
        // 읽지 않은 알림 카운트 증가
        if (!state.fridgeNotificationCounts[numericFridgeId]) {
          state.fridgeNotificationCounts[numericFridgeId] = 0;
        }
        state.fridgeNotificationCounts[numericFridgeId]++;
        
        // 실시간 알림 이벤트 발생 (DashboardHeader에서 수신)
        const realtimeEvent = new CustomEvent('realtime-notification', {
          detail: notification
        });
        window.dispatchEvent(realtimeEvent);
        console.log('실시간 알림 이벤트 발생:', notification);
      }
    },
    clearNotifications(state) {
      state.notifications = [];
      state.notificationCount = 0;
      Object.keys(state.typeCounts).forEach(key => {
        state.typeCounts[key] = 0;
      });
    },
    setSSEConnectionStatus(state, status) {
      state.isSSEConnected = status;
    },
    incrementConnectionAttempts(state) {
      state.connectionAttempts++;
    },
    resetConnectionAttempts(state) {
      state.connectionAttempts = 0;
    },
    // 냉장고별 알림 읽음 처리
    markFridgeNotificationAsRead(state, { fridgeId, notificationId }) {
      if (!fridgeId) return;
   
      const numericFridgeId = typeof fridgeId === 'string' ? parseInt(fridgeId, 10) : fridgeId;
      const notification = state.fridgeNotifications[numericFridgeId]?.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.fridgeNotificationCounts[numericFridgeId]--;
      }
    },
    // 냉장고별 알림 초기화
    clearFridgeNotifications(state, fridgeId) {
      if (state.fridgeNotifications[fridgeId]) {
        state.fridgeNotifications[fridgeId] = [];
        state.fridgeNotificationCounts[fridgeId] = 0;
      }
    },
    // 냉장고별 알림 카운트 리셋
    resetFridgeNotificationCount(state, fridgeId) {
      if (state.fridgeNotificationCounts[fridgeId]) {
        state.fridgeNotificationCounts[fridgeId] = 0;
      }
    }
  },
  actions: {
    initSSE(_, store) {
      // 전역 store 인스턴스 전달받아 사용
      const targetStore = store || this._vm?.$store;
      
      if (!targetStore) {
        return;
      }
      
      if (!isInitialized) {
        isInitialized = true;
      }

      // 이미 연결되어 있다면 새로 연결하지 않음
      if (sseState.isConnected && globalEventSource && globalEventSource.readyState === EventSource.OPEN) {
        targetStore.commit('notification/setSSEConnectionStatus', true);
        return;
      }

      // 전역 연결 함수 호출
      createSSEConnection(targetStore);
    },

    closeSSE() {
      // 실제로 앱이 종료되거나 로그아웃할 때만 호출
      const targetStore = this._vm?.$store;
      closeSSEConnection(targetStore);
    },

    // 페이지 이동 시에도 연결 유지 (연결 상태만 확인)
    keepConnection() {
      // 연결 상태만 확인하고 필요시 재연결
      if (!sseState.isConnected && !isForceClosing) {
        const targetStore = this._vm?.$store;
        if (targetStore) {
          createSSEConnection(targetStore);
        }
      }
    },

    // 연결 상태 강제 확인
    checkConnectionStatus({ commit, state }) {
      if (globalEventSource && globalEventSource.readyState === EventSource.OPEN) {
        if (!state.isSSEConnected) {
          commit('setSSEConnectionStatus', true);
        }
      } else {
        if (state.isSSEConnected) {
          commit('setSSEConnectionStatus', false);
        }
      }
    },
  },
  getters: {
    allNotifications: state => state.notifications,
    notificationCount: state => state.notificationCount,
    typeCounts: state => state.typeCounts,
    unreadCount: state => state.notifications.filter(n => !n.isRead).length,
    isSSEConnected: state => state.isSSEConnected,
    connectionAttempts: state => state.connectionAttempts,

    // 냉장고별 알림 관련 getter
    getFridgeNotifications: (state) => (fridgeId) => {
      const numericFridgeId = typeof fridgeId === 'string' ? parseInt(fridgeId, 10) : fridgeId;
      return state.fridgeNotifications[numericFridgeId] || [];
    },
    getFridgeNotificationCount: (state) => (fridgeId) => {
      const numericFridgeId = typeof fridgeId === 'string' ? parseInt(fridgeId, 10) : fridgeId;
      const count = state.fridgeNotificationCounts[numericFridgeId] || 0;
      return count;
    },
    getFridgeUnreadCount: (state) => (fridgeId) => {
      const numericFridgeId = typeof fridgeId === 'string' ? parseInt(fridgeId, 10) : fridgeId;
      const notifications = state.fridgeNotifications[numericFridgeId] || [];
      return notifications.filter(n => !n.isRead).length;
    },

    // 사이드바 빨간 점용 getter (역할별로 분리)
    inquiryBadgeCount: (state, getters, rootState) => {
      const userRole = rootState.user?.userInfo?.role || 'USER';
      
      if (userRole === 'ADMIN') {
        // ADMIN: 새로운 문의 알림만 표시
        return state.typeCounts.NEW_INQUIRY || 0;
      } else {
        // USER: 관리자 답변 알림만 표시
        return state.typeCounts.ADMIN_REPLY || 0;
      }
    },
    chatBadgeCount: state => state.typeCounts.ADMIN_CHAT + state.typeCounts.GROUP_CHAT
  }
};