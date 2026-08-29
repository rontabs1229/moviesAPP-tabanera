<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import api from '../api';

const route = useRoute();
const router = useRouter();
const movieId = route.params.movieId;

let notyf = null;

const isLoading = ref(true);
const movie = ref(null);
const currentUser = ref(null);

// Ratings state
const selectedRating = ref(0);
const hoverRating = ref(0);
const userExistingRating = ref(null);

// Comments state
const commentText = ref('');
const editingCommentId = ref(null);
const visibleCommentsCount = ref(3);

const isAdmin = computed(() => {
  return currentUser.value && currentUser.value.isAdmin === true;
});

const averageRating = computed(() => {
  if (!movie.value || !movie.value.ratings || movie.value.ratings.length === 0) return '0';
  const validRatings = movie.value.ratings.filter(item => item.rating > 0);
  if (validRatings.length === 0) return '0';
  const total = validRatings.reduce((acc, item) => acc + item.rating, 0);
  const avg = total / validRatings.length;
  if (avg === 0) return '0';
  return avg.toFixed(1);
});

// Comments sorting: current user's comments first, then latest
const sortedComments = computed(() => {
  if (!movie.value || !movie.value.comments) return [];
  const comments = [...movie.value.comments];
  const currentUserId = currentUser.value?._id || currentUser.value?.id;

  if (!currentUserId) return comments.reverse();

  const userComments = [];
  const otherComments = [];

  comments.forEach((c) => {
    const cUserId = c.userId?._id || c.userId?.id || c.userId;
    if (currentUserId && cUserId && currentUserId.toString() === currentUserId.toString()) {
      userComments.push(c);
    } else {
      otherComments.push(c);
    }
  });

  return [...userComments.reverse(), ...otherComments.reverse()];
});

const displayedComments = computed(() => {
  return sortedComments.value.slice(0, visibleCommentsCount.value);
});

const hasMoreComments = computed(() => {
  return visibleCommentsCount.value < sortedComments.value.length;
});

