<template>
  <v-dialog v-model="show" max-width="400" persistent>
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ title }}
      </v-card-title>
      <v-card-text class="text-body-1">
        {{ message }}
      </v-card-text>
      <v-card-actions class="d-flex justify-center">
        <v-btn 
          variant="outlined" 
          @click="$emit('cancel')"
          class="mr-4"
        >
          취소
        </v-btn>
        <v-btn 
          color="error" 
          @click="$emit('confirm')"
          variant="elevated"
        >
          삭제
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DeleteConfirmDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '삭제 확인'
    },
    message: {
      type: String,
      required: true
    }
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel']
}
</script>

<style scoped>
.v-card-title {
  color: #d32f2f;
  border-bottom: 1px solid #ffebee;
  padding-bottom: 16px;
}

.v-card-text {
  padding: 20px 0;
  color: #424242;
  line-height: 1.6;
}

.v-card-actions {
  padding: 16px 0;
}
</style>
