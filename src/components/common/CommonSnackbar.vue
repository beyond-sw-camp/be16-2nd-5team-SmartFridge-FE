<template>
  <v-snackbar 
    v-model="snackbar.show" 
    :timeout="snackbar.timeout" 
    :color="snackbar.color"
    :location="snackbar.location"
    :class="snackbar.class"
  >
    {{ snackbar.message }}
    <template v-slot:actions>
      <v-btn 
        color="white" 
        variant="text" 
        @click="snackbar.show = false"
      >
        닫기
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
export default {
  name: 'CommonSnackbar',
  data() {
    return {
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        timeout: 3000,
        location: 'bottom',
        class: ''
      }
    }
  },
  mounted() {
    // 커스텀 이벤트 리스너 등록
    window.addEventListener('show-snackbar', this.handleSnackbarEvent);
  },
  beforeUnmount() {
    // 이벤트 리스너 제거
    window.removeEventListener('show-snackbar', this.handleSnackbarEvent);
  },
  methods: {
    /**
     * 커스텀 이벤트 처리
     */
    handleSnackbarEvent(event) {
      const { message, color, timeout } = event.detail;
      this.showSnackbar(message, color, timeout);
    },
    /**
     * Snackbar를 표시하는 메서드
     * @param {string} message - 표시할 메시지
     * @param {string} color - 색상 (success, error, warning, info)
     * @param {number} timeout - 자동 닫힘 시간 (ms)
     * @param {string} location - 위치 (top, bottom)
     * @param {string} customClass - 추가 CSS 클래스
     */
    showSnackbar(message, color = 'success', timeout = 3000, location = 'bottom', customClass = '') {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.timeout = timeout;
      this.snackbar.location = location;
      this.snackbar.class = customClass;
      this.snackbar.show = true;
    },

    /**
     * 성공 메시지 표시
     */
    showSuccess(message, timeout = 3000) {
      this.showSnackbar(message, 'success', timeout);
    },

    /**
     * 에러 메시지 표시
     */
    showError(message, timeout = 4000) {
      this.showSnackbar(message, 'error', timeout);
    },

    /**
     * 경고 메시지 표시
     */
    showWarning(message, timeout = 3000) {
      this.showSnackbar(message, 'warning', timeout);
    },

    /**
     * 정보 메시지 표시
     */
    showInfo(message, timeout = 3000) {
      this.showSnackbar(message, 'info', timeout);
    },

    /**
     * Snackbar 숨기기
     */
    hideSnackbar() {
      this.snackbar.show = false;
    }
  }
}
</script>

<style scoped>
/* 커스텀 스타일이 필요한 경우 여기에 추가 */
</style>
