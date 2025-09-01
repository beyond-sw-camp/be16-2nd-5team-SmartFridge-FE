<template>
  <div class="shared-food-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">전체식품 목록</h1>
        </div>
        <div class="header-actions">
          <!-- Shared/NonShared 토글 버튼 -->
          <div class="toggle-button-container">
            <v-btn
              :color="isSharedView ? 'info' : 'grey'"
              :variant="isSharedView ? 'elevated' : 'outlined'"
              size="large"
              class="toggle-button"
              @click="onToggleChange"
              :class="{ 'active': isSharedView }"
            >
              <v-icon 
                :icon="isSharedView ? 'mdi-share-variant' : 'mdi-account'"
                class="mr-2"
              ></v-icon>
              {{ isSharedView ? '공유식품' : '개인식품' }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <v-card class="main-content-card">
      <!-- 필터 탭 -->
      <v-card-title class="filter-header">
        <div class="filter-tab-container">
          <v-tabs v-model="activeTab" class="filter-tabs" color="primary" density="compact" @change="onTabChange">
            <v-tab value="ALL" class="filter-tab">
              전체보기
            </v-tab>
            <v-tab value="EXPIRES_IN_THREE_DAYS" class="filter-tab">
              3일전
            </v-tab>
            <v-tab value="EXPIRES_TODAY" class="filter-tab">
              당일
            </v-tab>
            <v-tab value="EXPIRED" class="filter-tab">
              지남
            </v-tab>
            <v-tab value="TEMP_ONLY" class="filter-tab">
              임시보관
            </v-tab>
            <v-tab v-if="isManager" value="MY_FOODS" class="filter-tab">
              내 식품목록
            </v-tab>
          </v-tabs>
          
          <!-- 식품 등록 버튼 -->
          <div class="add-food-container">
            <v-btn 
              @click="openCreateModal" 
              color="success" 
              prepend-icon="mdi-plus"
              size="large"
              class="add-food-btn"
            >
              식품 등록
            </v-btn>
          </div>
        </div>
      </v-card-title>

      <!-- 카테고리 및 검색 필터 -->
      <v-card-text class="filter-section">
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">카테고리별 보기</label>
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              item-title="title"
              item-value="value"
              placeholder="선택하세요"
              variant="outlined"
              density="compact"
              class="category-select"
              @update:model-value="onCategoryChange"
            ></v-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">식품검색</label>
            <v-text-field
              v-model="searchQuery"
              placeholder="식품명으로 검색"
              variant="outlined"
              density="compact"
              class="search-field"
              prepend-inner-icon="mdi-magnify"
              @input="onSearchInput"
            ></v-text-field>
          </div>
        </div>
      </v-card-text>
      
      <v-card-text>
        <!-- 로딩 상태 표시 -->
        <div v-if="isLoading" class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="loading-text">데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터 테이블 -->
        <v-table v-else class="food-table">
          <thead>
            <tr>
              <th class="text-left">식품명</th>
              <th class="text-center">수량</th>
              <th class="text-left">등록자</th>
              <th class="text-left">등록일</th>
              <th class="text-left">유통기한</th>
              <th class="text-center">카테고리</th>
              <th class="text-center">위치</th>
              <th class="text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="food in foodList" :key="food.id" class="food-row" @click="openDetailModal(food)">
              <td class="food-name text-left">{{ food.name || '이름 없음' }}</td>
              <td class="quantity-cell text-center">{{ food.quantity || 0 }}</td>
              <td class="member-cell text-left">{{ food.registeredName || '알 수 없음' }}</td>
              <td class="date-cell text-left">{{ food.storageStartDate }}</td>
              <td class="expiration-cell text-left" :class="getExpirationClass(food.expirationDateTime)">
                {{ formatDate(food.expirationDateTime) }}
              </td>
              <td class="category-cell text-center">
                <v-chip 
                  :color="getCategoryColor(food.category)" 
                  size="small"
                  variant="outlined"
                >
                  {{ food.category || '미설정' }}
                </v-chip>
              </td>
              <td class="storage-cell text-center">
                <v-chip 
                  :color="getStorageColor(food.storageType)" 
                  size="small"
                  variant="outlined"
                >
                  {{ food.storageType || '미설정' }}
                </v-chip>
              </td>
              <td class="actions-cell text-center" @click.stop>
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="openEditModal(food)"
                  class="edit-btn"
                >
                  수정
                </v-btn>
                <v-btn
                  color="error"
                  size="small"
                  variant="text"
                  @click="deleteFood(food)"
                  class="delete-btn"
                >
                  삭제
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- 데이터가 없을 때 표시 -->
        <div v-if="!isLoading && (!foodList || foodList.length === 0)" class="no-data-container">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-food-off</v-icon>
          <h3 class="no-data-title">등록된 {{ isSharedView ? '공유' : '개인' }} 식품이 없습니다</h3>
          <p class="no-data-subtitle">새로운 식품을 등록하여 {{ isSharedView ? '멤버들과 공유' : '개인적으로 관리' }}해보세요</p>
          <v-btn 
            color="success" 
            @click="openCreateModal"
            prepend-icon="mdi-plus"
            class="mt-4"
          >
            첫 식품 등록하기
          </v-btn>
        </div>

        <!-- 페이징 컴포넌트 -->
        <div v-if="!isLoading && foodList && foodList.length > 0" class="pagination-container">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="onPageChange"
            color="primary"
            class="pagination-controls"
          ></v-pagination>
          
          <!-- 페이지 정보 표시 -->
          <div class="page-info">
            <span class="page-text">
              {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalElements) }} / 총 {{ totalElements }}개
            </span>
            
            <!-- 페이지 크기 선택 -->
            <div class="page-size-selector">
              <v-select
                v-model="pageSize"
                :items="pageSizeOptions"
                variant="outlined"
                density="compact"
                class="page-size-select"
                @update:model-value="onPageSizeChange"
                hide-details
              ></v-select>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 식품 등록/수정 모달 -->
    <FoodFormModal 
      v-model="isModalOpen" 
      :editing-food="selectedFood"
      :read-only="isReadOnly"
      @save="handleSave"
    />

    <!-- 삭제 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="deleteDialog"
      title="식품 삭제 확인"
      :message="`정말로 '${selectedFood.name || ''}' 식품을 삭제하시겠습니까?`"
      @confirm="confirmDelete"
      @cancel="deleteDialog = false"
    />

    <!-- CommonSnackbar 컴포넌트 추가 -->
    <CommonSnackbar ref="snackbar" />
  </div>
