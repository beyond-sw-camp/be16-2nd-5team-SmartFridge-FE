<template>
  <v-app>
    <v-main class="member-list-background">
      <v-container fluid class="member-list-container">
        <!-- 헤더 섹션 -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-info">
              <h1 class="page-title">
                <v-icon class="title-icon" color="primary">mdi-account-group</v-icon>
                유저 관리 & 채팅
              </h1>
              <p class="page-subtitle">냉장고 멤버들과 소통하고 관리하세요</p>
            </div>
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="user-list-card">
              <v-card-item class="card-header">
                <div class="d-flex align-center justify-space-between">
                  <v-card-title class="card-title">
                    <v-icon class="card-icon" color="primary">mdi-account-multiple</v-icon>
                    사용자 목록
                  </v-card-title>
                </div>
              </v-card-item>
              <v-divider></v-divider>

              <!-- 새로운 검색 영역 -->
              <div class="search-container">
                <div class="search-wrapper">
                  <v-text-field
                    v-model="searchQuery"
                    placeholder="사용자 검색..."
                    variant="solo"
                    density="comfortable"
                    hide-details
                    clearable
                    class="modern-search-field"
                    rounded="xl"
                    elevation="2"
                  >
                    <template #prepend-inner>
                      <v-icon color="primary" class="search-icon">mdi-magnify</v-icon>
                    </template>
                  </v-text-field>
                  
                  <div v-if="searchQuery" class="search-stats">
                    <v-chip 
                      color="primary" 
                      variant="tonal" 
                      size="small"
                      class="search-count-chip"
                    >
                      <v-icon start size="small">mdi-account-multiple</v-icon>
                      {{ filteredUsers.length }}명
                    </v-chip>
                  </div>
                </div>
              </div>

              <v-list
                class="user-list-container"
                lines="two"
              >
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.email"
                  class="user-list-item"
                  @click="user.role !== 'MANAGER' && selectUser(user)"
                  :class="{
                    'selected-user':
                      selectedUser && selectedUser.email === user.email,
                    'manager-user': user.role === 'MANAGER',
                  }"
                  :style="{
                    cursor: user.role === 'MANAGER' ? 'default' : 'pointer',
                  }"
                >
                  <template v-slot:prepend>
                    <div class="avatar-container">
                      <v-avatar
                        class="avatar-gradient"
                        size="48"
                        style="margin-right: 5px"
                      >
                        <v-img
                          v-if="user.profileImage && user.profileImage.startsWith('http')"
                          :src="user.profileImage"
                          :alt="user.name"
                          cover
                          class="profile-image"
                          @error="handleImageError(user)"
                        />
                        <img
                          v-else-if="user.profileImage && user.profileImage.startsWith('data:')"
                          :src="user.profileImage"
                          :alt="user.name"
                          class="profile-image"
                        />
                        <span v-else class="text-white font-weight-bold">{{
                          user.initial
                        }}</span>
                      </v-avatar>
                      <!-- 안읽은 메시지 개수 배지 -->
                      <div
                        v-if="user.unReadCount > 0"
                        class="unread-badge"
                      >
                        <span class="badge-content">{{ user.unReadCount }}</span>
                      </div>
                    </div>
                  </template>

                  <v-list-item-title class="user-name">{{
                    user.name
                  }}</v-list-item-title>
                  <v-list-item-subtitle class="user-email">
                    {{ user.email }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="user-actions">
                      <v-chip
                        :color="getRoleChipColor(user.role)"
                        variant="elevated"
                        size="small"
                        class="role-chip"
                      >
                        {{ user.role }}
                      </v-chip>

                      <v-menu
                        v-if="
                          user.role !== 'MANAGER' &&
                          currentUserRole === 'MANAGER'
                        "
                      >
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            variant="text"
                            size="small"
                            v-bind="props"
                            @click.stop
                            class="action-menu-btn"
                          >
                            <v-icon>mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>
                        <v-list class="action-menu">
                          <v-list-item @click="promoteToAdmin(user)" class="menu-item">
                            <template v-slot:prepend>
                              <v-icon color="success" class="menu-icon">mdi-account-star</v-icon>
                            </template>
                            <v-list-item-title>관리자 승격</v-list-item-title>
                          </v-list-item>

                          <v-list-item
                            @click="removeUser(user)"
                            class="menu-item text-error"
                          >
                            <template v-slot:prepend>
                              <v-icon color="error" class="menu-icon">mdi-account-remove</v-icon>
                            </template>
                            <v-list-item-title class="text-error"
                              >사용자 제거</v-list-item-title
                            >
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <div
                        v-else-if="user.role === 'MANAGER'"
                        class="spacer"
                      ></div>
                      <div
                        v-else-if="currentUserRole !== 'MANAGER'"
                        class="spacer"
                      ></div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card class="chat-card">
              <v-card-item class="chat-header">
                <v-card-title class="chat-title">
                  <v-icon class="chat-icon" color="primary">mdi-message-text</v-icon>
                  채팅방
                  <span v-if="selectedUser" class="chat-subtitle">
                    - {{ selectedUser.name }}님과의 대화
                  </span>
                </v-card-title>
              </v-card-item>
              <v-divider></v-divider>

              <div class="chat-messages">
                <div
                  v-if="!selectedUser"
                  class="empty-chat-state"
                >
                  <div class="empty-chat-content">
                    <v-icon size="64" color="grey-lighten-1" class="empty-icon">
                      mdi-message-outline
                    </v-icon>
                    <div class="empty-text">채팅할 사용자를 선택해주세요</div>
                    <div class="empty-subtext">왼쪽 목록에서 사용자를 선택하면 대화를 시작할 수 있습니다</div>
                  </div>
                </div>

                <div v-else class="chat-container">
                  <div
                    class="chat-messages-container"
                    ref="chatContainerRef"
                    @scroll="handleScroll"
                  >
                    <!-- 더 많은 메시지 로딩 인디케이터 -->
                    <div v-if="isLoadingMoreMessages" class="load-more-container">
                      <div class="load-more-content">
                        <v-progress-circular
                          indeterminate
                          color="primary"
                          size="32"
                          width="3"
                          class="load-more-spinner"
                        ></v-progress-circular>
                        <p class="load-more-text">과거 메시지를 불러오는 중...</p>
                      </div>
                    </div>
                    
                    <!-- 더 이상 로드할 메시지가 없을 때 표시 -->
                    <div v-if="!hasMoreMessages && chatMessages.length > 0" class="no-more-messages">
                      <div class="no-more-content">
                        <v-icon size="24" color="grey-lighten-1">mdi-check-circle-outline</v-icon>
                        <span class="no-more-text">모든 메시지를 불러왔습니다</span>
                      </div>
                    </div>
                    
                    <template v-for="(message, index) in chatMessages" :key="index">
                      <!-- 날짜 구분선 -->
                      <div
                        v-if="shouldShowDateSeparator(message, chatMessages[index - 1])"
                        class="date-separator"
                      >
                        <div class="date-separator-line"></div>
                        <span class="date-separator-text">{{ formatDate(message.timestamp) }}</span>
                        <div class="date-separator-line"></div>
                      </div>
                      
                      <!-- 메시지 -->
                      <div
                        :class="[
                          'message-wrapper',
                          message.senderEmail === senderEmail || message.senderEmail !== message.receiverEmail ? 'sent' : 'received',
                        ]"
                      >
                        <div class="message-bubble">
                          <div
                            v-if="message.senderEmail !== senderEmail"
                            class="sender-name"
                          >
                            {{ message.senderName }}
                          </div>
                          <div
                            v-if="message.imageUrls && message.imageUrls.length > 0"
                            :class="['image-container', `image-count-${message.imageUrls.length}`]"
                          >
                            <div 
                              v-for="(url, imgIndex) in message.imageUrls" 
                              :key="imgIndex" 
                              class="image-wrapper"
                            >
                              <img 
                                :src="url" 
                                alt="이미지" 
                                class="chat-image clickable" 
                                @click="openImageModal(message.imageUrls, imgIndex)"
                              />
                            </div>
                          </div>
                          <div class="message-text">{{ message.message }}</div>
                          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- 새로운 메시지 표시기 -->
                  <v-fade-transition>
                    <div v-if="showNewMessageIndicator" class="new-message-indicator">
                      <v-btn small rounded color="primary" @click="scrollToBottom">
                        <v-icon left>mdi-arrow-down</v-icon>
                        새로운 메시지
                      </v-btn>
                    </div>
                  </v-fade-transition>
                </div>
              </div>

              <v-divider></v-divider>
              <div class="input-area">
                <div
                  v-if="imagePreview.length > 0"
                  class="image-preview-container"
                >
                  <div
                    v-for="(image, index) in imagePreview"
                    :key="index"
                    class="image-preview-item"
                  >
                    <img :src="image.preview" class="preview-image" />
                    <v-btn
                      icon
                      x-small
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
                      <v-icon small>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>

                <v-text-field
                  v-model="newMessage"
                  placeholder="메시지를 입력하세요..."
                  variant="solo"
                  hide-details
                  rounded
                  density="comfortable"
                  @keyup.enter="sendMessage"
                  class="message-input"
                >
                  <template #append-inner>
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-image-plus"
                      variant="text"
                      @click="fileInput.click()"
                      class="input-btn"
                    >
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-send"
                      variant="text"
                      @click="sendMessage"
                      class="input-btn send-btn"
                    >
                      <v-icon>mdi-send</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>

                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style="display: none"
                  @change="onFileChange"
                />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-card class="guide-card">
          <v-card-item class="guide-header">
            <v-card-title class="guide-title">사용 안내</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-list class="guide-list">
            <v-list-item v-for="(item, i) in guide" :key="i" density="compact" class="guide-item">
              <template v-slot:prepend>
                <v-icon color="primary" class="guide-icon">
                  mdi-information
                </v-icon>
              </template>
              <v-list-item-title class="guide-text">{{
                item
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-container>
    </v-main>

    <!-- 이미지 모달 -->
    <ImageModal 
      v-model="showImageModal" 
      :images="modalImages" 
      :start-index="modalStartIndex" 
    />
  </v-app>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import axios from "axios";
import {
  getErrorMessage,
  getResultData,
  getFridgeId,
} from "@/utils/commonDataHandler";
import { useStore } from "vuex";
import router from "@/router";
import ImageModal from "@/components/chat/ImageModal.vue";

// --- 상태 변수 ---
const store = useStore();
const searchQuery = ref("");
const selectedUser = ref(null);
const newMessage = ref("");
const chatMessages = ref([]);
const fridgeId = computed(() => getFridgeId(store));
const chatContainerRef = ref(null);

// WebSocket 관련 상태
const stompClient = ref(null);
const subscription = ref(null); // 구독 객체 저장
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name"));

// 전역 SSE 이벤트 리스너를 위한 참조
let adminChatListener = null;

// 이미지 관련 상태
const newImages = ref([]);
const imagePreview = ref([]);
const fileInput = ref(null);
const currentUserRole = ref("MANAGER");

// 새로운 메시지 표시기 상태
const showNewMessageIndicator = ref(false);

// 페이징 관련 상태
const isLoadingMoreMessages = ref(false);
const hasMoreMessages = ref(true);
const currentPage = ref(0);
const pageSize = ref(20);
const isInitialLoad = ref(true);

// 이미지 모달 관련 상태
const showImageModal = ref(false);
const modalImages = ref([]);
const modalStartIndex = ref(0);

// --- 데이터 ---
const users = ref([]);
const guide = ref([
  "왼쪽에서 사용자를 선택하면 오른쪽에서 채팅할 수 있습니다.",
  "관리자는 사용자 권한을 변경하거나 제거할 수 있습니다.",
  "검색을 사용하여 원하는 사용자를 쉽게 찾을 수 있습니다.",
]);

// --- 유틸리티 함수 ---
const generateDefaultAvatar = (name, size = 48) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 그라데이션 배경 생성
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  // 원형 배경 그리기
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // 텍스트 그리기
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase(), size / 2, size / 2);
  
  return canvas.toDataURL();
};

