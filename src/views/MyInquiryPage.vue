<template>
  <div class="inquiry-page">
    <!-- 배경 그라데이션 -->
    <div class="background-gradient"></div>
    
    <div class="content-container">
      <!-- 헤더 섹션 -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">{{ role === 'ADMIN' ? '문의 관리' : '문의하기' }}</h1>
            <p class="page-subtitle">{{ role === 'ADMIN' ? '모든 사용자의 문의사항을 관리하고 답변하세요' : '등록한 문의사항과 답변을 확인하세요' }}</p>
            <div class="status-summary">
              <div class="status-item">
                <div class="status-indicator pending"></div>
                <span class="status-label">대기중</span>
                <span class="status-count">{{ statusCounts.PENDING }}</span>
              </div>
              <div class="status-item">
                <div class="status-indicator progress"></div>
                <span class="status-label">처리중</span>
                <span class="status-count">{{ statusCounts.IN_PROGRESS }}</span>
              </div>
              <div class="status-item">
                <div class="status-indicator completed"></div>
                <span class="status-label">완료</span>
                <span class="status-count">{{ statusCounts.COMPLETED }}</span>
              </div>
              <div class="status-item">
                <div class="status-indicator cancelled"></div>
                <span class="status-label">취소됨</span>
                <span class="status-count">{{ statusCounts.CANCELLED }}</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <v-btn
              v-if="role !== 'ADMIN'"
              @click="showCreateModal = true"
              color="primary"
              variant="elevated"
              size="large"
              prepend-icon="mdi-plus"
              class="create-btn"
              elevation="0"
            >
              문의 등록
            </v-btn>
            <v-btn
              @click="refreshInquiries"
              color="surface"
              variant="outlined"
              size="large"
              prepend-icon="mdi-refresh"
              class="refresh-btn"
              :loading="isLoading"
            >
              새로고침
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 문의 목록 -->
      <div v-if="allInquiries.length > 0" class="inquiry-list">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="loading-text">문의 목록을 불러오는 중...</p>
        </div>
        
        <!-- 문의 카드들 -->
        <div v-else class="inquiry-list-container">
          <v-card
            v-for="inquiry in paginatedInquiries"
            :key="inquiry.id"
            class="inquiry-item"
            elevation="0"
            variant="outlined"
          >
            <v-card-text class="inquiry-content">
              <!-- 문의 헤더 -->
              <div class="inquiry-header">
                <div class="inquiry-title-wrapper">
                  <h3 class="inquiry-title">
                    {{ inquiry.title }}
                  </h3>
                  <div class="inquiry-meta">
                    <div class="type-badge" :class="getTypeClass(inquiry.inquiryType)">
                      {{ getTypeLabel(inquiry.inquiryType) || '알 수 없음' }}
                    </div>
                    <div class="status-badge" :class="getStatusClass(inquiry.status)">
                      {{ getStatusLabel(inquiry.status) }}
                    </div>
                  </div>
                </div>
                <div class="inquiry-actions">
                  <div class="inquiry-date">
                    {{ formatDate(inquiry.createdAt) }}
                  </div>
                  <v-btn
                    @click="toggleInquiryDetail(inquiry.id)"
                    variant="text"
                    size="small"
                    :icon="inquiry.isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    class="expand-btn"
                  >
                  </v-btn>
                </div>
              </div>

              <!-- 문의 내용 미리보기 -->
              <div class="inquiry-preview">
                <p class="inquiry-text">
                  {{ inquiry.contents }}
                </p>
              </div>

              <!-- 답변 상태 표시 -->
              <div v-if="inquiry.status === 'COMPLETED'" class="answer-status">
                <div class="answer-icon">
                  <v-icon icon="mdi-check-circle" color="success" size="20"></v-icon>
                </div>
                <span class="answer-text">답변 완료</span>
                <span class="answer-date">{{ formatDate(inquiry.updatedAt) }}</span>
              </div>

              <!-- 답변 대기 중인 경우 ADMIN용 답변 버튼 -->
              <div v-else-if="role === 'ADMIN'" class="answer-status pending">
                <div class="answer-icon">
                  <v-icon 
                    icon="mdi-alert-circle" 
                    color="error" 
                    size="24"
                    class="pending-icon"
                  ></v-icon>
                  <span class="icon-fallback">⚠</span>
                </div>
                <span class="answer-text">답변 대기중</span>
                <v-btn
                  @click="openAnswerModal(inquiry)"
                  color="success"
                  variant="elevated"
                  size="small"
                  prepend-icon="mdi-reply"
                  class="answer-btn-small"
                  elevation="0"
                >
                  답변 등록하기
                </v-btn>
              </div>

              <!-- USER용 수정/삭제 버튼 (우측 하단) -->
              <div v-if="role !== 'ADMIN'" class="user-actions-bottom">
                <v-btn
                  @click="openEditModal(inquiry)"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-pencil"
                  class="edit-btn-bottom"
                >
                  수정하기
                </v-btn>
                <v-btn
                  @click="openDeleteConfirmModal(inquiry)"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-delete"
                  class="delete-btn-bottom"
                >
                  삭제하기
                </v-btn>
              </div>

              <!-- 아코디언 상세 내용 -->
              <v-expand-transition>
                <div v-show="inquiry.isExpanded" class="inquiry-detail-accordion">
                  <v-divider class="my-4"></v-divider>
                  
                  <!-- 답변 정보 -->
                  <div v-if="inquiry.status === 'COMPLETED'" class="detail-section">
                    <h4 class="detail-section-title">답변</h4>
                    <div class="detail-content">
                      <div class="detail-row">
                        <span class="detail-label">답변일:</span>
                        <span class="detail-value">{{ formatDate(inquiry.updatedAt) }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">답변 내용:</span>
                        <div class="detail-content-text answer-text">
                          {{ getAnswerContent(inquiry) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 답변 대기 중인 경우 USER용 메시지 -->
                  <div v-else-if="role !== 'ADMIN'" class="detail-section">
                    <h4 class="detail-section-title">답변 상태</h4>
                    <div class="waiting-answer-content">
                      <div class="waiting-icon">
                        <v-icon icon="mdi-clock-outline" size="40" color="warning"></v-icon>
                      </div>
                      <h5 class="waiting-title">답변 대기 중</h5>
                      <p class="waiting-description">
                        문의하신 내용에 대해 빠른 시일 내에 답변드리겠습니다.
                      </p>
                    </div>
                  </div>

                  <!-- 이미지 첨부 (있는 경우) -->
                  <div v-if="inquiry.imageUrls && inquiry.imageUrls.length > 0" class="detail-section">
                    <h4 class="detail-section-title">첨부 이미지</h4>
                    <div class="image-grid">
                      <div 
                        v-for="(imageUrl, index) in inquiry.imageUrls" 
                        :key="index"
                        class="image-item"
                      >
                        <img :src="imageUrl" :alt="`첨부 이미지 ${index + 1}`" class="attached-image" />
                      </div>
                    </div>
                  </div>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-section">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="changePage"
            color="primary"
            rounded="circle"
            class="pagination"
          ></v-pagination>
          
          <div class="page-info">
            총 {{ allInquiries.length }}개의 문의 중 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, allInquiries.length) }}번째 표시
            <span v-if="totalPages > 1" class="page-count">({{ currentPage }}/{{ totalPages }} 페이지)</span>
          </div>
        </div>
      </div>

      <!-- 문의가 없는 경우 -->
      <div v-else-if="allInquiries.length === 0 && !isLoading" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <v-icon icon="mdi-help-circle-outline" size="80" color="grey-lighten-2"></v-icon>
          </div>
          <h3 class="empty-title">등록된 문의가 없습니다</h3>
          <p class="empty-description">새로운 문의사항이 있으시면 문의 등록 버튼을 눌러주세요.</p>
          <v-btn
            @click="showCreateModal = true"
            color="primary"
            variant="elevated"
            size="large"
            prepend-icon="mdi-plus"
            class="empty-create-btn"
            elevation="0"
          >
            첫 문의 등록하기
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 문의 등록 모달 -->
    <v-dialog v-model="showCreateModal" max-width="600" persistent>
      <v-card class="create-modal" elevation="0" variant="outlined">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <v-icon color="primary" size="24" class="mr-3">mdi-help-circle</v-icon>
            <span>문의 등록</span>
          </div>
          <v-btn 
            icon 
            variant="text" 
            size="small"
            @click="closeCreateModal"
            class="close-btn"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="modal-content">
          <v-form @submit.prevent="submitInquiry" ref="form">
            <v-select
              v-model="inquiryData.inquiryType"
              :items="inquiryTypes"
              label="문의 종류"
              placeholder="문의 종류를 선택해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
              required
            ></v-select>

            <v-text-field
              v-model="inquiryData.title"
              label="제목"
              placeholder="문의 제목을 입력해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
              required
            ></v-text-field>

            <v-textarea
              v-model="inquiryData.contents"
              label="문의 내용"
              placeholder="문의 내용을 자세히 작성해주세요"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
              required
            ></v-textarea>

            <!-- 이미지 파일 업로드 -->
            <div class="image-upload-section">
              <label class="image-upload-label">이미지 첨부 (선택사항)</label>
              <v-file-input
                v-model="inquiryData.imageFiles"
                multiple
                accept="image/*"
                label="이미지 파일을 선택하세요"
                variant="outlined"
                prepend-icon="mdi-camera"
                class="form-field"
                show-size
                counter
                :rules="[rules.imageFiles]"
              ></v-file-input>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn
            @click="closeCreateModal"
            variant="outlined"
            color="grey-darken-1"
            size="large"
            class="cancel-btn"
          >
            취소
          </v-btn>
          <v-btn
            @click="submitInquiry"
            color="primary"
            variant="elevated"
            size="large"
            :loading="isSubmitting"
            :disabled="!isFormValid"
            class="submit-btn"
            elevation="0"
          >
            문의 등록
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 문의 수정 모달 -->
    <v-dialog v-model="showEditModal" max-width="600" persistent>
      <v-card class="edit-modal" elevation="0" variant="outlined">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <span>문의 수정</span>
          </div>
          <v-btn 
            icon 
            variant="text" 
            size="small"
            @click="closeEditModal"
            class="close-btn"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="modal-content">
          <v-form @submit.prevent="submitEditInquiry" ref="editForm">
            <v-select
              v-model="editData.inquiryType"
              :items="inquiryTypes"
              label="문의 종류"
              placeholder="문의 종류를 선택해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
              required
            ></v-select>

            <v-text-field
              v-model="editData.title"
              label="제목"
              placeholder="문의 제목을 입력해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
              required
            ></v-text-field>

            <v-textarea
              v-model="editData.contents"
              label="문의 내용"
              placeholder="문의 내용을 자세히 작성해주세요"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
              required
            ></v-textarea>

            <!-- 기존 이미지 표시 -->
            <div v-if="editData.existingImages && editData.existingImages.length > 0" class="existing-images-section">
              <label class="existing-images-label">기존 첨부 이미지</label>
              <div class="existing-images-grid">
                <div 
                  v-for="(imageUrl, index) in editData.existingImages" 
                  :key="index"
                  class="existing-image-item"
                >
                  <img :src="imageUrl" :alt="`기존 이미지 ${index + 1}`" class="existing-image" />
                  <v-btn
                    @click="removeExistingImage(index)"
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    class="remove-image-btn"
                  >
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>

            <!-- 이미지 파일 업로드 -->
            <div class="image-upload-section">
              <label class="image-upload-label">새 이미지 첨부 (선택사항)</label>
              <v-file-input
                v-model="editData.newImageFiles"
                multiple
                accept="image/*"
                label="새 이미지 파일을 선택하세요"
                variant="outlined"
                prepend-icon="mdi-camera"
                class="form-field"
                show-size
                counter
                :rules="[rules.imageFiles]"
              ></v-file-input>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn
            @click="closeEditModal"
            variant="outlined"
            color="grey-darken-1"
            size="large"
            class="cancel-btn"
          >
            취소
          </v-btn>
          <v-btn
            @click="submitEditInquiry"
            color="warning"
            variant="elevated"
            size="large"
            :loading="isSubmittingEdit"
            :disabled="!isEditFormValid"
            class="submit-edit-btn"
            elevation="0"
          >
            수정하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="showDeleteConfirmModal" max-width="400" persistent>
      <v-card class="delete-confirm-modal" elevation="0" variant="outlined">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <v-icon color="error" size="24" class="mr-3">mdi-alert-circle</v-icon>
            <span>문의 삭제 확인</span>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="modal-content">
          <div class="delete-confirm-content">
            <p class="delete-confirm-text">
              정말로 이 문의를 삭제하시겠습니까?
            </p>
            <p class="delete-confirm-subtext">
              삭제된 문의는 복구할 수 없습니다.
            </p>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn
            @click="closeDeleteConfirmModal"
            variant="outlined"
            color="grey-darken-1"
            size="large"
            class="cancel-btn"
          >
            취소
          </v-btn>
          <v-btn
            @click="confirmDeleteInquiry"
            color="error"
            variant="elevated"
            size="large"
            :loading="isDeleting"
            class="confirm-delete-btn"
            elevation="0"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ADMIN용 답변 모달 -->
    <v-dialog v-model="showAnswerModal" max-width="600" persistent>
      <v-card class="answer-modal" elevation="0" variant="outlined">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <v-icon color="success" size="24" class="mr-3">mdi-reply</v-icon>
            <span>답변 등록</span>
          </div>
          <v-btn 
            icon 
            variant="text" 
            size="small"
            @click="closeAnswerModal"
            class="close-btn"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="modal-content">
          <div class="inquiry-info">
            <h4 class="inquiry-info-title">문의 정보</h4>
            <div class="inquiry-info-content">
              <div class="info-row">
                <span class="info-label">제목:</span>
                <span class="info-value">{{ selectedInquiry?.title }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">내용:</span>
                <div class="info-content">{{ selectedInquiry?.contents }}</div>
              </div>
            </div>
          </div>
          
          <v-divider class="my-4"></v-divider>
          
          <v-form @submit.prevent="submitAnswer" ref="answerForm">
            <v-textarea
              v-model="answerData.contents"
              label="답변 내용"
              placeholder="답변 내용을 자세히 작성해주세요"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
              required
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn
            @click="closeAnswerModal"
            variant="outlined"
            color="grey-darken-1"
            size="large"
            class="cancel-btn"
          >
            취소
          </v-btn>
          <v-btn
            @click="submitAnswer"
            color="success"
            variant="elevated"
            size="large"
            :loading="isSubmittingAnswer"
            :disabled="!isAnswerValid"
            class="submit-answer-btn"
            elevation="0"
          >
            답변 등록
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 성공/에러 메시지 -->
    <CommonSnackbar ref="commonSnackbar" />
  </div>
</template>

<script>
import axios from 'axios'
import CommonSnackbar from '@/components/common/CommonSnackbar.vue'

export default {
  components: {
    CommonSnackbar
  },
  data() {
    return {
      inquiries: [],
      allInquiries: [], // 모든 문의 데이터
      showCreateModal: false,
      inquiryTypes: [
        { title: '기능 관련', value: 'FUNCTION' },
        { title: '버그 신고', value: 'BUG' },
        { title: '기타', value: 'ETC' }
      ],
      inquiryStatuses: [
        { title: '대기중', value: 'PENDING', color: 'warning' },
        { title: '처리중', value: 'IN_PROGRESS', color: 'info' },
        { title: '완료', value: 'COMPLETED', color: 'success' },
        { title: '취소됨', value: 'CANCELLED', color: 'error' }
      ],
      rules: {
        required: v => !!v || '필수 입력 항목입니다.',
        minLength: v => v.length >= 10 || '최소 10자 이상 입력해주세요.',
        imageFiles: v => {
          if (!v || v.length === 0) return true; // 이미지가 없어도 됨
          if (v.length > 5) return '이미지는 최대 5개까지 첨부할 수 있습니다.';
          const maxSize = 5 * 1024 * 1024; // 5MB
          for (let file of v) {
            if (file.size > maxSize) return '각 이미지 파일은 5MB 이하여야 합니다.';
          }
          return true;
        }
      },
      isSubmitting: false,
      // 프론트엔드 페이징 관련 데이터
      currentPage: 1,
      itemsPerPage: 15, // 한 페이지당 표시할 문의 수를 15개로 조정
      isLoading: false,
      autoRefreshInterval: null, // 자동 새로고침 인터벌
      inquiryData: {
        inquiryType: '',
        title: '',
        contents: '',
        imageFiles: []
      },
      showDetailModal: false, // 문의 상세 보기 모달 상태
      selectedInquiry: null, // 상세 보기 모달에 표시할 문의 데이터
      showAnswerModal: false, // ADMIN용 답변 모달 상태
      answerData: {
        contents: ''
      },
      isSubmittingAnswer: false,
      showEditModal: false, // 문의 수정 모달 상태
      editData: { // 수정할 문의 데이터
        inquiryType: '',
        title: '',
        contents: '',
        existingImages: [], // 기존 이미지 URL들
        newImageFiles: [], // 새로 업로드할 이미지 파일들
        removedImageIndexes: [] // 삭제할 이미지 인덱스들
      },
      isSubmittingEdit: false, // 수정 제출 중 상태
      showDeleteConfirmModal: false, // 삭제 확인 모달 상태
      isDeleting: false // 삭제 중 상태
    }
  },
  computed: {
    role() {
      return this.$store.state.user.userInfo?.role || 'USER';
    },
    
    isFormValid() {
      return this.inquiryData.title && 
             this.inquiryData.inquiryType && 
             this.inquiryData.contents &&
             this.inquiryData.contents.length >= 10
    },
    
    // 페이징된 문의 목록
    paginatedInquiries() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.allInquiries.slice(start, end)
    },
    
    // 전체 페이지 수
    totalPages() {
      return Math.ceil(this.allInquiries.length / this.itemsPerPage)
    },
    
    // 페이지 범위 (1~5, 6~10 등)
    pageRange() {
      const range = []
      const start = Math.max(1, this.currentPage - 2)
      const end = Math.min(this.totalPages, this.currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        range.push(i)
      }
      return range
    },
    
    // 상태별 문의 개수
    statusCounts() {
      const counts = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0
      }
      
      this.allInquiries.forEach(inquiry => {
        if (inquiry.status && Object.prototype.hasOwnProperty.call(counts, inquiry.status)) {
          counts[inquiry.status]++
        }
      })
      
      return counts
    },
    isAnswerValid() {
      return this.answerData.contents && this.answerData.contents.length >= 10;
    },
    isEditFormValid() {
      return this.editData.title && 
             this.editData.inquiryType && 
             this.editData.contents &&
             this.editData.contents.length >= 10;
    }
  },
  async mounted() {
    await this.fetchInquiries()
    // 30초마다 자동 새로고침 (상태 업데이트 확인용)
    this.startAutoRefresh()
  },
  
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async fetchInquiries() {
      try {
        this.isLoading = true

        const role = this.$store.state.user.userInfo?.role;

        const url = role === 'ADMIN'
        ? `${process.env.VUE_APP_API_BASE_URL}/inquiry/list`
        : `${process.env.VUE_APP_API_BASE_URL}/inquiry/myInquiry`
        
        // 현재 로그인한 사용자의 문의 목록 조회 API 호출
        const response = await axios.get(url)
        
        let inquiries = []
        
        if (response.data.result && Array.isArray(response.data.result)) {
          inquiries = response.data.result
        }
        
        if (inquiries.length > 0) {
          
          // 모든 문의 데이터를 allInquiries에 저장
          this.allInquiries = inquiries.map(inquiry => {
            const mappedInquiry = {
              id: inquiry.inquiryId || inquiry.id,
              inquiryType: inquiry.inquiryType,
              title: inquiry.title,
              contents: inquiry.contents,
              memberId: inquiry.memberId,
              imageUrls: inquiry.imageUrls || [],
              status: inquiry.status || 'PENDING',
              comments: inquiry.comments || [],
              createdAt: inquiry.createdAt || new Date().toISOString(),
              updatedAt: inquiry.updatedAt || inquiry.createdAt || new Date().toISOString(),
              isExpanded: false // 아코디언 상태 추가
            };
            return mappedInquiry;
          });
          
          // 첫 페이지로 초기화
          this.currentPage = 1
        } else {
          this.allInquiries = []
        }
        
      } catch (error) {
        console.error('문의 목록 조회 오류:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 페이지 변경 메서드
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    async submitInquiry() {
      if (!this.isFormValid) {
        this.showMessage('모든 필수 항목을 입력해주세요.', 'error')
        return
      }

      this.isSubmitting = true
      
      try {
        const formData = new FormData();
        formData.append('inquiryType', this.inquiryData.inquiryType);
        formData.append('title', this.inquiryData.title);
        formData.append('contents', this.inquiryData.contents);

        // 파일이 여러 개인 경우
        this.inquiryData.imageFiles.forEach(file => {
          formData.append('imageFiles', file);
        });

        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/inquiry/create`, formData)
        
        if (response.status === 201 || response.data.status_code === 201) {
          this.showMessage('문의가 성공적으로 등록되었습니다.', 'success')
          this.closeCreateModal()
          
          // ADMIN에게 새로운 문의 알림 발송
          this.$store.commit('notification/addNotification', {
            id: Date.now(),
            type: 'NEW_INQUIRY',
            content: `새로운 문의 "${this.inquiryData.title}"가 등록되었습니다.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
          });
          
          await this.fetchInquiries() // 목록 새로고침
        } else {
          this.showMessage('문의 등록에 실패했습니다. 다시 시도해주세요.', 'error')
        }
      } catch (error) {
        console.error('문의 등록 오류:', error)
        this.showMessage('문의 등록 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isSubmitting = false
      }
    },

    closeCreateModal() {
      this.showCreateModal = false
      this.resetForm()
    },

    resetForm() {
      this.inquiryData = {
        inquiryType: '',
        title: '',
        contents: '',
        imageFiles: []
      }
      this.$refs.form?.resetValidation()
    },

    getTypeLabel(inquiryType) {
      if (!inquiryType) {
        console.warn('inquiryType이 undefined 또는 null입니다');
        return '알 수 없음';
      }
      
      const typeItem = this.inquiryTypes.find(item => item.value === inquiryType);
      
      if (typeItem) {
        return typeItem.title;
      } else {
        // 백엔드에서 오는 실제 값과 매핑
        const fallbackMap = {
          'FUNCTION': '기능 관련',
          'BUG': '버그 신고',
          'ETC': '기타'
        };
        
        const fallbackLabel = fallbackMap[inquiryType];
        if (fallbackLabel) {
          return fallbackLabel;
        }
        
        console.warn('알 수 없는 타입:', inquiryType);
        return inquiryType; // 원본 값 반환
      }
    },

    getTypeColor(type) {
      const colorMap = {
        'FUNCTION': 'indigo',
        'BUG': 'red',
        'ETC': 'brown'
      }
      
      const color = colorMap[type] || 'grey'
      
      return color
    },

    getTypeClass(type) {
      const classMap = {
        'FUNCTION': 'type-function',
        'BUG': 'type-bug',
        'ETC': 'type-etc'
      }
      
      return classMap[type] || 'type-default'
    },

    getStatusClass(status) {
      const classMap = {
        'PENDING': 'status-pending',
        'IN_PROGRESS': 'status-progress',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
      }
      
      return classMap[status] || 'status-default'
    },

    getStatusLabel(status) {
      if (!status) {
        return '알 수 없음';
      }
      
      const statusItem = this.inquiryStatuses.find(item => item.value === status);
      if (statusItem) {
        return statusItem.title;
      }
      
      // fallback 매핑
      const fallbackMap = {
        'PENDING': '대기중',
        'IN_PROGRESS': '처리중',
        'COMPLETED': '완료',
        'CANCELLED': '취소됨'
      };
      
      return fallbackMap[status] || status;
    },

    getStatusColor(status) {
      if (!status) {
        return 'grey';
      }
      
      const statusItem = this.inquiryStatuses.find(item => item.value === status);
      if (statusItem) {
        return statusItem.color;
      }
      
      // fallback 색상 매핑
      const colorMap = {
        'PENDING': 'warning',
        'IN_PROGRESS': 'info',
        'COMPLETED': 'success',
        'CANCELLED': 'error'
      };
      
      return colorMap[status] || 'grey';
    },

    toggleInquiryDetail(inquiryId) {
      const inquiry = this.allInquiries.find(i => i.id === inquiryId);
      if (inquiry) {
        inquiry.isExpanded = !inquiry.isExpanded;
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    showMessage(message, color = 'success') {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    },

    async refreshInquiries() {
      this.isLoading = true;
      await this.fetchInquiries();
      this.isLoading = false;
      this.showMessage('문의 목록이 새로고침되었습니다.', 'info');
    },

    startAutoRefresh() {
      this.stopAutoRefresh() // 기존 인터벌 정리
      this.autoRefreshInterval = setInterval(async () => {
        await this.fetchInquiries()
      }, 30000) // 30초마다 실행
    },

    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval)
        this.autoRefreshInterval = null
      }
    },

    closeDetailModal() {
      // 모달 창을 제거하고 아코디언 방식으로 변경
      // 아코디언 상태를 토글하는 대신 모든 문의의 isExpanded를 false로 설정
      this.allInquiries.forEach(inquiry => {
        inquiry.isExpanded = false;
      });
    },

    getAnswerContent(inquiry) {
      if (!inquiry || !inquiry.comments || inquiry.comments.length === 0) {
        return '아직 답변이 등록되지 않았습니다.';
      }
      
      // comments 배열에서 가장 최근 답변의 contents를 가져옴
      const latestComment = inquiry.comments[inquiry.comments.length - 1];
      return latestComment.contents || '답변 내용을 불러올 수 없습니다.';
    },

    openAnswerModal(inquiry) {
      this.selectedInquiry = inquiry;
      this.answerData.contents = ''; // 모달 열릴 때 답변 내용 초기화
      this.showAnswerModal = true;
    },

    closeAnswerModal() {
      this.showAnswerModal = false;
      this.answerData.contents = '';
      this.$refs.answerForm?.resetValidation();
    },

    async submitAnswer() {
      if (!this.isAnswerValid) {
        this.showMessage('답변 내용을 입력해주세요.', 'error');
        return;
      }

      this.isSubmittingAnswer = true;

      try {
                 const requestData = {
           content: this.answerData.contents
         };
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/inquirycomment/create?inquiryId=${this.selectedInquiry.id}`, requestData);
        
        if (response.data.status_code === 201) {
          this.showMessage('답변이 성공적으로 등록되었습니다.', 'success');
          this.closeAnswerModal();
          
          // 문의 작성자에게 답변 알림 발송
          this.$store.commit('notification/addNotification', {
            id: Date.now(),
            type: 'ADMIN_REPLY',
            content: `문의 "${this.selectedInquiry?.title}"에 답변이 등록되었습니다.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
          });
          
          await this.fetchInquiries(); // 목록 새로고침
        } else {
          this.showMessage('답변 등록에 실패했습니다. 다시 시도해주세요.', 'error');
        }
      } catch (error) {
        console.error('답변 등록 오류:', error);
        this.showMessage('답변 등록 중 오류가 발생했습니다.', 'error');
      } finally {
        this.isSubmittingAnswer = false;
      }
    },

    testNotification() {
      // 역할에 맞는 테스트 알림 생성
      if (this.role === 'ADMIN') {
        // ADMIN: NEW_INQUIRY 테스트 알림
        this.$store.commit('notification/addNotification', {
          id: Date.now(),
          type: 'NEW_INQUIRY',
          content: '테스트: 새로운 문의가 등록되었습니다.',
          isRead: false,
          createdAt: new Date().toISOString(),
          fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
        });
        this.showMessage('ADMIN용 NEW_INQUIRY 테스트 알림이 추가되었습니다.', 'info');
      } else {
        // USER: ADMIN_REPLY 테스트 알림
        this.$store.commit('notification/addNotification', {
          id: Date.now(),
          type: 'ADMIN_REPLY',
          content: '테스트: 문의에 답변이 등록되었습니다.',
          isRead: false,
          createdAt: new Date().toISOString(),
          fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
        });
        this.showMessage('USER용 ADMIN_REPLY 테스트 알림이 추가되었습니다.', 'info');
      }
  
    },

    openEditModal(inquiry) {
      this.selectedInquiry = inquiry; // 수정할 문의 데이터 설정
      this.editData.inquiryType = inquiry.inquiryType;
      this.editData.title = inquiry.title;
      this.editData.contents = inquiry.contents;
      this.editData.existingImages = inquiry.imageUrls || []; // 기존 이미지 URL들
      this.editData.newImageFiles = []; // 새 이미지 파일들 초기화
      this.editData.removedImageIndexes = []; // 삭제할 이미지 인덱스들 초기화
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.resetEditForm();
    },

    resetEditForm() {
      this.editData = {
        inquiryType: '',
        title: '',
        contents: '',
        existingImages: [],
        newImageFiles: [],
        removedImageIndexes: []
      };
      this.$refs.editForm?.resetValidation();
    },

    removeExistingImage(index) {
      this.editData.removedImageIndexes.push(index);
      this.editData.existingImages.splice(index, 1);
    },

    async submitEditInquiry() {
      if (!this.isEditFormValid) {
        this.showMessage('모든 필수 항목을 입력해주세요.', 'error');
        return;
      }

      this.isSubmittingEdit = true;

      try {
        const formData = new FormData();
        formData.append('inquiryType', this.editData.inquiryType);
        formData.append('title', this.editData.title);
        formData.append('contents', this.editData.contents);

        // 새로 업로드할 이미지 파일들
        this.editData.newImageFiles.forEach(file => {
          formData.append('imageFiles', file);
        });

        // 삭제할 이미지 인덱스들
        if (this.editData.removedImageIndexes.length > 0) {
          formData.append('removedImageIndexes', JSON.stringify(this.editData.removedImageIndexes));
        }

        const response = await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/inquiry/update/${this.selectedInquiry.id}`, formData);
        
        if (response.status === 200 || response.data.status_code === 200) {
          this.showMessage('문의가 성공적으로 수정되었습니다.', 'success');
          this.closeEditModal();
          await this.fetchInquiries(); // 목록 새로고침
        } else {
          this.showMessage('문의 수정에 실패했습니다. 다시 시도해주세요.', 'error');
        }
      } catch (error) {
        console.error('문의 수정 오류:', error);
        this.showMessage('문의 수정 중 오류가 발생했습니다.', 'error');
       } finally {
         this.isSubmittingEdit = false;
       }
     },

     openDeleteConfirmModal(inquiry) {
       this.selectedInquiry = inquiry;
       this.showDeleteConfirmModal = true;
     },

     closeDeleteConfirmModal() {
       this.showDeleteConfirmModal = false;
     },

     async confirmDeleteInquiry() {
       this.isDeleting = true;

       try {
         const response = await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/inquiry/delete/${this.selectedInquiry.id}`);
         
         if (response.status === 200 || response.data.status_code === 200) {
           this.showMessage('문의가 성공적으로 삭제되었습니다.', 'success');
           this.closeDeleteConfirmModal();
           await this.fetchInquiries(); // 목록 새로고침
         } else {
           this.showMessage('문의 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
         }
       } catch (error) {
         console.error('문의 삭제 오류:', error);
         this.showMessage('문의 삭제 중 오류가 발생했습니다.', 'error');
       } finally {
         this.isDeleting = false;
       }
     }
   }
 }
