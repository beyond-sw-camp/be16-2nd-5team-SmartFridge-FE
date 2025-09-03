<template>
  <div class="mypage-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">마이페이지</h1>
          <p class="page-subtitle">내 정보를 관리하고 활동 내역을 확인하세요</p>
        </div>
      </div>
    </div>

    <div class="mypage-content">
      <!-- 첫 번째 행: 프로필과 활동 통계 -->
      <div class="profile-stats-row">
        <!-- 프로필 섹션 -->
        <v-card class="profile-card">
          <v-card-title class="profile-header">
            <v-icon class="mr-2">mdi-account-circle</v-icon>
            프로필 정보
          </v-card-title>
                    <v-card-text>
            <div class="profile-section">
              <!-- 프로필 이미지 -->
               <br>
              <div class="profile-image-section">
                <div class="profile-image-container">
                  <div v-if="!userInfo.profileImage" class="profile-avatar-bg">
                    <span class="profile-avatar-initial">{{ userInitial }}</span>
                  </div>
                  <v-img
                    v-else
                    :src="userInfo.profileImage"
                    alt="Profile Image"
                    class="profile-avatar-image"
                    width="120"
                    height="120"
                  />
                  <v-btn
                    @click="openImageUpload"
                    class="edit-image-btn"
                    icon
                    size="small"
                    color="primary"
                  >
                    <v-icon>mdi-camera</v-icon>
                  </v-btn>
                </div>
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleImageUpload"
                />
              </div>
              
              <!-- 프로필 정보 -->
              <div class="profile-info-section">
                <div class="info-row">
                  <label class="info-label">이름</label>
                  <div class="info-value-container">
                    <div v-if="!isEditingName" class="name-display-section">
                      <span class="info-value">{{ userInfo.name || '이름 없음' }}</span>
                      <v-btn
                        @click="toggleEditName"
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        class="edit-btn"
                      />
                    </div>
                    <div v-else class="name-edit-section">
                      <div class="edit-input-container">
                        <input
                          v-model="editedName"
                          type="text"
                          class="modern-input"
                          placeholder="이름을 입력하세요"
                          @keyup.enter="saveName"
                          @keyup.esc="cancelEditName"
                          ref="nameInput"
                        />
                        <div class="edit-actions">
                          <v-btn
                            @click="saveName"
                            icon="mdi-check"
                            size="small"
                            variant="text"
                            color="success"
                            class="save-btn"
                          />
                          <v-btn
                            @click="cancelEditName"
                            icon="mdi-close"
                            size="small"
                            variant="text"
                            color="error"
                            class="cancel-btn"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="info-row">
                  <label class="info-label">이메일</label>
                  <span class="info-value">{{ userInfo.email || '이메일 없음' }}</span>
                </div>
                
                <div class="info-row">
                  <label class="info-label">가입일</label>
                  <span class="info-value">{{ formatDate(userInfo.createdTime) }}</span>
                </div>
              </div>
            </div>
            
            <!-- 회원 탈퇴 버튼 -->
            <div class="profile-danger-zone">
              <v-divider class="mb-3"></v-divider>
              <div class="danger-zone-in-profile">
                <div class="danger-info">
                  <h4>회원 탈퇴</h4>
                  <p>계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                </div>
                <v-btn
                  @click="showDeleteAccountDialog = true"
                  color="error"
                  variant="elevated"
                  size="small"
                  class="delete-account-btn-inline"
                >
                  <v-icon left size="16">mdi-account-remove</v-icon>
                  탈퇴하기
                </v-btn>
              </div>
            </div>
          </v-card-text>
      </v-card>

        <!-- 활동 통계 섹션 -->
        <v-card class="stats-card">
          <v-card-title class="stats-header">
            <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
            활동 통계
          </v-card-title>
          <v-card-text class="stats-content">
            <div class="stats-grid">
                              <div class="stat-item stat-posts">
                  <div class="stat-icon-wrapper">
                    <v-icon class="stat-icon" color="black">mdi-post-outline</v-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ myStats.postCount }}</div>
                    <div class="stat-label">작성한 글</div>
                  </div>
                </div>
                <div class="stat-item stat-comments">
                  <div class="stat-icon-wrapper">
                    <v-icon class="stat-icon" color="black">mdi-comment-outline</v-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ myStats.commentCount }}</div>
                    <div class="stat-label">작성한 댓글</div>
                  </div>
                </div>
                <div class="stat-item stat-likes">
                  <div class="stat-icon-wrapper">
                    <v-icon class="stat-icon" color="black">mdi-heart-outline</v-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ myStats.likeCount }}</div>
                    <div class="stat-label">받은 좋아요</div>
                  </div>
                </div>
              </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 두 번째 행: 내가 작성한 글과 알림 설정 -->
      <div class="posts-settings-row">
        <!-- 내가 작성한 글 섹션 -->
        <v-card class="posts-card">
          <v-card-title class="posts-header">
            <v-icon class="mr-2">mdi-post-outline</v-icon>
            내가 작성한 글
            <v-spacer></v-spacer>
            <v-btn
              @click="fetchMyPosts"
              icon="mdi-refresh"
              size="small"
              variant="text"
              color="primary"
            />
          </v-card-title>
          <v-card-text>
            <div v-if="isLoadingPosts" class="loading-container">
              <v-progress-circular indeterminate color="primary" size="32" />
              <span class="loading-text">게시글을 불러오는 중...</span>
            </div>
            
            <div v-else-if="myPosts.length > 0" class="posts-list">
              <div
                v-for="post in myPosts"
                :key="post.id"
                class="post-item"
                @click="viewPost(post)"
              >
                <div class="post-content">
                  <div class="post-header">
                    <div class="post-left">
                      <div class="post-title">{{ post.title }}</div>
                      <span class="post-date">{{ post.timeAgo }}</span>
                    </div>
                    <div class="post-right">
                      <span class="post-category">{{ post.categoryName }}</span>
                      <span class="post-fridge" v-if="post.fridgeName">
                        <v-icon size="14">mdi-fridge</v-icon>
                        {{ post.fridgeName }}
                      </span>
                    </div>
                  </div>
                  <div class="post-stats">
                    <span class="stat">
                      <v-icon size="16">mdi-eye</v-icon>
                      {{ post.viewCount || 0 }}
                    </span>
                    <span class="stat">
                      <v-icon size="16">mdi-heart</v-icon>
                      {{ post.likeCount || 0 }}
                    </span>
                    <span class="stat">
                      <v-icon size="16">mdi-comment</v-icon>
                      {{ post.commentCount || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-posts">
              <v-icon size="48" color="grey-lighten-1">mdi-post-outline</v-icon>
              <p class="no-posts-text">작성한 게시글이 없습니다</p>
              <v-btn color="primary" @click="goToCommunity">
                첫 게시글 작성하기
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- 알림 설정 섹션 -->
        <v-card class="notification-settings-card">
          <v-card-title class="notification-header">
            <v-icon class="mr-2">mdi-bell-outline</v-icon>
            알림 설정
          </v-card-title>
          <v-card-text>
            <div class="notification-settings">
              <div class="setting-description">
                <p class="setting-desc-text">원하는 알림을 선택하여 설정하세요</p>
              </div>
              <div class="settings-list">
                <div 
                  v-for="setting in notificationSettings" 
                  :key="setting.type" 
                  class="setting-item"
                >
                  <div class="setting-info">
                    <div class="setting-title">{{ setting.title }}</div>
                    <div class="setting-description">{{ setting.description }}</div>
                  </div>
                  <v-switch
                    v-model="setting.isActive"
                    @change="onNotificationSettingChange"
                    color="primary"
                    hide-details
                    class="setting-switch"
                  />
                </div>
              </div>
              
              <!-- 변경사항이 있을 때 저장/취소 버튼 표시 -->
              <div v-if="hasNotificationChanges" class="notification-actions">
                <v-divider class="mb-4"></v-divider>
                <div class="action-buttons">
                  <v-btn
                    @click="cancelNotificationChanges"
                    variant="outlined"
                    color="grey"
                    :disabled="isSavingNotifications"
                    class="mr-3"
                  >
                    <v-icon left>mdi-close</v-icon>
                    취소
                  </v-btn>
                  <v-btn
                    @click="saveNotificationSettings"
                    color="primary"
                    :loading="isSavingNotifications"
                    :disabled="isSavingNotifications"
                  >
                    <v-icon left>mdi-content-save</v-icon>
                    설정 저장
                  </v-btn>
                </div>
                <div class="changes-info">
                  <v-icon size="16" color="orange">mdi-information</v-icon>
                  <span class="changes-text">변경사항이 있습니다. 저장 버튼을 클릭하여 적용하세요.</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 회원 탈퇴 확인 다이얼로그 -->
      <v-dialog v-model="showDeleteAccountDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5 error--text">
            <v-icon left color="error">mdi-alert-circle</v-icon>
            회원 탈퇴 확인
          </v-card-title>
          <v-card-text>
            <div class="delete-account-warning">
              <p><strong>정말로 회원 탈퇴를 진행하시겠습니까?</strong></p>
              <p class="warning-text">탈퇴 시 다음과 같은 데이터가 삭제됩니다:</p>
              <ul class="warning-list">
                <li>프로필 정보 및 계정 데이터</li>
                <li>작성한 모든 게시글과 댓글</li>
                <li>참여 중인 냉장고 정보</li>
                <li>알림 설정 및 활동 내역</li>
              </ul>
              <p class="final-warning">이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              @click="showDeleteAccountDialog = false"
              color="grey"
              variant="text"
            >
              취소
            </v-btn>
            <v-btn
              @click="deleteAccount"
              color="error"
              :loading="isDeletingAccount"
              :disabled="isDeletingAccount"
            >
              탈퇴하기
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import axios from 'axios'

export default {
  name: 'MyPage',
  data() {
    return {
      isEditingName: false,
      editedName: '',
      isLoadingPosts: false,
      myPosts: [],
      myStats: {
        postCount: 0,
        commentCount: 0,
        likeCount: 0
      },

      notificationSettings: [
        {
          type: 'SYSTEM',
          title: '시스템 알림',
          description: '시스템 공지사항 및 중요한 업데이트',
          isActive: true
        },
        {
          type: 'ANNOUNCE',
          title: '공지사항',
          description: '냉장고 관련 공지사항 및 안내',
          isActive: true
        },
        {
          type: 'COMMENT',
          title: '댓글 알림',
          description: '내 게시글에 댓글이 달렸을 때',
          isActive: true
        },
        {
          type: 'CHAT',
          title: '채팅 알림',
          description: '새로운 채팅 메시지가 도착했을 때',
          isActive: true
        }
      ],
      originalNotificationSettings: [], // 원본 설정을 저장하여 변경사항 추적
      hasNotificationChanges: false, // 변경사항 여부
      isSavingNotifications: false, // 저장 중 상태
      showDeleteAccountDialog: false, // 회원 탈퇴 다이얼로그 표시 여부
      isDeletingAccount: false // 회원 탈퇴 진행 중 상태
    }
  },
  computed: {
    ...mapGetters(['getUserInfo', 'getUserName', 'getUserProfileImage', 'getUserInitial']),
    userInfo() {
      return this.getUserInfo || {}
    },
    userInitial() {
      return this.getUserInitial || 'U'
    }
  },
  async created() {
    await this.loadUserData()
    await this.fetchMyPosts()
    await this.fetchMyStats()

    // 알림 설정은 에러가 발생해도 페이지 로딩을 방해하지 않도록 처리
    try {
      await this.fetchNotificationSettings()
    } catch (error) {
      console.warn('⚠️ 알림 설정 로드 실패, 기본값 사용:', error.message)
    }
  },
  methods: {
    async loadUserData() {
      try {
        await this.$store.dispatch('fetchUserInfo')
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    },

    async fetchMyPosts() {
      try {
        this.isLoadingPosts = true
        const token = localStorage.getItem('accessToken')
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/member/myposts`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200 && response.data.result) {
          this.myPosts = response.data.result || []
        } else {
          this.myPosts = []
        }
      } catch (error) {
        console.error('내 게시글 조회 실패:', error)
        this.myPosts = []
      } finally {
        this.isLoadingPosts = false
      }
    },

    async fetchMyStats() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/member/mystats`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200 && response.data.result) {
          this.myStats = response.data.result
        } else {
          this.myStats = {
            postCount: 0,
            commentCount: 0,
            likeCount: 0
          }
        }
      } catch (error) {
        console.error('통계 조회 실패:', error)
        this.myStats = {
          postCount: 0,
          commentCount: 0,
          likeCount: 0
        }
      }
    },



    toggleEditName() {
      if (this.isEditingName) {
        this.saveName()
      } else {
        this.isEditingName = true
        this.editedName = this.userInfo.name || ''
        this.$nextTick(() => {
          if (this.$refs.nameInput) {
            this.$refs.nameInput.focus()
            this.$refs.nameInput.select()
          }
        })
      }
    },

    async saveName() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/member/update/name`,
          { name: this.editedName },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // Vuex 스토어 업데이트
          await this.$store.dispatch('fetchUserInfo')
          this.isEditingName = false
          alert(response.data.status_message || '이름이 변경되었습니다.')
        } else {
          alert(response.data.status_message || '이름 수정에 실패했습니다.')
        }
      } catch (error) {
        console.error('이름 수정 실패:', error)
        const errorMessage = error.response?.data?.status_message || '이름 수정에 실패했습니다.'
        alert(errorMessage)
      }
    },

    cancelEditName() {
      this.isEditingName = false
      this.editedName = ''
    },

    openImageUpload() {
      this.$refs.imageInput.click()
    },

    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }

      try {
        // 백엔드에서 기대하는 UpdateProfielImageDto 구조에 맞춰 전송
        const formData = new FormData()
        formData.append('newProfileImage', file)

        const token = localStorage.getItem('accessToken')
        const response = await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/member/update/profileimage`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // Vuex 스토어 업데이트
          await this.$store.dispatch('fetchUserInfo')
          alert(response.data.status_message || '프로필 이미지가 변경되었습니다.')
        } else {
          alert(response.data.status_message || '프로필 이미지 수정에 실패했습니다.')
        }
      } catch (error) {
        console.error('프로필 이미지 수정 실패:', error)
        const errorMessage = error.response?.data?.status_message || '프로필 이미지 수정에 실패했습니다.'
        alert(errorMessage)
      }
    },

    viewPost(post) {
      // 게시글 상세 페이지로 이동
      // fridgeId가 있으면 해당 냉장고의 게시글로, 없으면 현재 라우트의 fridgeId 사용
      const fridgeId = post.fridgeId || this.$route.params.fridgeId || 'default'
      this.$router.push(`/fridge/${fridgeId}/post/${post.id}`)
    },

    goToCommunity() {
      // 커뮤니티 페이지로 이동
      const fridgeId = this.$route.params.fridgeId || 'default'
      this.$router.push(`/fridge/${fridgeId}/community`)
    },

    formatDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },



    async fetchNotificationSettings() {
      try {
        const token = localStorage.getItem('accessToken')
        
        // 백엔드 API가 구현되지 않았을 경우를 대비한 임시 처리
        console.log('알림 설정 조회 시도 중...')
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        console.log('알림 설정 조회 성공:', response.data)
        
        // 백엔드에서 받은 설정으로 현재 설정 업데이트
        if (response.data && Array.isArray(response.data)) {
          const serverSettings = response.data
          this.notificationSettings.forEach(setting => {
            // 백엔드에서 NotificationSetting 객체 배열로 응답하는 경우
            const serverSetting = serverSettings.find(s => s.notificationSettingType === setting.type)
            if (serverSetting) {
              setting.isActive = serverSetting.isActive
            }
          })
        }
        
        // 원본 설정 저장 (깊은 복사)
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
        
      } catch (error) {
        console.error('알림 설정 조회 실패:', error)
        
        // 404나 기타 에러 시 기본값으로 초기화
        console.log('기본 알림 설정으로 초기화')
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
      }
    },

    // 알림 설정 변경 감지
    onNotificationSettingChange() {
      // 현재 설정과 원본 설정 비교
      this.hasNotificationChanges = !this.areNotificationSettingsEqual(
        this.notificationSettings, 
        this.originalNotificationSettings
      )
    },

    // 설정 비교 함수
    areNotificationSettingsEqual(current, original) {
      if (current.length !== original.length) return false
      
      return current.every(currentSetting => {
        const originalSetting = original.find(s => s.type === currentSetting.type)
        return originalSetting && originalSetting.isActive === currentSetting.isActive
      })
    },

    // 변경사항 취소
    cancelNotificationChanges() {
      // 원본 설정으로 되돌리기
      this.notificationSettings = JSON.parse(JSON.stringify(this.originalNotificationSettings))
      this.hasNotificationChanges = false
    },

    // 알림 설정 일괄 저장
    async saveNotificationSettings() {
      try {
        this.isSavingNotifications = true
        const token = localStorage.getItem('accessToken')
        
        // 토큰 검증
        if (!token) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.')
          this.$router.push('/login')
          return
        }
        
        // NotificationSettingReqDto 구조에 맞춰 settings 객체 생성
        // Map<String, Boolean> settings 형태로 전송
        const settings = {}
        this.notificationSettings.forEach(setting => {
          // 백엔드에서 ENUM으로 변환하므로 대문자로 전송
          settings[setting.type.toUpperCase()] = setting.isActive
        })

        const requestData = { settings }
        
        // 백엔드 DTO 검증: NotificationSettingReqDto { Map<String, Boolean> settings }
        console.log('전송할 데이터 구조 검증:', {
          isSettingsObject: typeof settings === 'object',
          settingsKeys: Object.keys(settings),
          settingsValues: Object.values(settings),
          allValuesBoolean: Object.values(settings).every(v => typeof v === 'boolean')
        })
        
        // 디버깅을 위한 로그 추가
        console.log('알림 설정 저장 요청:', {
          url: `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
          data: requestData,
          token: token ? 'exists' : 'missing'
        })

        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
          requestData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log('알림 설정 저장 응답:', response.data)
        
        // 성공 시 원본 설정 업데이트
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
        
        // 성공 메시지 표시
        alert('알림 설정이 성공적으로 저장되었습니다.')
        
      } catch (error) {
        console.error('알림 설정 저장 실패:', error)
        
        // 상세한 에러 정보 로깅
        if (error.response) {
          console.error('응답 에러:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          })
        } else if (error.request) {
          console.error('요청 에러:', error.request)
        } else {
          console.error('설정 에러:', error.message)
        }
        
        // 에러 메시지를 더 자세히 표시
        let errorMessage = '알림 설정 저장에 실패했습니다.'
        if (error.response) {
          // 서버에서 응답을 받았지만 에러 상태코드인 경우
          if (error.response.status === 401) {
            errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
          } else if (error.response.status === 403) {
            errorMessage = '권한이 없습니다.'
          } else if (error.response.status === 400) {
            errorMessage = '요청 형식이 올바르지 않습니다.'
          } else if (error.response.status === 500) {
            errorMessage = '서버 내부 오류가 발생했습니다.'
          } else if (error.response.data) {
            // 백엔드에서 보내는 에러 메시지 구조에 따라 조정
            if (error.response.data.message) {
              errorMessage = error.response.data.message
            } else if (error.response.data.status_message) {
              errorMessage = error.response.data.status_message
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data
            }
          }
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
        }
        
        alert(errorMessage)
      } finally {
        this.isSavingNotifications = false
      }
    },

    // 회원 탈퇴 처리
    async deleteAccount() {
      try {
        this.isDeletingAccount = true
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          alert('로그인이 필요합니다.')
          this.$router.push('/login')
          return
        }

        const response = await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/member/delete`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // 로컬 스토리지 정리
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          
          // Vuex 상태 초기화
          await this.$store.dispatch('logout')
          
          // 백엔드에서 제공하는 성공 메시지 표시
          alert(response.data.status_message || '회원탈퇴가 성공적으로 되었습니다.\n그동안 저희 Smart Fridge를 이용해주셔서 감사합니다.')
          
          // 로그인 페이지로 이동
          this.$router.push('/login')
        } else {
          // 응답은 받았지만 성공이 아닌 경우
          alert(response.data.status_message || '회원 탈퇴에 실패했습니다.')
        }
        
      } catch (error) {
        console.error('회원 탈퇴 실패:', error)
        
        let errorMessage = '회원 탈퇴에 실패했습니다.'
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = '로그인이 필요합니다.'
          } else if (error.response.status === 403) {
            errorMessage = '권한이 없습니다.'
          } else if (error.response.data) {
            // CommonDto 구조의 에러 메시지 처리
            if (error.response.data.status_message) {
              errorMessage = error.response.data.status_message
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message
            }
          }
        } else if (error.request) {
          errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
        }
        
        // 외래키 제약조건 에러 특별 처리
        if (error.response && error.response.data && 
            typeof error.response.data === 'string' && 
            error.response.data.includes('foreign key constraint fails')) {
          errorMessage = '회원 탈퇴를 진행할 수 없습니다.\n참여 중인 채팅방이나 냉장고가 있어 탈퇴가 제한됩니다.\n관리자에게 문의해주세요.'
        }
        
        alert(errorMessage)
      } finally {
        this.isDeletingAccount = false
        this.showDeleteAccountDialog = false
      }
    }
  }
}
</script>

