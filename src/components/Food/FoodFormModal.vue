<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <v-card class="food-form-modal">
      <!-- 헤더 섹션 -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-icon">
            <v-icon size="32" color="primary">mdi-food-apple</v-icon>
          </div>
          <div class="header-text">
                      <h2 class="modal-title">{{ getModalTitle() }}</h2>
          <p class="modal-subtitle">{{ getModalSubtitle() }}</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" class="close-btn"></v-btn>
      </div>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <v-container fluid class="pa-0">
          <v-row>
            <!-- 식품명 -->
            <v-col cols="12">
              <div class="form-section">
                <label class="form-label">
                  <v-icon size="18" color="primary" class="mr-2">mdi-tag</v-icon>
                  식품명 *
                </label>
                <v-text-field
                  v-model="formData.name"
                  placeholder="식품명을 입력해주세요"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :rules="[v => !!v || '식품명을 입력해주세요']"
                  :disabled="readOnly"
                ></v-text-field>
              </div>
            </v-col>

                         <!-- 수량과 보관위치 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="success" class="mr-2">mdi-scale</v-icon>
                   수량 *
                 </label>
                 <div class="quantity-input">
                   <v-btn 
                     icon="mdi-minus" 
                     variant="outlined" 
                     size="small"
                     @click="decreaseQuantity"
                     :disabled="formData.quantity <= 1"
                     class="quantity-btn"
                   ></v-btn>
                   <v-text-field
                     v-model.number="formData.quantity"
                     type="number"
                     min="1"
                     variant="outlined"
                     density="comfortable"
                     hide-details="auto"
                     class="quantity-field"
                     :rules="[v => v > 0 || '수량은 1개 이상이어야 합니다']"
                     :disabled="readOnly"
                   ></v-text-field>
                   <v-btn 
                     icon="mdi-plus" 
                     variant="outlined" 
                     size="small"
                     @click="increaseQuantity"
                     class="quantity-btn"
                   ></v-btn>
                 </div>
               </div>
             </v-col>

             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="info" class="mr-2">mdi-fridge</v-icon>
                   보관위치
                 </label>
                 <v-select
                   :items="storageTypes"
                   v-model="formData.storageType"
                   placeholder="보관위치를 선택해주세요"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   item-title="name"
                   item-value="value"
                   :disabled="readOnly"
                 ></v-select>
               </div>
             </v-col>

             <!-- 유통기한 날짜와 시간 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="warning" class="mr-2">mdi-calendar</v-icon>
                   유통기한 날짜 *
                 </label>
                 <v-text-field
                   v-model="formData.expirationDate"
                   type="date"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   placeholder="날짜를 선택하세요"
                   :disabled="readOnly"
                 ></v-text-field>
               </div>
             </v-col>

             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="warning" class="mr-2">mdi-clock</v-icon>
                   유통기한 시간 (선택사항)
                 </label>
                 <v-text-field
                   v-model="formData.expirationTime"
                   type="time"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   placeholder="시간을 선택하세요 (선택하지 않으면 23:59로 설정됩니다)"
                   :disabled="readOnly"
                 ></v-text-field>
               </div>
             </v-col>

             <!-- 카테고리 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="purple" class="mr-2">mdi-shape</v-icon>
                   카테고리
                 </label>
                 <v-select
                   :items="categories"
                   v-model="formData.category"
                   placeholder="카테고리를 선택해주세요"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   item-title="name"
                   item-value="value"
                   :disabled="readOnly"
                 ></v-select>
               </div>
             </v-col>

            <!-- 메모 -->
            <v-col cols="12">
              <div class="form-section">
                <label class="form-label">
                  <v-icon size="18" color="grey" class="mr-2">mdi-note-text</v-icon>
                  메모
                </label>
                <v-textarea
                  v-model="formData.memo"
                  placeholder="식품에 대한 메모를 입력해주세요"
                  rows="3"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :disabled="readOnly"
                ></v-textarea>
              </div>
            </v-col>

            <!-- 공유 설정 -->
            <v-col cols="12">
              <div class="share-section">
                <v-checkbox
                  v-model="formData.shareable"
                  label="다른 멤버와 공유"
                  color="primary"
                  hide-details="auto"
                  class="share-checkbox"
                  :disabled="readOnly"
                >
                  <template v-slot:label>
                    <div class="checkbox-label">
                      <v-icon size="20" color="primary" class="mr-2">mdi-share-variant</v-icon>
                      <span>다른 멤버와 공유</span>
                      <span class="checkbox-description">체크하면 냉장고 멤버들과 식품 정보를 공유합니다</span>
                    </div>
                  </template>
                </v-checkbox>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- 액션 버튼 -->
      <v-divider></v-divider>
      
      <v-card-actions class="pa-6">
        <div class="action-buttons">
          <v-btn 
            v-if="!readOnly"
            variant="outlined" 
            color="grey-darken-1" 
            @click="save(true)"
            class="action-btn temp-btn"
            prepend-icon="mdi-clock-outline"
          >
            임시 등록
          </v-btn>
          
          <div class="right-buttons">
            <v-btn 
              variant="outlined" 
              @click="closeModal"
              class="action-btn cancel-btn"
            >
              {{ readOnly ? '닫기' : '취소' }}
            </v-btn>
            <v-btn 
              v-if="!readOnly"
              color="primary" 
              @click="save(false)"
              class="action-btn save-btn"
              :loading="isLoading"
              prepend-icon="mdi-check"
            >
              {{ isEditMode ? '수정 완료' : '등록 완료' }}
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- CommonSnackbar 컴포넌트 추가 -->
  <CommonSnackbar ref="snackbar" />
