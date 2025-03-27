import  { createRouter, createWebHashHistory} from 'vue-router'

import LoginVue from '@/Components/loginVue.vue'
import Dashboard from '@/Components/dashboardVue.vue'

const routes = [
    {
        path: '/',
        name: 'login',
        component: LoginVue
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        children:[
            {
                path: "/video",
                name: 'video',
                component: () => import('@/Components/videoVue.vue')
            },
            {
                path: '/document',
                name: 'document',
                component: () => import('@/Components/documentVue.vue')
            },
            {
                path: '/navigator',
                name: 'navigator',
                component: () => import('@/Components/navigatorVue.vue')
            },
            {
                path: '/transfer',
                name: 'transfer',
                component: () => import('@/Components/transferVue.vue')
            },
            {
                path: '/getDocument',
                name: 'getDocument',
                component: () => import('@/Components/getDocumentVue.vue')
            },
            {
                path: '/todoList',
                name: 'todoList',
                component: () => import('@/Components/toDoListVue.vue')
            },
            {
                path: '/chat',
                name: 'chat',
                component: () => import('@/Components/chatVue.vue')
            },
            {
                path: '/documentDetail/:id',
                name: 'documentDetail',
                component: () => import('@/Components/documentDetailVue.vue')
            }
        ]
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router;