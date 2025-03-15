import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {
            name: localStorage.getItem('username') || '',  // ✅ 这里初始化
            age: Number(localStorage.getItem('age')) || 0
        }
    }),
    actions: {
        setUser(name, age) {
            this.user.name = name;
            this.user.age = age;
            localStorage.setItem('username', name);
            localStorage.setItem('age', String(age));
        },
        getUsername() {
            return this.user.name;
        },
        setUsername(name) {
            this.user.name = name;
            localStorage.setItem('username', name);
        }
    },
    persist: true // ✅ 启用持久化
});
