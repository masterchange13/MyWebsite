import  { createRouter, createWebHashHistory} from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'login',
        component: () => import('@/Components/loginVue.vue')
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/Components/registerVue.vue')
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/Components/dashboardVue.vue'),
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
                path: '/appLauncher',
                name: 'appLauncher',
                component: () => import('@/Components/appLauncherVue.vue')
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
                path: '/agent',
                name: 'agent',
                component: () => import('@/Components/agentVue.vue')
            },
            {
                path: '/profile/:id',
                name: 'profile',
                component: () => import('@/Components/profileVue.vue')
            },
            {
                path: '/documentDetail/:id',
                name: 'documentDetail',
                component: () => import('@/Components/documentDetailVue.vue')
            },
            {
                path: '/music',
                name: 'music',
                component: () => import('@/views/musicVue.vue')
            },
            {
                path: '/qiMen',
                name: 'qiMen',
                component: () => import('@/Components/qiMenVue.vue')
            },
            {
                path: '/timer',
                name: 'timer',
                component: () => import('@/Components/timerVue.vue')
            },
            {
                path: '/calculator',
                name: 'calculator',
                component: () => import('@/Components/calculatorVue.vue')
            },
            {
                path: '/decision',
                name: 'decision',
                component: () => import('@/Components/decisionVue.vue')
            },
            {
                path: '/email',
                name: 'email',
                component: () => import('@/Components/emailVue.vue')
            },
            {
                path: '/guide',
                name: 'guide',
                component: () => import('@/Components/guideVue.vue')
            },
            {
                path: '/feedback',
                name: 'feedback',
                component: () => import('@/Components/feedbackVue.vue')
            },
            {
                path: '/author',
                name: 'author',
                component: () => import('@/Components/authorVue.vue')
            },
            {
                path: '/siteSettings',
                name: 'siteSettings',
                component: () => import('@/Components/siteSettingsVue.vue')
            }
        ]
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router;
