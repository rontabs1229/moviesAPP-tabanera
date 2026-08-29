<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRouter } from 'vue-router';
  import { Notyf } from 'notyf';

  import api from '../api';
  import { useGlobalStore } from '../stores/global';

  const router = useRouter();
  const globalStore = useGlobalStore();
  const { user } = storeToRefs(globalStore);

  let notyf = null;

  const userEmail = ref('');
  const userId = ref('');
  const reviewsList = ref([]);
  const isLoading = ref(true);
  const errorMessage = ref('');
  const isSidebarOpen = ref(false);

  // Filters, Search & Sorting state (Default sort: title-asc)
  const searchQuery = ref('');
  const selectedType = ref('All');
  const selectedGenre = ref('All');
  const sortBy = ref('title-asc');

  // Pagination state: Default 3 cards, increment by 3
  const visibleCount = ref(3);

  const genreOptions = [
    'All',
    'Action',
    'Comedy',
    'Fantasy',
    'Fiction',
    'Historical',
    'Horror',
    'Medical',
    'Melodrama',
    'Romance',
    'Thriller',
    'Time-Travel',
    'Zombie'
  ];

  async function fetchProfileAndReviews() {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      const userRes = await api.get('/users/details').catch(() => null);
      if (userRes) {
        const userData = userRes.data.user || userRes.data;
        userEmail.value = userData?.email || user.value?.email || '';
        userId.value = userData?._id || userData?.id || user.value?._id || '';
      }

      const moviesRes = await api.get('/movies/getMovies');
      const allMovies = moviesRes.data.movies || moviesRes.data || [];

      const userReviews = [];
      
      allMovies.forEach(movie => {
        let hasInteracted = false;
        let userRating = 0;
        let userCommentCount = 0;

        if (Array.isArray(movie.ratings)) {
          const foundRating = movie.ratings.find(r => (r.userId?._id || r.userId) === userId.value);
          if (foundRating) {
            userRating = foundRating.rating;
            hasInteracted = true;
          }
        }

        if (Array.isArray(movie.comments)) {
          const userComments = movie.comments.filter(c => (c.userId?._id || c.userId) === userId.value);
          if (userComments.length > 0) {
            userCommentCount = userComments.length;
            hasInteracted = true;
          }
        }

        if (hasInteracted) {
          userReviews.push({
            ...movie,
            id: movie._id || movie.id,
            userRating: userRating,
            userCommentsCount: userCommentCount,
            createdAt: movie.createdAt || new Date()
          });
        }
      });

      reviewsList.value = userReviews;
    } catch (error) {
      console.error('Error fetching profile or reviews:', error);
      errorMessage.value = 'Failed to load profile data.';
      notyf?.error('Failed to load profile data.');
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    notyf = new Notyf();
    fetchProfileAndReviews();
  });

  const userName = computed(() => {
    if (!userEmail.value) return 'K-Reviewer';
    return userEmail.value.split('@')[0];
  });

  const userInitial = computed(() => {
    return userEmail.value ? userEmail.value.charAt(0).toUpperCase() : 'J';
  });

  const totalReviewsCount = computed(() => reviewsList.value.length);

  // Computes whether the user has left any ratings to any movies
  const hasUserRatedAny = computed(() => {
    return reviewsList.value.some(item => (item.userRating || 0) > 0);
  });

  const filteredReviews = computed(() => {
    if (!Array.isArray(reviewsList.value)) return [];

    const query = searchQuery.value.trim().toLowerCase();

    return reviewsList.value
      .filter((item) => {
        const matchesSearch = !query || (item.title && item.title.toLowerCase().includes(query));

        const matchesType =
          selectedType.value === 'All' ||
          (selectedType.value === 'Drama' && item.contentType === 'Drama') ||
          (selectedType.value === 'Movie' && item.contentType === 'Movie') ||
          (selectedType.value === 'K-Drama' && (item.type === 'K-Drama' || item.contentType === 'Drama')) ||
          (selectedType.value === 'K-Movie' && (item.type === 'K-Movie' || item.contentType === 'Movie'));

        const matchesGenre =
          selectedGenre.value === 'All' ||
          (item.genre && item.genre.includes(selectedGenre.value));

        return matchesSearch && matchesType && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy.value === 'title-asc') {
          return (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy.value === 'title-desc') {
          return (b.title || '').localeCompare(a.title || '', undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy.value === 'latest') return (b.year || new Date(b.createdAt || 0)) - (a.year || new Date(a.createdAt || 0));
        if (sortBy.value === 'oldest') return (a.year || new Date(a.createdAt || 0)) - (b.year || new Date(b.createdAt || 0));
        return 0;
      });
  });

  const displayedReviews = computed(() => {
    return filteredReviews.value.slice(0, visibleCount.value);
  });

  const hasMore = computed(() => {
    return visibleCount.value < filteredReviews.value.length;
  });

  function loadMore() {
    visibleCount.value += 3;
  }

  function resetFilters() {
    searchQuery.value = '';
    selectedType.value = 'All';
    selectedGenre.value = 'All';
    sortBy.value = 'title-asc';
    visibleCount.value = 3;
  }

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
  }

  function handleCardClick(movieId) {
    router.push(`/movies/${movieId}`);
  }

  function goToContents() {
    router.push({ name: 'Contents' });
  }

  function formatContentType(item) {
    const type = item.contentType || item.type || '';
    if (type.toLowerCase().includes('drama') || type === 'Drama') return 'K-Drama';
    return 'K-Movie';
  }

  const fallbackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23eaeaea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23888'%3ENo Image Available%3C/text%3E%3C/svg%3E";

  function handleImageError(event) {
    event.target.src = fallbackImage;
  }
