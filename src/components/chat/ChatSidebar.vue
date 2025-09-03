<template>
  <v-container class="chat-sidebar-container">
    <v-card class="d-flex flex-column chat-sidebar-card" rounded="xl">
      <v-list-item class="pa-4">
        <template v-slot:prepend>
        <v-avatar 
          color="primary" 
          size="48"
          :image="userProfileImage"
        >
          <span v-if="!userProfileImage" class="text-h6">
            {{ userName ? userName[0] : '' }}
          </span>
        </v-avatar>
      </template>
        <v-list-item-title class="font-weight-bold text-h6 ml-3">{{ userName }} </v-list-item-title>
      </v-list-item>

      <v-tabs v-model="tab" grow>
        <v-tab value="chat">채팅목록</v-tab>
        <v-tab value="groupbuy">공동구매</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab" class="flex-grow-1" style="overflow-y: auto;">
        <v-window-item value="chat">
          <v-list @mouseleave="hoveredRoomId = null">
             <div
              v-if="managerRoom && managerRoom.isManager===false"
              @click="selectRoom(managerRoom, 'manager')"
              class="chat-room-card manager-room"
              :class="{ active: selectedRoomId === managerRoom.roomId }"
            >
              <div class="room-content">
                <!-- 상단 줄: 관리자 배지, 제목, 읽지 않은 메시지 -->
                <div class="room-header">
                  <div class="room-status-wrapper">
                    <v-chip
                      color="primary"
                      variant="flat"
                      size="x-small"
                      class="room-status-chip manager-badge"
                    >
                      ADMIN
                    </v-chip>
                  </div>
                  
                  <div class="room-title-section">
                    <h3 class="room-title">
                      {{ managerRoom.roomName }}
                      <v-icon
                        icon="mdi-shield-account"
                        size="16"
                        color="primary"
                        class="admin-icon"
                      />
                    </h3>
                  </div>
                  
                  <div class="room-badges">
                    <v-chip
                      v-if="managerRoom.unReadCount > 0"
                      color="error"
                      variant="elevated"
                      size="small"
                      class="unread-badge"
                    >
                      {{ managerRoom.unReadCount }}
                    </v-chip>
                  </div>
                </div>
                
                <!-- 하단 줄: 관리자 정보 -->
                <div class="room-footer">
                  <div class="room-author">
                    <span class="author-text admin-text">
                      {{ managerRoom.userName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-for="room in sortedMyPurchaseRooms"
              :key="room.roomId"
              class="chat-room-card"
              @mouseenter="hoveredRoomId = room.roomId"
              @mouseleave="hoveredRoomId = null"
            >
              <div v-if="hoveredRoomId !== room.roomId" class="room-content">
                <!-- 상단 줄: 상태, 제목, 읽지 않은 메시지 -->
                <div class="room-header">
                  <div class="room-status-wrapper">
                    <v-chip
                      :color="isRoomOpen(room) ? 'success' : 'grey-darken-1'"
                      variant="flat"
                      size="x-small"
                      class="room-status-chip"
                    >
                      {{ isRoomOpen(room) ? 'OPEN' : 'CLOSE' }}
                    </v-chip>
                  </div>
                  
                  <div class="room-title-section">
                    <h3 class="room-title">
                      {{ room.roomName }}
                      <v-icon
                        v-if="room.isCreator"
                        icon="mdi-crown"
                        size="16"
                        color="amber"
                        class="crown-icon"
                      />
                    </h3>
                  </div>
                  
                  <div class="room-badges">
                    <v-chip
                      v-if="room.unReadCount > 0"
                      color="error"
                      variant="elevated"
                      size="small"
                      class="unread-badge"
                    >
                      {{ room.unReadCount }}
                    </v-chip>
                  </div>
                </div>
                
                <!-- 하단 줄: 작성자, 참여자 수 -->
                <div class="room-footer">
                  <div class="room-author">
                    <span v-if="!room.isCreator" class="author-text">
                      {{ room.userName }}
                    </span>
                  </div>
                  
                  <div class="participants-info">
                    <v-chip
                      :color="isRoomFull(room) ? 'error' : 'success'"
                      variant="outlined"
                      size="small"
                      class="participants-chip"
                    >
                      <v-icon 
                        :icon="isRoomFull(room) ? 'mdi-account-off' : 'mdi-account-group'" 
                        size="14" 
                        class="mr-1"
                      />
                      {{ room.currentParticipants }}/{{ room.maxParticipants }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <div v-else class="hover-actions">
                <div class="action-button info" @click.stop="viewRoomInfo(room, true)">
                  <div class="action-icon">
                    <v-icon size="18">mdi-information-outline</v-icon>
                  </div>
                  <div class="action-text">정보 보기</div>
                </div>
                
                <div class="action-divider"></div>
                
                <div class="action-button start" @click.stop="startChat(room)">
                  <div class="action-icon">
                    <v-icon size="18">mdi-login-variant</v-icon>
                  </div>
                  <div class="action-text">참여하기</div>
                </div>
                
                <div class="action-divider"></div>
                
                <div class="action-button leave" @click.stop="leaveRoom(room)">
                  <div class="action-icon">
                    <v-icon size="18">mdi-exit-to-app</v-icon>
                  </div>
                  <div class="action-text">나가기</div>
                </div>
              </div>
            </div>
          </v-list>
        </v-window-item>

        <v-window-item value="groupbuy">
          <v-list @mouseleave="hoveredRoomId = null">
            <!-- 공동구매 생성 버튼 -->
            <div
              class="chat-room-card creation-card"
              @click="createChatRoom()"
            >
              <div class="room-content">
                <div class="creation-content">
                  <v-icon icon="mdi-plus-circle-outline" size="20" class="creation-icon"></v-icon>
                  <span class="creation-text">공동 구매 하기</span>
                </div>
              </div>
            </div>
            
            <!-- 공동구매 채팅방 목록 -->
            <div
              v-for="room in purchaseRooms"
              :key="room.roomId"
              class="chat-room-card"
              @mouseenter="hoveredRoomId = room.roomId"
              @mouseleave="hoveredRoomId = null"
            >
              <div v-if="hoveredRoomId !== room.roomId" class="room-content">
                <!-- 상단 줄: 상태, 제목, 참여 상태 -->
                <div class="room-header">
                  <div class="room-status-wrapper">
                    <v-chip
                      :color="isRoomFull(room) ? 'error' : 'success'"
                      variant="flat"
                      size="x-small"
                      class="room-status-chip"
                    >
                      {{ isRoomFull(room) ? 'FULL' : 'OPEN' }}
                    </v-chip>
                  </div>
                  
                  <div class="room-title-section">
                    <h3 class="room-title">
                      {{ room.roomName }}
                      <v-icon
                        v-if="room.isCreator"
                        icon="mdi-crown"
                        size="16"
                        color="amber"
                        class="crown-icon"
                      />
                      <v-icon
                        v-if="myPurchaseRooms.some(r => r.roomId === room.roomId && !r.isCreator)"
                        icon="mdi-check-circle"
                        size="16"
                        color="success"
                        class="participating-icon"
                      />
                    </h3>
                  </div>
                  
                  <div class="room-badges">
                    <v-chip
                      :color="isRoomFull(room) ? 'error' : 'success'"
                      variant="outlined"
                      size="small"
                      class="participants-chip"
                    >
                      <v-icon 
                        :icon="isRoomFull(room) ? 'mdi-account-off' : 'mdi-account-group'" 
                        size="14" 
                        class="mr-1"
                      />
                      {{ room.currentParticipants }}/{{ room.maxParticipants }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <div v-else class="hover-actions">
                <div v-if="!myPurchaseRooms.some(r => r.roomId === room.roomId)" class="action-button start" @click.stop="viewRoomInfo(room, false)">
                  <div class="action-icon">
                    <v-icon size="18">mdi-login-variant</v-icon>
                  </div>
                  <div class="action-text">참여하기</div>
                </div>
                
                <div v-if="myPurchaseRooms.some(r => r.roomId === room.roomId)" class="participating-status">
                  <div class="status-icon">
                    <v-icon size="18" color="success">mdi-check-circle</v-icon>
                  </div>
                  <div class="status-text">이미 참여중입니다</div>
                </div>
              </div>
            </div>
          </v-list>
        </v-window-item>
      </v-window>
    </v-card>
     <RoomInfoModal
      v-if="selectedRoomIdForModal"
      v-model="isModalOpen"
      :roomId="selectedRoomIdForModal"
      :isParticipant="isParticipantforModal"
    />
    <CreateRoomModal
      v-model="isCreateModalOpen"
      :fridge-id="fridgeId"
    />
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import RoomInfoModal from './RoomInfoModal.vue';
import axios from 'axios';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import CreateRoomModal from './CreateRoomModal.vue';
import { useStore } from 'vuex';

const store = useStore();

const userName = computed(() => store.getters.getUserName);
const userProfileImage = computed(() => store.getters.getUserProfileImage);

const isCreateModalOpen = ref(false);
const tab = ref('chat');
const selectedRoomId = ref(null);
const hoveredRoomId = ref(null);
const emit = defineEmits(['select-room', 'select-roomType']);
const isParticipantforModal = ref(false); // 사용자가 해당 방의 참여자인지 여부를 추적하는 ref 추가

// [추가] 모달의 상태를 관리할 ref들을 추가합니다.
const isModalOpen = ref(false); // 모달이 열렸는지 여부
const selectedRoomIdForModal = ref(null); // 모달에 표시할 방 정보

const managerRoom = ref(null);    // 첫 번째 채팅방
const myPurchaseRooms = ref([]);     // 나머지 모든 채팅방
const purchaseRooms = ref([]);     // 공동구매 채팅방
const isLoading = ref(true); // 1. 로딩 상태를 관리할 ref 추가 (초기값 true)
const fridgeId = computed(() => getFridgeId(store));

// 닫힌 채팅방을 하단에 위치시키는 computed 속성
const sortedMyPurchaseRooms = computed(() => {
  return [...myPurchaseRooms.value].sort((a, b) => {
    const aIsOpen = isRoomOpen(a);
    const bIsOpen = isRoomOpen(b);
    
    // 열린 방이 먼저, 닫힌 방이 나중에 오도록 정렬
    if (aIsOpen && !bIsOpen) return -1;
    if (!aIsOpen && bIsOpen) return 1;
    return 0;
  });
});

onMounted(async () => {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/chat/my/rooms/${fridgeId.value}`);
    const allRooms = getResultData(response); // 서버에서 받은 채팅방 배열

    const [first, ...rest] = allRooms;
    managerRoom.value = first;
    myPurchaseRooms.value = rest;
  } catch (error) {
    console.error("API 호출 에러:", error);
    alert(getErrorMessage(error));
  } finally {
    // 2. API 호출이 성공하든 실패하든, 마지막에는 로딩 상태를 false로 변경
    isLoading.value = false;
  }

  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/list/${fridgeId.value}`);
    purchaseRooms.value = getResultData(response); // 서버에서 받은 채팅방 배열
  } catch (error) {
    console.error("API 호출 에러:", error);
    alert(getErrorMessage(error));
  } finally {
    // 2. API 호출이 성공하든 실패하든, 마지막에는 로딩 상태를 false로 변경
    isLoading.value = false;
  }
});

// [수정] createChatRoom 함수가 새 모달을 열도록 변경
const createChatRoom = () => {
  isCreateModalOpen.value = true;
};

const isRoomFull = (room) => {
  return room.currentParticipants >= room.maxParticipants;
};

const isRoomOpen = (room) => {
  // 방이 꽉 차지 않았고, 활성화된 상태면 OPEN
  return !isRoomFull(room) && room.status !== 'INACTIVE';
};

const selectRoom = (room, roomType) => {
  selectedRoomId.value = room.id;
  emit('select-room', room, roomType);
};

const startChat = (room) => {
  selectRoom(room, 'purchase');
};

// [수정] viewRoomInfo 함수가 모달을 열도록 수정합니다.
const viewRoomInfo = (room, isParticipant) => {
  selectedRoomIdForModal.value = room.roomId; // 클릭된 방의 정보를 저장
  isModalOpen.value = true;           // 모달을 열도록 상태 변경
  isParticipantforModal.value = isParticipant; // 참여자 여부를 저장
};

const leaveRoom = async(room) => {
  try {
    await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/${room.roomId}/leave`);
    alert('방에서 나갔습니다.');
    window.location.reload();
  } catch (error) {
    console.error("API 호출 에러:", error);
    alert(getErrorMessage(error));
  } finally {
    // 2. API 호출이 성공하든 실패하든, 마지막에는 로딩 상태를 false로 변경
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* CSS는 변경할 필요가 없습니다. 그대로 사용하시면 됩니다. */
.chat-sidebar-card {
  height: 100%;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.v-divider {
  margin-bottom: 0 !important;
}

.v-list {
  padding-top: 0 !important;
  padding-left: 8px;
  padding-right: 8px;
  flex: 1;
  min-height: 0;
  max-height: 75vh;
  overflow-y: auto;
}

.v-list-item {
  border-radius: 12px !important;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:first-child {
  margin-top: 0 !important;
}

.v-list-item:last-child {
  margin-bottom: 0 !important;
}

.v-list-item:hover {
  background-color: #f5f5f5;
  transform: translateX(4px);
}

.v-window {
  overflow: hidden !important;
  flex: 1;
  min-height: 0;
}

.v-list::-webkit-scrollbar {
  width: 6px;
}

.v-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.v-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  border: 1px solid #f5f5f5;
}

.v-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.v-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f5f5f5;
}

.hover-actions {
  display: flex;
  color: #333;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  font-size: 0.875rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.action-button.info:hover {
  color: #7f7e7e;
}
.action-button.leave:hover {
  color: #D32F2F;
}
.action-button.start:hover {
  color: #1976D2; /* 참여 버튼은 hover 시 파란색으로 강조 */
}

/* 읽지 않은 메시지 v-chip 스타일 */
.unread-chip {
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  min-width: 24px !important;
  height: 24px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3) !important;
  animation: pulse-glow 2s infinite;
  position: relative;
  overflow: visible !important;
}

.unread-chip::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff5252, #f44336, #d32f2f);
  border-radius: 50%;
  z-index: -1;
  opacity: 0.3;
  animation: rotate-gradient 3s linear infinite;
}

/* 펄스 글로우 애니메이션 */
@keyframes pulse-glow {
  0% {
    box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 4px 16px rgba(211, 47, 47, 0.5);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
    transform: scale(1);
  }
}

/* 회전 그라데이션 애니메이션 */
@keyframes rotate-gradient {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .unread-chip {
    min-width: 20px !important;
    height: 20px !important;
    font-size: 0.65rem !important;
  }
}

@media (max-width: 480px) {
  .unread-chip {
    min-width: 18px !important;
    height: 18px !important;
    font-size: 0.6rem !important;
  }
}

/* 다크모드 대응 */
@media (prefers-color-scheme: dark) {
  .unread-chip {
    box-shadow: 0 2px 8px rgba(255, 82, 82, 0.4) !important;
  }
  
  .unread-chip::before {
    background: linear-gradient(45deg, #ff6b6b, #ff5252, #f44336);
    opacity: 0.4;
  }
}

/* 접근성 향상 */
.unread-chip:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* 호버 효과 */
.unread-chip:hover {
  transform: scale(1.1) !important;
  transition: transform 0.2s ease-in-out !important;
}

/* 채팅방 상태 표시 스타일 */
.room-status-container {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.room-status-chip {
  font-size: 0.6rem !important;
  font-weight: 600 !important;
  height: 18px !important;
  min-width: 32px !important;
  padding: 0 6px !important;
  border-radius: 9px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
  transition: all 0.2s ease-in-out !important;
}

.room-status-chip:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

/* OPEN 상태 스타일 */
.room-status-chip[style*="green"] {
  background: linear-gradient(135deg, #4caf50, #388e3c) !important;
  color: white !important;
}

/* CLOSE 상태 스타일 */
.room-status-chip[style*="grey"] {
  background: linear-gradient(135deg, #757575, #616161) !important;
  color: white !important;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .room-status-chip {
    font-size: 0.55rem !important;
    height: 16px !important;
    min-width: 28px !important;
    padding: 0 4px !important;
  }
}

@media (max-width: 480px) {
  .room-status-chip {
    font-size: 0.5rem !important;
    height: 14px !important;
    min-width: 24px !important;
    padding: 0 3px !important;
  }
}

/* 다크모드 대응 */
@media (prefers-color-scheme: dark) {
  .room-status-chip[style*="green"] {
    background: linear-gradient(135deg, #66bb6a, #4caf50) !important;
  }
  
  .room-status-chip[style*="grey"] {
    background: linear-gradient(135deg, #90a4ae, #78909c) !important;
  }
}

/* 🎨 새로운 모던 채팅방 카드 스타일 */
.chat-room-card {
  margin: 8px 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafe 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.chat-room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.chat-room-card:hover::before {
  opacity: 1;
}

.room-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 상단 헤더 영역 */
.room-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.room-status-wrapper {
  flex-shrink: 0;
}

.room-title-section {
  flex: 1;
  min-width: 0;
}

.room-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crown-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.room-badges {
  flex-shrink: 0;
}

/* 하단 푸터 영역 */
.room-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.room-author {
  flex: 1;
  min-width: 0;
}

.author-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants-info {
  flex-shrink: 0;
}

/* 개선된 칩 스타일 */
.room-status-chip {
  font-size: 0.625rem !important;
  font-weight: 700 !important;
  height: 20px !important;
  min-width: 36px !important;
  padding: 0 8px !important;
  border-radius: 10px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.unread-badge {
  font-weight: 700 !important;
  min-width: 24px !important;
  height: 24px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
  animation: unread-pulse 2s infinite;
}

.participants-chip {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  height: 24px !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
}

.participants-chip:hover {
  transform: scale(1.05) !important;
}

/* 애니메이션 */
@keyframes unread-pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
  }
}

/* 🎯 완전히 새로운 호버 액션 디자인 */
.hover-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.action-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: transparent;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.action-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-align: center;
  transition: all 0.3s ease;
  line-height: 1.2;
}

/* 호버 효과 */
.action-button:hover::before {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:hover .action-icon {
  transform: scale(1.1);
}

.action-button:hover .action-text {
  color: #1e293b;
  font-weight: 700;
}

/* 정보 보기 버튼 */
.action-button.info:hover .action-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-button.info:hover .action-text {
  color: #1d4ed8;
}

/* 참여하기 버튼 */
.action-button.start:hover .action-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.start:hover .action-text {
  color: #059669;
}

/* 나가기 버튼 */
.action-button.leave:hover .action-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.action-button.leave:hover .action-text {
  color: #dc2626;
}

/* 구분선 */
.action-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #e2e8f0, transparent);
  margin: 0 8px;
}

/* 🎯 참여중 상태 디자인 */
.participating-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  flex: 1;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.participating-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  margin-bottom: 4px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  animation: success-pulse 2s infinite;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  text-align: center;
  line-height: 1.2;
}

/* 성공 펄스 애니메이션 */
@keyframes success-pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.5);
    transform: scale(1.05);
  }
}

/* 호버 효과 */
.participating-status:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
}

.participating-status:hover .status-icon {
  transform: scale(1.1);
}

.participating-status:hover .status-text {
  color: #166534;
  font-weight: 700;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .chat-room-card {
    margin: 6px 8px;
    border-radius: 12px;
  }
  
  .room-content {
    padding: 12px;
    gap: 8px;
  }
  
  .room-title {
    font-size: 0.9rem;
  }
  
  .author-text {
    font-size: 0.8rem;
  }
  
  .room-status-chip {
    font-size: 0.55rem !important;
    height: 18px !important;
    min-width: 32px !important;
  }
  
  .participants-chip {
    font-size: 0.7rem !important;
    height: 22px !important;
  }
  
  /* 호버 액션 모바일 */
  .hover-actions {
    padding: 8px 12px;
  }
  
  .action-button {
    min-height: 50px;
  }
  
  .action-icon {
    width: 28px;
    height: 28px;
  }
  
  .action-text {
    font-size: 0.7rem;
  }
  
  .action-divider {
    height: 35px;
    margin: 0 6px;
  }
  
  /* 참여중 상태 모바일 */
  .participating-status {
    min-height: 50px;
  }
  
  .status-icon {
    width: 28px;
    height: 28px;
  }
  
  .status-text {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .chat-room-card {
    margin: 4px 6px;
    border-radius: 10px;
  }
  
  .room-content {
    padding: 10px;
    gap: 6px;
  }
  
  .room-header {
    gap: 8px;
  }
  
  .room-title {
    font-size: 0.85rem;
  }
  
  /* 호버 액션 소형 모바일 */
  .hover-actions {
    padding: 6px 8px;
  }
  
  .action-button {
    min-height: 45px;
  }
  
  .action-icon {
    width: 24px;
    height: 24px;
  }
  
  .action-text {
    font-size: 0.65rem;
  }
  
  .action-divider {
    height: 30px;
    margin: 0 4px;
  }
  
  /* 참여중 상태 소형 모바일 */
  .participating-status {
    min-height: 45px;
  }
  
  .status-icon {
    width: 24px;
    height: 24px;
  }
  
  .status-text {
    font-size: 0.65rem;
  }
}

/* 다크모드 지원 */
@media (prefers-color-scheme: dark) {
  .chat-room-card {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .room-title {
    color: #f1f5f9;
  }
  
  .author-text {
    color: #cbd5e1;
  }
  
  .hover-actions {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    color: #f1f5f9;
  }
  
  .action-button:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* 다크모드 호버 액션 */
  .hover-actions {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .action-icon {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .action-text {
    color: #cbd5e1;
  }
  
  .action-button:hover::before {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .action-button:hover .action-text {
    color: #f1f5f9;
  }
  
  .action-divider {
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent);
  }
  
  /* 다크모드 참여중 상태 */
  .participating-status {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    border-color: rgba(34, 197, 94, 0.3);
  }
  
  .participating-status::before {
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  }
  
  .status-text {
    color: #6ee7b7;
  }
  
  .participating-status:hover .status-text {
    color: #a7f3d0;
  }
}

/* 관리자 채팅방 특별 스타일 */
.manager-room {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
  border: 1px solid rgba(25, 118, 210, 0.2) !important;
}

.manager-room:hover {
  border-color: rgba(25, 118, 210, 0.4) !important;
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.15) !important;
}

.manager-room.active {
  border-color: #1976d2 !important;
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.25) !important;
}

.manager-badge {
  background: linear-gradient(135deg, #1976d2, #1565c0) !important;
  color: white !important;
  font-weight: 800 !important;
}

.admin-icon {
  filter: drop-shadow(0 1px 2px rgba(25, 118, 210, 0.3));
}

.admin-text {
  color: #1565c0 !important;
  font-weight: 600 !important;
}

.admin-chip {
  border-color: #1976d2 !important;
  color: #1976d2 !important;
  font-weight: 600 !important;
}

/* 다크모드에서 관리자 채팅방 */
@media (prefers-color-scheme: dark) {
  .manager-room {
    background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%) !important;
    border-color: rgba(96, 165, 250, 0.3) !important;
  }
  
  .manager-room:hover {
    border-color: rgba(96, 165, 250, 0.5) !important;
    box-shadow: 0 8px 25px rgba(96, 165, 250, 0.2) !important;
  }
  
  .admin-text {
    color: #93c5fd !important;
  }
  
  .admin-chip {
    border-color: #60a5fa !important;
    color: #60a5fa !important;
  }
}

/* 공동구매 생성 버튼 스타일 */
.creation-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
  border: 1px solid rgba(14, 165, 233, 0.2) !important;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.creation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.4) !important;
}

.creation-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  color: #0369a1;
  font-weight: 600;
  font-size: 0.9rem;
  height: 100%;
}

.creation-icon {
  color: #0284c7;
  filter: drop-shadow(0 1px 2px rgba(14, 165, 233, 0.3));
}

.creation-text {
  color: #0369a1;
  font-weight: 600;
}

/* 공동구매 참여 아이콘 */
.participating-icon {
  filter: drop-shadow(0 1px 2px rgba(34, 197, 94, 0.3));
}

/* 방장 텍스트 스타일 */
.creator-text {
  color: #f59e0b !important;
  font-weight: 600 !important;
}

/* 다크모드에서 공동구매 생성 버튼 */
@media (prefers-color-scheme: dark) {
  .creation-card {
    background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%) !important;
    border-color: rgba(56, 189, 248, 0.3) !important;
  }
  
  .creation-card:hover {
    border-color: rgba(56, 189, 248, 0.5) !important;
    box-shadow: 0 8px 25px rgba(56, 189, 248, 0.2) !important;
  }
  
  .creation-icon {
    color: #38bdf8;
  }
  
  .creation-text {
    color: #7dd3fc;
  }
  
  .creator-text {
    color: #fbbf24 !important;
  }
}
</style>