// --- API 함수 ---
const fetchUsers = async () => {
  try {
    
    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    
    const userData = getResultData(response);
    
    users.value = userData.map((user) => {
      const userName = user.memberName || user.nickname || "이름 없음";
      
      // 프로필 이미지 유효성 검사 (올바른 필드명 사용)
      let profileImage = null;
      if (user.memberProfileImage && user.memberProfileImage.trim() !== '') {
        // URL이 유효한지 확인
        if (user.memberProfileImage.startsWith('http') || user.memberProfileImage.startsWith('data:')) {
          profileImage = user.memberProfileImage;
        } else {
          profileImage = generateDefaultAvatar(userName);
        }
      } else {
        profileImage = generateDefaultAvatar(userName);
      }
      
      return {
        name: userName,
        email: user.memberEmail,
        role: user.type,
        initial: userName.charAt(0),
        roomId: user.roomId,
        unReadCount: user.unReadCount || 0,
        profileImage: profileImage,
      };
    });
  } catch (error) {
    console.error("사용자 목록 조회 실패:", getErrorMessage(error));
  }
};

// --- 계산된 속성 ---
const filteredUsers = computed(() => {
  // 1. 검색 기능 먼저 적용
  const filtered = searchQuery.value
    ? users.value.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : users.value; // 2. 정렬 기능 추가 // MANAGER 역할을 가진 사용자를 먼저 정렬

  return filtered.sort((a, b) => {
    if (a.role === "MANAGER" && b.role !== "MANAGER") {
      return -1; // a를 b보다 앞으로
    } else if (a.role !== "MANAGER" && b.role === "MANAGER") {
      return 1; // b를 a보다 앞으로
    } else {
      return 0; // 순서 변경 없음
    }
  });
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  
  // 유저관리 페이지 진입 시 MANAGER_CHAT 알림 제거하지 않음 (실제 unReadCount 기반으로 배지 관리)
  
  // 사용자 목록 로드
  await fetchUsers();
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // 전역 SSE 이벤트 리스너 등록
  setupAdminChatListener();
  
  // 초기 배지 상태 설정
  updateAdminChatBadge();
});

