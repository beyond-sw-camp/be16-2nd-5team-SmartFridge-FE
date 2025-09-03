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
             <v-list-item
              v-if="managerRoom && managerRoom.isManager===false"
              @click="selectRoom(managerRoom, 'manager')"
              :active="selectedRoomId === managerRoom.roomId"
              class="ma-2 pa-0"
              rounded="lg"
              height="68px"
            >
              <div class="d-flex align-center fill-height pa-3">
                <div style="color: red; font-size: medium; margin-right: 15px; back">
                  {{ managerRoom.unReadCount }}
                </div>
                <div class="flex-grow-1">
                  <v-list-item-title class="font-weight-bold text-truncate d-flex align-center">
                    <span>{{ managerRoom.roomName }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">{{ managerRoom.userName }}</v-list-item-subtitle>
                </div>
              </div>
            </v-list-item>
            <v-list-item
              v-for="room in myPurchaseRooms"
              :key="room.roomId"
              class="ma-2 pa-0"
              rounded="lg"
              height="68px"
              @mouseenter="hoveredRoomId = room.roomId"
            >
              <div v-if="hoveredRoomId !== room.roomId" class="d-flex align-center fill-height pa-3">
                <div style="color: red; font-size: medium; margin-right: 15px;">
                  {{ room.unReadCount }}
                </div>
                <div class="flex-grow-1 text-truncate">
                  <v-list-item-title class="font-weight-bold text-truncate d-flex align-center">
                    <div class="text-truncate">{{ room.roomName }}</div>
                    <v-icon
                        v-if="room.isCreator"
                        icon="mdi-crown"
                        size="x-small"
                        color="yellow"
                        class="mr-2 flex-shrink-0 "
                      ></v-icon>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="!room.isCreator" class="text-truncate">{{ room.userName }}</v-list-item-subtitle>
                </div>
                <v-chip
                  :color="isRoomFull(room) ? 'red' : 'green'"
                  variant="tonal"
                  size="small"
                  label
                  class="flex-shrink-0"
                >
                  {{ room.currentParticipants }}/{{ room.maxParticipants }}명
                </v-chip>
              </div>

              <div v-else class="hover-actions">
                <div class="action-button info" @click.stop="viewRoomInfo(room, true)">
                  <v-icon size="small">mdi-information-outline</v-icon>
                  <span class="ml-2">정보 보기</span>
                </div>
                <v-divider vertical></v-divider>
                <div class="action-button start" @click.stop="startChat(room)">
                  <v-icon size="small">mdi-login-variant</v-icon>
                  <span class="ml-2">참여하기</span>
                </div>
                <v-divider vertical></v-divider>
                <div class="action-button leave" @click.stop="leaveRoom(room)">
                  <v-icon size="small">mdi-exit-to-app</v-icon>
                  <span class="ml-2">나가기</span>
                </div>
              </div>
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="groupbuy">
          <v-list @mouseleave="hoveredRoomId = null">
            <v-list-item
              class="ma-2 pa-0 creation-item"
              rounded="lg"
              height="68px"
              @click="createChatRoom()"
            >
              <div class="d-flex align-center justify-center fill-height text-medium-emphasis">
                <v-icon icon="mdi-plus-circle-outline" class="mr-2"></v-icon>
                <span>공동 구매 하기</span>
              </div>
            </v-list-item>
            <v-list-item
              v-for="room in purchaseRooms"
              :key="room.roomId"
              class="ma-2 pa-0"
              rounded="lg"
              height="68px"
              @mouseenter="hoveredRoomId = room.roomId"
            >
              <div v-if="hoveredRoomId !== room.roomId" class="d-flex align-center fill-height pa-3">
                <div class="flex-grow-1">
                  <v-list-item-title class="font-weight-bold text-truncate d-flex align-center">
                    <span>{{ room.roomName }}</span>
                    <v-icon
                        v-if="room.isCreator"
                        icon="mdi-crown"
                        size="x-small"
                        color="yellow"
                        class="mr-2 flex-shrink-0"
                      ></v-icon>
                      <v-icon
                        v-if="myPurchaseRooms.some(r => r.roomId === room.roomId && !r.isCreator)"
                        icon="mdi-check"
                        size="x-small"
                        color="red"
                        class="mr-2 flex-shrink-0"
                      ></v-icon>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="!room.isCreator" class="text-truncate">{{ room.userName }}</v-list-item-subtitle>
                </div>
                <v-chip
                  :color="isRoomFull(room) ? 'red' : 'green'"
                  variant="tonal"
                  size="small"
                  label
                >
                  {{ room.currentParticipants }}/{{ room.maxParticipants }}명
                </v-chip>
              </div>

              <div v-else class="hover-actions">
                <div v-if="!myPurchaseRooms.some(r => r.roomId === room.roomId)" class="action-button info" @click.stop="viewRoomInfo(room, false)">
                  <v-icon size="small">mdi-login-variant</v-icon>
                  <span class="ml-2">참여하기</span>
                </div>
                <div><span v-if="myPurchaseRooms.some(r => r.roomId === room.roomId)" class="ml-2">이미 참여중입니다</span></div>
              </div>
            </v-list-item>
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
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  border-radius: 16px !important;
  margin: 8px 12px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.v-list-item:first-child {
  margin-top: 12px !important;
}

.v-list-item:last-child {
  margin-bottom: 12px !important;
}

.v-list-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.4);
}

/* 내부 컨텐츠 spacing 개선 */
.v-list-item .d-flex.align-center.fill-height {
  padding: 16px !important;
  margin: 4px 0;
}

.v-list-item .d-flex.align-center.justify-center.fill-height {
  padding: 20px !important;
  margin: 6px 0;
}

/* 읽지 않은 메시지 카운트 스타일 개선 */
.v-list-item .d-flex > div:first-child {
  margin-right: 20px !important;
  min-width: 24px;
  text-align: center;
}

/* 채팅방 제목과 설명 간격 개선 */
.v-list-item-title {
  margin-bottom: 4px !important;
}

/* 참여자 수 칩 스타일 개선 */
.v-chip {
  margin-left: 12px !important;
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
  color: #1e293b;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.025em;
}

.action-button.info:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}
.action-button.leave:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
.action-button.start:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
</style>