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

              <v-card-text class="search-section">
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="사용자 이름 또는 이메일로 검색"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  class="search-field"
                >
                  <template #prepend-inner>
                    <v-icon color="primary" class="search-icon">mdi-magnify</v-icon>
                  </template>
                </v-text-field>
              </v-card-text>

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
                    <v-avatar
                      class="user-avatar"
                      size="48"
                    >
                      <v-img
                        v-if="user.profileImage"
                        :src="user.profileImage"
                        :alt="user.name"
                        cover
                        class="profile-image"
                      />
                      <span v-else class="avatar-text">{{
                        user.initial
                      }}</span>
                    </v-avatar>
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

                <div
                  v-else
                  class="chat-messages-container"
                  ref="chatContainerRef"
                >
                  <div
                    v-for="(message, index) in chatMessages"
                    :key="index"
                    :class="[
                      'message-wrapper',
                      message.senderEmail === senderEmail ? 'sent' : 'received',
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
                        class="image-container"
                      >
                        <img
                          v-for="(url, imgIndex) in message.imageUrls"
                          :key="imgIndex"
                          :src="url"
                          alt="이미지"
                          class="chat-image"
                        />
                      </div>
                      <div class="message-text">{{ message.message }}</div>
                      <div class="message-time">{{ message.timestamp }}</div>
                    </div>
                  </div>
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
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name"));

// 이미지 관련 상태
const newImages = ref([]);
const imagePreview = ref([]);
const fileInput = ref(null);
const currentUserRole = ref("MANAGER");

// --- 데이터 ---
const users = ref([]);
const guide = ref([
  "왼쪽에서 사용자를 선택하면 오른쪽에서 채팅할 수 있습니다.",
  "관리자는 사용자 권한을 변경하거나 제거할 수 있습니다.",
  "검색을 사용하여 원하는 사용자를 쉽게 찾을 수 있습니다.",
]);

// --- API 함수 ---
const fetchUsers = async () => {
  try {
    console.log("fetchUsers 함수 시작");
    console.log("API URL:", `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members`);
    console.log("토큰 존재 여부:", !!token.value);
    
    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    
    console.log("API 호출 성공");
    const memberList = getResultData(response);
    console.log("멤버 목록:", memberList);
    
    // 백엔드에서 memberProfileImage 필드를 제공하고 있음
    users.value = memberList.map((user) => {
      return {
        name: user.memberName || user.nickname || "이름 없음",
        email: user.memberEmail,
        role: user.type,
        initial: (user.memberName || user.nickname || "이름 없음").charAt(0),
        roomId: user.roomId,
        profileImage: user.memberProfileImage || null, // 백엔드에서 제공하는 프로필 이미지
      };
    });
    
    console.log("최종 사용자 목록:", users.value);
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
  console.log("FridgeMemberList 컴포넌트 마운트됨");
  console.log("현재 fridgeId:", fridgeId.value);
  
  // 유저관리 페이지 진입 시 ADMIN_CHAT 알림 제거
  try {
    await store.dispatch('notification/clearAdminChatNotificationsOnEnter');
  } catch (error) {
    console.error('ADMIN_CHAT 알림 제거 실패:', error);
  }
  
  // 사용자 목록 로드
  console.log("사용자 목록 로드 시작");
  await fetchUsers();
  console.log("사용자 목록 로드 완료");
});

