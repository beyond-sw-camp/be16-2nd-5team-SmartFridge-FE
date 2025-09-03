<template>
  <v-card class="d-flex flex-column chat-window-full" rounded="xl">
    <div v-if="!selectedRoom" class="d-flex justify-center align-center flex-grow-1 text-center text-grey">
      <div>
        <p class="text-h6">채팅을 선택해주세요.</p>
        <p>왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
      </div>
    </div>

    <template v-else>
      <v-toolbar density="compact">
        <v-toolbar-title class="font-weight-bold">{{ selectedRoom.roomName }}</v-toolbar-title>
      </v-toolbar>
      <v-divider />

      <div class="chat-container">
        <v-card-text ref="chatBox" class="flex-grow-1 pa-0 chat-box" @scroll="handleScroll">
          <div v-for="(group, groupIndex) in groupedMessages" :key="groupIndex" class="message-group">
            <!-- 날짜 구분선 -->
            <div class="date-divider">
              <div class="date-line"></div>
              <div class="date-text">{{ formatDate(group.date) }}</div>
              <div class="date-line"></div>
            </div>
            
            <!-- 해당 날짜의 메시지들 -->
            <div
              v-for="(msg, msgIndex) in group.messages"
              :key="`${msg.senderEmail}-${msg.timestamp}-${msgIndex}`"
              :class="['message-wrapper', msg.senderEmail === senderEmail ? 'sent' : 'received']"
            >
              <div class="message-bubble">
                <div v-if="msg.senderEmail !== senderEmail" class="sender-name">{{ msg.senderName }}</div>
                <div v-if="msg.imageUrls && msg.imageUrls.length > 0" :class="['image-container', `image-count-${msg.imageUrls.length}`]">
                  <div 
                    v-for="(url, imgIndex) in msg.imageUrls" 
                    :key="imgIndex" 
                    class="image-wrapper"
                  >
                    <img 
                      :src="url" 
                      alt="이미지" 
                      class="chat-image clickable" 
                      @click="openImageModal(msg.imageUrls, imgIndex)"
                    />
                  </div>
                </div>
                <div class="message-text">{{ msg.message }}</div>
                <div class="message-time">{{ formatMessageTime(msg.timestamp) }}</div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-fade-transition>
          <div v-if="showNewMessageIndicator" class="new-message-indicator">
            <v-btn small rounded color="primary" @click="scrollToBottom">
              <v-icon left>mdi-arrow-down</v-icon>
              새로운 메시지
            </v-btn>
          </div>
        </v-fade-transition>
      </div>

      <v-divider />

      <div class="input-area">
        <div v-if="imagePreview.length > 0" class="image-preview-container">
          <div v-for="(image, index) in imagePreview" :key="index" class="image-preview-item">
            <img :src="image.preview" class="preview-image" />
            <v-btn icon x-small color="error" class="remove-image-btn" @click="removeImage(index)">
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
            <v-btn icon="mdi-image-plus" variant="text" @click="fileInput.click()" />
            <v-btn icon="mdi-send" variant="text" @click="sendMessage" />
          </template>
        </v-text-field>
        <input ref="fileInput" type="file" multiple accept="image/*" style="display: none" @change="onFileChange" />
      </div>
    </template>

    <!-- 이미지 모달 -->
    <ImageModal 
      v-model="showImageModal" 
      :images="modalImages" 
      :start-index="modalStartIndex" 
    />
  </v-card>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';
import ImageModal from './ImageModal.vue';

const props = defineProps({
  selectedRoom: { type: Object, default: null },
  selectedRoomType: { type: String, default: null }
});

// --- 상태 (State) ---
const messages = ref([]);
const newMessage = ref("");
const stompClient = ref(null);
const subscription = ref(null); // 구독 객체 저장
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name")); // [개선] senderName 추가
const newImages = ref([]);
const imagePreview = ref([]);
const chatBox = ref(null);
const fileInput = ref(null);
const showNewMessageIndicator = ref(false);
const showImageModal = ref(false);
const modalImages = ref([]);
const modalStartIndex = ref(0);

