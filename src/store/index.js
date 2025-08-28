import { createStore } from "vuex";
import notification from "./notification";
import user from "./user";

const store = createStore({
    state: {
        currentFridgeId: localStorage.getItem('currentFridgeId') || null
    },
    mutations: {
        setCurrentFridgeId(state, id) {
            state.currentFridgeId = id;
            localStorage.setItem('currentFridgeId', id);
        },
        clearCurrentFridgeId(state) {
            state.currentFridgeId = null;
            localStorage.removeItem('currentFridgeId');
        }
    },
    getters: {
        getCurrentFridgeId: state => state.currentFridgeId
    },
    modules: {
        notification,
        user
    }
});

export default store;