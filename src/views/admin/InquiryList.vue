<template>
  <div class="admin-layout">
    <div class="inquiry-list">
      <div class="header">
        <h1>문의 목록</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item active">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="statusFilter" @change="filterInquiries">
          <option value="">전체 상태</option>
          <option value="답변대기">답변대기</option>
          <option value="답변완료">답변완료</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="제목으로 검색..." @input="filterInquiries">
      </div>

      <div class="inquiry-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inquiry in filteredInquiries" :key="inquiry.id">
              <td>{{ inquiry.id }}</td>
              <td>{{ inquiry.title }}</td>
              <td>{{ inquiry.author }}</td>
              <td>
                <span :class="inquiry.status === '답변완료' ? 'completed' : 'pending'">
                  {{ inquiry.status }}
                </span>
              </td>
              <td>{{ inquiry.createdAt }}</td>
              <td>
                <button @click="viewInquiry(inquiry)" class="view-btn">보기</button>
                <button v-if="inquiry.status === '답변대기'" @click="replyInquiry(inquiry)" class="reply-btn">답변</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 문의 상세 보기 모달 -->
      <div v-if="selectedInquiry" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedInquiry.title }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="inquiry-detail">
              <p><strong>작성자:</strong> {{ selectedInquiry.author }}</p>
              <p><strong>작성일:</strong> {{ selectedInquiry.createdAt }}</p>
              <p><strong>내용:</strong></p>
              <div class="content">{{ selectedInquiry.content }}</div>
              
              <!-- 첨부 이미지 표시 -->
              <div v-if="selectedInquiry.imageUrls && selectedInquiry.imageUrls.length > 0" class="inquiry-images">
                <p><strong>첨부 이미지:</strong></p>
                <div class="image-gallery">
                  <div v-for="(imageUrl, index) in selectedInquiry.imageUrls" :key="index" class="image-item">
                    <img 
                      :src="imageUrl" 
                      :alt="`문의 이미지 ${index + 1}`"
                      @click="openImageModal(imageUrl)"
                      @error="handleImageError"
                      class="inquiry-image"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedInquiry.reply" class="reply-detail">
              <h3>답변</h3>
              <div class="content">{{ selectedInquiry.reply }}</div>
              <p><strong>답변일:</strong> {{ selectedInquiry.replyDate }}</p>
            </div>
            
            <div v-else-if="isReplyMode" class="reply-form">
              <h3>답변 작성</h3>
              <div class="no-reply-info">
                <p class="no-reply-message">답변이 아직 없습니다.</p>
              </div>
              <textarea v-model="replyContent" placeholder="답변을 입력하세요..." rows="5"></textarea>
              <div class="form-actions">
                <button @click="submitReply" class="submit-btn">답변 등록</button>
                <button @click="closeModal" class="cancel-btn">취소</button>
              </div>
            </div>
            
            <div v-else class="no-reply-view">
              <h3>답변</h3>
              <div class="no-reply-info">
                <p class="no-reply-message">답변이 아직 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 이미지 확대보기 모달 -->
      <div v-if="selectedImage" class="image-modal" @click="closeImageModal">
        <div class="image-modal-content" @click.stop>
          <button @click="closeImageModal" class="image-close-btn">×</button>
          <img :src="selectedImage" alt="확대 이미지" class="enlarged-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'InquiryList',
  data() {
    return {
      inquiries: [],
      filteredInquiries: [],
      statusFilter: '',
      searchQuery: '',
      selectedInquiry: null,
      replyContent: '',
      isReplyMode: false,
      loading: true,
      selectedImage: null // 이미지 확대보기용
    }
  },
  mounted() {
    this.loadInquiries();
  },
  methods: {
    async loadInquiries() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/inquiry/list`);
        
        console.log('Admin Inquiry API Response:', response.data);
        
        if (response.data.status_code === 200) {
          console.log('First inquiry item:', response.data.result[0]);
          
          this.inquiries = await Promise.all(response.data.result.map(async (inquiry) => {
            // 작성자 정보 가져오기 시도
            let authorInfo = `Member ID: ${inquiry.memberId}`;
            try {
              // memberId로 사용자 정보 조회 시도 (이 API가 있다면)
              // const memberResponse = await axios.get(`http://localhost:8080/admin/member/detail/${inquiry.memberId}`);
              // authorInfo = memberResponse.data.result?.memberEmail || authorInfo;
            } catch (error) {
              // 사용자 정보 조회 실패 시 Member ID로 표시
            }
            
            return {
              // InquiryResDto 구조에 맞게 수정
              id: inquiry.inquiryId,
              title: inquiry.title,
              author: authorInfo,
              status: inquiry.status === 'PENDING' ? '답변대기' : '답변완료',
              createdAt: inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : '-',
              content: inquiry.contents,
              imageUrls: inquiry.imageUrls || [], // 이미지 URL 배열 추가
              // comments 배열에서 답변 정보 추출 (첫 번째 댓글을 답변으로 가정)
              reply: inquiry.comments && inquiry.comments.length > 0 ? 
                    (inquiry.comments[0].commentContents || inquiry.comments[0].contents) : null,
              replyDate: inquiry.comments && inquiry.comments.length > 0 && 
                        (inquiry.comments[0].createdAt || inquiry.comments[0].createdTime) 
                        ? new Date(inquiry.comments[0].createdAt || inquiry.comments[0].createdTime).toLocaleDateString() : null
            };
          }));
          this.filteredInquiries = [...this.inquiries];
        }
      } catch (error) {
        console.error('문의 목록 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.$store.dispatch('showSnackbar', {
          message: '문의 목록 로드에 실패했습니다.',
          color: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    filterInquiries() {
      let filtered = [...this.inquiries];
      
      if (this.statusFilter) {
        filtered = filtered.filter(inquiry => inquiry.status === this.statusFilter);
      }
      
      if (this.searchQuery) {
        filtered = filtered.filter(inquiry => 
          inquiry.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      this.filteredInquiries = filtered;
    },
    
    async viewInquiry(inquiry) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/inquiry/detail/${inquiry.id}`);
        
        console.log('Inquiry Detail API Response:', response.data);
        
        if (response.data.status_code === 200) {
          const inquiryDetail = response.data.result;
          this.selectedInquiry = {
            ...inquiry,
            content: inquiryDetail.contents,
            title: inquiryDetail.title,
            author: `Member ID: ${inquiryDetail.memberId}`,
            createdAt: inquiryDetail.createdAt ? new Date(inquiryDetail.createdAt).toLocaleDateString() : '-',
            imageUrls: inquiryDetail.imageUrls || [], // 이미지 URL 배열 추가
            // comments 배열에서 답변 정보 추출
            reply: inquiryDetail.comments && inquiryDetail.comments.length > 0 ? 
                  (inquiryDetail.comments[0].commentContents || inquiryDetail.comments[0].contents) : null,
            replyDate: inquiryDetail.comments && inquiryDetail.comments.length > 0 && 
                      (inquiryDetail.comments[0].createdAt || inquiryDetail.comments[0].createdTime) 
                      ? new Date(inquiryDetail.comments[0].createdAt || inquiryDetail.comments[0].createdTime).toLocaleDateString() : null
          };
        } else {
          this.selectedInquiry = inquiry;
        }
        this.isReplyMode = false; // 보기 모드
        this.replyContent = '';
      } catch (error) {
        console.error('문의 상세 정보 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.selectedInquiry = inquiry;
        this.isReplyMode = false; // 보기 모드
        this.replyContent = '';
      }
    },
    
    replyInquiry(inquiry) {
      this.selectedInquiry = inquiry;
      this.isReplyMode = true; // 답변 모드
      this.replyContent = '';
    },
    
    async submitReply() {
      if (!this.replyContent.trim()) {
        alert('답변 내용을 입력해주세요.');
        return;
      }
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/admin/inquiry/reply?inquiryId=${this.selectedInquiry.id}`,
          {
            commentContents: this.replyContent
          }
        );
        
        if (response.data.status_code === 201) {
          this.selectedInquiry.reply = this.replyContent;
          this.selectedInquiry.replyDate = new Date().toLocaleDateString();
          this.selectedInquiry.status = '답변완료';
          
          // 목록 업데이트
          const index = this.inquiries.findIndex(i => i.id === this.selectedInquiry.id);
          if (index !== -1) {
            this.inquiries[index] = { ...this.selectedInquiry };
          }
          
          this.filterInquiries();
          this.closeModal();
          
          this.$store.dispatch('showSnackbar', {
            message: '답변이 성공적으로 등록되었습니다.',
            color: 'success'
          });
        }
      } catch (error) {
        console.error('답변 등록 실패:', error);
        this.$store.dispatch('showSnackbar', {
          message: '답변 등록에 실패했습니다.',
          color: 'error'
        });
      }
    },
    
    closeModal() {
      this.selectedInquiry = null;
      this.replyContent = '';
      this.isReplyMode = false;
    },
    
    openImageModal(imageUrl) {
      this.selectedImage = imageUrl;
    },
    
    closeImageModal() {
      this.selectedImage = null;
    },
    
    handleImageError(event) {
      console.error('이미지 로드 실패:', event.target.src);
      event.target.style.display = 'none';
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.inquiry-list {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logout-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.3);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234, 67, 53, 0.4);
}

