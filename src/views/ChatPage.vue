<template>
  <v-app>
    <v-main class="gradient-background">
      <v-container fluid class="chat-padding fill-height">
        <v-row no-gutters class="fill-height">
          <v-col cols="12" md="4" lg="3" xl="2">
            <ChatSidebar ref="chatSidebar" @select-room="handleRoomSelect" @room-left="handleRoomLeft" />
          </v-col>
          
          <v-col cols="12" md="8" lg="9" xl="10">
            <ChatWindow 
              :selected-room="selectedRoom" 
              :selected-roomType="selectedRoomType"
              @order-completed="handleOrderCompleted" 
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import ChatSidebar from '../components/chat/ChatSidebar.vue'; // 사이드바 컴포넌트 import
import ChatWindow from '../components/chat/ChatWindow.vue';   // 채팅창 컴포넌트 import

const store = useStore();
const router = useRouter();

// 선택된 채팅방 정보를 저장할 반응형 변수
const selectedRoom = ref(null);
const selectedRoomType = ref(null);
const chatSidebar = ref(null);

// 사이드바에서 채팅방을 선택했을 때 호출될 함수
const handleRoomSelect = (room, roomType) => {
  selectedRoom.value = room;
  selectedRoomType.value = roomType;
};

// 구매 완료 이벤트를 받아서 사이드바 새로고침
const handleOrderCompleted = () => {
  if (chatSidebar.value) {
    chatSidebar.value.handleRoomCreated();
  }
};

// 채팅방 나가기/삭제 이벤트를 받아서 선택된 채팅방 초기화
const handleRoomLeft = () => {
  selectedRoom.value = null;
  selectedRoomType.value = null;
};

// 페이지 진입 시 채팅 알림 제거 및 냉장고 ID 확인
onMounted(() => {
  // 현재 냉장고 ID 확인
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (!currentFridgeId) {
    // 냉장고 목록 페이지로 리다이렉트
    router.push('/fridge/list');
    return;
  }
  
  // 채팅 페이지 진입 시 알림 제거 (MANAGER_CHAT 배지는 유지)
  // store.dispatch('notification/clearChatNotificationsOnEnter'); // 유저 관리 배지 보호를 위해 주석 처리
});
</script>

<style scoped>
.fill-height {
  height: 100vh;
  overflow: hidden;
}
.gradient-background {
  background: linear-gradient(96.94deg, #667EEA 0%, #764BA2 100%);
}

.chat-padding {
  padding: 16px !important;
}

/* 모바일에서는 패딩 줄이기 */
@media (max-width: 600px) {
  .chat-padding {
    padding: 8px !important;
  }
}
</style>