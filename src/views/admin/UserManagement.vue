<template>
  <div class="admin-layout">
    <div class="user-management">
      <div class="header">
        <h1>사용자 관리</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item active">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="roleFilter" @change="filterUsers">
          <option value="">전체 역할</option>
          <option value="ADMIN">관리자</option>
          <option value="USER">일반사용자</option>
        </select>
        <select v-model="statusFilter" @change="filterUsers">
          <option value="">전체 상태</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
          <option value="정지">정지</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="이름 또는 이메일로 검색..." @input="filterUsers">
        <button @click="exportUsers" class="export-btn">사용자 목록 내보내기</button>
      </div>

      <div class="user-table">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>마지막 로그인</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="getRoleClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span :class="getStatusClass(user.status)">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.createdAt }}</td>
              <td>{{ user.lastLoginAt || '-' }}</td>
              <td>
                <button @click="viewUser(user)" class="view-btn">보기</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 사용자 상세 보기 모달 -->
      <div v-if="selectedUser" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>사용자 정보</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="user-detail">
              <p><strong>ID:</strong> {{ selectedUser.id }}</p>
              <p><strong>이름:</strong> {{ selectedUser.name }}</p>
              <p><strong>이메일:</strong> {{ selectedUser.email }}</p>
              <p><strong>역할:</strong> {{ selectedUser.role }}</p>
              <p><strong>상태:</strong> {{ selectedUser.status }}</p>
              <p><strong>가입일:</strong> {{ selectedUser.createdAt }}</p>
              <p><strong>마지막 로그인:</strong> {{ selectedUser.lastLoginAt || '-' }}</p>
              <p><strong>프로필 이미지:</strong> {{ selectedUser.profileImage || '없음' }}</p>
            </div>
            
            <div class="modal-actions">
              <button @click="closeModal" class="close-modal-btn">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      filteredUsers: [],
      roleFilter: '',
      statusFilter: '',
      searchQuery: '',
      selectedUser: null,
      loading: true
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/member/list`);
        
        console.log('Member List API Response:', response.data);
        
        if (response.data.status_code === 200) {
          console.log('First member item:', response.data.result[0]);
          
          this.users = response.data.result
            .map(member => {
              console.log('Member role 값:', member.role, '타입:', typeof member.role);
              return {
                // MemberResDto 실제 구조에 맞게 매핑
                id: member.id, // UUID
                name: member.name,
                email: member.email,
                role: member.role ? member.role : 'USER', // API에서 받은 role 값 사용, 없으면 기본값 USER
                status: '활성', // MemberResDto에 status 필드가 없으므로 기본값
                createdAt: member.createdTime ? new Date(member.createdTime).toLocaleDateString() : '-',
                lastLoginAt: member.lastLoginTime ? new Date(member.lastLoginTime).toLocaleString() : '-',
                profileImage: member.profileImage || null
              };
            });
          this.filteredUsers = [...this.users];
        }
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.$store.dispatch('showSnackbar', {
          message: '사용자 목록 로드에 실패했습니다.',
          color: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    filterUsers() {
      let filtered = [...this.users];
      
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter);
      }
      
      if (this.statusFilter) {
        filtered = filtered.filter(user => user.status === this.statusFilter);
      }
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
        );
      }
      
      this.filteredUsers = filtered;
    },
    
    getRoleClass(role) {
      return role === 'ADMIN' ? 'role-admin' : 'role-user';
    },
    
    getStatusClass(status) {
      const classes = {
        '활성': 'status-active',
        '비활성': 'status-inactive',
        '정지': 'status-suspended'
      };
      return classes[status] || '';
    },
    
    async viewUser(user) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/member/detail/${user.email}`);
        
        console.log('Member Detail API Response:', response.data);
        
        if (response.data.status_code === 200) {
          const memberDetail = response.data.result;
          this.selectedUser = {
            ...user,
            // MemberResDto 실제 구조에 맞게 매핑
            id: memberDetail.id,
            name: memberDetail.name,
            email: memberDetail.email,
            createdAt: memberDetail.createdTime ? new Date(memberDetail.createdTime).toLocaleDateString() : '-',
            lastLoginAt: memberDetail.lastLoginTime ? new Date(memberDetail.lastLoginTime).toLocaleString() : '-',
            profileImage: memberDetail.profileImage || null
          };
        }
      } catch (error) {
        console.error('사용자 상세 정보 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.selectedUser = user;
      }
    },
    
    exportUsers() {
      try {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } catch (error) {
        console.error('사용자 목록 내보내기 실패:', error);
      }
    },
    
    generateCSV() {
      const headers = ['ID', '이름', '이메일', '역할', '상태', '가입일', '마지막 로그인'];
      const rows = this.filteredUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.createdAt,
        user.lastLoginAt || '-'
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    },
    
    closeModal() {
      this.selectedUser = null;
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.user-management {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logout-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.3);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234, 67, 53, 0.4);
}

.navigation-menu {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item {
  padding: 12px 24px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

.nav-item.active {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.filters select, .filters input {
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.filters select:focus, .filters input:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.filters input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.export-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 168, 83, 0.4);
}

.user-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-table table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th, .user-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-table th {
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-table td {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.user-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.role-admin {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(234, 67, 53, 0.3);
}

.role-user {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.status-active {
  color: #34a853;
  font-weight: 600;
  background: rgba(52, 168, 83, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-inactive {
  color: #6c757d;
  font-weight: 600;
  background: rgba(108, 117, 125, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-suspended {
  color: #ea4335;
  font-weight: 600;
  background: rgba(234, 67, 53, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.view-btn, .edit-btn, .activate-btn, .deactivate-btn, .delete-btn {
  margin: 0 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.3s ease;
}

.view-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.edit-btn {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #212529;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.activate-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
}

.activate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.4);
}

.deactivate-btn {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.deactivate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(234, 67, 53, 0.3);
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow-y: auto;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.user-detail p {
  margin: 16px 0;
  font-size: 14px;
  line-height: 1.6;
}

.user-detail strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.form-actions, .modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.save-btn, .cancel-btn, .close-modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(135deg, #34a853 0%, #2d8f47 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 168, 83, 0.4);
}

.cancel-btn, .close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-btn:hover, .close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .user-management {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters select, .filters input {
    width: 100%;
  }
  
  .user-table {
    overflow-x: auto;
  }
  
  .user-table th, .user-table td {
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header h2 {
    font-size: 20px;
  }
}
</style>
