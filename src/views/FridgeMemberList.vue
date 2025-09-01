<template>
  <v-app>
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <v-card class="mb-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3 text-h4 font-weight-bold"
              >👤 유저 관리 & 채팅</v-card-title
            >
          </v-card-item>
        </v-card>

        <v-row>
          <v-col cols="12" md="4">
            <v-card rounded="lg">
              <v-card-item>
                <div class="d-flex align-center justify-space-between">
                  <v-card-title class="text-grey-darken-3"
                    >👤 사용자 목록</v-card-title
                  >
                </div>
              </v-card-item>
              <v-divider></v-divider>

              <v-card-text class="pb-0">
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="사용자 이름 또는 이메일로 검색"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-card-text>

              <v-list
                class="bg-transparent user-list-scroll"
                lines="two"
                style="height: 400px; overflow-y: auto"
              >
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.email"
                  class="ma-2 user-list-item"
                  rounded="lg"
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
                      class="avatar-gradient"
                      size="48"
                      style="margin-right: 5px"
                    >
                      <span class="text-white font-weight-bold">{{
                        user.initial
                      }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold">{{
                    user.name
                  }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ user.email }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-chip
                        :color="getRoleChipColor(user.role)"
                        label
                        size="small"
                        class="font-weight-bold mr-2"
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
                          ></v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="promoteToAdmin(user)">
                            <template v-slot:prepend>
                              <v-icon>mdi-crown</v-icon>
                            </template>
                            <v-list-item-title>관리자 승격</v-list-item-title>
                          </v-list-item>

                          <v-list-item
                            @click="removeUser(user)"
                            class="text-error"
                          >
                            <template v-slot:prepend>
                              <v-icon color="error">mdi-account-remove</v-icon>
                            </template>
                            <v-list-item-title class="text-error"
                              >사용자 제거</v-list-item-title
                            >
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <div
                        v-else-if="user.role === 'MANAGER'"
                        style="width: 40px; height: 40px"
                      ></div>
                      <div
                        v-else-if="currentUserRole !== 'MANAGER'"
                        style="width: 40px; height: 40px"
                      ></div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card rounded="lg">
              <v-card-item>
                <v-card-title class="text-grey-darken-3">
                  💬 채팅방
                  <span v-if="selectedUser" class="text-caption ml-2">
                    - {{ selectedUser.name }}님과의 대화
                  </span>
                </v-card-title>
              </v-card-item>
              <v-divider></v-divider>

              <div class="chat-messages">
                <div
                  v-if="!selectedUser"
                  class="d-flex align-center justify-center"
                  style="height: 400px"
                >
                  <v-card-text class="text-center text-grey">
                    <v-icon size="64" color="grey-lighten-1"
                      >mdi-chat-outline</v-icon
                    >
                    <div class="text-h6 mt-2">채팅할 사용자를 선택해주세요</div>
                  </v-card-text>
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
              <div class="input-area" style="padding: 4px">
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
                >
                  <template #append-inner>
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-image-plus"
                      variant="text"
                      @click="fileInput.click()"
                    />
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-send"
                      variant="text"
                      @click="sendMessage"
                    />
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

        <v-card class="mt-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3">사용 안내</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-list class="bg-transparent">
            <v-list-item v-for="(item, i) in guide" :key="i" density="compact">
              <template v-slot:prepend>
                <v-icon color="blue-darken-1" class="mr-3"
                  >mdi-circle-medium</v-icon
                >
              </template>
              <v-list-item-title class="text-grey-darken-1">{{
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
    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    users.value = getResultData(response).map((user) => ({
      name: user.memberName || user.nickname || "이름 없음",
      email: user.memberEmail,
      role: user.type,
      initial: (user.memberName || user.nickname || "이름 없음").charAt(0),
      roomId: user.roomId,
    }));
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
.app-bar-gradient {
  background: linear-gradient(91.91deg, #667eea 0%, #764ba2 100%);
}
.avatar-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.user-list-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}
.user-list-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.selected-user {
  border-color: #667eea;
  background-color: #e3f2fd;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}
.user-list-scroll {
  scrollbar-width: thin;
  scrollbar-color: #667eea #f5f5f5;
}
.user-list-scroll::-webkit-scrollbar {
  width: 8px;
}
.user-list-scroll::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}
.user-list-scroll::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}
.user-list-scroll::-webkit-scrollbar-thumb:hover {
  background: #5a6fd8;
}
.chat-messages {
  height: 400px;
  overflow: hidden;
}
.chat-messages-container {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}
.message-wrapper {
  margin: 8px 0;
  display: flex;
  flex-direction: column;
}
.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-word;
}
.sent {
  align-items: flex-end;
}
.sent .message-bubble {
  background: #1976d2;
  color: white;
  border-bottom-right-radius: 4px;
}
.received {
  align-items: flex-start;
}
.received .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.sender-name {
  font-size: 0.75rem;
  margin-bottom: 4px;
  opacity: 0.8;
}
.message-text {
  font-size: 0.95rem;
  line-height: 1.4;
}
.message-time {
  font-size: 0.7rem;
  margin-top: 4px;
  opacity: 0.7;
}
.input-area {
  background: white;
  border-top: 1px solid #eee;
}
.chat-image {
  max-width: 200px;
  border-radius: 8px;
  margin: 4px 0;
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
</style>