// --- Watcher ---
watch(selectedUser, async (newUser, oldUser) => {
  if (oldUser) {
    disconnectWebSocket();
  }
  if (newUser) {
    chatMessages.value = [];
    newMessage.value = "";
    imagePreview.value = [];
    newImages.value = [];
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/manager/chat/history/room/${newUser.roomId}`,
        {
          headers: { Authorization: `Bearer ${token.value}` },
        }
      );
      const chatData = getResultData(response);
      if (Array.isArray(chatData)) {
        chatMessages.value = chatData.map((msg) => ({
          senderEmail: msg.senderEmail,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.timestamp,
          imageUrls: msg.imageUrls || [],
        }));
      }
      scrollToBottom();
      connectWebSocket(newUser.roomId);
    } catch (error) {
      console.error("채팅 내역 로딩 실패:", getErrorMessage(error));
      chatMessages.value = [];
    }
  } else {
    chatMessages.value = [];
  }
});

// --- 헬퍼 함수 ---
const getRoleChipColor = (role) => (role === "MANAGER" ? "red" : "green");

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
        stompClient.value.subscribe(
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
              scrollToBottom();
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

const disconnectWebSocket = () => {
  if (stompClient.value?.connected) {
    stompClient.value.disconnect();
    stompClient.value = null;
  }
};

// --- 메시지 및 이미지 처리 ---
const uploadImages = async (files) => {
  if (!selectedUser.value) return [];
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    console.log("📬 FormData에 담긴 내용을 확인합니다:");
    for (const [key, value] of formData.entries()) {
      // value가 File 객체인지, 정보(이름, 크기 등)가 올바른지 확인
      console.log(`${key}:`, value);
    }
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

const scrollToBottom = () => {
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

// --- 관리자 기능 ---
const promoteToAdmin = async (user) => {
  if (confirm(`${user.name}님을 관리자로 승격하시겠습니까?`)) {
    try {
      await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/delegateManager?memberEmail=${user.email}`);
      alert(`${user.name}님을 관리자로 승격하였습니다.`);
      router.push('/fridge/dashboard');
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

// --- 생명주기 훅 ---
onMounted(fetchUsers);

onUnmounted(disconnectWebSocket);
</script>

<style scoped>
/* 전체 배경 */
.member-list-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.member-list-background::before {
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

.member-list-container {
  padding: 32px;
}

/* 헤더 스타일 */
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
  align-items: flex-start;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px !important;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* 사용자 목록 카드 */
.user-list-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
}

.card-header {
  padding: 20px 24px 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 20px !important;
}

.search-section {
  padding: 16px 24px 0;
}

.search-field {
  width: 100%;
}

.search-icon {
  font-size: 20px !important;
}

/* 사용자 목록 컨테이너 */
.user-list-container {
  height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: transparent;
}

.user-list-container::-webkit-scrollbar {
  width: 6px;
}

.user-list-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.user-list-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.user-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 사용자 아이템 */
.user-list-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  margin: 8px 0;
  padding: 16px;
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
  font-weight: 600;
  font-size: 12px;
}

.action-menu-btn {
  color: #666;
  transition: all 0.2s ease;
}

.action-menu-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.action-menu {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.menu-item {
  border-radius: 8px;
  margin: 4px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.menu-icon {
  font-size: 18px !important;
}

.spacer {
  width: 40px;
  height: 40px;
}

/* 채팅 카드 */
.chat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
}

.chat-header {
  padding: 20px 24px 16px;
}

.chat-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-icon {
  font-size: 20px !important;
}

.chat-subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

/* 빈 채팅 상태 */
.empty-chat-state {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chat-content {
  text-align: center;
  color: #666;
}

.empty-icon {
  margin-bottom: 16px;
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

/* 채팅 메시지 */
.chat-messages {
  height: 400px;
  overflow: hidden;
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
  padding: 14px 18px;
  border-radius: 20px;
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
  border-bottom-right-radius: 8px;
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
  border-bottom-left-radius: 8px;
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

/* 이미지 */
.chat-image {
  max-width: 200px;
  border-radius: 12px;
  margin: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 입력 영역 */
.input-area {
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 0 0 16px 16px;
}

.message-input {
  width: 100%;
}

.input-btn {
  color: #667eea;
  transition: all 0.2s ease;
}

.input-btn:hover {
  color: #5a6fd8;
  background: rgba(102, 126, 234, 0.1);
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  min-width: 36px;
}

.send-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: scale(1.05);
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
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute !important;
  top: -4px !important;
  right: -4px !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  background-color: #ff4444 !important;
}

.remove-image-btn .v-icon {
  font-size: 16px !important;
  color: white !important;
}

/* 가이드 카드 */
.guide-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 24px;
}

.guide-header {
  padding: 20px 24px 16px;
}

.guide-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.guide-list {
  background: transparent;
  padding: 0 24px 20px;
}

.guide-item {
  border-radius: 8px;
  margin: 4px 0;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.guide-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.guide-icon {
  margin-right: 12px;
  font-size: 18px !important;
}

.guide-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .member-list-container {
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
}

@media (max-width: 600px) {
  .member-list-container {
    padding: 16px;
  }

  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .user-list-container,
  .chat-messages-container {
    height: 300px;
  }

  .message-bubble {
    max-width: 85%;
  }
}
</style>