</script>

<template>
  <div class="collections-page">

    <!-- Off-Canvas Swoop Drawer -->
    <aside class="swoop-drawer" :class="{ open: isSidebarOpen }">
      <div class="drawer-header">
        <h3>Filter & Sort</h3>
        <button type="button" class="close-drawer-btn" @click="toggleSidebar">✕</button>
      </div>

      <div class="drawer-content">
        <div class="filter-group">
          <label class="filter-label">Content Type</label>
          <select v-model="selectedType" class="filter-select">
            <option value="All">All Types</option>
            <option value="Drama">K-Drama</option>
            <option value="Movie">K-Movie</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Genre</label>
          <select v-model="selectedGenre" class="filter-select">
            <option v-for="genre in genreOptions" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <select v-model="sortBy" class="filter-select">
            <option value="title-asc">Title (A - Z) [Default]</option>
            <option value="title-desc">Title (Z - A)</option>
            <option value="latest">Release Year (Newest)</option>
            <option value="oldest">Release Year (Oldest)</option>
          </select>
        </div>

        <button type="button" class="reset-filter-btn" @click="resetFilters">
          Reset Filters
        </button>
      </div>
    </aside>

    <div 
      v-if="isSidebarOpen" 
      class="drawer-backdrop" 
      @click="toggleSidebar"
    ></div>

    <div class="main-wrapper" :class="{ shifted: isSidebarOpen }">
      <div class="profile-container">

        <div class="profile-card">
          <div class="avatar-circle">
            {{ userInitial }}
          </div>
          
          <div class="profile-info">
            <p class="greeting-text">Hello K-Reviewer</p>
            <p class="profile-name">{{ userName }}</p>
          </div>

          <div class="stats-wrapper">
            <span class="stats-header-title">Total Reviews:</span>
            <span class="stat-value">{{ totalReviewsCount }}</span>
            <span class="stat-label">Reviews</span>
          </div>
        </div>

        <main class="main-content">
          <div class="section-header-row">
            <h2 class="section-title">My Reviews</h2>
            <button 
              type="button" 
              class="review-action-btn" 
              @click="goToContents"
            >
              {{ hasUserRatedAny ? 'K-Review More' : 'K-Review Now' }}
            </button>
          </div>

          <div class="toolbar-area">
            <button type="button" class="inline-filter-btn" @click="toggleSidebar">
              ☰ Filters
            </button>

            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by Title..."
                class="search-input"
              />
              <span v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">✕</span>
            </div>
          </div>

          <div v-if="isLoading" class="state-container">
            <p>Loading My Reviews...</p>
          </div>

          <div v-else-if="errorMessage" class="state-container error">
            <p>{{ errorMessage }}</p>
          </div>

          <div v-else-if="displayedReviews.length > 0" class="cards-grid">
            <div 
              v-for="item in displayedReviews" 
              :key="item._id || item.id" 
              class="content-card"
              @click="handleCardClick(item._id || item.id)"
            >
              <div class="card-top-info">
                <span class="card-type-badge">{{ formatContentType(item) }}</span>
                <span class="card-year">{{ item.year || '2012' }}</span>
              </div>

              <div class="card-image-wrapper">
                <img 
                  :src="item.image?.url || item.posterUrl || item.poster || item.image || fallbackImage" 
                  :alt="item.title"
                  class="card-image"
                  @error="handleImageError"
                />
              </div>

              <div class="card-body">
                <h3 class="card-title">{{ item.title }}</h3>
                <p class="card-info-line">
                  <span class="info-label">Genre:</span> {{ Array.isArray(item.genre) ? item.genre.join(', ') : item.genre }}
                </p>
                <p class="card-info-line" v-if="item.director">
                  <span class="info-label">Director:</span> {{ item.director }}
                </p>
                
                <div class="user-review-footer">
                  <div class="rating-section">
                    <span class="meta-label">My Rating:</span>
                    <div v-if="item.userRating > 0" class="stars">
                      <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= item.userRating }">★</span>
                    </div>
                    <span v-else class="no-rating-text">Please rate it!</span>
                  </div>
                  <div class="comment-section">
                    <span class="meta-label">My Comments</span>
                    <span class="comment-bubble-icon">💬</span>
                    <span class="comment-count">:{{ item.userCommentsCount || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="state-container">
            <p>No reviews match your search or filter criteria.</p>
          </div>

          <div v-if="!isLoading && displayedReviews.length > 0" class="pagination-container">
            <button v-if="hasMore" type="button" class="show-more-btn" @click="loadMore">
              Show More
            </button>
            <p v-else class="end-message">--- No More Reviews ---</p>
          </div>
        </main>

      </div>
    </div>

  </div>
</template>

<style scoped>
  .collections-page {
    font-family: 'Shanti', sans-serif;
    background-color: #D9FFF4;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 48px;
  }

  .swoop-drawer {
    position: fixed;
    top: 0;
    left: -280px;
    width: 280px;
    height: 100vh;
    background-color: #ffffff;
    z-index: 100;
    box-shadow: 4px 0 20px rgba(50, 30, 72, 0.15);
    transition: left 0.3s ease-in-out;
    padding: 24px;
    box-sizing: border-box;
  }

  .swoop-drawer.open {
    left: 0;
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }

  .drawer-header h3 {
    margin: 0;
    color: #321E48;
    font-size: 18px;
  }

  .close-drawer-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #321E48;
  }

  .drawer-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-label {
    font-size: 13px;
    font-weight: 700;
    color: #321E48;
  }

  .filter-select {
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #43637E;
    outline: none;
    background-color: #fff;
    cursor: pointer;
  }

  .filter-select:focus {
    border-color: #65DCD5;
  }

  .reset-filter-btn {
    margin-top: 10px;
    background-color: transparent;
    color: #321E48;
    border: 2px solid #321E48;
    border-radius: 6px;
    padding: 10px;
    font-family: 'Shanti', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-filter-btn:hover {
    background-color: #321E48;
    color: #ffffff;
  }

  .drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(50, 30, 72, 0.2);
    z-index: 90;
  }

  .main-wrapper {
    transition: transform 0.3s ease-in-out;
    padding: clamp(24px, 5vw, 48px) 16px;
    max-width: 1280px;
    margin: 0 auto;
  }

  .main-wrapper.shifted {
    transform: translateX(120px);
  }

  .profile-container {
    width: 100%;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background-color: white;
    border-radius: 16px;
    padding: clamp(20px, 4vw, 32px);
    box-shadow: 0 12px 32px rgba(50, 30, 72, 0.12);
    margin-bottom: 32px;
  }

  .avatar-circle {
    width: 72px;
    height: 72px;
    min-width: 72px;
    border-radius: 50%;
    background-color: #321E48;
    color: white;
    font-size: 32px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .greeting-text {
    font-size: 14px;
    color: #43637E;
    margin: 0;
  }

  .profile-name {
    font-family: 'Shalimar', cursive;
    font-size: 36px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
    line-height: 1;
  }

  .stats-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: auto;
  }

  .stats-header-title {
    font-size: 13px;
    font-weight: 600;
    color: #321E48;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #43637E;
  }

  .stat-label {
    font-size: 11px;
    color: #43637E;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
  }

  .review-action-btn {
    background-color: #321E48;
    color: #D9FFF4;
    border: 2px solid #65DCD5;
    border-radius: 8px;
    padding: 8px 18px;
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(50, 30, 72, 0.1);
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .review-action-btn:hover {
    background-color: #43637E;
    transform: translateY(-2px);
  }

  .toolbar-area {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .inline-filter-btn {
    background-color: #321E48;
    color: #D9FFF4;
    border: 2px solid #65DCD5;
    border-radius: 8px;
    padding: 10px 20px;
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(50, 30, 72, 0.1);
    transition: transform 0.2s ease, background-color 0.2s ease;
    white-space: nowrap;
  }

  .inline-filter-btn:hover {
    background-color: #43637E;
    transform: translateY(-2px);
  }

  .search-box {
    position: relative;
    flex: 1;
    max-width: 450px;
  }

  .search-input {
    width: 100%;
    padding: 10px 36px 10px 16px;
    border-radius: 8px;
    border: 2px solid #321E48;
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    outline: none;
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(50, 30, 72, 0.05);
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    border-color: #65DCD5;
  }

  .clear-search-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #43637E;
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
  }

  .cards-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 28px;
    align-items: stretch;
  }

  .cards-grid > * {
    flex: 0 0 calc((100% - 56px) / 3);
    max-width: calc((100% - 56px) / 3);
    box-sizing: border-box;
  }

  @media (max-width: 1024px) {
    .cards-grid > * {
      flex: 0 0 calc((100% - 28px) / 2);
      max-width: calc((100% - 28px) / 2);
    }
  }

  @media (max-width: 640px) {
    .cards-grid > * {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }

  .content-card {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(50, 30, 72, 0.08);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .content-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(50, 30, 72, 0.15);
  }

  .card-top-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-type-badge {
    font-family: 'Shalimar', cursive;
    font-size: 26px;
    color: #c99e32;
    font-weight: 700;
    line-height: 1;
  }

  .card-year {
    font-size: 14px;
    font-weight: 700;
    color: #321E48;
  }

  .card-image-wrapper {
    width: 100%;
    height: 220px;
    border-radius: 10px;
    overflow: hidden;
    background-color: #f0f0f0;
    margin-bottom: 14px;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .content-card:hover .card-image {
    transform: scale(1.03);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: #321E48;
    margin: 0 0 6px 0;
    text-align: center;
    line-height: 1.2;
  }

  .card-info-line {
    font-size: 13px;
    color: #43637E;
    margin: 0;
    line-height: 1.4;
  }

  .info-label {
    font-weight: 700;
    color: #321E48;
  }

  .user-review-footer {
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rating-section, .comment-section {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
  }

  .meta-label {
    font-weight: 700;
    color: #321E48;
  }

  .stars {
    display: flex;
    gap: 2px;
  }

  .star {
    font-size: 24px;
    color: #ddd;
    line-height: 1;
  }

  .star.filled {
    color: #f39c12;
  }

  .no-rating-text {
    font-size: 12px;
    color: #c99e32;
    font-weight: 700;
    font-style: italic;
  }

  .comment-bubble-icon {
    font-size: 14px;
    margin-left: 2px;
  }

  .comment-count {
    font-weight: 700;
    color: #321E48;
  }

  .state-container {
    text-align: center;
    padding: 40px;
    background-color: #ffffff;
    border-radius: 12px;
    color: #43637E;
    box-shadow: 0 8px 20px rgba(50, 30, 72, 0.08);
  }

  .state-container.error {
    color: #c0392b;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }

  .show-more-btn {
    background-color: #321E48;
    color: #ffffff;
    font-family: 'Shanti', sans-serif;
    font-size: 15px;
    font-weight: 700;
    border: 2px solid #65DCD5;
    border-radius: 8px;
    padding: 12px 32px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .show-more-btn:hover {
    background-color: #43637E;
    transform: translateY(-2px);
  }

  .end-message {
    font-size: 15px;
    color: #321E48;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
  }

  @media (max-width: 640px) {
    .main-wrapper.shifted {
      transform: translateX(0);
    }
    .toolbar-area {
      flex-direction: column;
      align-items: stretch;
    }
    .search-box {
      max-width: 100%;
    }
  }
</style>