async function fetchMovieDetails(preserveRating = false) {
  try {
    const res = await api.get(`/movies/getMovie/${movieId}`);
    movie.value = res.data.movie || res.data;

    if (currentUser.value && movie.value.ratings) {
      const currentUserId = currentUser.value._id || currentUser.value.id;
      const existing = movie.value.ratings.find((r) => {
        const rUserId = r.userId?._id || r.userId?.id || r.userId;
        return rUserId && currentUserId && rUserId.toString() === currentUserId.toString() && r.rating > 0;
      });

      if (existing && existing.rating > 0) {
        userExistingRating.value = existing;
        selectedRating.value = existing.rating;
      } else {
        userExistingRating.value = null;
        if (!preserveRating) {
          selectedRating.value = 0;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching movie details:', error);
    notyf?.error('Failed to load movie details.');
  }
}

async function fetchInitialData() {
  try {
    isLoading.value = true;
    const userRes = await api.get('/users/details');
    currentUser.value = userRes.data.user || userRes.data;
    await fetchMovieDetails();
  } catch (error) {
    console.error('Error initializing page:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  notyf = new Notyf();
  await fetchInitialData();
});

function handleGoBack() {
  router.back();
}

function handleStarClick(star) {
  if (isAdmin.value) {
    notyf?.error('Admin is not allowed to rate content.');
    return;
  }
  selectedRating.value = star;
}

async function submitRating() {
  if (isAdmin.value) {
    notyf?.error('Admin is not allowed to rate content.');
    return;
  }
  if (!selectedRating.value || selectedRating.value === 0) {
    notyf?.error('Please select star(s) before clicking Rate Now.');
    return;
  }

  try {
    if (userExistingRating.value) {
      await api.patch(`/movies/updateRating/${movieId}`, { rating: selectedRating.value });
      notyf?.success('Rating updated successfully!');
    } else {
      await api.post(`/movies/addRating/${movieId}`, { rating: selectedRating.value });
      notyf?.success('Rating submitted successfully!');
    }
    await fetchMovieDetails(true);
  } catch (error) {
    console.error('Error submitting rating:', error);
    notyf?.error(error.response?.data?.message || 'Failed to submit rating.');
  }
}

async function deleteRating() {
  if (isAdmin.value) return;
  
  if (!window.confirm('Are you sure you want to remove your rating?')) {
    return;
  }

  try {
    await api.delete(`/movies/deleteRating/${movieId}`);
    notyf?.success('Rating removed.');
    selectedRating.value = 0;
    userExistingRating.value = null;
    await fetchMovieDetails(false);
  } catch (error) {
    console.error('Error removing rating:', error);
    notyf?.error(error.response?.data?.message || 'Failed to remove rating.');
  }
}

function handleCommentInput(e) {
  if (isAdmin.value) {
    commentText.value = '';
    notyf?.error('Admin is not allowed to comment.');
    return;
  }
  const val = e.target.value;
  if (val.length <= 100) {
    commentText.value = val;
  } else {
    commentText.value = val.slice(0, 100);
    notyf?.error('Comment cannot exceed 100 characters.');
  }
}

function clearComment() {
  commentText.value = '';
  editingCommentId.value = null;
}

async function submitComment() {
  if (isAdmin.value) {
    notyf?.error('Admin is not allowed to comment.');
    return;
  }
  if (!commentText.value.trim()) return;

  if (commentText.value.length > 100) {
    notyf?.error('Comment cannot exceed 100 characters.');
    return;
  }

  try {
    if (editingCommentId.value) {
      await api.patch(`/movies/updateComment/${movieId}/${editingCommentId.value}`, {
        comment: commentText.value
      });
      notyf?.success('Comment updated!');
      editingCommentId.value = null;
    } else {
      await api.patch(`/movies/addComment/${movieId}`, {
        comment: commentText.value
      });
      notyf?.success('Comment posted!');
    }
    commentText.value = '';
    await fetchMovieDetails(true);
  } catch (error) {
    console.error('Error saving comment:', error);
    notyf?.error('Failed to save comment.');
  }
}

function editComment(comment) {
  if (isAdmin.value) {
    notyf?.error('Admin is not allowed to comment.');
    return;
  }
  editingCommentId.value = comment._id;
  commentText.value = comment.comment || comment.text;
}

async function deleteComment(commentId) {
  if (!window.confirm('Are you sure you want to delete this comment?')) {
    return;
  }

  try {
    await api.patch(`/movies/deleteComment/${movieId}/${commentId}`);
    notyf?.success('Comment deleted.');
    await fetchMovieDetails(true);
  } catch (error) {
    console.error('Error deleting comment:', error);
    notyf?.error('Failed to delete comment.');
  }
}

function showMoreComments() {
  visibleCommentsCount.value += 3;
}

function isMyComment(comment) {
  if (!currentUser.value) return false;
  const currentUserId = currentUser.value._id || currentUser.value.id;
  const commentUserId = comment.userId?._id || comment.userId?.id || comment.userId;
  return currentUserId && commentUserId && currentUserId.toString() === commentUserId.toString();
}

// Updated helpers to read from the populated email field
function getCommentUserIdentifier(comment) {
  if (comment.userId && typeof comment.userId === 'object' && comment.userId.email) {
    return comment.userId.email.split('@')[0];
  }
  if (isMyComment(comment) && currentUser.value?.email) {
    return currentUser.value.email.split('@')[0];
  }
  return 'Movie Fan';
}

function getCommentUserInitial(comment) {
  const identifier = getCommentUserIdentifier(comment);
  if (identifier && identifier !== 'Movie Fan') {
    return identifier.charAt(0).toUpperCase();
  }
  return 'M';
}
</script>

<template>
  <div class="content-page">
    <div v-if="isLoading" class="loading-state">
      <p>Loading content...</p>
    </div>

    <div v-else-if="movie" class="content-container">
      <button type="button" class="back-nav-btn" @click="handleGoBack">
        ← Go Back
      </button>

      <div class="hero-section">
        <div class="hero-bg-image">
          <img
            v-if="movie.image && movie.image.url"
            :src="movie.image.url"
            :alt="movie.title"
          />
        </div>

        <div class="hero-content">
          <span class="badge-type">
            {{ movie.contentType === 'Drama' ? 'K-Drama' : 'K-Movie' }}
          </span>

          <div class="rating-badge-circle">
            <svg class="star-svg-bg" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span class="rating-score">{{ averageRating }}</span>
          </div>
        </div>

        <div class="hero-title-bar">
          <h1 class="movie-title">{{ movie.title }}</h1>
          <div class="movie-meta-tags">
            <span>{{ movie.genre }}</span>
            <span>{{ movie.year }}</span>
          </div>
        </div>
      </div>

      <div class="lower-grid">
        <div class="left-panel">
          <div class="info-card">
            <h3 class="panel-heading">Director</h3>
            <p class="panel-text">{{ movie.director || 'N/A' }}</p>

            <h3 class="panel-heading synopsis-heading">Synopsis</h3>
            <p class="panel-text synopsis-text">{{ movie.description }}</p>
          </div>

          <div class="review-card">
            <h3 class="panel-heading">Leave a Review!</h3>
            <div class="stars-container">
              <span
                v-for="star in 5"
                :key="star"
                class="star-item"
                :class="{
                  active: star <= (hoverRating || selectedRating)
                }"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="handleStarClick(star)"
              >
                ★
              </span>
            </div>

            <div class="review-actions">
              <button type="button" class="submit-btn" @click="submitRating">
                {{ userExistingRating ? 'Update' : 'Rate Now' }}
              </button>
              <button v-if="userExistingRating" type="button" class="submit-btn remove-btn" @click="deleteRating">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="comments-card">
            <div class="comments-header">
              <h3 class="panel-heading">Comments:</h3>
              <span class="comments-total-count">{{ movie.comments ? movie.comments.length : 0 }}</span>
            </div>

            <div class="comment-input-wrapper">
              <div class="input-container">
                <input
                  type="text"
                  :value="commentText"
                  placeholder="Leave a Comment (max 100 chars):"
                  maxlength="100"
                  class="comment-field"
                  @input="handleCommentInput"
                  @keyup.enter="submitComment"
                />
                <span class="char-counter">{{ commentText.length }}/100</span>
                <button
                  v-if="commentText.length > 0"
                  type="button"
                  class="clear-input-btn"
                  @click="clearComment"
                >
                  ✕
                </button>
              </div>
              <button type="button" class="send-comment-btn" @click="submitComment" title="Send">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            <div class="comments-scroll-area">
              <div v-if="displayedComments.length === 0" class="no-comments">
                No comments yet. Be the first to comment!
              </div>

              <div
                v-for="comment in displayedComments"
                :key="comment._id"
                class="comment-bubble"
              >
                <div class="comment-bubble-header">
                  <div class="comment-author-group">
                    <div class="user-avatar-badge">{{ getCommentUserInitial(comment) }}</div>
                    <span class="comment-author">
                      {{ getCommentUserIdentifier(comment) }}:
                    </span>
                  </div>
                  <span class="comment-date">
                    {{ comment.createdAt ? new Date(comment.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recent' }}
                  </span>
                </div>
                <p class="comment-body">“{{ comment.comment || comment.text }}”</p>

                <div v-if="isMyComment(comment)" class="comment-item-actions">
                  <button type="button" class="inline-action-btn" @click="editComment(comment)">Edit</button>
                  <span class="dot">|</span>
                  <button type="button" class="inline-action-btn delete" @click="deleteComment(comment._id)">Delete</button>
                </div>
              </div>

              <div v-if="hasMoreComments" class="show-more-wrapper">
                <button type="button" class="show-more-btn" @click="showMoreComments">
                  Show More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .content-page {
    width: 100%;
    min-height: 100vh;
    background-color: #E2E8F0;
    padding: 24px 16px;
    font-family: 'Shanti', sans-serif;
    display: flex;
    justify-content: center;
  }

  .loading-state {
    text-align: center;
    padding: 60px;
    color: #43637E;
    font-weight: 700;
  }

  .content-container {
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .back-nav-btn {
    background: none;
    border: none;
    font-size: 15px;
    font-weight: 700;
    color: #321E48;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    align-self: flex-start;
  }

  .back-nav-btn:hover {
    color: #43637E;
  }

  .hero-section {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: #2c2c2c;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 8px 24px rgba(50, 30, 72, 0.12);
    animation: fadeInHero 0.6s ease-in-out;
  }

  @keyframes fadeInHero {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hero-bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .hero-bg-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    background-repeat: no-repeat;
  }

  .hero-content {
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
  }

  .badge-type {
    background-color: rgba(30, 30, 30, 0.85);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: #FFD700;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  }

  .rating-badge-circle {
    position: relative;
    width: 75px;
    height: 75px;
    background-color: #1a1a1a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .star-svg-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    fill: #FFD700;
  }

  .rating-score {
    position: relative;
    z-index: 2;
    font-size: 18px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
  }

  .hero-title-bar {
    position: relative;
    z-index: 3;
    background: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-top-right-radius: 24px;
    padding: 20px 24px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    max-width: 65%;
  }

  .movie-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }

  .movie-meta-tags {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #cbd5e1;
    font-weight: 600;
  }

  .lower-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .left-panel,
  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-card,
  .review-card,
  .comments-card {
    background-color: #1e1e1e;
    border-radius: 16px;
    padding: 24px;
    color: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .panel-heading {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
  }

  .panel-text {
    margin: 0;
    font-size: 14px;
    color: #cbd5e1;
    line-height: 1.5;
  }

  .synopsis-heading {
    margin-top: 20px;
  }

  .synopsis-text {
    overflow: visible;
  }

  .review-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stars-container {
    display: flex;
    gap: 12px;
    margin: 12px 0 20px 0;
  }

  .star-item {
    font-size: 42px;
    color: #555555;
    cursor: pointer;
    transition: color 0.15s ease, transform 0.1s ease;
  }

  .star-item:hover {
    transform: scale(1.1);
  }

  .star-item.active {
    color: #FFD700;
  }

  .review-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: center;
  }

  .submit-btn {
    background-color: #ffffff;
    color: #1e1e1e;
    border: none;
    border-radius: 20px;
    padding: 8px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .submit-btn:hover {
    background-color: #e2e8f0;
  }

  .remove-btn {
    background-color: #e74c3c;
    color: #ffffff;
  }

  .remove-btn:hover {
    background-color: #c0392b;
  }

  .comments-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 500px;
  }

  .comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .comments-total-count {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
  }

  .comment-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .input-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .comment-field {
    width: 100%;
    background-color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 10px 65px 10px 12px;
    font-size: 13px;
    color: #1e1e1e;
    outline: none;
    font-family: 'Shanti', sans-serif;
  }

  .char-counter {
    position: absolute;
    right: 32px;
    font-size: 10px;
    color: #888888;
    pointer-events: none;
  }

  .clear-input-btn {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 700;
    color: #888888;
    cursor: pointer;
  }

  .clear-input-btn:hover {
    color: #333333;
  }

  .send-comment-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #ffffff;
    color: #1e1e1e;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
  }

  .send-comment-btn:hover {
    background-color: #e2e8f0;
  }

  .comments-scroll-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .comments-scroll-area::-webkit-scrollbar {
    width: 6px;
  }

  .comments-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .comments-scroll-area::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    transition: background-color 0.2s ease;
  }

  .comments-scroll-area::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }

  .no-comments {
    font-size: 13px;
    color: #888888;
    text-align: center;
    padding: 20px 0;
    font-style: italic;
  }

  .comment-bubble {
    background-color: #2c2c2c;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .comment-bubble-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .comment-author-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar-badge {
    width: 24px;
    height: 24px;
    background-color: #FFD700;
    color: #1e1e1e;
    font-weight: 700;
    font-size: 12px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .comment-author {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    text-transform: none;
  }

  .comment-date {
    font-size: 10px;
    color: #94a3b8;
  }

  .comment-body {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    color: #e2e8f0;
  }

  .comment-item-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    margin-top: 4px;
  }

  .inline-action-btn {
    background: none;
    border: none;
    font-size: 11px;
    color: #94a3b8;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    font-family: 'Shanti', sans-serif;
    transition: color 0.15s ease;
  }

  .inline-action-btn:hover {
    color: #ffffff;
  }

  .inline-action-btn.delete {
    color: #e74c3c;
  }

  .inline-action-btn.delete:hover {
    color: #c0392b;
  }

  .dot {
    color: #555555;
    font-size: 10px;
  }

  .show-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .show-more-btn {
    background-color: #321E48;
    color: #ffffff;
    border: none;
    border-radius: 16px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .show-more-btn:hover {
    background-color: #43637E;
  }

  @media (max-width: 768px) {
    .lower-grid {
      grid-template-columns: 1fr;
    }

    .hero-section {
      height: auto;
    }

    .hero-title-bar {
      max-width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .movie-title {
      font-size: 22px;
    }
  }
</style>