// --- Watcher ---
watch(selectedUser, async (newUser, oldUser) => {
  if (oldUser) {
    unsubscribe(oldUser);
  }
  if (newUser) {
    // 채팅 상태 초기화
    chatMessages.value = [];
    newMessage.value = "";
    imagePreview.value = [];
    newImages.value = [];
    showNewMessageIndicator.value = false;
    closeImageModal();
    
    // 페이징 상태 초기화
    isLoadingMoreMessages.value = false;
    hasMoreMessages.value = true;
    currentPage.value = 0;
    isInitialLoad.value = true;
    
    await loadChatHistory(newUser, false);
    connectWebSocket(newUser.roomId);
  } else {
    chatMessages.value = [];
    showNewMessageIndicator.value = false;
    closeImageModal();
  }
});

// --- 헬퍼 함수 ---
const getRoleChipColor = (role) => (role === "MANAGER" ? "red" : "green");

// 채팅 내역 로딩 함수 (페이징 지원)
const loadChatHistory = async (user, isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMoreMessages.value = true;
  } else {
    isInitialLoad.value = true;
    currentPage.value = 0;
    hasMoreMessages.value = true;
  }

  try {
    const url = `${process.env.VUE_APP_API_BASE_URL}/manager/chat/history/room/${user.roomId}?page=${currentPage.value}&size=${pageSize.value}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    
    // Page<ChatMessageDto> 구조에서 content 필드 추출
    const pageData = getResultData(response);
    const chatData = pageData?.content || [];
    
    // 배열이 아닌 경우 빈 배열로 처리
    const safeNewMessages = Array.isArray(chatData) ? chatData : [];
    
    if (isLoadMore) {
      // 더 많은 메시지를 로드할 때는 기존 메시지 앞에 추가
      const newMessages = safeNewMessages.map((msg) => ({
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        imageUrls: msg.imageUrls || [],
        receiverEmail: msg.receiverEmail,
      }));
      chatMessages.value = [...newMessages, ...chatMessages.value];
    } else {
      // 초기 로드일 때는 메시지 교체
      chatMessages.value = safeNewMessages.map((msg) => ({
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        imageUrls: msg.imageUrls || [],
        receiverEmail: msg.receiverEmail,
      }));
      
      // 읽음 처리
      try {
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/manager/chat/${user.roomId}/read`);
      } catch (readError) {
        console.warn('읽음 처리 실패:', readError);
      }
      
      // 선택된 사용자의 안읽은 메시지 개수 초기화
      const userIndex = users.value.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users.value[userIndex].unReadCount = 0;
      }
    }

    // 더 이상 로드할 메시지가 없는지 확인
    hasMoreMessages.value = !pageData?.last;
    
    if (isLoadMore) {
      currentPage.value++;
    } else {
      currentPage.value = 1; // 초기 로드 후 다음 페이지는 1부터
      scrollToBottom();
    }
  } catch (error) {
    console.error("채팅 내역 로딩 실패:", getErrorMessage(error));
    
    // 에러 발생 시 빈 배열로 설정 (초기 로드인 경우만)
    if (!isLoadMore) {
      chatMessages.value = [];
    }
  } finally {
    isLoadingMoreMessages.value = false;
    isInitialLoad.value = false;
  }
};

