<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    width="420px"
    eager
  >
    <template v-slot:activator="{ props: activatorProps }">
      <slot name="activator" :props="activatorProps"></slot>
    </template>
    
    <v-card class="participants-dropdown" rounded="xl" elevation="12">
      <!-- 헤더 섹션 -->
      <div class="modal-header">
        <div class="header-gradient"></div>
        <div class="header-content">
          <div class="d-flex align-center">
            <div class="header-icon">
              <v-icon icon="mdi-account-group" size="24" color="white"></v-icon>
            </div>
            <div class="ml-4">
              <h2 class="modal-title">{{ roomName || '채팅방' }}</h2>
              <p class="modal-subtitle">참여자 목록</p>
            </div>
          </div>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            class="close-btn"
            @click="closeModal"
          >
            <v-icon color="white" size="20"></v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- 컨텐츠 섹션 -->
      <div class="dropdown-content" style="height: 320px; overflow-y: auto;">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-animation">
            <v-progress-circular 
              indeterminate 
              color="primary" 
              size="48"
              width="4"
            ></v-progress-circular>
            <p class="loading-text">참여자 정보를 불러오는 중...</p>
          </div>
        </div>
        
        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-container">
          <div class="error-animation">
            <v-icon icon="mdi-alert-circle" size="48" color="error"></v-icon>
            <p class="error-text">{{ error }}</p>
            <v-btn variant="outlined" color="error" @click="fetchParticipants">
              다시 시도
            </v-btn>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="participants.length === 0" class="empty-container">
          <div class="empty-animation">
            <v-icon icon="mdi-account-off" size="48" color="grey"></v-icon>
            <p class="empty-text">참여자가 없습니다</p>
          </div>
        </div>

        <!-- 참여자 목록 -->
        <div v-else class="participants-container">
          <div
            v-for="(participant, index) in participants"
            :key="participant.email || index"
            class="participant-card"
            :class="{ 'is-online': participant.isOnline }"
          >
            <!-- 아바타 영역 -->
            <div class="avatar-container">
              <div class="avatar-wrapper">
                <v-avatar 
                  :color="participant.profileImage ? undefined : getAvatarColor(index)" 
                  size="48"
                  :image="participant.profileImage"
                  class="participant-avatar"
                >
                  <span v-if="!participant.profileImage" class="avatar-text">
                    {{ getInitial(participant.name || participant.userName) }}
                  </span>
                </v-avatar>
                <!-- 온라인 상태 표시 -->
                <div 
                  v-if="participant.isOnline" 
                  class="online-indicator"
                ></div>
              </div>
            </div>

            <!-- 정보 영역 -->
            <div class="participant-info">
              <div class="participant-header">
                <h3 class="participant-name">
                  {{ participant.name || participant.userName }}
                </h3>
                <!-- 역할 배지 -->
                <div v-if="participant.isCreator || participant.isManager" class="role-badge">
                  <v-icon size="14" class="mr-1">mdi-crown</v-icon>
                  <span>{{ participant.isCreator ? '방장' : '관리자' }}</span>
                </div>
              </div>
              <p class="participant-email">{{ participant.email }}</p>
            </div>

            <!-- 상태 영역 -->
            <div class="participant-status">
              <div class="status-badge" :class="{ active: participant.isOnline }">
                <div class="status-dot"></div>
                <span class="status-text">
                  {{ participant.isOnline ? '온라인' : '오프라인' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 푸터 섹션 -->
      <div class="dropdown-footer">
        <div class="participants-summary">
          <div class="summary-icon">
            <v-icon icon="mdi-account-multiple" size="20" color="primary"></v-icon>
          </div>
          <span class="summary-text">총 {{ participants.length }}명 참여 중</span>
        </div>
        <v-btn 
          color="primary" 
          variant="elevated" 
          rounded="lg"
          class="close-button"
          @click="closeModal"
        >
          <v-icon left>mdi-check</v-icon>
          확인
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { getResultData } from '@/utils/commonDataHandler'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  roomId: { type: [String, Number], default: null },
  roomType: { type: String, default: null },
  roomName: { type: String, default: null }
});

const emit = defineEmits(['update:modelValue', 'participants-count-updated']);

const participants = ref([]);
const isLoading = ref(false);
const error = ref(null);

// v-menu를 위한 computed property
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 이름의 첫 글자를 반환하는 함수
const getInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 아바타 색상을 인덱스에 따라 반환하는 함수
const getAvatarColor = (index) => {
  const colors = [
    'primary', 'secondary', 'success', 'info', 'warning', 
    'error', 'purple', 'indigo', 'pink', 'teal'
  ];
  return colors[index % colors.length];
};

