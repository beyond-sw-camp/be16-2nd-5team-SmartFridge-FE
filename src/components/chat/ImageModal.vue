<template>
  <v-dialog v-model="isVisible" max-width="90vw" max-height="90vh" @update:model-value="handleVisibilityChange">
    <v-card class="image-modal-card">
      <v-card-title class="d-flex justify-space-between align-center pa-3">
        <span class="text-h6">이미지 {{ currentImageIndex + 1 }} / {{ images.length }}</span>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" />
      </v-card-title>
      
      <v-card-text class="pa-0 d-flex align-center justify-center">
        <div class="image-viewer-container">
          <!-- 이전 버튼 -->
          <v-btn
            v-if="images.length > 1 && currentImageIndex > 0"
            icon="mdi-chevron-left"
            class="nav-btn left-btn"
            size="large"
            color="grey"
            @click="previousImage"
          />
          
          <!-- 이미지 -->
          <img
            v-if="images[currentImageIndex]"
            :src="images[currentImageIndex]"
            alt="확대 이미지"
            class="modal-image"
          />
          
          <!-- 다음 버튼 -->
          <v-btn
            v-if="images.length > 1 && currentImageIndex < images.length - 1"
            icon="mdi-chevron-right"
            class="nav-btn right-btn"
            size="large"
            color="grey"
            @click="nextImage"
          />
        </div>
      </v-card-text>
      
      <!-- 이미지 인디케이터 -->
      <v-card-actions v-if="images.length > 1" class="justify-center pa-3">
        <div class="image-indicators">
          <v-btn
            v-for="(_, index) in images"
            :key="index"
            :class="['indicator-dot', { active: index === currentImageIndex }]"
            size="x-small"
            variant="text"
            @click="currentImageIndex = index"
          />
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 }
});

const emit = defineEmits(['update:modelValue']);

const isVisible = ref(props.modelValue);
const currentImageIndex = ref(props.startIndex);

// props 변화 감지
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue;
  if (newValue) {
    currentImageIndex.value = props.startIndex;
  }
});

watch(() => props.startIndex, (newIndex) => {
  currentImageIndex.value = newIndex;
});

const handleVisibilityChange = (value) => {
  emit('update:modelValue', value);
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
};

const nextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    currentImageIndex.value++;
  }
};
</script>

<style scoped>
/* 이미지 모달 스타일 */
.image-modal-card {
  background: #000;
  color: white;
}

.image-viewer-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  max-height: 70vh;
  width: 100%;
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(128, 128, 128, 0.8) !important;
  z-index: 10;
}

.nav-btn:hover {
  background: rgba(128, 128, 128, 1) !important;
}

.left-btn {
  left: 16px;
}

.right-btn {
  right: 16px;
}

/* 이미지 인디케이터 */
.image-indicators {
  display: flex;
  gap: 8px;
  align-items: center;
}

.indicator-dot {
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  padding: 0;
}

.indicator-dot.active {
  background: white;
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.8);
}
</style>