// 더 많은 메시지 로드 함수
const loadMoreMessages = async () => {
  if (!selectedUser.value || isLoadingMoreMessages.value || !hasMoreMessages.value) {
    return;
  }
  
  await loadChatHistory(selectedUser.value, true);
};

// 이미지 로딩 오류 처리
const handleImageError = (user) => {
  // 기본 아바타로 변경
  user.profileImage = generateDefaultAvatar(user.name);
};

// 날짜와 시간 포맷팅 함수들
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return '오늘';
  } else if (isYesterday) {
    return '어제';
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
};

const selectUser = (user) => {
  if (user.role !== "MANAGER") {
    selectedUser.value = user;
  }
};

// --- WebSocket 함수 ---
const connectWebSocket = (roomId) => {
  if (stompClient.value?.connected) return;
  try {
    const sockJs = new SockJS(
      `${process.env.VUE_APP_API_BASE_URL}/connect/chat`
    );
    stompClient.value = Stomp.over(sockJs);
    stompClient.value.connect(
      { Authorization: `Bearer ${token.value}` },
      () => {
        // 구독 객체를 저장
        subscription.value = stompClient.value.subscribe(
          `/topic/chat/MANAGER/${roomId}`,
          (message) => {
            const receivedMessage = JSON.parse(message.body);
            if (Array.isArray(chatMessages.value)) {
              chatMessages.value.push({
                senderEmail: receivedMessage.senderEmail,
                senderName: receivedMessage.senderName,
                message: receivedMessage.message,
                timestamp: receivedMessage.timestamp,
                imageUrls: receivedMessage.imageUrls || [],
              });
              
              // 내가 보낸 메시지라면 무조건 스크롤을 아래로 이동
              if (receivedMessage.senderEmail === senderEmail.value) {
                scrollToBottom();
                return;
              }
              
              // 다른 사람이 보낸 메시지의 경우, 사용자가 하단에 거의 스크롤되었는지 확인
              const el = chatContainerRef.value;
              const isAtBottom = el ? el.scrollHeight - el.clientHeight <= el.scrollTop + 20 : true;

              if (isAtBottom) {
                scrollToBottom();
              } else {
                showNewMessageIndicator.value = true;
              }
            }
          },
          { Authorization: `Bearer ${token.value}` }
        );
      }
    );
  } catch (error) {
    console.error("WebSocket 연결 실패:", error);
  }
};