<style scoped>
.mypage-container {
  padding: 32px;
  margin-left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.mypage-container::before {
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
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
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
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.mypage-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 첫 번째 행: 프로필과 활동 통계 */
.profile-stats-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

/* 두 번째 행: 내가 작성한 글과 알림 설정 */
.posts-settings-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}



.profile-card,
.notification-settings-card,
.posts-card,
.stats-card,
.account-actions-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-header,
.stats-header,
.posts-header,
.notification-header {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  padding: 16px 20px;
  min-height: 64px;
  display: flex;
  align-items: center;
}

.profile-section {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.profile-image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 35px;
}

.profile-image-container {
  position: relative;
  margin-bottom: 16px;
}

.profile-avatar-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(180deg, #0468FF 0%, #789DFB 100%);
  border-radius: 60px;
}

.profile-avatar-initial {
  font-weight: 700;
  font-size: 48px;
  color: #FFF;
}

.profile-avatar-image {
  border-radius: 60px;
  object-fit: cover;
}

.edit-image-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-info-section {
  flex: 1;
  margin-top: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-height: 40px;
}

.info-label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
  margin-right: 20px;
}

.info-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.info-value {
  font-size: 16px;
  color: #666;
}

/* 현대적인 이름 편집 디자인 */
.name-display-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.name-edit-section {
  flex: 1;
}

