<template>
  <v-card class="d-flex flex-column" style="height: 100vh;" rounded="xl">
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
import { ref, watch, nextTick, onUnmounted, computed } from 'vue';
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

// [수정] 컴포넌트가 사라질 때 현재 방 정보를 사용하여 연결 해제
onUnmounted(() => {
  unsubscribe(props.selectedRoom, props.selectedRoomType);
});
</script>

<style scoped>
.chat-window-card { height: 100vh; }
.chat-container {
  position: relative;
  flex: 1 1 auto;
  overflow-y: hidden;
}
.chat-box { 
  height: 100%;
  overflow-y: auto; 
  padding: 20px; 
  background: #f8f9fa; 
}
.message-wrapper { margin: 8px 0; display: flex; flex-direction: column; }
.message-bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; word-break: break-word; }
.sent { align-items: flex-end; }
.sent .message-bubble { background: #1976D2; color: white; border-bottom-right-radius: 4px; }
.received { align-items: flex-start; }
.received .message-bubble { background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.sender-name { font-size: 0.75rem; margin-bottom: 4px; opacity: 0.8; }
.message-text { font-size: 0.95rem; line-height: 1.4; }
.message-time { font-size: 0.7rem; margin-top: 4px; opacity: 0.7; }
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
.input-area { padding: 12px; background: white; border-top: 1px solid #eee; }
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
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.9;
}

/* 날짜별 메시지 그룹 스타일 */
.message-group {
  margin-bottom: 20px;
}

.date-divider {
  display: flex;
  align-items: center;
  margin: 24px 0 16px 0;
  text-align: center;
}

.date-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
}

.date-text {
  padding: 0 16px;
  font-size: 0.8rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 4px 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 이미지 클릭 가능 스타일 */
.chat-image.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-image.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}


</style>