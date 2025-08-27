<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="closeModal" 
    max-width="500px"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <span class="text-h6 font-weight-bold">채팅방 정보</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeModal"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="py-5" style="min-height: 250px;">
        <div v-if="isLoading" class="d-flex justify-center align-center fill-height">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else-if="error" class="d-flex justify-center align-center fill-height">
          <v-alert type="error" :text="error" variant="tonal"></v-alert>
        </div>

        <v-list v-else-if="roomDetails">
          <v-list-item title="방 제목">
            <template v-slot:append>
              <span class="text-medium-emphasis">{{ roomDetails.roomName }}</span>
            </template>
          </v-list-item>

          <v-list-item title="개설자">
            <template v-slot:append>
              <span class="text-medium-emphasis">{{ roomDetails.userName }}</span>
            </template>
          </v-list-item>

          <v-list-item title="참여 현황">
            <template v-slot:subtitle>
              <v-progress-linear
                :model-value="(roomDetails.currentParticipants / roomDetails.maxParticipants) * 100"
                :color="isRoomFull ? 'red' : 'green'"
                height="8"
                rounded
                class="my-1"
              ></v-progress-linear>
              {{ roomDetails.currentParticipants }} / {{ roomDetails.maxParticipants }} 명
            </template>
          </v-list-item>
          <v-list-item title="설명" class="description-item">
            <template v-slot:subtitle>
              <span style="white-space: pre-wrap;">{{ displayContents }}</span>
              <a
                v-if="roomDetails?.contents?.length > 100"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
                class="toggle-button"
              >
                {{ isDescriptionExpanded ? '접기' : '더 보기' }}
              </a>
            </template>
          </v-list-item>
          <v-list-item title="공동구매 링크">
            <template v-slot:subtitle>
              <a 
                :href="roomDetails.productUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-style"
              >
                {{ roomDetails.productUrl }}
              </a>
            </template>
          </v-list-item>
          <v-list-item title="방 생성일" :subtitle="roomDetails.createdAt"></v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 justify-center">
        <v-btn v-if="isParticipant" color="primary"  variant="flat" @click="closeModal" min-width="100">
          확인
        </v-btn>
        <v-btn v-if="!isParticipant" color="primary"  variant="flat" @click="joinRoom(roomId)" min-width="100">
          참여
        </v-btn>
        <v-btn v-if="!isParticipant" color="secondary"  variant="flat" @click="closeModal" min-width="100">
          취소
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';

// [수정] props: room 객체 대신 roomId를 받도록 변경
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  roomId: { type: [String, Number], default: null },
  isParticipant: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

// store 사용
const store = useStore();

// [추가] 모달 내부에서 사용할 상태 변수들
const roomDetails = ref(null); // API로 받아온 상세 데이터를 저장
const isLoading = ref(false);  // 로딩 상태
const error = ref(null);       // 에러 메시지

const joinRoom = async(roomId) => {
  console.log('채팅방 참여:', roomId);
  try {
    isLoading.value = true;
    
    // roomId를 사용해 상세 정보 API 호출
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/${roomId}/join`);
    
    // 채팅방이 가득 찼는지 확인
    if (roomDetails.value && isRoomFull.value) {
      // 채팅방 개설자에게 알림 발송
      const notificationData = {
        type: 'ROOM_FULL',
        title: '공동 구매 채팅방이 가득 찼습니다',
        message: '공동 구매 채팅방이 가득 찼습니다',
        fridgeId: roomDetails.value.fridgeId || null,
        roomId: roomId,
        timestamp: new Date().toISOString()
      };
      
      // store에 알림 추가
      store.commit('notification/addNotification', notificationData);
    }
    
    alert("채팅방에 성공적으로 참여했습니다.");
    closeModal();
    
    // 페이지 새로고침 대신 이벤트 발생
    window.dispatchEvent(new CustomEvent('chatRoomJoined', { detail: { roomId } }));

  } catch (err) {
    console.error("채팅방 참여 실패:", err);
    alert("채팅방 참여에 실패했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// API 호출 함수
const fetchRoomDetails = async () => {
  if (!props.roomId) return; // roomId가 없으면 실행하지 않음

  isLoading.value = true;
  error.value = null;
  roomDetails.value = null;

  try {
    // roomId를 사용해 상세 정보 API 호출
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/info/${props.roomId}`);
    roomDetails.value = getResultData(response); // 예시 경로, 실제 API에 맞게 수정
  } catch (err) {
    console.error("채팅방 상세 정보 조회 실패:", err);
    error.value = "정보를 불러오는 데 실패했습니다.";
  } finally {
    isLoading.value = false;
  }
};

// [추가] 설명란이 펼쳐졌는지 여부를 저장하는 상태 변수
const isDescriptionExpanded = ref(false);

// [추가] 표시될 내용을 계산하는 computed 속성
const displayContents = computed(() => {
  const contents = roomDetails.value?.contents;
  const limit = 100;

  // 내용이 없거나 100자 이하면 그냥 전체 내용을 반환
  if (!contents || contents.length <= limit) {
    return contents;
  }

  // 100자 이상일 경우, 펼침 상태에 따라 다른 내용을 반환
  if (isDescriptionExpanded.value) {
    return contents; // 펼쳐졌으면 전체 내용
  } else {
    return contents.slice(0, limit) + '...'; // 접혀있으면 100자 + ...
  }
});

// [핵심] modelValue(모달의 열림/닫힘 상태)가 변경될 때를 감지
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    isDescriptionExpanded.value = false;
  }
  // 모달이 열릴 때 (newValue가 true일 때) API를 호출
  if (newValue) {
    fetchRoomDetails();
  }
}, {
  immediate: true
});

const closeModal = () => {
  emit('update:modelValue', false);
};

const isRoomFull = computed(() => {
  if (!roomDetails.value) return false;
  return roomDetails.value.currentParticipants >= roomDetails.value.maxParticipants;
});
</script>

<style scoped>
/* [추가] 설명(description-item) 내부의 v-list-item-subtitle 스타일을 재정의 */
.description-item :deep(.v-list-item-subtitle) {
  /* 텍스트가 여러 줄로 자연스럽게 줄바꿈되도록 설정 */
  white-space: normal; 
  
  /* 컴포넌트 높이가 내용에 따라 자동으로 조절되도록 설정 */
  height: auto;
  
  /* Vuetify의 기본 한 줄 처리를 무효화 */
  overflow: visible;
  -webkit-line-clamp: unset;
}

.toggle-button {
  color: #1976D2;
  cursor: pointer;
  font-weight: 500;
  margin-left: 8px;
}
.toggle-button:hover {
  text-decoration: underline;
}
</style>