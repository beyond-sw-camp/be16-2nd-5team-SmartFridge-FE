import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";
import SharedFood from "@/views/SharedFood.vue";
import FridgeMemberList from "@/views/FridgeMemberList.vue";

export const FridgeRouter = [
  {
    path: '/fridge/list',
    name: 'FridgeList',
    component: FridgeList,
    meta: { requiresAuth: true }
  },
  {
    path: '/fridge/dashboard',
    name: 'FridgeDashboard',
    component: FridgeDashboard
  },
  {
    path: '/fridge/food/shared',
    name: 'SharedFood',
    component: SharedFood
  },
  {
    path: '/fridge/member/list',
    name: 'FridgeMemberList',
    component: FridgeMemberList
  },
  
]