.edit-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.modern-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  background: white;
  transition: all 0.3s ease;
  outline: none;
  min-width: 0;
}

.modern-input:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  transform: translateY(-1px);
}

.modern-input::placeholder {
  color: #999;
  font-weight: 400;
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.save-btn {
  background: rgba(76, 175, 80, 0.1) !important;
  border-radius: 6px !important;
}

.save-btn:hover {
  background: rgba(76, 175, 80, 0.2) !important;
  transform: scale(1.05);
}

.cancel-btn {
  background: rgba(244, 67, 54, 0.1) !important;
  border-radius: 6px !important;
}

.cancel-btn:hover {
  background: rgba(244, 67, 54, 0.2) !important;
  transform: scale(1.05);
}

.edit-btn {
  min-width: auto !important;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.stats-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-content {
  flex: 1;
  padding: 16px 20px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  flex: 1;
}

.stat-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-posts {
  border-left-color: #2196F3;
}

.stat-posts .stat-icon-wrapper {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

.stat-comments {
  border-left-color: #4CAF50;
}

.stat-comments .stat-icon-wrapper {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
}

.stat-likes {
  border-left-color: #F44336;
}

.stat-likes .stat-icon-wrapper {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  flex: 1;
  text-align: left;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 15px;
  color: #666;
  font-weight: 500;
  line-height: 1;
}





.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.loading-text {
  color: #666;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.post-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.post-category {
  background: #1976d2;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.post-fridge {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-date {
  font-size: 12px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.no-posts,
.no-activity {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-posts-text,
.no-activity-text {
  margin: 16px 0;
  font-size: 16px;
}

/* 프로필 내 회원 탈퇴 스타일 */
.profile-danger-zone {
  margin-top: 16px;
}

.danger-zone-in-profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

.danger-info {
  flex: 1;
}

.danger-info h4 {
  color: #d32f2f;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.danger-info p {
  color: #666;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.delete-account-btn-inline {
  margin-left: 16px;
  flex-shrink: 0;
}

/* 회원 탈퇴 다이얼로그 스타일 */
.delete-account-warning {
  padding: 8px 0;
}

.warning-text {
  color: #666;
  margin: 16px 0 8px 0;
}

.warning-list {
  margin: 8px 0 16px 20px;
  padding: 0;
}

.warning-list li {
  color: #666;
  margin-bottom: 4px;
}

.final-warning {
  color: #d32f2f;
  font-weight: 600;
  margin: 16px 0 0 0;
}

/* 알림 설정 스타일 */
.notification-settings {
  padding: 8px 0;
}

.setting-description {
  margin-bottom: 20px;
}

.setting-desc-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: #e9ecef;
}

.setting-info {
  flex: 1;
  margin-right: 16px;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.setting-switch {
  flex-shrink: 0;
}

/* 알림 설정 액션 버튼 스타일 */
.notification-actions {
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
}

.changes-info {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 8px 16px;
  background: #fff3e0;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.changes-text {
  font-size: 14px;
  color: #f57c00;
  font-weight: 500;
}

@media (max-width: 600px) {
  .mypage-container {
    padding: 16px;
    margin-left: 8px;
  }
}

@media (max-width: 768px) {
  .profile-stats-row,
  .posts-settings-row {
    grid-template-columns: 1fr;
  }
  
  .profile-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .profile-info-section {
    width: 100%;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-item {
    padding: 12px 16px;
  }
  
  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
    margin-right: 16px;
  }
  
  .stat-icon {
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value-container {
    width: 100%;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-info {
    margin-right: 0;
    width: 100%;
  }
  
  .setting-switch {
    align-self: flex-end;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-buttons .v-btn {
    width: 100%;
    margin: 0 !important;
  }
  
  .changes-info {
    text-align: center;
  }
  
  .danger-zone-in-profile {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .delete-account-btn-inline {
    margin-left: 0;
    width: 100%;
  }
  
  /* 이름 편집 모바일 스타일 */
  .modern-input {
    font-size: 16px;
    padding: 10px 12px;
  }
  
  .edit-input-container {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .edit-actions {
    justify-content: center;
    gap: 16px;
  }
}
</style>
