<template>
  <div class="stats-section">
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card total-food">
          <v-card-text class="text-center">
            <v-icon color="brown" size="36">mdi-package-variant</v-icon>
            <div class="stat-number">{{ foodStats.totalCount }}</div>
            <div class="stat-label">총 식품 수</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card fresh-food">
          <v-card-text class="text-center">
            <v-icon color="green" size="36">mdi-check-circle</v-icon>
            <div class="stat-number">{{ foodStats.freshCount }}</div>
            <div class="stat-label">신선한 식품</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card expiring-soon">
          <v-card-text class="text-center">
            <v-icon color="amber" size="36">mdi-alert</v-icon>
            <div class="stat-number">{{ foodStats.expiringSoonCount }}</div>
            <div class="stat-label">유통기한 임박</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card expired-food">
          <v-card-text class="text-center">
            <v-icon color="red" size="36">mdi-close-circle</v-icon>
            <div class="stat-number">{{ foodStats.expiredCount }}</div>
            <div class="stat-label">유통기한 초과</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';

// Props 정의
const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  }
});

const foodStats = ref({});

const fetchFoodStats = async () => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }
    
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${props.fridgeId}/food/stats`);
    foodStats.value = response.data.result;
  } catch (error) {
    console.error("식품통계를 불러오는데 실패했습니다:", error);
  }
};

onMounted(() => {
  fetchFoodStats();
});
</script>

<style scoped>
.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  height: 140px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.stat-card .v-card-text {
  padding: 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 12px 0 6px 0;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@media (max-width: 600px) {
  .stat-card {
    height: 140px;
  }
  
  .stat-number {
    font-size: 28px;
  }
}
</style>
