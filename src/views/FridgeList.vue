<template>
  <div class="fridge-list-container">
    <div class="fridge-list-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">내 냉장고 목록</h1>
          <p class="page-subtitle">참여중인 냉장고를 관리하고 새로운 냉장고를 만들어보세요</p>
        </div>
        <div class="header-actions">
          <v-btn class="action-btn join-btn" variant="outlined" @click="openJoinModal">
            <v-icon start>mdi-account-plus</v-icon>
            참여하기
          </v-btn>
          <v-btn class="action-btn create-btn" color="primary" @click="openCreateModal">
            <v-icon start>mdi-plus</v-icon>
            냉장고 만들기
          </v-btn>
          <v-btn class="action-btn logout-btn" variant="outlined" color="error" @click="doLogout">
            <v-icon start>mdi-logout</v-icon>
            로그아웃
          </v-btn>
        </div>
      </div>
    </div>

    <div class="fridge-content">
      <div v-if="!fridgeList.length" class="empty-state">
        <div class="empty-icon">
          <v-icon size="80" color="grey-lighten-1">mdi-fridge-outline</v-icon>
        </div>
        <h3 class="empty-title">참여중인 냉장고가 없습니다</h3>
        <p class="empty-description">'냉장고 만들기' 또는 '참여하기'를 통해 새 냉장고를 추가해보세요.</p>
      </div>

      <div v-else class="fridge-grid">
        <div v-for="fridge in fridgeList" :key="fridge.fridgeId" class="fridge-card">
          <div class="card-header">
            <div class="fridge-info">
              <h3 class="fridge-name">{{ fridge.fridgeName }}</h3>
              <div class="fridge-type">
                <v-chip :color="fridge.type === 'MANAGER' ? 'success' : 'info'" size="small" variant="tonal">
                  {{ fridge.type === 'MANAGER' ? '관리자' : '일반' }}
                </v-chip>
              </div>
            </div>
            <div v-if="fridge.type === 'MANAGER'" class="invite-section">
              <span class="invite-label">초대코드</span>
              <v-btn icon="mdi-content-copy" variant="text" size="small" class="copy-btn"
                @click="copyInviteCode(fridge.inviteLink)" title="초대코드 복사"></v-btn>
            </div>
          </div>

          <div class="card-body">
            <p class="fridge-description">{{ fridge.description || '냉장고 설명이 없습니다.' }}</p>
          </div>

          <div class="card-actions">
            <div class="left-actions">
              <v-btn v-if="fridge.type === 'COMMON'" color="error" variant="text" size="small" class="action-btn"
                @click="openLeaveConfirmDialog(fridge)">
                나가기
              </v-btn>
              <v-btn v-else-if="fridge.type === 'MANAGER'" color="error" variant="text" size="small" class="action-btn"
                @click="openDeleteConfirmDialog(fridge)">
                삭제
              </v-btn>
            </div>

            <div class="right-actions">
              <v-btn v-if="fridge.type === 'MANAGER'" variant="text" color="primary" size="small" class="action-btn"
                @click="openEditModal(fridge)">
                수정
              </v-btn>
              <v-btn color="primary" class="enter-btn" @click="enterFridge(fridge.fridgeId)">
                들어가기
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FridgeFormModal v-model="isFormModalOpen" :editing-fridge="selectedFridge" @save="handleSaveFridge" />
    <FridgeInviteModal v-model="isJoinModalOpen" @join="handleJoinFridge" />

    <!-- 삭제 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="showDeleteDialog"
      title="냉장고 삭제 확인"
      :message="`'${selectedFridge?.fridgeName || ''}' 냉장고를 정말 삭제하시겠습니까? 모든 멤버와 데이터가 영구적으로 삭제됩니다.`"
      @confirm="deleteFridge(selectedFridge?.fridgeId)"
      @cancel="showDeleteDialog = false"
    />

    <!-- 나가기 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="showLeaveDialog"
      title="냉장고 나가기 확인"
      :message="`'${selectedFridge?.fridgeName || ''}' 냉장고에서 나가시겠습니까? 작성한 모든 데이터가 삭제됩니다.`"
      @confirm="leaveFridge(selectedFridge?.fridgeId)"
      @cancel="showLeaveDialog = false"
    />

    <CommonSnackbar ref="commonSnackbar" />

  </div>
</template>

