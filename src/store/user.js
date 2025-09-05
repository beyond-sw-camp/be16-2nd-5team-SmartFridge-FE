import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import authService from '@/services/authService.js';

const user = {
    state: {
        userInfo: null,
        isLoggedIn: false
    },
    
    mutations: {
        SET_USER_INFO(state, userInfo) {
            state.userInfo = userInfo;
            state.isLoggedIn = true;
        },
        
        CLEAR_USER_INFO(state) {
            state.userInfo = null;
            state.isLoggedIn = false;
        }
    },
    
    actions: {
        async fetchUserInfo({ commit }) {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error('No access token found');
                }
                
                // JWT 토큰에서 이메일 추출
                const decodedToken = jwtDecode(token);
                const email = decodedToken.sub || localStorage.getItem('email');
                
                if (!email) {
                    throw new Error('No email found in token or localStorage');
                }
                
                // 백엔드 API에서 사용자 정보를 가져오기 (JWT 토큰으로 인증)
                try {
                    console.log('🔍 Fetching user info for email:', email);
                    
                    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/member/info`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('✅ API Response:', response.data);
                    
                    if (response.data.status_code === 200 && response.data.result) {
                        const userInfo = response.data.result;
                        console.log('✅ User info loaded from API:', userInfo);
                        console.log('🔍 Profile image field in API response:', userInfo.profileImage || userInfo.profile_image || userInfo.avatar || userInfo.image);
                        commit('SET_USER_INFO', userInfo);
                        return userInfo;
                    }
                } catch (apiError) {
                    console.error('❌ API fetch failed:', {
                        message: apiError.message,
                        status: apiError.response?.status,
                        statusText: apiError.response?.statusText,
                        responseData: apiError.response?.data,
                        requestUrl: apiError.config?.url,
                        requestParams: apiError.config?.params
                    });
                    
                    // 401 에러인 경우 토큰 갱신 시도
                    if (apiError.response?.status === 401) {
                        try {
                            console.log('🔄 Attempting to refresh token...');
                            await authService.refreshAccessToken();
                            
                            // 토큰 갱신 후 다시 API 호출 시도
                            const retryResponse = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/member/info`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                                }
                            });
                            
                            if (retryResponse.data.status_code === 200 && retryResponse.data.result) {
                                const userInfo = retryResponse.data.result;
                                console.log('✅ User info loaded from API after token refresh:', userInfo);
                                commit('SET_USER_INFO', userInfo);
                                return userInfo;
                            }
                        } catch (refreshError) {
                            console.error('❌ Token refresh failed:', refreshError);
                            // 토큰 갱신 실패 시 로그아웃 처리
                            commit('CLEAR_USER_INFO');
                            localStorage.clear();
                            window.location.href = '/';
                            throw refreshError;
                        }
                    }
                    
                    console.warn('🔄 Using fallback method');
                }
                
                // API가 실패하면 JWT 토큰과 localStorage에서 기본 정보 생성
                if (email) {
                    // 이메일에서 사용자 이름 추출 (@ 앞 부분)
                    const username = email.split('@')[0];
                    
                    const fallbackUserInfo = {
                        email: email,
                        name: username,
                        profileImage: null,
                        role: decodedToken.role || localStorage.getItem('role') || 'USER',
                        createdTime: null // 백엔드에서 createdTime 필드로 반환
                    };
                    
                    commit('SET_USER_INFO', fallbackUserInfo);
                    console.log('⚠️ Using fallback user info:', fallbackUserInfo);
                    return fallbackUserInfo;
                }
                
                throw new Error('Failed to fetch user info from API and fallback methods');
                
            } catch (error) {
                console.error('Error fetching user info:', error);
                // 토큰이 유효하지 않거나 만료된 경우 로그아웃 처리
                if (error.response && error.response.status === 401) {
                    commit('CLEAR_USER_INFO');
                    authService.logout();
                }
                throw error;
            }
        },
        
        logout({ commit }) {
            commit('CLEAR_USER_INFO');
            authService.logout();
        }
    },
    
    getters: {
        getUserInfo: state => state.userInfo,
        isLoggedIn: state => state.isLoggedIn,
        getUserName: state => state.userInfo ? state.userInfo.name : '',
        getUserEmail: state => state.userInfo ? state.userInfo.email : '',
        getUserProfileImage: state => {
            if (!state.userInfo) return null;
            
            // 다양한 필드명으로 프로필 이미지 찾기
            const profileImage = state.userInfo.profileImage || 
                               state.userInfo.profile_image || 
                               state.userInfo.avatar || 
                               state.userInfo.image ||
                               state.userInfo.profileImg ||
                               state.userInfo.profile_img;
            
            console.log('🔍 getUserProfileImage - userInfo:', state.userInfo);
            console.log('🔍 getUserProfileImage - found profileImage:', profileImage);
            
            return profileImage;
        },
        getUserInitial: state => {
            if (state.userInfo && state.userInfo.name) {
                return state.userInfo.name.charAt(0);
            }
            return '';
        }
    }
};

export default user;
