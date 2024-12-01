import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {
            name: '',
            age: 0
        }
    }),
    actions: {
        setUsername(name) {
            this.user.name = name;
            // 将用户名保存到 localStorage
            localStorage.setItem('username', name);
        },
        getUsername() {
            // 从 localStorage 获取用户名
            return this.user.name || localStorage.getItem('username') || '';
        },
        setUser(name, age) {
            this.user.name = name;
            this.user.age = age;
            localStorage.setItem('username', name);
        },
        getUser() {
            return this.user;
        }
    }
});
