<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import CollectionsCard from '../components/CollectionsCard.vue';

const router = useRouter();

// State
const contents = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isSidebarOpen = ref(false);

// Filters, Search & Sorting state
const searchQuery = ref('');
const selectedType = ref('All');
const selectedGenre = ref('All');
const sortBy = ref('title-asc');

// Pagination state: Default 6 cards
const visibleCount = ref(6);

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

async function fetchContents() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/movies/getMovies');
    contents.value = response.data?.movies || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    errorMessage.value = 'Failed to load collections. Please try again later.';
    contents.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleCardClick(movieId) {
  router.push({ name: 'Review', params: { movieId } });
}

// Reset Filters & Search
function resetFilters() {
  searchQuery.value = '';
  selectedType.value = 'All';
  selectedGenre.value = 'All';
  sortBy.value = 'title-asc';
}

// Search & Filtered contents logic
const filteredContents = computed(() => {
  if (!Array.isArray(contents.value)) return [];

  const query = searchQuery.value.trim().toLowerCase();

  return contents.value
    .filter((item) => {
      // Search matching title
      const matchesSearch = !query || (item.title && item.title.toLowerCase().includes(query));

      // Type matching
      const matchesType =
        selectedType.value === 'All' ||
        (selectedType.value === 'Drama' && item.contentType === 'Drama') ||
        (selectedType.value === 'Movie' && item.contentType === 'Movie');

      // Genre matching
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
      if (sortBy.value === 'latest') return (b.year || 0) - (a.year || 0);
      if (sortBy.value === 'oldest') return (a.year || 0) - (b.year || 0);
      return 0;
    });
});

const displayedContents = computed(() => {
  return filteredContents.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return visibleCount.value < filteredContents.value.length;
});

function loadMore() {
  visibleCount.value += 6;
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

onMounted(() => {
  fetchContents();
});
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
        <!-- Content Type Filter -->
        <div class="filter-group">
          <label class="filter-label">Content Type</label>
          <select v-model="selectedType" class="filter-select">
            <option value="All">All Types</option>
            <option value="Drama">K-Drama</option>
            <option value="Movie">K-Movie</option>
          </select>
        </div>

        <!-- Genre Filter -->
        <div class="filter-group">
          <label class="filter-label">Genre</label>
          <select v-model="selectedGenre" class="filter-select">
            <option v-for="genre in genreOptions" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </div>

        <!-- Sort By -->
        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <select v-model="sortBy" class="filter-select">
            <option value="title-asc">Title (A - Z) [Default]</option>
            <option value="title-desc">Title (Z - A)</option>
            <option value="latest">Release Year (Newest)</option>
            <option value="oldest">Release Year (Oldest)</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button type="button" class="reset-filter-btn" @click="resetFilters">
          Reset Filters
        </button>
      </div>
    </aside>

    <!-- Overlay Backdrop -->
    <div 
      v-if="isSidebarOpen" 
      class="drawer-backdrop" 
      @click="toggleSidebar"
    ></div>

    <!-- Main View Area -->
    <div class="main-wrapper" :class="{ shifted: isSidebarOpen }">
      <main class="main-content">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <h2>Discover Your Favorite K-Contents</h2>
          <p>Explore, rate, and share reviews on trending Korean movies and dramas.</p>
        </div>

        <!-- Toolbar Area: Filters Button + Search Bar -->
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

        <!-- States -->
        <div v-if="isLoading" class="state-container">
          <p>Loading K-Contents...</p>
        </div>

        <div v-else-if="errorMessage" class="state-container error">
          <p>{{ errorMessage }}</p>
        </div>

        <!-- 3 Cards Per Row Grid -->
        <div v-else-if="displayedContents.length > 0" class="cards-grid">
          <CollectionsCard
            v-for="item in displayedContents"
            :key="item._id"
            :content="item"
            @select="handleCardClick"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="state-container">
          <p>No K-Contents match your search or filter criteria.</p>
        </div>

        <!-- Pagination Controls -->
        <div v-if="!isLoading && displayedContents.length > 0" class="pagination-container">
          <button v-if="hasMore" type="button" class="show-more-btn" @click="loadMore">
            Show More
          </button>
          <p v-else class="end-message">-- No More K-Contents found --</p>
        </div>
      </main>
    </div>

  </div>
</template>

<style scoped>
.collections-page {
  font-family: 'Shanti', sans-serif;
  background-color: #f4f7f6;
  min-height: calc(100vh - 60px);
  position: relative;
  overflow-x: hidden;
}

/* Off-Canvas Swoop Drawer */
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
}

.filter-select:focus {
  border-color: #65DCD5;
}

/* Reset Filter Button */
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

/* Backdrop */
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(50, 30, 72, 0.2);
  z-index: 90;
}

/* Main View Wrapper */
.main-wrapper {
  transition: transform 0.3s ease-in-out;
  padding: 32px 24px;
  max-width: 1280px;
  margin: 0 auto;
}

.main-wrapper.shifted {
  transform: translateX(120px);
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-banner {
  background-color: #321E48;
  color: #ffffff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(50, 30, 72, 0.1);
}

.hero-banner h2 {
  margin: 0 0 8px 0;
  font-size: 26px;
  color: #65DCD5;
}

.hero-banner p {
  margin: 0;
  font-size: 15px;
  color: #D9FFF4;
}

/* Toolbar Layout for Filter Button & Search Bar */
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

/* Search Box Container */
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

/* Grid Layout: 3 Cards Per Row */
.cards-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
}

.cards-grid > * {
  width: calc((100% - 56px) / 3);
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .cards-grid > * {
    width: calc((100% - 28px) / 2);
  }
}

@media (max-width: 640px) {
  .cards-grid > * {
    width: 100%;
  }
}

.state-container {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  color: #43637E;
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
  font-size: 14px;
  color: #888888;
  font-style: italic;
  margin: 0;
}

@media (max-width: 1024px) {
  .cards-grid {
    grid-path-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
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