// 구독 해제 로직
const unsubscribe = (user) => {
  if (!user) {
    console.warn('unsubscribe: user가 없습니다.');
    return;
  }

  
  try {
    // 1. 먼저 구독 해제
    if (subscription.value) {
      const id = { roomId: user.roomId, roomType: 'manager' };
      subscription.value.unsubscribe(id);
      subscription.value = null;
    }
    
    // 2. 그 다음 연결 해제
    if (stompClient.value?.connected) {
      stompClient.value.disconnect(() => {
      });
      stompClient.value = null;
    }
  } catch (error) {
    console.error('구독 해제 중 오류 발생:', error);
    // 오류 발생 시에도 상태 정리
    subscription.value = null;
    stompClient.value = null;
  }
};

const disconnectWebSocket = () => {
  if (selectedUser.value) {
    unsubscribe(selectedUser.value);
  } else if (stompClient.value?.connected) {
    stompClient.value.disconnect();
    stompClient.value = null;
    subscription.value = null;
  }
};

// --- 메시지 및 이미지 처리 ---
const uploadImages = async (files) => {
  if (!selectedUser.value) return [];
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/manager/chat/room/${selectedUser.value.roomId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token.value}`,
        },
      }
    );
    return getResultData(response);
  } catch (error) {
    console.error("이미지 업로드 실패:", getErrorMessage(error));
    return [];
  }
};

const sendMessage = async () => {
  if (
    !selectedUser.value ||
    (newMessage.value.trim() === "" && newImages.value.length === 0)
  )
    return;

  const currentMessage = newMessage.value;
  const currentImages = [...newImages.value];
  newMessage.value = "";
  newImages.value = [];
  imagePreview.value = [];

  try {
    const imageUrls =
      currentImages.length > 0 ? await uploadImages(currentImages) : [];

    if (stompClient.value?.connected) {
      const message = {
        senderEmail: senderEmail.value,
        senderName: senderName.value,
        message: currentMessage,
        imageUrls: imageUrls,
        timestamp: new Date().toISOString(),
      };
      stompClient.value.send(
        `/publish/chat/MANAGER/${selectedUser.value.roomId}`,
        JSON.stringify(message)
      );
    }

    scrollToBottom();
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    newMessage.value = currentMessage;
    newImages.value = currentImages;
    imagePreview.value = currentImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
  }
};

const handleScroll = async () => {
  const el = chatContainerRef.value;
  if (!el) return;
  
  // 사용자가 수동으로 맨 아래로 스크롤하면 새 메시지 표시기를 숨깁니다.
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
    showNewMessageIndicator.value = false;
  }
  
  // 위로 스크롤하여 과거 메시지 로드
  if (el.scrollTop < 200 && hasMoreMessages.value && !isLoadingMoreMessages.value && !isInitialLoad.value) {
    const previousScrollHeight = el.scrollHeight;
    await loadMoreMessages();
    
    // 스크롤 위치 유지 (새로 로드된 메시지로 인한 높이 변화 보정)
    nextTick(() => {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - previousScrollHeight;
    });
  }
};

const scrollToBottom = () => {
  showNewMessageIndicator.value = false;
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (newImages.value.length + files.length > 10) {
    alert("이미지는 최대 10장까지만 선택할 수 있습니다.");
    return;
  }
  newImages.value.push(...files);
  imagePreview.value.push(
    ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
  );
  event.target.value = "";
};

const removeImage = (index) => {
  URL.revokeObjectURL(imagePreview.value[index].preview);
  imagePreview.value.splice(index, 1);
  newImages.value.splice(index, 1);
};

// 이미지 모달 관련 함수들
const openImageModal = (imageUrls, startIndex = 0) => {
  modalImages.value = imageUrls;
  modalStartIndex.value = startIndex;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImages.value = [];
  modalStartIndex.value = 0;
};

// --- 관리자 기능 ---
const promoteToAdmin = async (user) => {
  if (confirm(`${user.name}님을 관리자로 승격하시겠습니까?`)) {
    try {
      await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/delegateManager?memberEmail=${user.email}`);
      alert(`${user.name}님을 관리자로 승격하였습니다.`);
      router.push('/fridge/list');
    } catch (error) {
      console.error("관리자 승격 실패:", getErrorMessage(error));
      alert("관리자 승격에 실패했습니다.");
    }
  }
};

