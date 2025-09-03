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
            
            <div v-else class="reply-form">
              <h3>답변 작성</h3>
              <textarea v-model="replyContent" placeholder="답변을 입력하세요..." rows="5"></textarea>
              <div class="form-actions">
                <button @click="submitReply" class="submit-btn">답변 등록</button>
                <button @click="closeModal" class="cancel-btn">취소</button>
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
              // 백엔드에서 comments가 단일 객체이므로 그대로 사용
              reply: inquiry.comments ? (inquiry.comments.commentContents || inquiry.comments.contents) : null,
              replyDate: inquiry.comments && (inquiry.comments.createdAt || inquiry.comments.createdTime)
                        ? new Date(inquiry.comments.createdAt || inquiry.comments.createdTime).toLocaleDateString() : null
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
            // 백엔드에서 comments가 단일 객체이므로 그대로 사용
            reply: inquiryDetail.comments ? (inquiryDetail.comments.commentContents || inquiryDetail.comments.contents) : null,
            replyDate: inquiryDetail.comments && (inquiryDetail.comments.createdAt || inquiryDetail.comments.createdTime)
                      ? new Date(inquiryDetail.comments.createdAt || inquiryDetail.comments.createdTime).toLocaleDateString() : null
          };
        } else {
          this.selectedInquiry = inquiry;
        }
        this.replyContent = '';
      } catch (error) {
        console.error('문의 상세 정보 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.selectedInquiry = inquiry;
        this.replyContent = '';
      }
    },
    
    replyInquiry(inquiry) {
      this.selectedInquiry = inquiry;
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
  background: #f8f9fa;
}

.inquiry-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.navigation-menu {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.nav-item {
  padding: 10px 20px;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: #007bff;
  color: white;
}



.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filters select, .filters input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.inquiry-table table {
  width: 100%;
  border-collapse: collapse;
}

.inquiry-table th, .inquiry-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.inquiry-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.completed {
  color: #28a745;
  font-weight: bold;
}

.pending {
  color: #ffc107;
  font-weight: bold;
}

.view-btn, .reply-btn {
  margin: 0 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view-btn {
  background: #17a2b8;
  color: white;
}

.reply-btn {
  background: #28a745;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  width: 80%;
  max-width: 600px;
  max-height: 80%;
  overflow-y: auto;
  border-radius: 8px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
  white-space: pre-wrap;
}

.reply-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 10px 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.submit-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background: #28a745;
  color: white;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

/* 문의 이미지 스타일 */
.inquiry-images {
  margin: 20px 0;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-item {
  position: relative;
}

.inquiry-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid #ddd;
  transition: all 0.3s ease;
}

.inquiry-image:hover {
  border-color: #007bff;
  transform: scale(1.02);
}

/* 이미지 확대보기 모달 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
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
  border-radius: 8px;
}

.image-close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.image-close-btn:hover {
  background: white;
}
</style>
