<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRouter } from 'vue-router';
  import { Notyf } from 'notyf';
  import 'notyf/notyf.min.css';

  import api from '../api';
  import { useGlobalStore } from '../stores/global';
  import ContentCard from '../components/ContentCard.vue';
  import AddContent from '../components/AddContent.vue';

  const router = useRouter();
  const globalStore = useGlobalStore();
  const { user } = storeToRefs(globalStore);

  let notyf = null;

  const adminEmail = ref('');
  const contentsList = ref([]);
  const isAddingContent = ref(false);

  // Controls & Search (Default sorted to alphabetical A-Z)
  const searchQuery = ref('');
  const sortBy = ref('az');
  const selectedType = ref('all');
  const selectedGenre = ref('all');

  const genres = [
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

  async function fetchAdminData() {
    try {
      const [userRes, contentsRes] = await Promise.allSettled([
        api.get('/users/details'),
        api.get('/movies/getMovies')
      ]);

      if (userRes.status === 'fulfilled') {
        const userData = userRes.value.data.user || userRes.value.data;
        adminEmail.value = userData?.email || user.value?.email || 'admin@example.com';
      }

      if (contentsRes.status === 'fulfilled') {
        const moviesData = contentsRes.value.data.movies || contentsRes.value.data || [];
        contentsList.value = Array.isArray(moviesData) ? moviesData : [];
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      notyf?.error('Failed to load dashboard data.');
    }
  }

  onMounted(() => {
    notyf = new Notyf();
    fetchAdminData();
  });

  const adminName = computed(() => {
    if (!adminEmail.value) return 'Admin';
    return adminEmail.value.split('@')[0];
  });

  const adminInitial = computed(() => {
    return adminEmail.value ? adminEmail.value.charAt(0).toUpperCase() : 'A';
  });

  // Content Counters
  const totalContentsCount = computed(() => contentsList.value.length);

  const kMoviesCount = computed(() => {
    return contentsList.value.filter(item => item.contentType === 'Movie').length;
  });

  const kDramasCount = computed(() => {
    return contentsList.value.filter(item => item.contentType === 'Drama').length;
  });

  const filteredAndSortedContents = computed(() => {
    let result = [...contentsList.value];
    const query = searchQuery.value.trim().toLowerCase();

    // Filter by Title / Letter Search
    if (query) {
      result = result.filter(item => item.title && item.title.toLowerCase().includes(query));
    }

    // Filter by Content Type
    if (selectedType.value !== 'all') {
      result = result.filter(item => item.contentType === selectedType.value);
    }

    // Filter by Comma-Separated Genre String
    if (selectedGenre.value !== 'all') {
      const targetGenre = selectedGenre.value.toLowerCase();
      result = result.filter(item => {
        if (!item.genre) return false;
        const itemGenres = item.genre.split(',').map(g => g.trim().toLowerCase());
        return itemGenres.includes(targetGenre);
      });
    }

    // Sorting Logic
    return result.sort((a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;

      const calcRating = (list) => {
        if (!list || !list.length) return 0;
        return list.reduce((acc, curr) => acc + curr.rating, 0) / list.length;
      };

      const ratingA = calcRating(a.ratings);
      const ratingB = calcRating(b.ratings);

      const titleA = a.title || '';
      const titleB = b.title || '';

      switch (sortBy.value) {
        case 'az':
          return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
        case 'za':
          return titleB.localeCompare(titleA, undefined, { numeric: true, sensitivity: 'base' });
        case 'oldest':
          return yearA - yearB;
        case 'highest':
          return ratingB - ratingA;
        case 'lowest':
          return ratingA - ratingB;
        case 'latest':
        default:
          return yearB - yearA;
      }
    });
  });

  function toggleAddContent() {
    isAddingContent.value = !isAddingContent.value;
  }

  function handleContentAdded(newMovie) {
    contentsList.value.unshift(newMovie);
    isAddingContent.value = false;
    notyf?.success('Content added successfully!');
  }

  function handleEditContent(content) {
    router.push(`/movies/${content._id}/edit`);
  }

  async function handleDeleteContent(movieId) {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.delete(`/movies/deleteMovie/${movieId}`);
      contentsList.value = contentsList.value.filter(item => item._id !== movieId);
      notyf?.success('Content deleted successfully!');
    } catch (error) {
      console.error('Error deleting content:', error);
      notyf?.error('Failed to delete content.');
    }
  }
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">

      <!-- Admin Top Card -->
      <div class="profile-card">
        <div class="avatar-circle">
          {{ adminInitial }}
        </div>

        <div class="profile-info">
          <p class="greeting-text">Hello K-Admin,</p>
          <p class="profile-name">{{ adminName }}</p>
        </div>

        <!-- Breakdown Counters -->
        <div class="stats-wrapper">
          <div class="stat-item total-highlight">
            <span class="stat-value total-value">{{ totalContentsCount }}</span>
            <span class="stat-label total-label">Total</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ kMoviesCount }}</span>
            <span class="stat-label">K-Movies</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ kDramasCount }}</span>
            <span class="stat-label">K-Dramas</span>
          </div>
        </div>
      </div>

      <!-- Toggle Add Content Button -->
      <div class="top-action-row">
        <button type="button" class="btn btn-primary" @click="toggleAddContent">
          {{ isAddingContent ? 'Close Form' : '+ Add New Content' }}
        </button>
      </div>

      <!-- Expandable AddContent Component -->
      <AddContent
        v-if="isAddingContent"
        @contentAdded="handleContentAdded"
        @cancel="isAddingContent = false"
      />

      <!-- Contents Section -->
      <div class="reviews-section">
        <div class="section-header">
          <div class="header-main-row">
            <h2 class="section-title">Contents</h2>

            <div class="controls-wrapper">
              <!-- Search Bar -->
              <div class="control-group search-group">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search title..."
                  class="search-input"
                />
                <span v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">✕</span>
              </div>

              <!-- Filter By Type -->
              <div class="control-group">
                <label for="type-filter" class="control-label">Filter By:</label>
                <select id="type-filter" v-model="selectedType" class="select-input">
                  <option value="all">All Types</option>
                  <option value="Movie">Movie</option>
                  <option value="Drama">Drama</option>
                </select>
              </div>

              <!-- Filter By Genre -->
              <div class="control-group">
                <select id="genre-filter" v-model="selectedGenre" class="select-input">
                  <option value="all">All Genres</option>
                  <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>

              <!-- Sort By -->
              <div class="control-group">
                <label for="sort" class="control-label">Sort By:</label>
                <select id="sort" v-model="sortBy" class="select-input">
                  <option value="az">A - Z</option>
                  <option value="za">Z - A</option>
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Render Content Cards -->
        <div v-if="filteredAndSortedContents.length" class="reviews-list">
          <ContentCard
            v-for="item in filteredAndSortedContents"
            :key="item._id"
            :content="item"
            @edit="handleEditContent"
            @delete="handleDeleteContent"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <p class="empty-title">No contents available</p>
          <p class="empty-subtitle">Try resetting filters or click "+ Add New Content" above to create one.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
  .profile-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background-color: #D9FFF4;
    padding: clamp(24px, 5vw, 48px) 16px;
    font-family: 'Shanti', sans-serif;
  }

  .profile-container {
    width: 100%;
    max-width: 850px;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background-color: white;
    border-radius: 16px;
    padding: clamp(20px, 4vw, 32px);
    box-shadow: 0 12px 32px rgba(50, 30, 72, 0.12);
    margin-bottom: 16px;
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
    align-items: center;
    gap: 16px;
    margin-left: auto;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #321E48;
    line-height: 1.1;
  }

  /* Golden Yellow Highlight for Total */
  .stat-value.total-value {
    font-size: 30px;
    color: #D4A017;
    font-weight: 800;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    color: #43637E;
    text-transform: uppercase;
  }

  .stat-label.total-label {
    color: #B8860B;
    font-weight: 700;
  }

  .stat-divider {
    width: 1px;
    height: 28px;
    background-color: #E2E8F0;
  }

  .top-action-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }

  .reviews-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .header-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 22px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
  }

  .btn {
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.15s ease;
  }

  .btn-primary {
    background-color: #321E48;
    color: white;
  }

  .btn-primary:hover {
    background-color: #43637E;
    transform: translateY(-2px);
  }

  .controls-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    background-color: white;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(50, 30, 72, 0.06);
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-group {
    position: relative;
  }

  .search-input {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    padding: 6px 28px 6px 10px;
    border-radius: 8px;
    border: 1px solid #43637E;
    background-color: white;
    color: #321E48;
    outline: none;
    width: 140px;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    border-color: #65DCD5;
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    font-size: 12px;
    color: #43637E;
    cursor: pointer;
  }

  .control-label {
    font-size: 13px;
    color: #321E48;
    font-weight: 600;
  }

  .select-input {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #43637E;
    background-color: white;
    color: #321E48;
    outline: none;
    cursor: pointer;
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .empty-state {
    background-color: white;
    border-radius: 16px;
    padding: 40px 20px;
    text-align: center;
    box-shadow: 0 8px 20px rgba(50, 30, 72, 0.08);
  }

  .empty-title {
    font-size: 16px;
    font-weight: 700;
    color: #321E48;
    margin: 0 0 6px 0;
  }

  .empty-subtitle {
    font-size: 14px;
    color: #43637E;
    margin: 0;
  }

  @media (max-width: 600px) {
    .profile-card {
      flex-direction: column;
      text-align: center;
    }

    .stats-wrapper {
      margin-left: 0;
      justify-content: center;
      width: 100%;
      margin-top: 12px;
    }

    .header-main-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .controls-wrapper {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }

    .control-group {
      justify-content: space-between;
    }

    .search-input {
      width: 100%;
    }
  }
</style>