.navigation-menu {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item {
  padding: 12px 24px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

.nav-item.active {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: center;
}

.filters select, .filters input {
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.filters select:focus, .filters input:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.filters input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.inquiry-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.inquiry-table table {
  width: 100%;
  border-collapse: collapse;
}

.inquiry-table th, .inquiry-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.inquiry-table th {
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inquiry-table td {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.inquiry-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.completed {
  color: #34a853;
  font-weight: 600;
  background: rgba(52, 168, 83, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.pending {
  color: #fbbc04;
  font-weight: 600;
  background: rgba(251, 188, 4, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.view-btn, .reply-btn {
  margin: 0 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.3s ease;
}

.view-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.reply-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
}

.reply-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.4);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow-y: auto;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.content {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  margin: 16px 0;
  white-space: pre-wrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 1.6;
}

.reply-form textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin: 16px 0;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  backdrop-filter: blur(10px);
}

.reply-form textarea:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.reply-form textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

.submit-btn, .cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.submit-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 168, 83, 0.4);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 답변 섹션 스타일 */
.no-reply-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  margin-bottom: 16px;
}

.no-reply-message {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  margin: 0;
  font-size: 14px;
}

.no-reply-view {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.no-reply-view h3 {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 문의 이미지 스타일 */
.inquiry-images {
  margin: 24px 0;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
}

.inquiry-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.inquiry-image:hover {
  border-color: #4285f4;
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(66, 133, 244, 0.3);
}

/* 이미지 확대보기 모달 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
}

.image-modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.enlarged-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.image-close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.image-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .inquiry-list {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters select, .filters input {
    width: 100%;
  }
  
  .inquiry-table {
    overflow-x: auto;
  }
  
  .inquiry-table th, .inquiry-table td {
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header h2 {
    font-size: 20px;
  }
}
</style>