</template>

<script>
import axios from 'axios';
import CommonSnackbar from '../common/CommonSnackbar.vue';

export default {
  components: {
    CommonSnackbar
  },
  props: {
    modelValue: Boolean,
    editingFood: {
      type: Object,
      default: () => ({})
    },
    readOnly: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      formData: {
        name: '',
        quantity: 1,
        expirationDate: '',
        expirationTime: '',
        storageType: null,
        category: null,
        memo: '',
        shareable: false
      },
      storageTypes: [],
      categories: [],
      isLoading: false
    }
  },
  created() {
    this.fetchEnums();
  },
  computed: {
    isEditMode() {
      return this.editingFood && this.editingFood.id;
    },
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  watch: {
    editingFood: {
      handler(newFoodData) {
        const defaultFormData = this.$options.data().formData;
        this.formData = {
          ...defaultFormData,
          ...newFoodData
        };

        // expirationDateTime을 expirationDate와 expirationTime으로 분리
        if (newFoodData.expirationDateTime) {
          const dateTime = new Date(newFoodData.expirationDateTime);
          this.formData.expirationDate = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
          this.formData.expirationTime = dateTime.toTimeString().slice(0, 5); // HH:MM
        }

        // shareable이 명시적으로 설정되지 않은 경우에만 기본값 설정
        if (this.formData.shareable === undefined) {
          this.formData.shareable = false;
        }
        // null이나 false는 그대로 유지 (SharedFood에서 true로 설정한 경우 보존)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    getModalTitle() {
      if (this.readOnly) {
        return '식품 상세 정보';
      }
      return this.isEditMode ? '식품 수정' : '새로운 식품 등록';
    },
    getModalSubtitle() {
      if (this.readOnly) {
        return '등록된 식품의 자세한 정보를 확인할 수 있습니다';
      }
      return this.isEditMode ? '식품 정보를 수정해주세요' : '냉장고에 새로운 식품을 추가해주세요';
    },
    async fetchEnums() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/enums`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.categories = response.data.categories;
        this.storageTypes = response.data.storageTypes;
      } catch (error) {
        console.error("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.", error);
        this.$refs.snackbar.showError("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.");
      }
    },
    increaseQuantity() {
      this.formData.quantity++;
    },
    decreaseQuantity() {
      if (this.formData.quantity > 1) {
        this.formData.quantity--;
      }
    },
    async save(isTemp) {
      if (!this.formData.name.trim()) {
        this.$refs.snackbar.showWarning("식품명을 입력해주세요.");
        return;
      }
      
      this.isLoading = true;
      
      try {
        let expirationHour = null;
        let expirationMinute = null;
        
        if (this.formData.expirationTime) {
          const [hour, minute] = this.formData.expirationTime.split(':');
          expirationHour = parseInt(hour);
          expirationMinute = parseInt(minute);
        }
        
        const saveData = { 
          ...this.formData, 
          expirationHour: expirationHour,
          expirationMinute: expirationMinute,
          isTemp: isTemp 
        };
        
        delete saveData.expirationTime;
        
        // 성공 메시지 표시
        if (isTemp) {
          this.$refs.snackbar.showInfo("식품이 임시로 등록되었습니다.");
        } else if (this.isEditMode) {
          this.$refs.snackbar.showSuccess("식품 정보가 성공적으로 수정되었습니다.");
        } else {
          this.$refs.snackbar.showSuccess("식품이 성공적으로 등록되었습니다.");
        }
        
        this.$emit('save', saveData);
        this.closeModal();
      } catch (error) {
        console.error("식품 저장 중 오류가 발생했습니다:", error);
        this.$refs.snackbar.showError("식품 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        this.isLoading = false;
      }
    },
    closeModal() {
      this.dialog = false;
    }
  }
}
</script>

<style scoped>
.food-form-modal {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.close-btn {
  color: white;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.custom-input {
  border-radius: 12px;
}

.quantity-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-btn {
  border-radius: 8px;
  min-width: 40px;
}

.quantity-field {
  flex: 1;
  border-radius: 12px;
}

.share-section {
  background: rgba(102, 126, 234, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.share-checkbox {
  margin: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-description {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  margin-left: 28px;
  opacity: 0.8;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.right-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  height: auto;
  min-height: 44px;
}

.temp-btn {
  border: 2px solid #666;
  color: #666;
}

.cancel-btn {
  border: 2px solid #ddd;
  color: #666;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  color: white !important;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .modal-header {
    padding: 20px 24px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 16px;
  }
  
  .right-buttons {
    width: 100%;
    justify-content: stretch;
  }
  
  .action-btn {
    flex: 1;
  }
}
</style>