</template>

<script>
import axios from 'axios';
import FoodFormModal from '../components/Food/FoodFormModal.vue';
import CommonSnackbar from '../components/common/CommonSnackbar.vue';
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog.vue';
import { getFridgeId } from '@/utils/commonDataHandler';

export default {
  components: {
    FoodFormModal,
    CommonSnackbar,
    DeleteConfirmDialog
  },
  data() {
    return {
      foodList: [],
      isModalOpen: false,
      selectedFood: {},
      isReadOnly: false,
      deleteDialog: false,
      isLoading: false,
      activeTab: 'ALL', // 필터 탭 상태
      selectedCategory: 'ALL', // 카테고리 필터 상태
      searchQuery: '', // 검색어 상태
      categoryOptions: [],
      currentPage: 1, // 현재 페이지
      pageSize: 10, // 페이지당 항목 수
      totalPages: 0, // 전체 페이지 수
      totalElements: 0, // 전체 데이터 수
      pageSizeOptions: [
        { title: '10개', value: 10 },
        { title: '20개', value: 20 },
        { title: '50개', value: 50 },
        { title: '100개', value: 100 },
      ],
      isSharedView: true, // 공유/개인 토글 상태
      fridgeInfo: {}, // 냉장고 정보
    }
  },
  async created() {
    // URL 쿼리 파라미터 확인하여 개인식품 모드로 설정
    if (this.$route.query.mode === 'nonshared') {
      this.isSharedView = false;
    }
    
    // 냉장고 정보 가져오기
    await this.fetchFridgeInfo();
    
    await this.fetchEnums();
    await this.fetchFoodList();
  },
  computed: {
    isManager() {
      return this.fridgeInfo.type === 'MANAGER';
    }
  },
  watch: {
    activeTab() {
      this.fetchFoodList();
    }
  },
  methods: {
    async fetchEnums() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/enums`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 백엔드에서 가져온 카테고리에 '전체' 옵션 추가
        this.categoryOptions = [
          { title: 'ALL', value: 'ALL' },
          ...response.data.categories
        ];
      } catch (error) {
        console.error("카테고리 목록을 불러오는 데 실패했습니다.", error);
      }
    },
    async fetchFoodList() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.$router.push('/fridge/list');
          return;
        }

        let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/list?isShared=${this.isSharedView}&page=${this.currentPage - 1}&size=${this.pageSize}`;
        
        // viewAll 파라미터 추가 (전체식품: true, 내 식품목록: false)
        const viewAll = this.activeTab === 'MY_FOODS' ? false : true;
        url += `&viewAll=${viewAll}`;

        // 카테고리 필터 추가
        if (this.selectedCategory !== 'ALL') {
          url += `&category=${this.selectedCategory}`;
        }

        // 검색 필터 추가
        if (this.searchQuery) {
          url += `&foodName=${this.searchQuery}`;
        }

        const response = await axios.get(url);
        this.foodList = response.data.result.content || [];
        this.totalPages = response.data.result.totalPages;
        this.totalElements = response.data.result.totalElements;
      } catch (error) {
        console.error('식품 목록 조회 실패:', error);
        this.foodList = [];
      } finally {
        this.isLoading = false;
      }
    },
    openCreateModal() {
      this.selectedFood = {
        name: '',
        quantity: 0,
        storageStartDate: '',
        expirationDateTime: '',
        storageType: '',
        category: '',
        shareable: true
      };
      this.isReadOnly = false;
      this.isModalOpen = true;
    },
    openEditModal(food) {
      this.selectedFood = { ...food };
      this.isReadOnly = false;
      this.isModalOpen = true;
    },
    openDetailModal(food) {
      this.selectedFood = { ...food };
      this.isReadOnly = true;
      this.isModalOpen = true;
    },
    async handleSave(foodData) {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) { 
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.'); 
          return; 
        }
        let response;
        if (foodData.id) {
          response = await axios.put(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/update/${foodData.id}`, foodData);
          console.log('식품 수정 성공:', response.data);
          this.$refs.snackbar.showSuccess('식품이 성공적으로 수정되었습니다.');
        } else {
          response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/register`, foodData);
          console.log('식품 등록 성공:', response.data);
          this.$refs.snackbar.showSuccess('식품이 성공적으로 등록되었습니다.');
        }
        await this.fetchFoodList();
      } catch (error) {
        console.error('식품 저장 실패:', error);
        this.$refs.snackbar.showError('식품 저장에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    },
    async deleteFood(food) {
      this.selectedFood = food;
      this.deleteDialog = true;
    },
    async confirmDelete() {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) { 
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.'); 
          return; 
        }
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/delete/${this.selectedFood.id}`);
        this.deleteDialog = false;
        this.selectedFood = {};
        await this.fetchFoodList();
        this.showSnackbar('식품이 삭제되었습니다.', 'error');
      } catch (error) {
        console.error('식품 삭제 실패:', error);
        this.$refs.snackbar.showError('식품 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    getExpirationClass(dateString) {
      if (!dateString) return '';
      const expirationDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expirationDate < today) {
        return 'expired';
      } else if (expirationDate.getTime() - today.getTime() < 3 * 24 * 60 * 60 * 1000) {
        return 'expiring-soon';
      } else {
        return '';
      }
    },
    getStorageColor(storageType) {
      if (storageType === '냉장') return 'info';
      if (storageType === '냉동') return 'error';
      if (storageType === '실온') return 'success';
      return 'grey';
    },
    getCategoryColor(category) {
      if (category === '과일') return 'primary';
      if (category === '채소') return 'success';
      if (category === '육류') return 'error';
      if (category === '해산물') return 'info';
      if (category === '곡류') return 'warning';
      if (category === '유제품') return 'purple';
      if (category === '음료') return 'blue';
      return 'grey';
    },
    onCategoryChange() {
      this.resetPagination();
      this.fetchFoodList();
    },
    onSearchInput() {
      this.resetPagination();
      this.fetchFoodList();
    },
    onTabChange() {
      this.resetPagination();
      this.fetchFoodList();
    },
    onPageChange() {
      this.fetchFoodList();
    },
    onPageSizeChange() {
      this.resetPagination();
      this.fetchFoodList();
    },
    onToggleChange() {
      this.isSharedView = !this.isSharedView;
      
      // URL 쿼리 파라미터 업데이트
      const query = { ...this.$route.query };
      if (this.isSharedView) {
        delete query.mode;
      } else {
        query.mode = 'nonshared';
      }
      
      // URL 업데이트 (브라우저 히스토리에 추가하지 않음)
      this.$router.replace({ query });
      
      this.resetPagination();
      this.fetchFoodList();
    },
    // 페이징 초기화
    resetPagination() {
      this.currentPage = 1;
    },
    // 냉장고 정보 가져오기
    async fetchFridgeInfo() {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/detail`);
        if (response.data.result) {
          this.fridgeInfo = response.data.result;
          console.log('냉장고 정보 로딩 완료:', this.fridgeInfo);
        }
      } catch (error) {
        console.error('냉장고 정보 로딩 실패:', error);
      }
    },
    
    // Snackbar 메시지 표시
    showSnackbar(message, color) {
      this.$refs.snackbar.showSnackbar(message, color);
    }
  }
}
</script>