const removeUser = async (user) => {
  if (confirm(`${user.name}님을 냉장고에서 제거하시겠습니까?`)) {
    try {
      await axios.delete(
        `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members/${user.email}`,
      );
      users.value = users.value.filter((u) => u.email !== user.email);
      if (selectedUser.value && selectedUser.value.email === user.email) {
        selectedUser.value = null;
      }
    } catch (error) {
      console.error("사용자 제거 실패:", getErrorMessage(error));
      alert("사용자 제거에 실패했습니다.");
    }
  }
};

// beforeunload 이벤트 핸들러
const handleBeforeUnload = () => {
  // 현재 선택된 사용자가 있으면 WebSocket 연결 해제
  if (selectedUser.value) {
    unsubscribe(selectedUser.value);
  }
};

// --- 전역 SSE 이벤트 리스너 관리 ---
const setupAdminChatListener = () => {
  // 전역 SSE 이벤트 리스너 등록
  adminChatListener = (event) => {
    const notification = event.detail;
    handleAdminChatNotification(notification);
  };
  
  // 커스텀 이벤트 리스너 등록
  window.addEventListener('admin-chat-notification', adminChatListener);
};

const removeAdminChatListener = () => {
  if (adminChatListener) {
    window.removeEventListener('admin-chat-notification', adminChatListener);
    adminChatListener = null;
  }
};

// 배지 업데이트 함수
const updateAdminChatBadge = () => {
  // 모든 사용자의 unReadCount 확인
  const hasUnreadMessages = users.value.some(user => (user.unReadCount || 0) > 0);
  
  // 배지 상태 업데이트
  if (hasUnreadMessages) {
    store.commit('notification/setAdminChatCount', 1);
  } else {
    store.commit('notification/setAdminChatCount', 0);
  }
  
};

// MANAGER_CHAT 알림 처리
const handleAdminChatNotification = async (notification) => {
  
  if (notification.type === 'MANAGER_CHAT') {
    const roomId = notification.roomId || notification.chatRoomId;
  
    let userIndex = -1;
    
    if (roomId) {
      userIndex = users.value.findIndex(u => u.roomId === roomId);
    }
    
    if (userIndex !== -1) {
      users.value[userIndex].unReadCount = (users.value[userIndex].unReadCount || 0) + 1;
      
      // 배지 상태 업데이트
      updateAdminChatBadge();
    } else {
      // 사용자를 찾을 수 없는 경우 사용자 목록을 새로 고침하여 최신 unReadCount 가져오기
      try {
        await fetchUsers();
      } catch (error) {
        console.error('사용자 목록 새로고침 실패:', error);
      }
    }
  }
};

// --- 생명주기 훅 ---
onUnmounted(() => {
  disconnectWebSocket();
  removeAdminChatListener();
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
/* 전체 배경 */
.member-list-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.member-list-container {
  padding: 16px;
  min-height: 100vh;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .member-list-container {
    padding: 8px;
  }
}

/* 페이지 헤더 레이아웃 */
.page-header {
  margin-bottom: 24px;
  text-align: left;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.title-icon {
  font-size: 2rem !important;
}

.page-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
  font-weight: 500;
}

/* 카드 레이아웃 개선 */
.user-list-card,
.chat-card,
.guide-card {
  height: 100%;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.card-header,
.chat-header,
.guide-header {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.card-title,
.chat-title,
.guide-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon,
.chat-icon {
  font-size: 1.5rem !important;
}

/* 새로운 검색 컨테이너 */
.search-container {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}

.search-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}


/* 검색 통계 */
.search-stats {
  display: flex;
  justify-content: center;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-count-chip {
  background: rgba(102, 126, 234, 0.1) !important;
  color: #667eea !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  padding: 8px 16px !important;
  border-radius: 20px !important;
  border: 1px solid rgba(102, 126, 234, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15) !important;
}

.search-count-chip .v-icon {
  font-size: 14px !important;
  margin-right: 6px !important;
}

/* 아바타 컨테이너와 배지 스타일 */
.avatar-container {
  position: relative;
  display: inline-block;
}


.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.unread-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 10;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
  font-weight: 700;
  font-size: 11px;
}

.badge-content {
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
  padding: 0 4px;
}
/* 사용자 목록 레이아웃 */
.user-list-container {
  padding: 8px 16px 16px;
  max-height: 400px;
  overflow-y: auto;
}

.user-list-container .v-list-item {
  border-radius: 24px !important;
  margin: 8px 0 !important;
  padding: 20px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(5px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease !important;
}

.user-list-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  margin: 8px 0;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-list-item:hover {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.95);
}

.selected-user {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.manager-user {
  opacity: 0.7;
  cursor: default;
}

.manager-user:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 아바타 */
.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.avatar-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.user-avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 50%;
}

.avatar-text {
  color: white;
  font-weight: 700;
  font-size: 16px;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  position: relative;
  z-index: 1;
}

/* 사용자 정보 */
.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: #666;
}

/* 사용자 액션 */
.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-chip {
  font-weight: 700;
  font-size: 11px;
  border-radius: 20px !important;
  padding: 6px 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-menu-btn {
  color: #666;
  transition: all 0.2s ease;
  border-radius: 50% !important;
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
}

.action-menu-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1) !important;
  transform: scale(1.1);
}

.action-menu {
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  padding: 8px;
}

.menu-item {
  border-radius: 16px;
  margin: 4px;
  transition: all 0.2s ease;
  padding: 12px 16px !important;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.08) !important;
  transform: translateX(4px);
}

