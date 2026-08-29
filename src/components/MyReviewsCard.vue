<script setup>
  import { defineProps, defineEmits } from 'vue';

  const props = defineProps({
    review: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['edit', 'delete']);

  function handleEdit() {
    emit('edit', props.review);
  }

  function handleDelete() {
    emit('delete', props.review._id || props.review.id);
  }
</script>

<template>
  <div class="review-card">
    <!-- Media / Poster Thumbnail Container -->
    <div class="image-container">
      <img
        v-if="review.image || review.poster"
        :src="review.image || review.poster"
        :alt="review.title || 'Review Poster'"
        class="poster-img"
      >
      <div v-else class="image-placeholder">
        Pic
      </div>
    </div>

    <!-- Details Section -->
    <div class="review-details">
      <h3 class="title">Title: {{ review.title || 'Untitled' }}</h3>
      <p class="genre">Genre: {{ review.genre || 'N/A' }}</p>
    </div>

    <!-- Rating & Action Section -->
    <div class="review-meta">
      <p class="release-date">Release Date: {{ review.releaseDate || 'N/A' }}</p>
      
      <div class="rating-row">
        <span class="rating-label">My Rating:</span>
        <div class="stars">
          <span 
            v-for="star in 5" 
            :key="star" 
            class="star" 
            :class="{ active: star <= (review.rating || 0) }"
          >
            ★
          </span>
        </div>

        <!-- Pencil/Edit Button -->
        <button type="button" class="btn-icon edit-btn" title="Edit Review" @click="handleEdit">
          ✏️
        </button>
        <!-- Delete Button -->
        <button type="button" class="btn-icon delete-btn" title="Delete Review" @click="handleDelete">
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Shanti&family=Shalimar&display=swap');

  .review-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 8px 24px rgba(50, 30, 72, 0.1);
    font-family: 'Shanti', sans-serif;
  }

  /* Pic Container */
  .image-container {
    width: 100px;
    height: 70px;
    min-width: 100px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #321E48;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    color: white;
    font-size: 15px;
    font-weight: 600;
  }

  /* Details Area */
  .review-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-size: 15px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
  }

  .genre {
    font-size: 13px;
    color: #43637E;
    margin: 0;
  }

  /* Meta & Rating Area */
  .review-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .release-date {
    font-size: 13px;
    color: #43637E;
    margin: 0;
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rating-label {
    font-size: 13px;
    font-weight: 600;
    color: #321E48;
  }

  .stars {
    display: flex;
    gap: 2px;
  }

  .star {
    font-size: 16px;
    color: #cccccc;
  }

  .star.active {
    color: #321E48;
  }

  /* Action Buttons */
  .btn-icon {
    background: transparent;
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: transform 0.15s ease, background-color 0.2s ease;
  }

  .edit-btn:hover {
    background-color: #D9FFF4;
    transform: scale(1.15);
  }

  .delete-btn:hover {
    background-color: #ffe6e6;
    transform: scale(1.15);
  }

  @media (max-width: 580px) {
    .review-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .review-meta {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
  }
</style>