<style scoped>
.shared-food-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

.page-header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-button-container {
  display: flex;
  align-items: center;
}

.toggle-button {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 20px;
  min-width: 140px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toggle-button.active {
  background: linear-gradient(135deg, #64b5f6 0%, #90caf9 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(100, 181, 246, 0.4);
}

.toggle-button:not(.active) {
  background: linear-gradient(135deg, #f5f1e8 0%, #e6d7c3 100%);
  color: #8b7355;
  border: 2px solid #d4c4a8;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.15);
}

.toggle-button:not(.active):hover {
  background: linear-gradient(135deg, #f8f4ec 0%, #e8d9c6 100%);
  border-color: #c4b498;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.25);
  transform: translateY(-1px);
}

.toggle-button .v-icon {
  transition: all 0.3s ease;
}

.toggle-button.active .v-icon {
  color: white;
  transform: scale(1.1);
}

.toggle-button:not(.active) .v-icon {
  color: #666;
}

.add-food-container {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.add-food-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-header {
  padding: 20px 24px 0;
  background: white;
  border-bottom: none;
  margin-bottom: 0;
}

.filter-tab-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.filter-tabs {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
  flex: 1;
}

.filter-tab {
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

.filter-tab:hover {
  background-color: transparent;
  color: #333;
}

.filter-tab.v-tab--active {
  background-color: transparent;
  color: #1976d2;
  font-weight: 600;
  border-bottom: 2px solid #1976d2;
}

.filter-tab.v-tab--active .v-icon {
  color: #1976d2;
}

.page-size-selector {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.page-size-select {
  min-width: 100px;
  max-width: 120px;
}

.page-size-select .v-field {
  font-size: 14px;
  padding: 8px 12px;
}

.filter-section {
  padding: 20px 24px 0;
}

.filter-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.filter-item {
  flex: 1;
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}

.category-select, .search-field, .page-size-select {
  width: 100%;
}

.food-table {
  width: 100%;
  border-collapse: collapse;
}

.food-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.food-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.food-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.food-row:hover {
  background-color: #f0f8ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.food-name {
  font-weight: 500;
  color: #333;
}

.quantity-cell {
  font-weight: 500;
  color: #333;
  text-align: center;
}

.member-cell, .date-cell, .expiration-cell {
  color: #666;
}

.expiration-cell.expired {
  color: #f44336;
  font-weight: 500;
}

.expiration-cell.expiring-soon {
  color: #ff9800;
  font-weight: 500;
}

.storage-cell, .category-cell {
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.edit-btn {
  border-radius: 6px;
  font-weight: 500;
  margin-right: 8px; /* Add some space between edit and delete buttons */
}

.delete-btn {
  border-radius: 6px;
  font-weight: 500;
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

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.pagination-controls {
  margin: 0;
}

.page-info {
  position: absolute;
  right: 24px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-text {
  white-space: nowrap;
}

.page-size-selector {
  display: flex;
  align-items: center;
}

.page-size-select {
  min-width: 100px;
  max-width: 120px;
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

@media (max-width: 600px) {
  .shared-food-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
    margin-top: 16px;
  }

  .toggle-button-container {
    width: 100%;
    justify-content: center;
  }

  .toggle-button {
    width: 100%;
    max-width: 200px;
    font-size: 13px;
    padding: 10px 16px;
    min-width: auto;
  }

  .filter-tab-container {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-size-selector {
    margin-left: 0;
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
    gap: 16px;
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
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .page-size-selector {
    margin-top: 8px;
  }
}
</style>