// API 호출 함수 - 공동구매 채팅방만 처리
const fetchParticipants = async () => {
  if (!props.roomId || !props.roomType || props.roomType !== 'purchase') return;

  isLoading.value = true;
  error.value = null;
  participants.value = [];

  try {
    // 공동구매 채팅방의 경우 - 채팅방 정보 API에서 참여자 정보 추출
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/participants/${props.roomId}`);
    const participantsData = getResultData(response);
    console.log("participantsData", participantsData);

    if (participantsData) {
      // map을 사용해 participantsData 배열을 새로운 형식의 배열로 변환한 뒤 한 번에 할당
      participants.value = participantsData.map(participant => ({
        name: participant.memberName,
        email: participant.memberEmail,
        isCreator: participant.isCreator,
        isOnline: participant.isOnline,
        profileImage: participant.profileImage
      }));
    }
  } catch (err) {
    console.error("참여자 목록 조회 실패:", err);
    error.value = "참여자 목록을 불러오는 데 실패했습니다.";
  } finally {
    isLoading.value = false;
  }
};

// 참여자 수를 부모 컴포넌트에 전달
const participantCount = computed(() => participants.value.length);

// 모달이 열릴 때 API 호출
watch(() => props.modelValue, (newValue) => {
  console.log('ParticipantsModal modelValue 변화:', newValue);
  console.log('Room ID:', props.roomId, 'Room Type:', props.roomType);
  if (newValue) {
    console.log('참여자 목록을 가져오는 중...');
    fetchParticipants();
  }
}, {
  immediate: true
});

// 참여자 수가 변경될 때 부모에게 알림
watch(participantCount, (newCount) => {
  emit('participants-count-updated', newCount);
});

const closeModal = () => {
  console.log('참여자 모달 닫기');
  isOpen.value = false;
};
</script>

<style scoped>
/* 드롭다운 전체 스타일 */
.participants-dropdown {
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* 헤더 스타일 */
.modal-header {
  position: relative;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.header-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  backdrop-filter: blur(10px);
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  margin: 2px 0 0 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* 컨텐츠 영역 스타일 */
.dropdown-content {
  padding: 16px;
  background: #fafafa;
}

/* 로딩/에러/빈 상태 공통 스타일 */
.loading-container,
.error-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-animation,
.error-animation,
.empty-animation {
  text-align: center;
}

.loading-text,
.error-text,
.empty-text {
  margin: 16px 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

/* 참여자 목록 스타일 */
.participants-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.participant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.participant-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: #e0e0e0;
}

.participant-card:hover::before {
  opacity: 1;
}

.participant-card.is-online {
  border-color: #e8f5e8;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
}

/* 아바타 스타일 */
.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
}

.participant-avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
  transition: transform 0.3s ease;
}

.participant-card:hover .participant-avatar {
  transform: scale(1.05);
}

.avatar-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
  animation: pulse-online 2s infinite;
}

@keyframes pulse-online {
  0% { box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0.1); }
  100% { box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3); }
}

/* 참여자 정보 스타일 */
.participant-info {
  flex: 1;
  min-width: 0;
}

.participant-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.participant-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.role-badge {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #8b4513;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.participant-email {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
  word-break: break-word;
}

/* 상태 영역 스타일 */
.participant-status {
  flex-shrink: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.status-badge.active {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  color: #2e7d32;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  transition: background 0.3s ease;
}

.status-badge.active .status-dot {
  background: #4caf50;
}

.status-text {
  font-size: 0.8rem;
  font-weight: 500;
}

/* 푸터 스타일 */
.dropdown-footer {
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.participants-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-icon {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 6px;
}

.summary-text {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.close-button {
  padding: 8px 24px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.close-button:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

/* 스크롤바 스타일 */
.dropdown-content::-webkit-scrollbar {
  width: 4px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 2px;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #667eea, #764ba2);
  border-radius: 2px;
}

.dropdown-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #5a6fd8, #6a4190);
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .modal-header {
    padding: 14px 16px;
  }
  
  .dropdown-content {
    padding: 12px;
  }
  
  .participant-card {
    padding: 10px;
    gap: 10px;
  }
  
  .participant-avatar {
    width: 40px !important;
    height: 40px !important;
  }
  
  .dropdown-footer {
    padding: 10px 16px;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