</script>

<style scoped>
.inquiry-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  background-color: #f5f5f5;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  z-index: -1;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
  box-sizing: border-box;
}

.header-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.header-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 32px;
}

.header-text {
  flex-grow: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 500;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 0;
  font-weight: 400;
  line-height: 1.6;
}

.status-summary {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.status-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.status-item:hover::before {
  left: 100%;
}

.status-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.pending {
  background-color: #ff9800;
  box-shadow: 0 0 8px rgba(255, 152, 0, 0.4);
}

.status-indicator.progress {
  background-color: #2196f3;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.4);
}

.status-indicator.completed {
  background-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}

.status-indicator.cancelled {
  background-color: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
}

.status-label {
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
}

.status-count {
  font-weight: 700;
  color: #1976d2;
  font-size: 1.125rem;
  margin-left: auto;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.create-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
}

.create-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.create-btn:hover::before {
  left: 100%;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.refresh-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
}

.refresh-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.refresh-btn:hover::before {
  left: 100%;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.test-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
}

.test-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.test-btn:hover::before {
  left: 100%;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.inquiry-list {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.loading-text {
  margin-top: 20px;
  color: #666;
  font-size: 1rem;
}

.inquiry-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.inquiry-item {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: #fff;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.inquiry-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}

.inquiry-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.inquiry-item:hover::before {
  opacity: 1;
}

.inquiry-item::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 24px 24px 0;
  border-color: transparent #f3f4f6 transparent transparent;
  transition: border-color 0.3s ease;
}

.inquiry-item:hover::after {
  border-color: transparent #e0e7ff transparent transparent;
}

.inquiry-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.inquiry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.inquiry-title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inquiry-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.inquiry-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.type-badge, .status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.type-badge::before, .status-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.type-badge:hover::before, .status-badge:hover::before {
  left: 100%;
}

.type-badge:hover, .status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.type-badge {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.type-badge.type-function {
  background-color: #eef2ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.type-badge.type-bug {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.type-badge.type-etc {
  background-color: #fef3c7;
  color: #d97706;
  border-color: #fed7aa;
}

.status-badge {
  background-color: #f9fafb;
  color: #6b7280;
  border-color: #e5e7eb;
}

.status-badge.status-pending {
  background-color: #fffbeb;
  color: #d97706;
  border-color: #fed7aa;
}

.status-badge.status-progress {
  background-color: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.status-badge.status-completed {
  background-color: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.status-badge.status-cancelled {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.inquiry-date {
  font-size: 0.875rem;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.inquiry-preview {
  margin: 0;
}

.inquiry-text {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.answer-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #4caf50;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.answer-status.pending {
  color: #dc2626;
  border-left-color: #dc2626;
  background-color: #fef2f2;
}

.answer-status.pending .pending-icon {
  color: #dc2626 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.answer-status.pending .icon-fallback {
  display: none;
  color: #dc2626;
  font-weight: bold;
  font-size: 20px;
  margin-left: 4px;
}

.answer-status.pending .pending-icon:not([style*="display: none"]) + .icon-fallback {
  display: none;
}

.answer-status.pending .pending-icon[style*="display: none"] + .icon-fallback,
.answer-status.pending .pending-icon:not(:visible) + .icon-fallback {
  display: inline-block;
}

.answer-icon {
  flex-shrink: 0;
}

.answer-text {
  font-weight: 600;
}

.answer-date {
  color: #999;
  font-size: 0.8rem;
  margin-left: auto;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
  border-top: 1px solid #eee;
}

.pagination {
  margin: 0;
}

.page-info {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-count {
  font-weight: 600;
  color: #333;
}

.empty-state {
  background-color: #fff;
  border-radius: 16px;
  border: 2px dashed #e0e0e0;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  margin-bottom: 15px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 300;
  color: #333;
  margin-bottom: 10px;
}

.empty-description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.empty-create-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.create-modal {
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.modal-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.modal-title {
  display: flex;
  align-items: center;
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.025em;
}

.close-btn {
  color: #64748b;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ef4444;
  transform: scale(1.1);
}

.modal-content {
  padding: 32px;
  background-color: #ffffff;
}

.form-field {
  margin-bottom: 24px;
}

.modal-actions {
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background-color: #f8fafc;
}

.cancel-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  color: #475569;
  background-color: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn:hover {
  background-color: #f8fafc;
  border-color: #64748b;
  color: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.submit-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.answer-btn {
  margin-top: 16px;
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.answer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.answer-modal {
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.inquiry-info {
  margin-bottom: 24px;
}

.inquiry-info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.inquiry-info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.info-label {
  font-weight: 600;
  color: #475569;
  min-width: 60px;
  flex-shrink: 0;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
  flex: 1;
}

.info-content {
  color: #1e293b;
  line-height: 1.6;
  background-color: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #10b981;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.submit-answer-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.submit-answer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}



/* 상세 보기 모달 스타일 */
.inquiry-detail-accordion {
  /* No specific styles needed here, as the content is now inline */
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  font-weight: 600;
  color: #555;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-chip {
  font-weight: 500;
}

.detail-content-text {
  color: #333;
  line-height: 1.6;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-text {
  border-left-color: #4caf50;
  background-color: #f1f8e9;
}

.waiting-answer-content {
  text-align: center;
  padding: 20px;
}

.waiting-icon {
  margin-bottom: 16px;
}

.waiting-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.waiting-description {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.admin-answer-section {
  text-align: center;
  padding: 20px;
}

.image-section {
  margin-top: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.image-item:hover {
  transform: scale(1.05);
}

.attached-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.expand-btn {
  color: #999;
  transition: transform 0.3s ease;
  margin-left: auto;
}

.expand-btn:hover {
  color: #1976d2;
}

.inquiry-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.inquiry-detail-accordion {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .inquiry-page {
    padding-top: 60px; /* Adjust for smaller screens */
  }

  .header-section {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 10px;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .create-btn {
    width: 100%;
  }

  .inquiry-list-container {
    grid-template-columns: 1fr; /* Single column on small screens */
  }

  .inquiry-item {
    margin-bottom: 15px;
  }

  .inquiry-content {
    padding: 20px;
    gap: 12px;
  }

  .inquiry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .inquiry-title {
    font-size: 1.1rem;
  }

  .inquiry-text {
    -webkit-line-clamp: 4; /* More lines on small screens */
  }

  .pagination-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .page-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .page-count {
    font-size: 0.75rem;
  }

  .empty-state {
    padding: 30px 15px;
  }

  .empty-title {
    font-size: 1.3rem;
  }

  .empty-description {
    font-size: 0.9rem;
  }

  .empty-create-btn {
    width: 100%;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .close-btn {
    color: #999;
  }

  .modal-content {
    padding: 20px;
  }

  .form-field {
    margin-bottom: 12px;
  }

  .modal-actions {
    padding: 15px 20px;
    justify-content: center;
    gap: 8px;
  }

  .cancel-btn, .submit-btn {
    width: 100%;
  }

  /* 상세 보기 모달 반응형 */
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .detail-label {
    min-width: auto;
  }

  .image-grid {
    grid-template-columns: 1fr;
  }

  .waiting-content {
    padding: 30px 15px;
  }

  .waiting-title {
    font-size: 1.1rem;
  }

  .waiting-description {
    font-size: 0.9rem;
  }

  /* 아코디언 반응형 */
  .inquiry-actions {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .detail-section-title {
    font-size: 1.1rem;
  }

  .detail-content-text {
    padding: 12px;
    font-size: 0.9rem;
  }

  .waiting-answer-content {
    padding: 20px 15px;
  }

  .waiting-title {
    font-size: 1rem;
  }

  .waiting-description {
    font-size: 0.85rem;
  }
}

.answer-btn-small {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 8px 16px;
  font-size: 0.875rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-btn-small::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.answer-btn-small:hover::before {
  left: 100%;
}

.answer-btn-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* 수정/삭제 버튼 스타일 (우측 하단) */
.user-actions-bottom {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.edit-btn-bottom, .delete-btn-bottom {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.025em;
  padding: 6px 12px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
}

.edit-btn-bottom {
  color: #3b82f6 !important;
  border-color: #dbeafe;
  background-color: #f8fafc;
}

.edit-btn-bottom:hover {
  background-color: #eff6ff;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.delete-btn-bottom {
  color: #ef4444 !important;
  border-color: #fecaca;
  background-color: #fef2f2;
}

.delete-btn-bottom:hover {
  background-color: #fee2e2;
  border-color: #ef4444;
  transform: translateY(-1px);
}

/* 기존 수정/삭제 버튼 스타일 (아코디언 내부용) */
.user-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.edit-btn, .delete-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 8px 16px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff !important;
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff !important;
  border: none;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* 수정 모달 스타일 */
.edit-modal {
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.submit-edit-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg,  #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.submit-edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

/* 삭제 확인 모달 스타일 */
.delete-confirm-modal {
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.delete-confirm-content {
  text-align: center;
  padding: 20px 0;
}

.delete-confirm-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.delete-confirm-subtext {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.confirm-delete-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 16px 32px;
  font-size: 1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.confirm-delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

/* 이미지 업로드 섹션 스타일 */
.image-upload-section, .existing-images-section {
  margin-top: 24px;
}

.image-upload-label, .existing-images-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.existing-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.existing-image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.existing-image-item:hover {
  transform: scale(1.05);
}

.existing-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(239, 68, 68, 0.9) !important;
  color: white !important;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
}

.remove-image-btn:hover {
  background-color: rgba(239, 68, 68, 1) !important;
  transform: scale(1.1);
}

/* 반응형 디자인에서 수정/삭제 버튼 */
@media (max-width: 768px) {
  .user-actions, .user-actions-bottom {
    flex-direction: column;
    gap: 8px;
  }

  .edit-btn, .delete-btn, .edit-btn-bottom, .delete-btn-bottom {
    width: 100%;
    justify-content: center;
  }

  .existing-images-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
  }

  .existing-image {
    height: 100px;
  }
}
</style>
