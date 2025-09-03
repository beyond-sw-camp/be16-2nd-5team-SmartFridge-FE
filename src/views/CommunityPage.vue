<template>
  <div class="community-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">커뮤니티</h1>
          <p class="page-subtitle">냉장고 멤버들과 소통하고 정보를 공유해보세요</p>
        </div>
        <div class="header-actions">
          <v-btn @click="openCreateModal" color="primary" prepend-icon="mdi-plus" size="large" class="write-post-btn">
            글쓰기
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <v-card class="main-content-card">
      <!-- 게시판 종류 탭 -->
      <v-card-title class="board-tabs-header">
        <v-tabs v-model="activeBoard" class="board-tabs" color="primary" density="compact" @update:model-value="onBoardChange">
          <!-- 전체보기 탭 추가 -->
          <v-tab value="전체" class="board-tab">
            전체보기
          </v-tab>
          <!-- 기존 카테고리 탭들 -->
          <v-tab v-for="category in boardCategories" :key="category.id" :value="category.category" class="board-tab">
            {{ category.category }}
          </v-tab>
        </v-tabs>
      </v-card-title>

      <!-- 검색 및 필터 -->
      <v-card-text class="search-section">
        <div class="search-row">
          <div class="search-item">
            <v-text-field v-model="searchQuery" placeholder="제목, 내용, 작성자로 검색" variant="outlined" density="compact"
              class="search-field" prepend-inner-icon="mdi-magnify" @input="onSearchInput" hide-details></v-text-field>
          </div>
          <div class="search-item">
            <v-select v-model="sortBy" :items="sortOptions" variant="outlined" density="compact" class="sort-select"
              @update:model-value="onSortChange" hide-details></v-select>
          </div>
        </div>
      </v-card-text>

      <v-card-text>
        <!-- 로딩 상태 표시 -->
        <div v-if="isLoading" class="loading-container">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="loading-text">게시글을 불러오는 중...</p>
        </div>

        <!-- 게시글 목록 -->
        <div v-else-if="postList && postList.length > 0" class="post-list">
          <div v-for="post in postList" :key="post.id" class="post-item" @click="viewPost(post)">
            <div class="post-content">
              <div class="post-header">
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="post-meta">
                  <span class="post-author">{{ post.writer }}</span>
                  <span class="post-category">{{ post.categoryName }}</span>
                  <span class="post-time">{{ post.timeAgo }}</span>
                </div>
              </div>
              <div class="post-stats">
                <div class="stat-item">
                  <v-icon size="16" color="blue">mdi-eye</v-icon>
                  <span>{{ post.viewCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 데이터가 없을 때 표시 -->
        <div v-else class="no-data-container">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-post-outline</v-icon>
          <h3 class="no-data-title">등록된 게시글이 없습니다</h3>
          <p class="no-data-subtitle">첫 번째 게시글을 작성해보세요</p>
          <v-btn color="primary" @click="openCreateModal" prepend-icon="mdi-plus" class="mt-4">
            첫 게시글 작성하기
          </v-btn>
        </div>

        <!-- 페이징 컴포넌트 -->
        <div v-if="!isLoading && postList && postList.length > 0" class="pagination-container">
          <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7" @update:model-value="onPageChange"
            color="primary" class="pagination-controls"></v-pagination>

          <!-- 페이지 정보 표시 -->
          <div class="page-info">
            <span class="page-text">
              {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalElements) }} / 총 {{
              totalElements }}개
            </span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 게시글 작성 모달 -->
    <PostFormModal v-model="isModalOpen" :board-type="activeBoard" @save="handleSave" />
    
    <!-- Snackbar 컴포넌트 추가 -->
    <CommonSnackbar ref="commonSnackbar" />
  </div>
</template>

<script>
import axios from 'axios';
import { getFridgeId } from '@/utils/commonDataHandler';
import PostFormModal from '../components/Community/PostFormModal.vue';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';

