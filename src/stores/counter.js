// stores/counter.js
import { defineStore } from 'pinia'

// offcial example
export const useCounterStore = defineStore('counter', {
  state: () => {
    return { count: 0 }
  },
  // could also be defined as
  // state: () => ({ count: 0 })
  actions: {
    increment() {
      this.count++
    },
  },
})

export const userStore = defineStore('user', {
    state: () => {
        return {
            user:{
                 name: '',
                 age: 0
            }
        }
    },
    actions: {
        setUser(name, age) {
            this.user.name = name
            this.user.age = age
        },
        getUser() {
            return this.user
        }
    }
})