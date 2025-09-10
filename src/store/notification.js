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
        // retryTimeout: 5000
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
        
        // MANAGER_CHAT 알림의 경우 커스텀 이벤트 발생 (onmessage에서도 처리)
        if (data.type === 'MANAGER_CHAT') {
          window.dispatchEvent(new CustomEvent('admin-chat-notification', {
            detail: data
          }));
        }
      } catch (error) {
        console.error('SSE 메시지 파싱 오류:', error);
      }
    };

    // 타입별 커스텀 이벤트 리스너 등록 (전역 처리)
    const notificationTypes = [
      'ADMIN_REPLY', 'NEW_FOOD', 'EXPIRATION_IMMINENT', 
      'NEW_ANNOUNCEMENT', 'NEW_COMMENT', 'NEW_INQUIRY', 'NEW_MEMBER',
      'MANAGER_CHAT', 'GROUP_CHAT', 'INQUIRY_REPLY'
    ];

    notificationTypes.forEach(type => {
      globalEventSource.addEventListener(type, (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 서버가 준 type을 우선 사용, 없을 때만 이벤트명 사용
          const finalType = data.type || type;
          const notificationWithType = { ...data, type: finalType };
          store.commit('notification/addNotification', notificationWithType);
          
          // MANAGER_CHAT 알림의 경우 커스텀 이벤트 발생
          if (finalType === 'MANAGER_CHAT') {
            window.dispatchEvent(new CustomEvent('admin-chat-notification', {
              detail: notificationWithType
            }));
          }
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
        sseState.isConnected = false;
        store.commit('notification/setSSEConnectionStatus', false);
        createSSEConnection(store);
      }
    }
  }, 30000);
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
      MANAGER_CHAT: 0,
      GROUP_CHAT: 0,
      ROOM_FULL: 0,
      INQUIRY_REPLY: 0
    },
    // 유저 관리 페이지에서 설정한 배지 상태 추적
    userManagementBadgeState: {
      isSetByUserManagement: false, // 유저 관리 페이지에서 설정했는지 여부
      hasUnreadMessages: false // 실제 unReadCount 기반 상태
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
        if (notification.type === 'MANAGER_CHAT') {
          // MANAGER_CHAT의 경우 유저 관리 페이지에서만 관리하도록 함 (중복 배지 업데이트 방지)
          const currentPath = window.location.pathname;
          if (currentPath === '/fridge/member/list') {
            // 유저 관리 페이지에 있으면 store에서 배지 업데이트하지 않음 (커스텀 이벤트에서 처리)
            console.log('📨 SSE MANAGER_CHAT 알림 - 유저 관리 페이지에서 커스텀 이벤트로 처리');
          } else {
            // 다른 페이지에 있으면 배지 표시
            state.typeCounts[notification.type] = 1;
            console.log('📨 SSE MANAGER_CHAT 알림 - 다른 페이지에서 배지 표시:', {
              typeCounts: state.typeCounts.MANAGER_CHAT,
              currentPath
            });
          }
        } else {
          // 다른 타입은 기존 로직 사용
          state.typeCounts[notification.type]++;
        }
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
      }
      
      // 실시간 알림 이벤트 발생 (모든 알림에 대해, fridgeId와 관계없이)
      const realtimeEvent = new CustomEvent('realtime-notification', {
        detail: notification
      });
      window.dispatchEvent(realtimeEvent);
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

    // 냉장고 변경 시 모든 알림 초기화
    clearAllFridgeNotifications(state) {
      state.fridgeNotifications = {};
      state.fridgeNotificationCounts = {};
      state.notifications = [];
      state.notificationCount = 0;
      // typeCounts는 냉장고별로 유지되며, 전환 시 복원(hydrate)로 처리
    },
    // 냉장고별 알림 카운트 리셋
    resetFridgeNotificationCount(state, fridgeId) {
      if (state.fridgeNotificationCounts[fridgeId]) {
        state.fridgeNotificationCounts[fridgeId] = 0;
      }
    },
    
    // 문의 알림 제거
    clearInquiryNotifications(state) {
      state.typeCounts.NEW_INQUIRY = 0;
      state.typeCounts.ADMIN_REPLY = 0;
      state.typeCounts.INQUIRY_REPLY = 0;
    },
    
    // 유저관리 페이지 진입 시 MANAGER_CHAT 알림 제거하지 않음 (실제 unReadCount 기반으로 유지)
    clearAdminChatNotifications(state) {
      // MANAGER_CHAT 배지는 실제 unReadCount 기반으로 유지하므로 제거하지 않음
      console.log('🧹 clearAdminChatNotifications 호출 - MANAGER_CHAT 배지 유지:', {
        currentValue: state.typeCounts.MANAGER_CHAT,
        userManagementState: state.userManagementBadgeState,
        message: 'MANAGER_CHAT 배지는 실제 unReadCount 기반으로 유지'
      });
    },

    // 채팅 알림 제거 (MANAGER_CHAT 배지는 유지)
    clearChatNotifications(state) {
      state.typeCounts.GROUP_CHAT = 0;
      state.typeCounts.ROOM_FULL = 0;
      // MANAGER_CHAT 배지는 유지 (유저 관리 페이지에서 관리)
      console.log('🧹 채팅 알림 제거 (MANAGER_CHAT 배지 유지):', {
        GROUP_CHAT: state.typeCounts.GROUP_CHAT,
        ROOM_FULL: state.typeCounts.ROOM_FULL,
        MANAGER_CHAT: state.typeCounts.MANAGER_CHAT
      });
    },

    // 채팅 배지 상태 직접 설정 (방 목록의 미읽음 합계를 반영)
    setAdminChatCount(state, count) {
      const oldValue = state.typeCounts.MANAGER_CHAT;
      const newValue = count > 0 ? 1 : 0;
      state.typeCounts.MANAGER_CHAT = newValue;
      
      // MANAGER_CHAT 배지 상태를 sessionStorage에 저장하여 페이지 이동 시에도 유지
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('managerChatBadgeState', JSON.stringify({
          count: newValue,
          timestamp: Date.now()
        }));
      }
      
      console.log('🏪 Store MANAGER_CHAT 배지 변경:', {
        oldValue,
        newValue,
        inputCount: count,
        stackTrace: new Error().stack
      });
    },

    // 유저 관리 페이지에서 배지 상태 설정 (실제 unReadCount 기반)
    setUserManagementBadgeState(state, { hasUnreadMessages, isSetByUserManagement = true }) {
      state.userManagementBadgeState = {
        isSetByUserManagement,
        hasUnreadMessages
      };
      
      // 배지 상태를 sessionStorage에 저장하여 페이지 이동 시에도 유지
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userManagementBadgeState', JSON.stringify({
          hasUnreadMessages,
          isSetByUserManagement,
          timestamp: Date.now()
        }));
      }
      
      console.log('👤 유저 관리 배지 상태 설정:', {
        hasUnreadMessages,
        isSetByUserManagement
      });
    },
    setGroupChatCount(state, count) {
      state.typeCounts.GROUP_CHAT = count > 0 ? 1 : 0;
    },

    // 저장된 typeCounts 로드
    setTypeCounts(state, payload) {
      if (!payload || typeof payload !== 'object') return;
      Object.keys(state.typeCounts).forEach(k => {
        state.typeCounts[k] = payload[k] ?? 0;
      });
    }
  },
  actions: {
    // sessionStorage에서 배지 상태 복원
    restoreBadgeStateFromStorage({ commit }) {
      if (typeof window !== 'undefined') {
        try {
          // MANAGER_CHAT 배지 상태 복원
          const managerChatBadgeState = sessionStorage.getItem('managerChatBadgeState');
          if (managerChatBadgeState) {
            const badgeData = JSON.parse(managerChatBadgeState);
            // 24시간 이내의 데이터만 복원 (너무 오래된 데이터는 무시)
            const isRecent = Date.now() - badgeData.timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              commit('setAdminChatCount', badgeData.count);
              console.log('🔄 MANAGER_CHAT 배지 상태 복원:', badgeData);
            } else {
              console.log('🔄 MANAGER_CHAT 배지 상태 만료됨, 복원하지 않음:', badgeData);
            }
          }
          
          // 유저 관리 배지 상태 복원
          const userManagementBadgeState = sessionStorage.getItem('userManagementBadgeState');
          if (userManagementBadgeState) {
            const badgeData = JSON.parse(userManagementBadgeState);
            // 24시간 이내의 데이터만 복원
            const isRecent = Date.now() - badgeData.timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              commit('setUserManagementBadgeState', {
                hasUnreadMessages: badgeData.hasUnreadMessages,
                isSetByUserManagement: badgeData.isSetByUserManagement
              });
              console.log('🔄 유저 관리 배지 상태 복원:', badgeData);
            } else {
              console.log('🔄 유저 관리 배지 상태 만료됨, 복원하지 않음:', badgeData);
            }
          }
        } catch (error) {
          console.error('배지 상태 복원 실패:', error);
        }
      }
    },

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

    // 냉장고 변경 시 SSE 연결 재설정
    refreshSSEOnFridgeChange({ commit, dispatch }, newFridgeId) {
      if (newFridgeId) {
        // 기존 알림 초기화
        commit('clearAllFridgeNotifications');
        
        // 기존 연결 종료
        if (globalEventSource) {
          globalEventSource.close();
          globalEventSource = null;
        }
        
        // 새로운 냉장고로 재연결
        setTimeout(() => {
          dispatch('initSSE');
          // 새 냉장고의 채팅 배지 상태 동기화
          dispatch('updateChatBadgesOnFridgeEnter', newFridgeId);
        }, 100);
      }
    },
    
    // 채팅 페이지 진입 시 알림 제거
    clearChatNotificationsOnEnter({ commit }) {
      commit('clearChatNotifications');
    },
    
    // 문의 페이지 진입 시 알림 제거
    clearInquiryNotificationsOnEnter({ commit }) {
      commit('clearInquiryNotifications');
    },
    
    // 유저관리 페이지 진입 시 MANAGER_CHAT 알림 제거하지 않음 (실제 unReadCount 기반으로 유지)
    clearAdminChatNotificationsOnEnter({ commit }) {
      // MANAGER_CHAT 배지는 실제 unReadCount 기반으로 유지하므로 제거하지 않음
      commit('clearAdminChatNotifications');
    }
    ,
    // 방 목록 기반으로 배지 상태 동기화
    updateChatBadgePresence({ commit }, { adminHasUnread, groupHasUnread }) {
      commit('setAdminChatCount', adminHasUnread ? 1 : 0);
      commit('setGroupChatCount', groupHasUnread ? 1 : 0);
    },

    // 냉장고 진입 시 채팅 목록 조회하여 배지 상태 업데이트
    async updateChatBadgesOnFridgeEnter({ commit }, fridgeId) {
      try {
        // 일반 채팅방 목록 조회
        const chatResponse = await fetch(`${process.env.VUE_APP_API_BASE_URL}/chat/my/rooms/${fridgeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        let allRooms = [];
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          allRooms = chatData.result || [];
          
        // 첫 번째 방은 관리자 채팅, 나머지는 그룹 채팅
        const [managerRoom, ...groupRooms] = allRooms;
        
        // 모든 채팅방의 unReadCount 합계로 계산
        const managerUnreadCount = managerRoom?.unReadCount || 0;
        const groupUnreadCount = groupRooms?.reduce((sum, room) => sum + (room.unReadCount || 0), 0) || 0;
        const totalUnreadCount = managerUnreadCount + groupUnreadCount;
        commit('setGroupChatCount', totalUnreadCount > 0 ? 1 : 0);
        
        // 로그 출력
        console.log('🔧 updateChatBadgesOnFridgeEnter - 모든 채팅방 unReadCount 합계로 배지 계산:', {
          managerUnreadCount,
          groupUnreadCount,
          totalUnreadCount,
          totalRooms: allRooms.length,
          message: '관리자 채팅방과 그룹 채팅방 모두 포함하여 배지 계산'
        });
        }

        // 관리자 채팅 미읽음 확인 (채팅방 목록의 첫 번째 방이 관리자 채팅방)
        const adminHasUnread = allRooms.length > 0 && (allRooms[0]?.unReadCount || 0) > 0;
        
        // 냉장고 진입 시 유저 관리 배지 상태 초기화 (실제 unReadCount 기반)
        commit('setUserManagementBadgeState', { 
          hasUnreadMessages: adminHasUnread,
          isSetByUserManagement: true 
        });
        
      } catch (error) {
        console.error('채팅 배지 상태 업데이트 실패:', error);
      }
    },

    // 그룹 채팅 배지만 동기화 (MANAGER_CHAT 배지는 건드리지 않음)
    async updateGroupChatBadgeOnly({ commit }, fridgeId) {
      try {
        // 일반 채팅방 목록 조회
        const chatResponse = await fetch(`${process.env.VUE_APP_API_BASE_URL}/chat/my/rooms/${fridgeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const allRooms = chatData.result || [];
          
          // 첫 번째 방은 관리자 채팅, 나머지는 그룹 채팅
          const [managerRoom, ...groupRooms] = allRooms;
          
          // 모든 채팅방의 unReadCount 합계로 계산
          const managerUnreadCount = managerRoom?.unReadCount || 0;
          const groupUnreadCount = groupRooms?.reduce((sum, room) => sum + (room.unReadCount || 0), 0) || 0;
          const totalUnreadCount = managerUnreadCount + groupUnreadCount;
          commit('setGroupChatCount', totalUnreadCount > 0 ? 1 : 0);
        }
        
      } catch (error) {
        console.error('그룹 채팅 배지 상태 업데이트 실패:', error);
      }
    },

    // 냉장고 진입 시 유저 관리 페이지 배지 상태 초기 설정
    async initializeUserManagementBadge({ commit, state }, fridgeId) {
      try {
        // 채팅방 목록 조회하여 실제 unReadCount 확인 (유저 관리 채팅방은 첫 번째 방)
        const chatResponse = await fetch(`${process.env.VUE_APP_API_BASE_URL}/chat/my/rooms/${fridgeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const allRooms = chatData.result || [];
          
          // 첫 번째 방이 관리자 채팅방 (유저 관리 채팅방)
          const managerRoom = allRooms[0];
          const hasUnreadMessages = managerRoom && (managerRoom.unReadCount || 0) > 0;
          
          console.log('🚀 냉장고 진입 시 유저 관리 배지 초기 설정 (채팅방 목록 기반):', {
            fridgeId,
            managerRoomUnReadCount: managerRoom?.unReadCount || 0,
            hasUnreadMessages,
            totalRooms: allRooms.length,
            currentBadgeState: state.typeCounts.MANAGER_CHAT
          });
          
          // 유저 관리 배지 상태 설정
          commit('setUserManagementBadgeState', { 
            hasUnreadMessages,
            isSetByUserManagement: true 
          });
          
          // MANAGER_CHAT 배지 상태도 설정
          commit('setAdminChatCount', hasUnreadMessages ? 1 : 0);
        }
        
      } catch (error) {
        console.error('유저 관리 배지 초기 설정 실패:', error);
      }
    },

    // 유저 관리 배지를 실제 채팅방 목록의 unReadCount와 동기화
    async syncUserManagementBadgeWithUnreadCount({ commit, state }, fridgeId) {
      try {
        // 채팅방 목록 조회하여 실제 unReadCount 확인 (유저 관리 채팅방은 첫 번째 방)
        const chatResponse = await fetch(`${process.env.VUE_APP_API_BASE_URL}/chat/my/rooms/${fridgeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const allRooms = chatData.result || [];
          
          // 첫 번째 방이 관리자 채팅방 (유저 관리 채팅방)
          const managerRoom = allRooms[0];
          const hasUnreadMessages = managerRoom && (managerRoom.unReadCount || 0) > 0;
          
          // 항상 배지 상태 업데이트 (초기 로드 시에도 배지가 표시되도록)
          const currentState = state.userManagementBadgeState;
          console.log('🔄 유저 관리 배지 상태 동기화 (채팅방 목록 기반):', {
            fridgeId,
            managerRoomUnReadCount: managerRoom?.unReadCount || 0,
            hasUnreadMessages,
            previousState: currentState.hasUnreadMessages,
            totalRooms: allRooms.length,
            currentBadgeState: state.typeCounts.MANAGER_CHAT
          });
          
          // 유저 관리 배지 상태 업데이트
          commit('setUserManagementBadgeState', { 
            hasUnreadMessages,
            isSetByUserManagement: true 
          });
          
          // MANAGER_CHAT 배지 상태는 유저 관리 페이지에서만 관리 (다른 곳에서는 건드리지 않음)
          console.log('🔄 syncUserManagementBadgeWithUnreadCount - MANAGER_CHAT 배지 상태 유지:', {
            hasUnreadMessages,
            currentBadgeState: state.typeCounts.MANAGER_CHAT,
            message: 'MANAGER_CHAT 배지는 유저 관리 페이지에서만 관리'
          });
        }
        
      } catch (error) {
        console.error('유저 관리 배지 동기화 실패:', error);
      }
    }
  },
  getters: {
    allNotifications: state => state.notifications,
    notificationCount: state => state.notificationCount,
    typeCounts: state => state.typeCounts,
    isSSEConnected: state => state.isSSEConnected,
    userManagementBadgeState: state => state.userManagementBadgeState,
    

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
    chatBadgeCount: (state) => {
      // MANAGER_CHAT은 채팅 배지에 포함하지 않음 (유저 관리 탭에서 별도 관리됨)
      // GROUP_CHAT과 ROOM_FULL만 채팅 배지에 포함
      return state.typeCounts.GROUP_CHAT + state.typeCounts.ROOM_FULL;
    }
  }
};