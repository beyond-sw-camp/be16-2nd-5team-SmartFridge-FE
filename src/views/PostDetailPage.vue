<template>
  <div class="post-detail-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <v-btn @click="goBack" prepend-icon="mdi-arrow-left" variant="text" class="back-btn">
            뒤로가기
          </v-btn>
          <h1 class="page-title">게시글</h1>
        </div>
        <div class="header-actions" v-if="postDetail">
          <!-- 본인이 작성한 게시글인 경우에만 수정/삭제 버튼 표시 -->
          <div v-if="isAuthor" class="author-actions">
            <v-btn @click="openEditModal" color="primary" variant="outlined" class="edit-btn">
              <v-icon>mdi-pencil</v-icon>
              수정
            </v-btn>
            <v-btn @click="openDeleteDialog" color="error" variant="outlined" class="delete-btn">
              <v-icon>mdi-delete</v-icon>
              삭제
            </v-btn>
          </div>
          <v-btn @click="toggleLike" :color="postDetail.isLiked ? 'red' : 'grey'" variant="outlined" class="like-btn">
            <v-icon>{{ postDetail.isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
            좋아요 {{ postDetail.likeCount }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <v-card class="main-content-card" v-if="postDetail">
      <!-- 게시글 헤더 -->
      <v-card-title class="post-header">
        <div class="post-title-section">
          <h2 class="post-title">{{ postDetail.title }}</h2>
          <div class="post-meta">
            <span class="post-author">{{ postDetail.writer }}</span>
            <span class="post-category">{{ postDetail.categoryName }}</span>
            <span class="post-date">{{ formatDate(postDetail.createdDate) }}</span>
          </div>
        </div>
        <div class="post-stats">
          <div class="stat-item">
            <v-icon size="16" color="blue">mdi-eye</v-icon>
            <span>{{ postDetail.viewCount }}</span>
          </div>
          <div class="stat-item">
            <v-icon size="16" color="red">mdi-heart</v-icon>
            <span>{{ postDetail.likeCount }}</span>
          </div>
          <div class="stat-item">
            <v-icon size="16" color="green">mdi-comment</v-icon>
            <span>{{ postDetail.commentCount }}</span>
          </div>
        </div>
      </v-card-title>

      <!-- 게시글 내용 -->
      <v-card-text class="post-content">
        <div class="content-text" v-html="processedContent"></div>
      </v-card-text>
    </v-card>

    <!-- 댓글 섹션 -->
    <v-card class="comments-card">
      <v-card-title class="comments-header">
        <div class="comments-title-section">
          <v-icon color="primary" size="24" class="mr-2">mdi-comment-multiple</v-icon>
          <h3>댓글 ({{ postDetail?.commentCount || 0 }})</h3>
        </div>
      </v-card-title>

      <!-- 댓글 작성 폼 -->
      <v-card-text class="comment-form-section">
        <div class="comment-input-container">
          <v-textarea
            v-model="newComment"
            placeholder="댓글을 작성해주세요..."
            variant="outlined"
            rows="3"
            class="comment-input"
            hide-details
          ></v-textarea>
          <v-btn 
            @click="submitComment" 
            color="primary" 
            :disabled="!newComment.trim()"
            class="comment-submit-btn"
          >
            댓글 작성
          </v-btn>
        </div>
      </v-card-text>

      <!-- 댓글 목록 -->
      <v-card-text class="comments-list">
        <div v-if="isLoadingComments" class="loading-container">
          <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
          <p class="loading-text">댓글을 불러오는 중...</p>
        </div>

        <div v-else-if="comments && comments.length > 0" class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <!-- 수정 모드가 아닐 때 -->
            <div v-if="editingCommentId !== comment.id">
              <div class="comment-header">
                <div class="comment-author-section">
                  <v-avatar size="32" color="primary" class="comment-avatar">
                    <v-icon color="white" size="16">mdi-account</v-icon>
                  </v-avatar>
                  <span class="comment-author">{{ comment.writer }}</span>
                </div>
                <div class="comment-actions">
                  <span class="comment-date">{{ formatDate(comment.createdDate) }}</span>
                  <!-- 댓글 작성자 본인만 수정/삭제 가능하도록 처리 -->
                  <div v-if="isCommentAuthor(comment)" class="comment-buttons">
                    <v-btn @click="startEditComment(comment)" size="small" variant="text" color="primary" class="action-btn">
                      <v-icon size="16">mdi-pencil</v-icon>
                      수정
                    </v-btn>
                    <v-btn @click="deleteComment(comment.id)" size="small" variant="text" color="error" class="action-btn">
                      <v-icon size="16">mdi-delete</v-icon>
                      삭제
                    </v-btn>
                  </div>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
            
            <!-- 수정 모드일 때 -->
            <div v-else class="comment-edit-form">
              <v-textarea
                v-model="editingCommentContent"
                variant="outlined"
                rows="2"
                class="comment-edit-input"
                hide-details
              ></v-textarea>
              <div class="comment-edit-actions">
                <v-btn @click="updateComment(comment.id)" size="small" color="primary" class="save-btn">
                  <v-icon size="16">mdi-check</v-icon>
                  저장
                </v-btn>
                <v-btn @click="cancelEditComment" size="small" variant="outlined" class="cancel-btn">
                  <v-icon size="16">mdi-close</v-icon>
                  취소
                </v-btn>
              </div>
            </div>
          </div>
          
          <!-- 댓글 페이징 -->
          <div v-if="commentTotalPages > 1" class="comment-pagination">
            <v-btn 
              @click="refreshComments" 
              :disabled="commentPage === 1"
              variant="outlined" 
              size="small"
              class="pagination-btn"
            >
              <v-icon size="16">mdi-rewind</v-icon>
              처음으로
            </v-btn>
            <span class="page-info">
              {{ commentPage }} / {{ commentTotalPages }} 페이지
            </span>
            <v-btn 
              @click="loadMoreComments" 
              :disabled="commentPage >= commentTotalPages"
              variant="outlined" 
              size="small"
              class="pagination-btn"
            >
              <v-icon size="16">mdi-fast-forward</v-icon>
              더보기
            </v-btn>
          </div>
        </div>

        <div v-else class="no-comments">
          <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-comment-outline</v-icon>
          <p class="no-comments-text">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- 수정 모달 -->
    <PostFormModal
      v-model="showEditModal"
      :editing-post="editingPost"
      :board-type="postDetail?.categoryName || '자유게시판'"
      @save="handlePostUpdate"
    />

    <!-- 게시글 삭제 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="showDeleteDialog"
      title="게시글 삭제 확인"
      :message="`'${postDetail?.title || ''}' 게시글을 정말 삭제하시겠습니까?`"
      @confirm="deletePost"
      @cancel="showDeleteDialog = false"
    />

    <!-- Snackbar 컴포넌트 추가 -->
    <CommonSnackbar ref="commonSnackbar" />

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="loading-text">게시글을 불러오는 중...</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';
import PostFormModal from '@/components/Community/PostFormModal.vue';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog.vue';
import { getFridgeId } from '@/utils/commonDataHandler';

export default {
  name: 'PostDetailPage',
  components: {
    PostFormModal,
    CommonSnackbar,
    DeleteConfirmDialog
  },
  data() {
    return {
      postDetail: null,
      comments: [],
      newComment: '',
      isLoading: false,
      isLoadingComments: false,
      // 댓글 페이징 관련
      commentPage: 1,
      commentPageSize: 10,
      commentTotalPages: 0,
      commentTotalElements: 0,
      // 댓글 수정 관련
      editingCommentId: null,
      editingCommentContent: '',
      // 게시글 수정 관련
      showEditModal: false,
      showDeleteDialog: false,
      editingPost: {}
    }
  },
  computed: {
    ...mapGetters(['getUserInfo', 'isLoggedIn']),
    
    // 마크다운 이미지를 HTML로 변환한 콘텐츠
    processedContent() {
      if (!this.postDetail?.content) return '';
      
      // 마크다운 이미지 형식 ![alt](url)을 HTML img 태그로 변환
      return this.postDetail.content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block;">'
      );
    },
    
    // 게시글 작성자 여부 확인
    isAuthor() {
      if (!this.postDetail || !this.userInfo) return false;
      return this.postDetail.writer === this.userInfo.name || 
             this.postDetail.writer === this.userInfo.email;
    },
    
    // 사용자 정보
    userInfo() {
      return this.getUserInfo;
    }
  },
  
  async created() {
    // 사용자 정보가 없으면 가져오기
    if (!this.isLoggedIn) {
      try {
        await this.$store.dispatch('fetchUserInfo');
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    }
    
    await this.fetchPostDetail();
    await this.fetchComments();
  },
  methods: {
    async fetchPostDetail() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          alert('냉장고 정보를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        this.postDetail = response.data.result;
        console.log('게시글 상세 정보:', this.postDetail);
        
      } catch (error) {
        console.error('게시글 상세 정보 조회 실패:', error);
        alert('게시글을 불러오는데 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },

    async fetchComments() {
      try {
        this.isLoadingComments = true;
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/list?page=${this.commentPage - 1}&size=${this.commentPageSize}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        this.comments = response.data.result.content || [];
        this.commentTotalPages = response.data.result.totalPages;
        this.commentTotalElements = response.data.result.totalElements;
        console.log('댓글 목록:', this.comments);
        
      } catch (error) {
        console.error('댓글 목록 조회 실패:', error);
        this.comments = [];
      } finally {
        this.isLoadingComments = false;
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        const commentData = {
          content: this.newComment.trim()
        };
        
        await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/create`,
          commentData,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 댓글 작성 성공 후 댓글 목록 새로고침
        this.newComment = '';
        this.commentPage = 1; // 첫 페이지로 리셋
        await this.fetchComments();
        
        // 게시글 정보도 새로고침 (댓글 수 업데이트)
        await this.fetchPostDetail();
        
        this.showSnackbar('댓글이 작성되었습니다.', 'success');
        
      } catch (error) {
        console.error('댓글 작성 실패:', error);
        this.showSnackbar('댓글 작성에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    async updateComment(commentId) {
      if (!this.editingCommentContent.trim()) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        const updateData = {
          content: this.editingCommentContent.trim()
        };
        
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/update/${commentId}`,
          updateData,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 수정 모드 종료
        this.editingCommentId = null;
        this.editingCommentContent = '';
        
        // 댓글 목록 새로고침
        await this.fetchComments();
        
        this.showSnackbar('댓글이 수정되었습니다.', 'success');
        
      } catch (error) {
        console.error('댓글 수정 실패:', error);
        this.showSnackbar('댓글 수정에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    async deleteComment(commentId) {
      if (!confirm('댓글을 삭제하시겠습니까?')) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/delete/${commentId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 댓글 목록 새로고침
        await this.fetchComments();
        
        // 게시글 정보도 새로고침 (댓글 수 업데이트)
        await this.fetchPostDetail();
        
        this.showSnackbar('댓글이 삭제되었습니다.', 'error');
        
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
        this.showSnackbar('댓글 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    startEditComment(comment) {
      this.editingCommentId = comment.id;
      this.editingCommentContent = comment.content;
    },

    cancelEditComment() {
      this.editingCommentId = null;
      this.editingCommentContent = '';
    },

    async loadMoreComments() {
      if (this.commentPage < this.commentTotalPages) {
        this.commentPage++;
        await this.fetchComments();
      }
    },

    async refreshComments() {
      this.commentPage = 1;
      await this.fetchComments();
    },

    async toggleLike() {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          alert('냉장고 정보를 찾을 수 없습니다.');
          return;
        }
        
        if (this.postDetail.isLiked) {
          // 좋아요 취소
          await axios.delete(
            `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/like`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }
          );
        } else {
          // 좋아요 추가
          await axios.post(
            `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/like`,
            {},
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }
          );
        }
        
        // 좋아요 상태 업데이트
        this.postDetail.isLiked = !this.postDetail.isLiked;
        this.postDetail.likeCount += this.postDetail.isLiked ? 1 : -1;
        
      } catch (error) {
        console.error('좋아요 토글 실패:', error);
        alert('좋아요 처리에 실패했습니다.');
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      // YYYY-MM-DD HH:MM 형식으로 반환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    goBack() {
      this.$router.go(-1);
    },

    // 게시글 수정 모달 열기
    openEditModal() {
      this.editingPost = {
        id: this.postDetail.id,
        title: this.postDetail.title,
        content: this.postDetail.content,
        category: this.postDetail.categoryName
      };
      this.showEditModal = true;
    },
    
    // 게시글 수정 처리
    async handlePostUpdate(updatedPost) {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/update`,
          updatedPost,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 게시글 정보 새로고침
        await this.fetchPostDetail();
        
        // 수정 모달 닫기
        this.showEditModal = false;
        
        this.showSnackbar('게시글이 수정되었습니다.', 'success');
        
      } catch (error) {
        console.error('게시글 수정 실패:', error);
        this.showSnackbar('게시글 수정에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },
    
    // 게시글 삭제 확인 다이얼로그 열기
    openDeleteDialog() {
      console.log('openDeleteDialog 호출됨');
      console.log('현재 showDeleteDialog:', this.showDeleteDialog);
      this.showDeleteDialog = true;
      console.log('변경 후 showDeleteDialog:', this.showDeleteDialog);
    },
    
    // 게시글 삭제
    async deletePost() {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/delete/${postId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 삭제 완료 상태를 localStorage에 저장하고 게시글 목록 페이지로 이동
        localStorage.setItem('postDeleted', 'true');
        this.$router.push('/fridge/community');
        
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
        this.showSnackbar('게시글 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },
    
    // 댓글 작성자 여부 확인
    isCommentAuthor(comment) {
      if (!comment || !this.userInfo) return false;
      return comment.writer === this.userInfo.name || 
             comment.writer === this.userInfo.email;
    },

    showSnackbar(message, color) {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    }
  }
}
</script>

<style scoped>
.post-detail-container {
  padding: 32px;
  margin-left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.post-detail-container::before {
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

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: #1976d2;
  transform: translateX(-2px);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.author-actions {
  display: flex;
  gap: 12px;
  margin-right: 16px;
}

.edit-btn, .delete-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn:hover, .delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.like-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.like-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.main-content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.post-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
}

.post-title-section {
  flex: 1;
}

.post-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.post-author, .post-date {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.post-category {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.post-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-content {
  padding: 24px;
}

.content-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.content-text img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: block;
}

.content-text p {
  margin: 16px 0;
}



.comments-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.comments-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
}

.comments-title-section {
  display: flex;
  align-items: center;
}

.comments-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.comment-form-section {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
}

.comment-input-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.comment-input {
  flex: 1;
}

.comment-submit-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
  transition: all 0.3s ease;
}

.comment-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
}

.comments-list {
  padding: 20px 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 4px solid #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.comment-item:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-author-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-author {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.comment-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding: 16px;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(25, 118, 210, 0.1);
}

.comment-edit-input {
  flex: 1;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.save-btn, .cancel-btn {
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover, .cancel-btn:hover {
  transform: translateY(-1px);
}

.no-comments {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.no-comments-text {
  font-size: 16px;
  color: #666;
  margin-top: 16px;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.pagination-btn {
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@media (max-width: 960px) {
  .post-detail-container {
    padding: 24px;
    margin-left: 8px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .post-title {
    font-size: 24px;
  }
  
  .author-actions {
    margin-right: 0;
    margin-bottom: 12px;
  }
}

@media (max-width: 600px) {
  .post-detail-container {
    padding: 16px;
    margin-left: 4px;
  }

  .page-header {
    padding: 16px;
  }

  .post-meta {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .post-stats {
    justify-content: center;
    margin-top: 16px;
  }

  .comment-input-container {
    flex-direction: column;
    gap: 12px;
  }

  .comment-submit-btn {
    align-self: flex-end;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .comment-actions {
    align-self: flex-end;
  }
  
  .author-actions {
    flex-direction: column;
    gap: 8px;
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .edit-btn, .delete-btn {
    width: 100%;
  }
}
</style>
