import CommunityPage from '../views/CommunityPage.vue'
import PostDetailPage from '../views/PostDetailPage.vue'

export const CommunityRouter = [
  {
    path: '/fridge/community',
    name: 'Community',
    component: CommunityPage
  },
  {
    path: '/fridge/post/:postId',
    name: 'PostDetail',
    component: PostDetailPage
  }
]