<style scoped>
.fridge-list-container {
  padding: 32px;
  padding-left: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.fridge-list-container::before {
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

.fridge-list-header {
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  margin-top: 8px;
}

.action-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  height: auto;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-btn {
  border: 2px solid #667eea;
  color: #667eea;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.logout-btn {
  border: 2px solid #f56565;
  color: #f56565;
  background: rgba(245, 101, 101, 0.05);
}

.logout-btn:hover {
  background: rgba(245, 101, 101, 0.1);
  border-color: #e53e3e;
  color: #e53e3e;
}

.fridge-content {
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  margin-bottom: 24px;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.fridge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.fridge-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 24px;
  transition: all 0.3s ease;
}

.fridge-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.fridge-info {
  flex: 1;
}

.fridge-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.fridge-type {
  margin-bottom: 8px;
}

.invite-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.copy-btn {
  color: #667eea;
}

.card-body {
  margin-bottom: 24px;
}

.fridge-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.left-actions,
.right-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.enter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  height: auto;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    align-self: flex-end;
  }

  .fridge-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .fridge-list-container {
    padding: 16px;
    margin-left: 8px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }

  .fridge-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-actions {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .left-actions,
  .right-actions {
    justify-content: center;
    gap: 12px;
  }

  .action-btn,
  .enter-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

<script>
import axios from 'axios';
import FridgeFormModal from '@/components/Fridge/FridgeFormModal.vue';
import FridgeInviteModal from '@/components/Fridge/FridgeInviteModal.vue';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog.vue';

export default {
  components: {
    FridgeFormModal,
    FridgeInviteModal,
    CommonSnackbar,
    DeleteConfirmDialog
  },
  data() {
    return {
      fridgeList: [],
      isFormModalOpen: false,
      isJoinModalOpen: false,
      showDeleteDialog: false,
      showLeaveDialog: false,
      selectedFridge: {},

    }
  },
  created() {
    this.fetchFridgeList();
  },
  methods: {
    async fetchFridgeList() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/list`);
        this.fridgeList = response.data.result;
      } catch (error) {
        console.error("냉장고 목록을 불러오는 데 실패했습니다:", error);
      }
    },
    async enterFridge(fridgeId) {
      const currentFridge = this.fridgeList.find(f => f.fridgeId === fridgeId);
      
      // 기존 냉장고 ID 저장
      const previousFridgeId = this.$store.getters.getCurrentFridgeId;
      
      this.$store.commit('setCurrentFridgeId', fridgeId);
      if (currentFridge) {
        this.$store.commit('setCurrentFridgeInfo', currentFridge);
      }
      
      // 냉장고가 변경되었을 때만 SSE 재연결
      if (previousFridgeId && previousFridgeId !== fridgeId) {
        await this.$store.dispatch('notification/refreshSSEOnFridgeChange', fridgeId);
      } else if (!previousFridgeId) {
        // 첫 번째 냉장고 선택 시 SSE 연결
        const isSSEConnected = this.$store.getters['notification/isSSEConnected'];
        if (!isSSEConnected) {
          await this.$store.dispatch('notification/initSSE');
        }
      }
      
      // 냉장고 진입 시 채팅 목록 조회하여 배지 상태 업데이트
      await this.$store.dispatch('notification/updateChatBadgesOnFridgeEnter', fridgeId);
      
      // 유저 관리 페이지 배지 상태 초기 설정은 제거 (MANAGER_CHAT 배지 보호)
      // await this.$store.dispatch('notification/initializeUserManagementBadge', fridgeId);
      
      this.$router.push('/fridge/dashboard');
    },
    openCreateModal() {
      this.selectedFridge = { fridgeName: '', description: '' };
      this.isFormModalOpen = true;
    },
    openEditModal(fridge) {
      this.selectedFridge = { ...fridge };
      this.isFormModalOpen = true;
    },
    openJoinModal() {
      this.isJoinModalOpen = true;
    },
    async handleSaveFridge(formData) {
      try {
        if (formData.fridgeId) {
          await axios.put(`${process.env.VUE_APP_API_BASE_URL}/fridge/${formData.fridgeId}/update`, formData);
          this.showSnackbar('냉장고 정보가 수정되었습니다.', 'success');
        } else {
          await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/create`, formData);
          this.showSnackbar('새로운 냉장고가 생성되었습니다!', 'success');
        }
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 처리 중 오류:", error);
        const message = error.response?.data?.status_message || "오류가 발생했습니다.";
        this.showSnackbar(message, 'error');
      }
    },
    async handleJoinFridge(inviteCode) {
      try {
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/join`, null, {
          params: { code: inviteCode }
        });
        this.showSnackbar('냉장고에 성공적으로 참여했습니다!', 'success');
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 참여에 실패했습니다:", error);
        const message = error.response?.data?.status_message || "냉장고 참여 중 오류가 발생했습니다.";
        this.showSnackbar(message, 'error');
      }
    },
    openLeaveConfirmDialog(fridge) {
      this.selectedFridge = fridge;
      this.showLeaveDialog = true;
    },

    openDeleteConfirmDialog(fridge) {
      console.log('openDeleteConfirmDialog 호출됨, fridge:', fridge);
      this.selectedFridge = fridge;
      this.showDeleteDialog = true;
      console.log('selectedFridge 설정됨:', this.selectedFridge);
      console.log('showDeleteDialog 설정됨:', this.showDeleteDialog);
    },

    async leaveFridge(fridgeId) {
      try {
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/leave`);
        this.showSnackbar('냉장고에서 나갔습니다.', 'success');
        this.showLeaveDialog = false; // 다이얼로그 닫기
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 나가기에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "나가기 처리 중 오류 발생", 'error');
      }
    },

    async deleteFridge(fridgeId) {
      try {
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}`);
        this.showSnackbar('냉장고가 삭제되었습니다.', 'success');
        this.showDeleteDialog = false; // 다이얼로그 닫기
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 삭제에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "삭제 처리 중 오류 발생", 'error');
      }
    },
    copyInviteCode(inviteCode) {
      if (!inviteCode) return;
      navigator.clipboard.writeText(inviteCode).then(() => {
        this.showSnackbar('초대 코드가 복사되었습니다!', 'info');
      }).catch(err => {
        console.error('코드 복사 실패:', err);
        this.showSnackbar('복사에 실패했습니다.', 'error');
      });
    },
    showSnackbar(message, color) {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    },
    
    doLogout() {
      // 로그아웃 확인 다이얼로그
      if (confirm('정말 로그아웃 하시겠습니까?')) {
        // Vuex store의 logout 액션 호출
        this.$store.dispatch('user/logout');
        
        // 로컬 스토리지 정리
        localStorage.clear();
        sessionStorage.clear();
        
        // 로그인 페이지로 이동
        this.$router.push('/login').catch(() => {
          window.location.href = '/login';
        });
      }
    }
  }
}
</script>