<template>
  <div class="fridge-dashboard">
    <DashboardHeader :fridgeId="currentFridgeId" />
    <DashboardStats :fridgeId="currentFridgeId" />
    <FoodPreviewTable :fridgeId="currentFridgeId" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import DashboardHeader from '@/components/FridgeDashboard/DashboardHeader.vue'
import DashboardStats from '@/components/FridgeDashboard/DashboardStats.vue'
import FoodPreviewTable from '@/components/FridgeDashboard/FoodPreviewTable.vue'

// Vuex store 사용
const store = useStore()

// 현재 선택된 냉장고 ID를 Vuex store에서 가져오기
const currentFridgeId = computed(() => store.getters.getCurrentFridgeId)

// 컴포넌트 마운트 시 냉장고 ID 확인
onMounted(() => {
  console.log('현재 선택된 냉장고 ID:', currentFridgeId.value)
  
  // 냉장고 ID가 없으면 처리
  if (!currentFridgeId.value) {
    console.warn('선택된 냉장고가 없습니다.')
    // 필요시 다른 페이지로 리다이렉트하거나 처리
  }
})
</script>

<style scoped>
.fridge-dashboard {
  padding: 32px;
  margin-left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.fridge-dashboard::before {
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

@media (max-width: 600px) {
  .fridge-dashboard {
    padding: 16px;
    margin-left: 8px;
  }
}
</style>