// timestamp를 Date 객체로 변환하는 함수
const parseTimestamp = (timestamp) => {
  
  // 다양한 형식의 timestamp를 처리
  if (!timestamp) return new Date();
  
  // 이미 Date 객체인 경우
  if (timestamp instanceof Date) return timestamp;
  
  // 문자열인 경우 다양한 형식 처리
  if (typeof timestamp === 'string') {
    // "2025-08-31 16시 57분" 같은 형식 처리
    if (timestamp.includes('시') && timestamp.includes('분')) {
      const match = timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})시\s+(\d{1,2})분/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return new Date(year, month - 1, day, hour, minute);
      }
    }
    
    // "2025-08-31T16:57:00" 같은 ISO 형식 처리
    if (timestamp.includes('T')) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // "2025-08-31 16:57:00" 같은 형식 처리
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/)) {
      const date = new Date(timestamp.replace(' ', 'T'));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // 기본 Date 생성자로 시도
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // 숫자인 경우 (timestamp)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  console.warn('알 수 없는 timestamp 형식:', timestamp);
  return new Date(); // 기본값으로 현재 시간 반환
};

// 메시지를 날짜별로 그룹화
const groupedMessages = computed(() => {
  const groups = {};
  
  messages.value.forEach(msg => {
    const date = parseTimestamp(msg.timestamp);
    const dateKey = date.toDateString(); // "Mon Oct 23 2023" 형식
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: date,
        messages: []
      };
    }
    groups[dateKey].messages.push(msg);
  });
  
  // 날짜순으로 정렬된 배열로 변환
  return Object.values(groups).sort((a, b) => a.date - b.date);
});

// 날짜를 예쁘게 포맷팅하는 함수
const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDate = new Date(date);
  
  if (msgDate.toDateString() === today.toDateString()) {
    return '오늘';
  } else if (msgDate.toDateString() === yesterday.toDateString()) {
    return '어제';
  } else {
    return msgDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

// 메시지 시간을 포맷팅하는 함수
const formatMessageTime = (timestamp) => {
  const date = parseTimestamp(timestamp);
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

watch(
  [() => props.selectedRoom, () => props.selectedRoomType],
  async ([newRoom, newRoomType], [oldRoom, oldRoomType]) => {
    if (oldRoom) {
      unsubscribe(oldRoom, oldRoomType);
    }

    resetChatState();

    if (newRoom && newRoom.roomId) {
      await loadChatHistory(newRoom, newRoomType);
      connectWebsocket(newRoom.roomId, newRoomType);
    }
  },
  { deep: true }
);

// --- 함수 (Functions) ---
const resetChatState = () => {
  messages.value = [];
  newMessage.value = "";
  imagePreview.value = [];
  newImages.value = [];
  showNewMessageIndicator.value = false;
  closeImageModal(); // 이미지 모달도 닫기
  
  // 구독 상태도 초기화
  subscription.value = null;
};

const loadChatHistory = async (room, roomType) => {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/${roomType}/chat/history/${room.roomId}`);
    messages.value = getResultData(response);
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/${roomType}/chat/${room.roomId}/read`);
    scrollToBottom();
  } catch (error) {
    console.error("채팅 내역 로딩 실패:", error);
  }
};

const handleScroll = () => {
  const el = chatBox.value;
  if (!el) return;
  // 사용자가 수동으로 맨 아래로 스크롤하면 새 메시지 표시기를 숨깁니다.
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
    showNewMessageIndicator.value = false;
  }
};

const scrollToBottom = () => {
  showNewMessageIndicator.value = false;
  nextTick(() => {
    if (chatBox.value) {
      const element = chatBox.value.$el || chatBox.value;
      element.scrollTop = element.scrollHeight;
    }
  });
};

