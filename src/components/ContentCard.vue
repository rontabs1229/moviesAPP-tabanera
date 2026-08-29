<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    content: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['edit', 'delete']);

  // Compute average rating or returning formatted string
  const averageRating = computed(() => {
    if (!props.content.ratings || props.content.ratings.length === 0) return null;
    const total = props.content.ratings.reduce((acc, item) => acc + item.rating, 0);
    const avg = total / props.content.ratings.length;
    return avg > 0 ? avg.toFixed(1) : null;
  });

  // Count total reviews
  const reviewCount = computed(() => {
    return props.content.ratings ? props.content.ratings.length : 0;
  });

  // Count total comments
  const commentCount = computed(() => {
    if (!props.content.comments) return 0;
    return props.content.comments.length;
  });

  function handleEdit() {
    emit('edit', props.content);
  }

  function handleDelete() {
    emit('delete', props.content._id);
  }
</script>

<template>
  <div class="content-card">
    <!-- Left Column: Edit/Delete links & Poster Image -->
    <div class="left-col">
      <div class="card-actions">
        <button type="button" class="action-btn edit-btn" @click="handleEdit">Edit</button>
        <span class="divider">|</span>
        <button type="button" class="action-btn delete-btn" @click="handleDelete">Delete</button>
      </div>

      <div class="image-box">
        <img
          v-if="content.image && content.image.url"
          :src="content.image.url"
          :alt="content.title"
          class="poster-img"
        />
        <div v-else class="image-placeholder">Pic</div>
      </div>
    </div>

    <!-- Center Column: Title & Synopsis -->
    <div class="center-col">
      <div class="title-header">
        <h3 class="content-title">{{ content.title }}</h3>
        <span class="content-type-badge">
          {{ content.contentType === 'Drama' ? 'K-Drama' : 'K-Movie' }}
        </span>
      </div>

      <div class="synopsis-group">
        <span class="label">Synopsis:</span>
        <p class="synopsis-text">{{ content.description }}</p>
      </div>
    </div>

    <!-- Right Column: Genre, Director, Year, Ratings, Reviews & Comments -->
    <div class="right-col">
      <p class="field-item">
        <span class="label">Genre:</span> {{ content.genre }}
      </p>
      <p class="field-item">
        <span class="label">Director:</span> {{ content.director || 'N/A' }}
      </p>
      <p class="field-item">
        <span class="label">Release Year:</span> {{ content.year }}
      </p>
      
      <p class="field-item ratings-item">
        <span class="label">Current Ratings:</span>
        <span v-if="averageRating" class="star-rating">
          <span class="rating-num">{{ averageRating }} / 5</span>
          <span class="star-icon">★</span>
        </span>
        <span v-else class="no-rating">
          No Ratings Yet
        </span>
      </p>

      <p class="field-item">
        <span class="label">Reviews:</span> {{ reviewCount }}
      </p>
      <p class="field-item">
        <span class="label">Comments:</span> {{ commentCount }}
      </p>
    </div>
  </div>
</template>

<style scoped>
  .content-card {
    display: flex;
    gap: 16px;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 4px 16px rgba(50, 30, 72, 0.08);
    font-family: 'Shanti', sans-serif;
    align-items: flex-start;
  }

  /* Left Column */
  .left-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 110px;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .edit-btn {
    color: #43637E;
  }

  .edit-btn:hover {
    color: #321E48;
  }

  .delete-btn {
    color: #e74c3c;
  }

  .delete-btn:hover {
    color: #c0392b;
  }

  .divider {
    font-size: 12px;
    color: #ccc;
  }

  .image-box {
    width: 110px;
    height: 75px;
    border-radius: 8px;
    background-color: #2c2c2c;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
  }

  /* Center Column */
  .center-col {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  .content-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #321E48;
  }

  .content-type-badge {
    font-family: 'Shalimar', cursive;
    color: #d4af37;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .synopsis-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .synopsis-text {
    margin: 0;
    font-size: 13px;
    color: #43637E;
    line-height: 1.4;
    word-break: break-word;
  }

  /* Right Column */
  .right-col {
    flex: 1.5;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    text-align: right;
  }

  .field-item {
    margin: 0;
    font-size: 13px;
    color: #43637E;
    line-height: 1.3;
  }

  .ratings-item {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
  }

  .label {
    font-weight: 700;
    color: #321E48;
    font-size: 13px;
  }

  .star-rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .rating-num {
    font-size: 13px;
    font-weight: 700;
    color: #43637E;
  }

  .star-icon {
    color: #f39c12;
    font-size: 13px;
  }

  .no-rating {
    font-size: 13px;
    font-style: italic;
    color: #888888;
  }

  @media (max-width: 600px) {
    .content-card {
      flex-direction: column;
    }

    .right-col {
      align-items: flex-start;
      text-align: left;
    }

    .ratings-item {
      justify-content: flex-start;
    }
  }
</style>