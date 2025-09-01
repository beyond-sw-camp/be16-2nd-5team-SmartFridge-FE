<template>
  <div class="tables-section">
    <v-row>
      <!-- 최근 등록한 식품 -->
      <v-col cols="12" lg="6">
        <v-card class="food-table-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>최근 등록한 개인식품</span>
            <div class="table-actions">
              <v-btn color="success" prepend-icon="mdi-plus" size="small" @click="openFoodModal(false)">
                식품 등록
              </v-btn>
              <v-btn color="purple" size="small" class="ml-2" @click="goToNonsharedFoodList">
                전체 보기
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>식품명</th>
                  <th>등록자</th>
                  <th>수량</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registeredName }}</td>
                  <td>{{ food.quantity }}</td>
                  <td>{{ formatDate(food.expirationDateTime) }}</td>
                  <td>{{ food.storageType }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 최근 등록한 공유식품 -->
      <v-col cols="12" lg="6">
        <v-card class="food-table-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>최근 등록한 공유식품</span>
            <div class="table-actions">
              <v-btn color="success" prepend-icon="mdi-plus" size="small" @click="openFoodModal(true)">
                식품 등록
              </v-btn>
              <v-btn color="purple" size="small" class="ml-2" @click="goToSharedFoodList">
                전체 보기
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>식품명</th>
                  <th>등록자</th>
                  <th>수량</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentSharedFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registeredName }}</td>
                  <td>{{ food.quantity }}</td>
                  <td>{{ formatDate(food.expirationDateTime) }}</td>
                  <td>{{ food.storageType }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FoodFormModal -->
    <FoodFormModal 
      v-model="isFoodModalOpen" 
      :editing-food="selectedFood"
      @save="handleFoodSave" 
    />

    <!-- CommonSnackbar 컴포넌트 추가 -->
    <CommonSnackbar ref="snackbar" />
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import router from '@/router';
import FoodFormModal from '@/components/Food/FoodFormModal.vue';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';

// Props 정의
const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  }
});

const recentFoods = ref([])
const recentSharedFoods = ref([])

// 모달 관련 상태
const isFoodModalOpen = ref(false);
const selectedFood = ref({});

// snackbar ref
const snackbar = ref(null);

// 유통기한을 깔끔하게 포맷팅하는 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 식품 등록 모달 열기 (방법 2: 부모 컴포넌트에서 editingFood prop으로 초기화)
const openFoodModal = (isShared) => {
  // SharedFood와 동일한 방식으로 빈 값으로 초기화
  selectedFood.value = {
    name: '',
    quantity: 1,
    storageStartDate: '',
    expirationDateTime: '',
    storageType: '',
    category: '',
    shareable: isShared
  };
  isFoodModalOpen.value = true;
};

// 식품 저장 처리
const handleFoodSave = async (foodData) => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }
    
    // 식품 등록 API 호출
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/${props.fridgeId}/food/register`, foodData);
    
    // 성공 메시지
    console.log('식품이 성공적으로 등록되었습니다.');
    
    // 성공 snackbar 표시
    if (snackbar.value) {
      snackbar.value.showSuccess('식품이 성공적으로 등록되었습니다.');
    }
    
    // 목록 새로고침
    await refreshFoodLists();
    
    // 모달은 FoodFormModal 내부에서 자동으로 닫힘
    // 폼 데이터도 editingFood prop을 통해 자동으로 초기화됨
    
  } catch (error) {
    console.error('식품 등록에 실패했습니다:', error);
    // alert 대신 snackbar 사용
    if (error.response?.data?.message) {
      console.error('API 에러 메시지:', error.response.data.message);
    }
  }
};

// 식품 목록 새로고침
const refreshFoodLists = async () => {
  await Promise.all([
    fetchRecentFoods(),
    fetchRecentSharedFoods()
  ]);
};

const fetchRecentFoods = async () => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }
    
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${props.fridgeId}/food/list?isShared=false`);
    
    console.log('API 응답 데이터:', response.data.result.content);
    
    // ID 기준으로 역순 정렬 (ID가 클수록 최신)
    const sortedFoods = response.data.result.content.sort((a, b) => {
      return (b.id || 0) - (a.id || 0);
    });
    
    console.log('정렬된 결과:', sortedFoods);
    
    // 상위 5개 추출
    recentFoods.value = sortedFoods.slice(0, 5);
    console.log('최종 결과 (개인):', recentFoods.value);
  } catch (error) {
    console.error("최근 등록한 식품을 불러오는데 실패했습니다:", error);
  }
};

const fetchRecentSharedFoods = async () => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }
    
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${props.fridgeId}/food/list?isShared=true`);
    
    console.log('공유식품 API 응답 데이터:', response.data.result.content);
    
    // ID 기준으로 역순 정렬 (ID가 클수록 최신)
    const sortedFoods = response.data.result.content.sort((a, b) => {
      return (b.id || 0) - (a.id || 0);
    });
    
    console.log('공유식품 정렬된 결과:', sortedFoods);
    
    // 상위 5개 추출
    recentSharedFoods.value = sortedFoods.slice(0, 5);
    console.log('최종 결과 (공유):', recentSharedFoods.value);
  } catch (error) {
    console.error("최근 등록한 공유식품을 불러오는데 실패했습니다:", error);
  }
};

onMounted(() => {
  fetchRecentFoods();
  fetchRecentSharedFoods();
});

const goToSharedFoodList = () => {
  router.push(`/fridge/food/shared`);
}

const goToNonsharedFoodList = () => {
  // 전체식품 페이지로 이동하면서 개인식품 모드로 설정
  router.push({
    path: `/fridge/food/shared`,
    query: { mode: 'nonshared' }
  });
}



</script>

<style scoped>
.tables-section {
  margin-bottom: 32px;
}

.food-table-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.food-table-card .v-card-title {
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(233, 236, 239, 0.5);
  padding: 20px 24px;
  font-weight: 600;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.v-table {
  background: transparent;
}

.v-table thead th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 12px;
  border-bottom: 2px solid #dee2e6;
}

.v-table tbody td {
  padding: 16px 12px;
  color: #495057;
  font-size: 14px;
  border-bottom: 1px solid #e9ecef;
}

.v-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .table-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