export default {
  components: {
    PostFormModal,
    CommonSnackbar
  },
  data() {
    return {
      activeBoard: '전체', // 기본값: 전체
      boardCategories: [], // API에서 가져올 카테고리 목록
      searchQuery: '',
      sortBy: 'latest',
      postList: [],
      isModalOpen: false,
      isLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
      sortOptions: [
        { title: '최신순', value: 'latest' },
        { title: '인기순', value: 'popular' },
        { title: '조회순', value: 'views' },
        { title: '좋아요순', value: 'likes' }
      ]
    }
  },
  async created() {
    console.log('=== CommunityPage created 시작 ===');
    console.log('현재 activeBoard:', this.activeBoard);
    console.log('현재 boardCategories:', this.boardCategories);
    
    await this.fetchCategories();
    console.log('카테고리 로드 완료 후 activeBoard:', this.activeBoard);
    console.log('카테고리 로드 완료 후 boardCategories:', this.boardCategories);
    
    await this.fetchPostList();
    console.log('게시글 목록 로드 완료');
    
    // 게시글 삭제 완료 메시지 확인 및 표시
    this.checkPostDeletedMessage();
  },
  methods: {
    async fetchCategories() {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('카테고리 조회 시작 - 토큰:', token ? '있음' : '없음');
        
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('API 응답 전체:', response);
        console.log('API 응답 데이터:', response.data);
        
        this.boardCategories = response.data;
        console.log('설정된 boardCategories:', this.boardCategories);
        
      } catch (error) {
        console.error("커뮤니티 카테고리 목록을 불러오는 데 실패했습니다.", error);
        // API 호출 실패 시 기본값으로 설정 - 객체 형태로 변경
        this.boardCategories = [
          { id: 1, category: '공지사항' },
          { id: 2, category: '자유게시판' },
          { id: 3, category: '꿀팁' },
          { id: 4, category: '레시피' }
        ];
        console.log('기본 카테고리로 설정됨:', this.boardCategories);
      }
    },
    async fetchPostList() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }

        let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/list?page=${this.currentPage - 1}&size=${this.pageSize}`;

        // 전체가 아닐 때만 카테고리 파라미터 추가
        if (this.activeBoard !== '전체') {
          url += `&category=${encodeURIComponent(this.activeBoard)}`;
          console.log('카테고리 필터 적용:', this.activeBoard);
          console.log('필터링된 URL:', url);
        }

        if (this.searchQuery) {
          url += `&keyword=${encodeURIComponent(this.searchQuery)}`;
        }

        if (this.sortBy !== 'latest') {
          url += `&sort=${this.sortBy}`;
        }

        console.log('최종 요청 URL:', url);
        const response = await axios.get(url);
        console.log('게시글 목록 조회 응답:', response.data);

        // 백엔드 응답 구조: { result: { content: [...], totalPages: ..., totalElements: ... } }
        this.postList = response.data.result?.content || [];
        this.totalPages = response.data.result?.totalPages || 0;
        this.totalElements = response.data.result?.totalElements || 0;

      } catch (error) {
        console.error('게시글 목록 조회 실패:', error);
        this.postList = [];
      } finally {
        this.isLoading = false;
      }
    },

    openCreateModal() {
      this.isModalOpen = true;
    },

    async handleSave(postData) {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }

        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/create`, postData);

        console.log('게시글 등록 성공:', response.data);

        await this.fetchPostList();
        this.isModalOpen = false;
        this.showSnackbar('게시글이 등록되었습니다.', 'success');
      } catch (error) {
        console.error('게시글 등록 실패:', error);
        this.showSnackbar('게시글 등록에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    viewPost(post) {
      console.log('=== viewPost 메서드 호출 ===');
      console.log('클릭된 게시글:', post);
      const fridgeId = getFridgeId(this.$store);
      console.log('현재 fridgeId:', fridgeId);
      console.log('게시글 ID:', post.id);
      
      if (!fridgeId) {
        console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
        alert('냉장고 정보를 찾을 수 없습니다.');
        return;
      }
      
      const targetUrl = `/fridge/post/${post.id}`;
      console.log('이동할 URL:', targetUrl);
      
      try {
        this.$router.push(targetUrl);
        console.log('라우터 이동 성공');
      } catch (error) {
        console.error('라우터 이동 실패:', error);
      }
    },



    onBoardChange(newValue) {
      console.log('=== 카테고리 변경 이벤트 발생 ===');
      console.log('이전 값:', this.activeBoard);
      console.log('새로운 값:', newValue);
      console.log('현재 activeBoard:', this.activeBoard);
      console.log('사용 가능한 카테고리들:', this.boardCategories);
      
      // 값이 실제로 변경되었는지 확인
      if (newValue !== this.activeBoard) {
        console.log('값이 변경되었습니다. activeBoard를 업데이트합니다.');
        this.activeBoard = newValue;
      }
      
      this.resetPagination();
      this.fetchPostList();
    },

    onSearchInput() {
      this.resetPagination();
      this.fetchPostList();
    },

    onSortChange() {
      this.resetPagination();
      this.fetchPostList();
    },

    onPageChange() {
      this.fetchPostList();
    },

    resetPagination() {
      this.currentPage = 1;
    },

    showSnackbar(message, color) {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    },
    
    // 게시글 삭제 완료 메시지 확인 및 표시
    checkPostDeletedMessage() {
      const postDeleted = localStorage.getItem('postDeleted');
      if (postDeleted === 'true') {
        this.showSnackbar('게시글이 삭제되었습니다.', 'error');
        localStorage.removeItem('postDeleted'); // 메시지 표시 후 제거
      }
    }
  }
}
</script>

<style scoped>
.community-container {
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.community-container::before {
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
  align-items: center;
}

.write-post-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.write-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.main-content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.board-tabs-header {
  padding: 20px 24px 0;
  background: transparent;
  border-bottom: none;
  margin-bottom: 0;
}

.board-tabs {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

.board-tab {
  font-weight: 500;
  color: #666;
  text-transform: none;
  font-size: 14px;
  padding: 12px 16px;
  border-radius: 0;
  margin: 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.board-tab:hover {
  background-color: transparent;
  color: #333;
}

.board-tab.v-tab--active {
  background-color: transparent;
  color: #1976d2;
  font-weight: 600;
  border-bottom: 2px solid #1976d2;
}

.search-section {
  padding: 20px 24px 0;
}

.search-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.search-item {
  flex: 1;
}

.search-field,
.sort-select {
  width: 100%;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-item:hover {
  border-color: #1976d2;
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.95);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  margin-right: 16px;
}

.post-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.post-author {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.post-category {
  font-size: 12px;
  color: #1976d2;
  font-weight: 500;
  background: rgba(25, 118, 210, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
}

.post-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.no-data-container {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.no-data-title {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}

.no-data-subtitle {
  margin-bottom: 24px;
  font-size: 16px;
  color: #666;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
}

.loading-text {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.pagination-controls {
  margin: 0;
}

.page-info {
  position: absolute;
  right: 24px;
  font-size: 14px;
  color: #666;
}

.page-text {
  font-weight: 500;
}

@media (max-width: 960px) {
  .community-container {
    padding: 24px;
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
}

@media (max-width: 600px) {
  .community-container {
    padding: 16px;
  }

  .page-header {
    padding: 16px;
  }

  .search-row {
    flex-direction: column;
    gap: 16px;
  }

  .post-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .post-meta {
    align-items: flex-start;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
    padding: 20px 16px;
  }

  .page-info {
    position: static;
    right: auto;
    margin-top: 8px;
  }
}
</style>