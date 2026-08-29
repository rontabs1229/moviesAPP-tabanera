import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'notyf/notyf.min.css';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/style.css'
import App from './App.vue'

// Pages and components
import Homepage from './pages/Homepage.vue';
import RegisterPage from './pages/RegisterPage.vue';
import LoginPage from './pages/LoginPage.vue';
import ProfilePage from './pages/ProfilePage.vue';
import DashboardPage from './pages/AdminDashboard.vue';
import CollectionsPage from './pages/CollectionsPage.vue';
import EditPage from './pages/EditPage.vue';
import ReviewPage from './pages/ReviewPage.vue';

import Logout from './components/Logout.vue';

import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Homepage
    },
    {
      path: '/movies',
      name: 'Contents',
      component: CollectionsPage
    },
    {
      path: '/movies/:movieId/edit',
      name: 'EditPage',
      component: EditPage
    },
    {
      path: '/movies/:movieId',
      name: 'Review',
      component: ReviewPage
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterPage
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage
    },
    {
      path: '/profile',
      name: 'Profile',
      component: ProfilePage
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardPage
    },
    {
      path: '/logout',
      name: 'Logout',
      component: Logout
    }
  ]
});


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
