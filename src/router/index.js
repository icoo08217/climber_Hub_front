import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/Login.vue'
import SignupView from '../views/Signup.vue'
import HomeView from '../views/Home.vue'
import AccountView from '../views/Account.vue'

const GymMapView = () => import('../views/GymMap.vue')
const GymDetailView = () => import('../views/GymDetail.vue')
const AdminGymOwnersView = () => import('../views/AdminGymOwners.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },
    { path: '/gyms', name: 'gyms', component: GymMapView, meta: { requiresAuth: true } },
    {
      path: '/gyms/:gymId',
      name: 'gym-detail',
      component: GymDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings/profile',
      name: 'profile-settings',
      redirect: '/account',
    },
    {
      path: '/admin/gym-owners',
      name: 'admin-gym-owners',
      component: AdminGymOwnersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/signup', name: 'signup', component: SignupView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    try {
      await auth.restore()
    } catch {
      // Keep the login screen accessible when the backend is unavailable.
      if (to.meta.requiresAuth) return '/login'
      return true
    }
  }
  if (to.meta.requiresAuth && !auth.member) return '/login'
  if (to.meta.requiresAdmin && auth.member?.role !== 'ADMIN') return '/account'
  if (['login', 'signup'].includes(to.name) && auth.member) return '/'
})

export default router
