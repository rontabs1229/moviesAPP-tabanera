<template>
  <main class="homepage">

    <!-- 1. Banner -->
    <section class="banner">
      <div class="banner-content">
        <img src="/logo-main.png" alt="RSTJ K-Reviews logo" class="banner-logo" />
        <span class="banner-eyebrow">your next favorite obsession</span>
        <h1 class="banner-title">RSTJ K-Reviews</h1>
        <p class="banner-desc">
          Honest, spoiler-free reviews and ratings for K-dramas, K-movies, and everything in between —
          written by fans, for fans. Find your next binge before everyone else does.
        </p>
        <div class="banner-actions">
          <router-link to="/movies" class="btn btn-primary">View Collections</router-link>
          <router-link to="/register" class="btn btn-outline">Join the Community</router-link>
        </div>
      </div>
    </section>

    <!-- 2. Split Showcase Section (Top-Rated Carousel & Buzz-Worthy List) -->
    <section class="section showcase-section">
      <div class="showcase-grid">
        
        <!-- Left Side: Top-Rated Carousel with overlapping slide transition & ranking badge without background image -->
        <div 
          class="top-rated-column"
          @mouseenter="stopAutoRotate"
          @mouseleave="startAutoRotate"
        >
          <div class="column-header">
            <span class="eyebrow">what the community loves</span>
            <h2 class="section-title">Top-Rated</h2>
          </div>

          <div class="carousel-container" v-if="topRatedCarousel.length > 0">
            <button class="carousel-control prev" @click="prevSlide" aria-label="Previous slide">❮</button>
            
            <div class="carousel-slides-wrapper">
              <div 
                v-for="(slide, index) in topRatedCarousel" 
                :key="slide._id || slide.id"
                class="carousel-slide"
                :class="{ active: index === currentSlideIndex }"
                :style="{ backgroundImage: `linear-gradient(rgba(50, 30, 72, 0.4), rgba(50, 30, 72, 0.6)), url(${getMovieImageUrl(slide)})` }"
              >
                <!-- Ranking Badge without poster image -->
                <div class="slide-poster-badge">
                  <span class="poster-rank-badge">#{{ slide.rank }}</span>
                </div>
                
                <div class="slide-content">
                  <div class="slide-play-btn" @click="selectMovie(slide)">▶</div>
                  <div class="slide-text-info">
                    <h3 class="slide-title">{{ slide.title }}</h3>
                    <div class="slide-rating-line">
                      ★ <span>{{ formatRating(slide.computedAverage) }}</span> / 5 <span class="computed-label">(computed ratings)</span>
                    </div>
                    <p class="slide-subtitle">Top Rated #{{ slide.rank }}</p>
                    <div class="slide-metrics">
                      <span>👍 {{ slide.likes?.length || slide.likes || 0 }}</span>
                      <span>⭐ {{ slide.totalRatingsCount || 0 }} ratings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="carousel-control next" @click="nextSlide" aria-label="Next slide">❯</button>
          </div>
        </div>

        <!-- Right Side: Buzz-Worthy -->
        <div class="buzz-worthy-column">
          <div class="column-header">
            <span class="eyebrow">trending discussion</span>
            <h2 class="section-title">Buzz-Worthy</h2>
          </div>

          <div class="buzz-list" v-if="buzzWorthyMovies.length > 0">
            <div 
              class="buzz-card" 
              v-for="movie in buzzWorthyMovies" 
              :key="movie._id || movie.id"
              @click="selectMovie(movie)"
            >
              <div class="buzz-poster" :style="{ backgroundImage: `url(${getMovieImageUrl(movie)})` }">
                <span class="buzz-play-icon">▶</span>
              </div>
              <div class="buzz-info">
                <h3 class="buzz-title">{{ movie.title }}</h3>
                <p class="buzz-meta">{{ movie.genre }} &middot; {{ movie.year }}</p>
                <div class="buzz-stats">
                  <span>👍 {{ movie.likes?.length || movie.likes || 0 }}</span>
                  <span>💬 {{ movie.comments?.length || movie.commentsCount || 0 }} comments</span>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-buzz" v-else>
            <p>No trending discussions yet. Be the first to comment on a show!</p>
          </div>
        </div>

      </div>

      <!-- Below Left and Right Sides: View All -->
      <div class="section-footer">
        <router-link to="/movies" class="btn btn-ghost">View All</router-link>
      </div>
    </section>

    <!-- 3. Register Now -->
    <section class="register-now">
      <span class="eyebrow-script">be part of it</span>
      <h2 class="register-title">Join the Community of Reviewers</h2>
      <p class="register-desc">
        Rate your favorite shows, write reviews that actually get read, and build a watchlist
        with thousands of fellow K-content fans. It's free, it takes a minute, and your next
        favorite drama is waiting.
      </p>
      <router-link to="/register" class="btn btn-cta">Join Now</router-link>
    </section>

  </main>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../api';

  const router = useRouter();
  const moviesList = ref([]);
  const currentSlideIndex = ref(0);
  let autoRotateTimer = null;

  async function fetchMovies() {
    try {
      const response = await api.get('/movies/getMovies');
      const rawMovies = response.data?.movies || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      
      moviesList.value = rawMovies.map(movie => {
        let imageUrl = '';
        if (movie.image) {
          imageUrl = typeof movie.image === 'string' ? movie.image : (movie.image.url || '');
        } else if (movie.poster) {
          imageUrl = movie.poster;
        }
        return {
          ...movie,
          normalizedImage: imageUrl
        };
      });
    } catch (err) {
      console.error('Failed to fetch movies from database:', err);
    }
  }

  function getMovieImageUrl(movie) {
    if (!movie) return '';
    return movie.normalizedImage || movie.poster || (typeof movie.image === 'string' ? movie.image : movie.image?.url) || '';
  }

  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(() => {
      nextSlide();
    }, 4500);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  onMounted(() => {
    fetchMovies().then(() => {
      startAutoRotate();
    });
  });

  onUnmounted(() => {
    stopAutoRotate();
  });

  const buzzWorthyMovies = computed(() => {
    return [...moviesList.value]
      .filter(movie => {
        const count = movie.comments?.length || movie.commentsCount || 0;
        return count > 0;
      })
      .sort((a, b) => {
        const countA = a.comments?.length || a.commentsCount || 0;
        const countB = b.comments?.length || b.commentsCount || 0;
        return countB - countA;
      })
      .slice(0, 4);
  });

  const topRatedCarousel = computed(() => {
    return moviesList.value
      .map(movie => {
        const ratingsArr = Array.isArray(movie.ratings) ? movie.ratings : [];
        let computedAverage = 0;
        
        if (ratingsArr.length > 0) {
          const sum = ratingsArr.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
          computedAverage = sum / ratingsArr.length;
        } else {
          computedAverage = Number(movie.rating || movie.averageRating || 0);
        }

        return {
          ...movie,
          computedAverage,
          totalRatingsCount: ratingsArr.length || movie.ratingCount || 0
        };
      })
      .filter(movie => movie.computedAverage > 0)
      .sort((a, b) => {
        if (b.computedAverage !== a.computedAverage) {
          return b.computedAverage - a.computedAverage;
        }
        return b.totalRatingsCount - a.totalRatingsCount;
      })
      .slice(0, 3)
      .map((movie, index) => ({ ...movie, rank: index + 1 }));
  });

  const currentSlide = computed(() => {
    if (topRatedCarousel.value.length === 0) return {};
    return topRatedCarousel.value[currentSlideIndex.value] || topRatedCarousel.value[0];
  });

  const nextSlide = () => {
    if (topRatedCarousel.value.length === 0) return;
    currentSlideIndex.value = (currentSlideIndex.value + 1) % topRatedCarousel.value.length;
  };

  const prevSlide = () => {
    if (topRatedCarousel.value.length === 0) return;
    currentSlideIndex.value = (currentSlideIndex.value - 1 + topRatedCarousel.value.length) % topRatedCarousel.value.length;
  };

  const formatRating = (val) => {
    if (!val || isNaN(Number(val))) return '4.5';
    const num = Number(val);
    const scaled = num > 5 ? num / 2 : num;
    return scaled.toFixed(1);
  };

  const selectMovie = (movie) => {
    const movieId = movie._id || movie.id;
    if (movieId) {
      router.push(`/movies/${movieId}`);
    }
  };
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Shalimar&family=Shanti&display=swap');

  .homepage {
    font-family: 'Shanti', sans-serif;
    overflow-x: hidden;
    background-color: #f7fafc;
  }

  .btn {
    display: inline-block;
    font-family: 'Shanti', sans-serif;
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 999px;
    border: 2px solid transparent;
    transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-2px);
  }

  /* ---------- 1. Banner ---------- */
  .banner {
    background: linear-gradient(135deg, #321E48 0%, #43637E 100%);
    padding: 90px 24px 80px;
    display: flex;
    justify-content: center;
    text-align: center;
  }

  .banner-content {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .banner-logo {
    height: 120px;
    margin-bottom: 16px;
  }

  .banner-eyebrow {
    font-family: 'Shalimar', cursive;
    font-size: 35px;
    color: #65DCD5;
    margin-bottom: 4px;
  }

  .banner-title {
    font-family: 'Shanti', serif;
    font-size: 44px;
    font-weight: 700;
    color: #D9FFF4;
    margin: 0 0 16px;
  }

  .banner-desc {
    font-size: 16px;
    line-height: 1.6;
    color: #D9FFF4;
    opacity: 0.9;
    margin-bottom: 32px;
  }

  .banner-actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-primary {
    background-color: #65DCD5;
    color: #321E48;
  }

  .btn-primary:hover {
    background-color: #D9FFF4;
  }

  .btn-outline {
    background-color: transparent;
    color: #D9FFF4;
    border-color: #D9FFF4;
  }

  .btn-outline:hover {
    background-color: #D9FFF4;
    color: #321E48;
  }

  /* ---------- Shared section styles ---------- */
  .section {
    padding: 64px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .column-header {
    margin-bottom: 24px;
  }

  .eyebrow {
    display: block;
    font-family: 'Shalimar', cursive;
    font-size: 30px;
    color: #43637E;
    margin-bottom: 2px;
  }

  .section-title {
    font-family: 'Shanti', serif;
    font-size: 26px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
  }

  .section-footer {
    text-align: center;
    margin-top: 48px;
  }

  .btn-ghost {
    background-color: transparent;
    color: #321E48;
    border-color: #321E48;
  }

  .btn-ghost:hover {
    background-color: #321E48;
    color: #D9FFF4;
  }

  /* ---------- Showcase Layout ---------- */
  .showcase-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 36px;
    align-items: stretch;
  }

  /* Left Side: Top-Rated Carousel styling with overlapping transition */
  .top-rated-column {
    display: flex;
    flex-direction: column;
  }

  .carousel-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 380px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(50, 30, 72, 0.15);
    display: flex;
    align-items: center;
    background-color: #1a1a1a;
  }

  .carousel-slides-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 380px;
  }

  .carousel-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 32px;
    background-size: cover;
    background-position: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out, transform 0.8s ease-in-out;
    transform: scale(1.03);
  }

  .carousel-slide.active {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
    z-index: 2;
  }

  .slide-poster-badge {
    position: absolute;
    top: 24px;
    left: 24px;
    width: 65px;
    height: 90px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    background-color: rgba(26, 26, 26, 0.75);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden;
  }

  .poster-rank-badge {
    background-color: #FFD700;
    color: #1a1a1a;
    font-size: 12px;
    font-weight: 800;
    padding: 3px 7px;
    border-bottom-right-radius: 6px;
    line-height: 1.2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .slide-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    background: rgba(50, 30, 72, 0.88);
    backdrop-filter: blur(8px);
    padding: 16px 20px;
    border-radius: 12px;
  }

  .slide-play-btn {
    width: 48px;
    height: 48px;
    background-color: #65DCD5;
    color: #321E48;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .slide-play-btn:hover {
    transform: scale(1.05);
    background-color: #D9FFF4;
  }

  .slide-text-info {
    display: flex;
    flex-direction: column;
  }

  .slide-title {
    font-size: 20px;
    font-weight: 700;
    color: #D9FFF4;
    margin: 0 0 2px;
  }

  .slide-rating-line {
    font-size: 14px;
    color: #ffd700;
    font-weight: 700;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .slide-rating-line span {
    color: #D9FFF4;
  }

  .computed-label {
    font-size: 11px;
    color: #65DCD5;
    font-weight: 400;
    margin-left: 4px;
    opacity: 0.85;
  }

  .slide-subtitle {
    font-size: 12px;
    color: #65DCD5;
    margin: 0 0 6px;
    font-weight: 600;
  }

  .slide-metrics {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #D9FFF4;
    opacity: 0.9;
  }

  .carousel-control {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: #D9FFF4;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }

  .carousel-control:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .carousel-control.prev {
    left: 16px;
  }

  .carousel-control.next {
    right: 16px;
  }

  /* Right Side: Buzz-Worthy list styling (enlarged) */
  .buzz-worthy-column {
    display: flex;
    flex-direction: column;
  }

  .buzz-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .empty-buzz {
    background: #ffffff;
    padding: 24px;
    border-radius: 14px;
    text-align: center;
    color: #43637E;
    font-size: 14px;
    box-shadow: 0 4px 16px rgba(50, 30, 72, 0.08);
  }

  .buzz-card {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #ffffff;
    padding: 16px 20px;
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(50, 30, 72, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }

  .buzz-card:hover {
    transform: translateX(4px);
    box-shadow: 0 6px 20px rgba(50, 30, 72, 0.12);
  }

  .buzz-poster {
    width: 120px;
    aspect-ratio: 16 / 9;
    border-radius: 10px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-size: cover;
    background-position: center;
    background-color: #e2e8f0;
  }

  .buzz-play-icon {
    color: #D9FFF4;
    font-size: 18px;
    background: rgba(0, 0, 0, 0.4);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .buzz-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .buzz-title {
    font-size: 17px;
    font-weight: 700;
    color: #321E48;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .buzz-meta {
    font-size: 13px;
    color: #43637E;
    margin: 0 0 6px;
  }

  .buzz-stats {
    display: flex;
    gap: 14px;
    font-size: 12px;
    color: #718096;
  }

  /* ---------- 3. Register Now ---------- */
  .register-now {
    background-color: #65DCD5;
    padding: 72px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .eyebrow-script {
    font-family: 'Shalimar', cursive;
    font-size: 35px;
    color: #321E48;
    margin-bottom: 4px;
  }

  .register-title {
    font-family: 'Shanti', serif;
    font-size: 30px;
    font-weight: 700;
    color: #321E48;
    margin: 0 0 16px;
    max-width: 560px;
  }

  .register-desc {
    font-size: 16px;
    line-height: 1.6;
    color: #321E48;
    max-width: 520px;
    margin-bottom: 28px;
  }

  .btn-cta {
    background-color: #321E48;
    color: #D9FFF4;
  }

  .btn-cta:hover {
    background-color: #43637E;
  }

  /* ================= Responsive ================= */

  @media (max-width: 992px) {
    .showcase-grid {
      grid-template-columns: 1fr;
      gap: 48px;
    }

    .banner {
      padding: 72px 20px 64px;
    }

    .banner-title {
      font-size: 36px;
    }

    .carousel-container {
      min-height: 300px;
    }
  }

  @media (max-width: 576px) {
    .section {
      padding: 48px 16px;
    }

    .banner {
      padding: 56px 16px 48px;
    }

    .banner-title {
      font-size: 30px;
    }

    .banner-desc {
      font-size: 15px;
    }

    .banner-actions {
      flex-direction: column;
      width: 100%;
    }

    .btn {
      width: 100%;
      text-align: center;
    }

    .section-title {
      font-size: 24px;
    }

    .register-title {
      font-size: 24px;
    }

    .slide-content {
      padding: 12px;
    }

    .slide-title {
      font-size: 16px;
    }
  }
</style>