.menu-icon {
  font-size: 18px !important;
}

.spacer {
  width: 40px;
  height: 40px;
}

/* 채팅 영역 레이아웃 */
.chat-messages {
  height: 400px;
  overflow: hidden;
}

.chat-container {
  position: relative;
  height: 400px;
}

.chat-messages-container {
  height: 400px;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

.chat-messages-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(148, 163, 184, 0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  z-index: 0;
}

/* 더 많은 메시지 로딩 인디케이터 스타일 */
.load-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.load-more-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.load-more-spinner {
  margin: 0;
}

.load-more-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* 더 이상 로드할 메시지가 없을 때 스타일 */
.no-more-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 16px;
  position: relative;
  z-index: 1;
}

.no-more-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.no-more-text {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.chat-subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 400;
  margin-left: 8px;
}

/* 빈 채팅 상태 레이아웃 */
.empty-chat-state {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

.empty-chat-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(148, 163, 184, 0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  z-index: 0;
}

.empty-chat-content {
  text-align: center;
  color: #666;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  margin-bottom: 16px;
  color: #94a3b8;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #666;
}

.message-wrapper {
  margin: 12px 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  max-width: 75%;
  padding: 16px 20px;
  border-radius: 24px;
  word-break: break-word;
  backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.sent {
  align-items: flex-end;
  margin-right: 8px;
}

.sent .message-bubble {
  background: #1a73e8;
  color: #ffffff;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 16px rgba(26, 115, 232, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.sent .message-bubble:hover {
  background: #1557b0;
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.35);
  transform: translateY(-1px);
}

.received {
  align-items: flex-start;
  margin-left: 8px;
}

.received .message-bubble {
  background: #ffffff;
  color: #1a1a1a;
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8eaed;
}

.received .message-bubble:hover {
  background: #f8f9fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.sender-name {
  font-size: 0.75rem;
  margin-bottom: 6px;
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: #666666;
}

.message-text {
  font-size: 0.95rem;
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0.01em;
  word-break: break-word;
}

.sent .message-text {
  color: #ffffff;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.received .message-text {
  color: #2c2c2c;
  font-weight: 400;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 6px;
  opacity: 0.8;
  font-weight: 500;
}

.sent .message-time {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.received .message-time {
  color: #5f6368;
}
/* 이미지 컨테이너 스타일 */
.image-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
  max-width: 420px; /* 2열로 배치할 때 적절한 크기 */
}

.image-wrapper {
  flex: 0 0 auto;
}

.chat-image { 
  width: 200px; 
  height: 150px; 
  object-fit: cover; 
  border-radius: 12px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
}

/* 이미지 개수별 크기 조정 */
.image-container.image-count-1 .chat-image {
  width: 250px;
  height: 180px;
}

.image-container.image-count-2 .chat-image {
  width: 180px;
  height: 135px;
}

.image-container.image-count-3 .chat-image,
.image-container.image-count-4 .chat-image {
  width: 130px;
  height: 100px;
}

/* 5개 이상일 때는 더 작게 */
.image-container[class*="image-count-"]:not(.image-count-1):not(.image-count-2):not(.image-count-3):not(.image-count-4) .chat-image {
  width: 100px;
  height: 80px;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .image-container {
    max-width: 300px;
  }
  
  .image-container.image-count-1 .chat-image {
    width: 200px;
    height: 150px;
  }
  
  .image-container.image-count-2 .chat-image {
    width: 140px;
    height: 105px;
  }
  
  .image-container.image-count-3 .chat-image,
  .image-container.image-count-4 .chat-image {
    width: 90px;
    height: 70px;
  }
  
  .image-container[class*="image-count-"]:not(.image-count-1):not(.image-count-2):not(.image-count-3):not(.image-count-4) .chat-image {
    width: 70px;
    height: 55px;
  }
}
/* 입력 영역 레이아웃 */
.input-area {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 0 0 24px 24px;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 4px 12px;
}

.image-preview-item {
  position: relative;
  width: 60px;
  height: 60px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-image-btn {
  position: absolute !important;
  top: -4px !important;
  right: -4px !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  background-color: #ff4444 !important;
  box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3) !important;
}

.remove-image-btn .v-icon {
  font-size: 16px !important;
  color: white !important;
}

.message-input {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.input-btn {
  color: #667eea;
  transition: all 0.2s ease;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
}

.input-btn:hover {
  background: rgba(102, 126, 234, 0.1) !important;
  transform: scale(1.1);
}

.send-btn:hover {
  background: rgba(34, 197, 94, 0.1) !important;
  color: #10b981 !important;
}

/* 날짜 구분선 스타일 */
.date-separator {
  display: flex;
  align-items: center;
  margin: 16px 0;
  padding: 0 20px;
}

.date-separator-line {
  flex: 1;
  height: 1px;
  background-color: #e0e0e0;
}

.date-separator-text {
  padding: 8px 16px;
  font-size: 0.75rem;
  color: #666;
  background: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  white-space: nowrap;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 새로운 메시지 표시기 스타일 */
.new-message-indicator {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.9;
}

.new-message-indicator .v-btn {
  border-radius: 24px !important;
  padding: 8px 20px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
}

/* 가이드 카드 레이아웃 */
.guide-card {
  margin-top: 24px;
}

.guide-header {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.guide-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-list {
  padding: 16px 24px 24px;
  background: rgba(255, 255, 255, 0.8);
}

.guide-list .v-list-item {
  border-radius: 24px !important;
  margin: 8px 0 !important;
  padding: 16px 20px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.guide-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  margin: 8px 0;
  padding: 16px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.guide-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
}

.guide-icon {
  color: #667eea;
}

.guide-text {
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Vuetify v-list-item 둥근 모서리 강제 적용 */
.user-list-container .v-list-item.rounded-0,
.guide-list .v-list-item.rounded-0 {
  border-radius: 24px !important;
}

/* Vuetify v-list-item 내부 요소들 스타일링 */
.user-list-container .v-list-item__content,
.guide-list .v-list-item__content {
  padding: 0 !important;
}

.user-list-container .v-list-item__prepend,
.guide-list .v-list-item__prepend {
  margin-right: 16px !important;
}

.user-list-container .v-list-item__append,
.guide-list .v-list-item__append {
  margin-left: 16px !important;
}

/* 다크모드 스타일 */
@media (prefers-color-scheme: dark) {
  .load-more-container {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .load-more-text {
    color: #9ca3af;
  }
  
  .no-more-content {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .no-more-text {
    color: #6b7280;
  }
}

/* 이미지 클릭 가능 스타일 */
.chat-image.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-image.clickable:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 반응형 레이아웃 */
@media (max-width: 768px) {
  .member-list-container {
    padding: 8px;
  }
  
  .page-header {
    margin-bottom: 16px;
  }
  
  .header-content {
    padding: 16px;
    border-radius: 20px;
  }
  
  .page-title {
    font-size: 1.5rem;
    flex-direction: column;
    gap: 8px;
  }
  
  .title-icon {
    font-size: 1.75rem !important;
  }
  
  .page-subtitle {
    font-size: 0.9rem;
  }
  
  /* 모바일 검색 필드 스타일 */
  .search-container {
    padding: 16px 20px 12px;
  }
  
  .search-count-chip {
    font-size: 11px !important;
    padding: 6px 12px !important;
  }
  
  .user-list-container {
    max-height: 300px;
    padding: 6px 12px 12px;
  }
  
  .user-list-item {
    padding: 12px;
    margin: 6px 0;
  }
  
  .chat-messages,
  .chat-container,
  .chat-messages-container {
    height: 300px;
  }
  
  .empty-chat-state {
    height: 300px;
  }
  
  .empty-chat-content {
    padding: 24px;
    border-radius: 20px;
  }
  
  .input-area {
    padding: 12px 16px;
  }
  
  .guide-list {
    padding: 12px 16px 16px;
  }
  
  .guide-item {
    padding: 10px 12px;
    margin: 6px 0;
  }
}

@media (max-width: 480px) {
  .member-list-container {
    padding: 4px;
  }
  
  .header-content {
    padding: 12px;
    border-radius: 16px;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .title-icon {
    font-size: 1.5rem !important;
  }
  
  .page-subtitle {
    font-size: 0.85rem;
  }
  
  /* 작은 화면 검색 필드 스타일 */
  .search-container {
    padding: 12px 16px 8px;
  }
  
  .search-count-chip {
    font-size: 10px !important;
    padding: 4px 8px !important;
  }
  
  .user-list-container {
    max-height: 250px;
    padding: 4px 8px 8px;
  }
  
  .user-list-item {
    padding: 10px;
    margin: 4px 0;
  }
  
  .chat-messages,
  .chat-container,
  .chat-messages-container {
    height: 250px;
  }
  
  .empty-chat-state {
    height: 250px;
  }
  
  .empty-chat-content {
    padding: 16px;
    border-radius: 16px;
  }
  
  .input-area {
    padding: 8px 12px;
  }
  
  .guide-list {
    padding: 8px 12px 12px;
  }
  
  .guide-item {
    padding: 8px 10px;
    margin: 4px 0;
  }
}
</style>
