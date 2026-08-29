<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="navbar-brand" @click="closeMenu">
        <img src="/logo-main.png" alt="logo" />
      </router-link>

      <div class="nav-group-right">
        <!-- Conditional Search Bar for Home Page with Suggestions Dropdown -->
        <div v-if="isHome" class="navbar-search-container" ref="searchContainerRef">
          <div class="search-input-wrapper">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              v-model="searchQuery"
              @focus="isFocused = true"
              placeholder="Search Title"
              class="navbar-search-input"
            />
          </div>

          <!-- Live Results Dropdown -->
          <div v-if="isFocused && searchQuery.trim() && filteredMovies.length > 0" class="search-dropdown">
            <div 
              v-for="movie in filteredMovies" 
              :key="movie._id || movie.id"
              class="search-dropdown-item"
              @mousedown.prevent="selectMovie(movie)"
            >
              <span class="dropdown-title">{{ movie.title }}</span>
              <span class="dropdown-meta">{{ movie.genre }} &middot; {{ movie.year }}</span>
            </div>
          </div>

          <div v-else-if="isFocused && searchQuery.trim() && filteredMovies.length === 0" class="search-dropdown">
            <div class="search-dropdown-item no-results">
              No movies found
            </div>
          </div>
        </div>

        <button 
          class="menu-toggle" 
          @click="toggleMenu" 
          :class="{ active: isOpen }" 
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="nav-links" :class="{ open: isOpen }">
          <router-link to="/" class="nav-link" @click="closeMenu">
            Home
          </router-link>

          <router-link  
            :to="{ name: 'Contents' }" 
            class="nav-link" 
            @click="closeMenu"
          >
            Contents
          </router-link>

          <router-link 
            v-if="isLoggedIn && !user?.isAdmin" 
            :to="{ name: 'Profile' }" 
            class="nav-link" 
            @click="closeMenu"
          >
            Profile
          </router-link>

          <router-link 
            v-if="isLoggedIn && user?.isAdmin" 
            :to="{ name: 'Dashboard' }" 
            class="nav-link" 
            @click="closeMenu"
          >
            Dashboard
          </router-link>

          <router-link 
            v-if="!isLoggedIn" 
            :to="{ name: 'Register' }" 
            class="nav-link" 
            @click="closeMenu"
          >
            Register
          </router-link>

          <router-link 
            v-if="!isLoggedIn" 
            :to="{ name: 'Login' }" 
            class="nav-link" 
            @click="closeMenu"
          >
            Login
          </router-link>

          <button 
            v-else 
            type="button"
            class="nav-link logout-btn" 
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { storeToRefs } from "pinia";
  import { useRouter, useRoute } from "vue-router";
  import { useGlobalStore } from "../stores/global";
  import api from "../api";

  const isOpen = ref(false);
  const isFocused = ref(false);
  const searchContainerRef = ref(null);
  const router = useRouter();
  const route = useRoute();

  const globalStore = useGlobalStore();
  const { user } = storeToRefs(globalStore);

  const searchQuery = ref('');
  const moviesList = ref([]);

  async function fetchNavbarMovies() {
    try {
      const response = await api.get('/movies/getMovies');
      moviesList.value = response.data?.movies || response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch navbar movies:', err);
    }
  }

  const filteredMovies = computed(() => {
    if (!searchQuery.value.trim()) return [];
    const query = searchQuery.value.toLowerCase();
    return moviesList.value.filter(movie => 
      movie.title && movie.title.toLowerCase().includes(query)
    );
  });

  const isHome = computed(() => route.path === '/');

  // Single source of truth: the store's user.token, which is kept in sync
  // with sessionStorage by getUserDetails()/clearUser() in stores/global.js.
  const isLoggedIn = computed(() => {
    return Boolean(user.value?.token);
  });

  const selectMovie = (movie) => {
    searchQuery.value = '';
    isFocused.value = false;
    const movieId = movie._id || movie.id;
    router.push(`/movies/${movieId}`);
  };

  const handleClickOutside = (event) => {
    if (searchContainerRef.value && !searchContainerRef.value.contains(event.target)) {
      isFocused.value = false;
    }
  };

  onMounted(() => {
    fetchNavbarMovies();
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
  };

  const closeMenu = () => {
    isOpen.value = false;
  };

  const handleLogout = () => {
    closeMenu();
    globalStore.logout();
    router.push('/login');
  };
</script>

<style scoped>
  nav {
    height: 60px;
    background-color: #321E48;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(50, 30, 72, 0.08);
  }

  .container {
    height: 100%;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    font-size: 20px;
    text-decoration: none;
  }

  img {
    height: 40px;
  }

  .nav-group-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .navbar-search-container {
    position: relative;
    width: 220px;
  }

  .search-input-wrapper {
    position: relative;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    stroke: #718096;
    pointer-events: none;
  }

  .navbar-search-input {
    width: 100%;
    padding: 6px 12px 6px 34px;
    background-color: #ffffff;
    border: none;
    border-radius: 50px;
    font-size: 13px;
    color: #1e1e1e;
    outline: none;
    font-family: 'Shanti', sans-serif;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
  }

  .search-dropdown-item {
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f0f0f0;
  }

  .search-dropdown-item:last-child {
    border-bottom: none;
  }

  .search-dropdown-item:hover {
    background-color: #f7fafc;
  }

  .dropdown-title {
    font-size: 13px;
    font-weight: 700;
    color: #321E48;
  }

  .dropdown-meta {
    font-size: 11px;
    color: #718096;
    margin-top: 2px;
  }

  .no-results {
    font-size: 13px;
    color: #718096;
    text-align: center;
    cursor: default;
  }

  .menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 20;
  }

  .menu-toggle span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: #D9FFF4;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  .menu-toggle.active span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }

  .menu-toggle.active span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .nav-link {
    font-family: 'Shalimar', cursive;
    font-size: 25px;
    font-weight: 600;
    color: #D9FFF4;
    letter-spacing: 2px;
    text-decoration: none;
    padding: 8px 4px;
    position: relative;
    transition: color 0.2s ease;
    background: none;
    border: none;
    cursor: pointer;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 2px;
    background-color: #65DCD5;
    transition: width 0.2s ease;
  }

  .nav-link:hover,
  .nav-link.router-link-active {
    color: #65DCD5;
  }

  .nav-link:hover::after,
  .nav-link.router-link-active::after {
    width: 100%;
  }

  .logout-btn {
    color: #D9FFF4;
    font-weight: 600;
  }

  @media (max-width: 992px) {
    .menu-toggle {
      display: flex;
    }

    .nav-group-right {
      gap: 12px;
    }

    .navbar-search-container {
      width: 160px;
    }

    .nav-links {
      position: absolute;
      top: 60px;
      left: 0;
      right: 0;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      background-color: #321E48;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      box-shadow: 0 4px 6px rgba(50, 30, 72, 0.1);
    }

    .nav-links.open {
      max-height: 350px;
    }

    .nav-link {
      width: 100%;
      padding: 14px 24px;
      color: #D9FFF4;
      text-align: left;
    }

    .nav-link::after {
      display: none;
    }
  }

  @media (max-width: 576px) {
    .container {
      padding: 0 16px;
    }

    img {
      height: 32px;
    }

    .navbar-search-container {
      width: 130px;
    }

    .navbar-search-input {
      padding: 5px 10px 5px 28px;
      font-size: 11px;
    }

    .search-icon {
      left: 10px;
      width: 12px;
      height: 12px;
    }
  }
</style>