const connectWebsocket = (roomId, roomType) => {
  if (stompClient.value?.connected || !roomType) return;
  
  const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect/chat`);
  stompClient.value = Stomp.over(sockJs);
  stompClient.value.connect({ Authorization: `Bearer ${token.value}` }, () => {
    // 구독 객체를 저장
    subscription.value = stompClient.value.subscribe(`/topic/chat/${roomType.toUpperCase()}/${roomId}`, (message) => {
      const newMessage = JSON.parse(message.body);
      messages.value.push(newMessage);
      
      // 내가 보낸 메시지라면 무조건 스크롤을 아래로 이동
      if (newMessage.senderEmail === senderEmail.value) {
        scrollToBottom();
        return;
      }
      
      const el = chatBox.value;
      // 다른 사람이 보낸 메시지의 경우, 사용자가 하단에 거의 스크롤되었는지 확인합니다.
      const isAtBottom = el ? el.scrollHeight - el.clientHeight <= el.scrollTop + 20 : true;

      if (isAtBottom) {
        scrollToBottom();
      } else {
        showNewMessageIndicator.value = true;
      }
    }, { Authorization: `Bearer ${token.value}` });
  });
};

// 구독 해제 로직
const unsubscribe = (room, roomType) => {
  if (!room || !roomType) {
    console.warn('unsubscribe: room 또는 roomType이 없습니다.');
    return;
  }

  console.log(`채팅방 ${room.roomName || room.roomId} 구독 해제 시작`);
  
  try {
    // 1. 먼저 구독 해제
    if (subscription.value) {
      const id = { roomId: room.roomId, roomType };
      subscription.value.unsubscribe(id);
      subscription.value = null;
      console.log('구독이 해제되었습니다.');
    }
    
    // 2. 그 다음 연결 해제
    if (stompClient.value?.connected) {
      stompClient.value.disconnect(() => {
        console.log('WebSocket 연결이 정상적으로 해제되었습니다 (disconnected)');
      });
      stompClient.value = null;
      console.log('WebSocket 연결 해제 완료');
    }
  } catch (error) {
    console.error('구독 해제 중 오류 발생:', error);
    // 오류 발생 시에도 상태 정리
    subscription.value = null;
    stompClient.value = null;
  }
};



const changeImage = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));
  const response = await axios.post(
    `${process.env.VUE_APP_API_BASE_URL}/${props.selectedRoomType}/chat/room/${props.selectedRoom.roomId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token.value}` } }
  );
  return getResultData(response);
};

const sendMessage = async () => {
  if (!props.selectedRoom || (newMessage.value.trim() === "" && newImages.value.length === 0)) return;

  const currentMessage = newMessage.value;
  const currentImages = [...newImages.value];
  newMessage.value = "";
  newImages.value = [];
  imagePreview.value = [];

  try {
    const imageUrls = currentImages.length > 0 ? await changeImage(currentImages) : [];
    // [개선] message 객체에 senderName 추가
    const message = { 
      senderEmail: senderEmail.value, 
      senderName: senderName.value,
      message: currentMessage, 
      imageUrls
    };
    if (stompClient.value?.connected) {
      stompClient.value.send(`/publish/chat/${props.selectedRoomType.toUpperCase()}/${props.selectedRoom.roomId}`, JSON.stringify(message));
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    newMessage.value = currentMessage;
    newImages.value = currentImages;
    imagePreview.value = currentImages.map(file => ({ file, preview: URL.createObjectURL(file) }));
  }
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (newImages.value.length + files.length > 10) {
    alert('이미지는 최대 10장까지만 선택할 수 있습니다.');
    return;
  }
  newImages.value.push(...files);
  imagePreview.value.push(...files.map(file => ({ file, preview: URL.createObjectURL(file) })));
  event.target.value = '';
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

// beforeunload 이벤트 핸들러
const handleBeforeUnload = () => {
  // 현재 선택된 방이 있으면 연결 해제
  if (props.selectedRoom && props.selectedRoomType) {
    unsubscribe(props.selectedRoom, props.selectedRoomType);
  }
};

// 컴포넌트 마운트 시 beforeunload 이벤트 리스너 등록
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// [수정] 컴포넌트가 사라질 때 현재 방 정보를 사용하여 연결 해제 및 이벤트 리스너 제거
onUnmounted(() => {
  unsubscribe(props.selectedRoom, props.selectedRoomType);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.chat-window-full { 
  height: calc(100vh - 32px);
  min-height: calc(100vh - 32px);
}
.chat-container {
  position: relative;
  flex: 1 1 auto;
  overflow-y: hidden;
}
.chat-box { 
  height: 100%;
  overflow-y: auto; 
  padding: 24px; 
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

.chat-box::before {
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
  color: #2c2c2c;
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
  border-radius: 16px; 
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: all 0.3s ease;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.3);
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
.input-area { 
  padding: 16px; 
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 0 0 24px 24px;
}
.image-preview-container { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 4px 12px; }
.image-preview-item { position: relative; width: 60px; height: 60px; }
.preview-image { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.image-preview-item .remove-image-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  min-width: 20px;
  background-color: #ff4444;
}
.image-preview-item .remove-image-btn .v-icon {
  font-size: 16px;
  color: white;
}
.new-message-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  animation: bounceIn 0.4s ease-out;
}

@keyframes bounceIn {
  0% { 
    opacity: 0; 
    transform: translateX(-50%) scale(0.3);
  }
  50% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1.05);
  }
  100% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1);
  }
}

.new-message-indicator .v-btn {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3) !important;
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #667eea !important;
  font-weight: 600;
}

/* 날짜별 메시지 그룹 스타일 */
.message-group {
  margin-bottom: 20px;
}

.date-divider {
  display: flex;
  align-items: center;
  margin: 20px 0 12px 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.date-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.4), transparent);
}

.date-text {
  padding: 0 16px;
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px 16px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  letter-spacing: 0.025em;
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


</style>
