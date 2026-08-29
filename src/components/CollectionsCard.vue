<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select']);

function handleClick() {
  emit('select', props.content._id);
}

const averageRating = computed(() => {
  if (!props.content.ratings || props.content.ratings.length === 0) return null;
  const total = props.content.ratings.reduce((acc, item) => acc + item.rating, 0);
  const avg = total / props.content.ratings.length;
  return avg > 0 ? avg.toFixed(1) : null;
});

const commentCount = computed(() => {
  if (props.content.comments) return props.content.comments.length;
  if (props.content.ratings) return props.content.ratings.length;
  return 0;
});
</script>

<template>
  <div class="collection-card" @click="handleClick">
    <div class="card-header">
      <span class="content-type-badge">
        {{ content.contentType === 'Drama' ? 'K-Drama' : 'K-Movie' }}
      </span>
      <span class="content-year">{{ content.year }}</span>
    </div>

    <div class="image-box">
      <img
        v-if="content.image && content.image.url"
        :src="content.image.url"
        :alt="content.title"
        class="poster-img"
      />
      <div v-else class="image-placeholder">No Image</div>
    </div>

    <div class="card-body">
      <h3 class="content-title" :title="content.title">{{ content.title }}</h3>
      
      <div class="meta-info">
        <p class="meta-row">
          <span class="meta-label">Genre:</span> 
          <span class="meta-value">{{ content.genre }}</span>
        </p>
        <p class="meta-row">
          <span class="meta-label">Director:</span> 
          <span class="meta-value">{{ content.director || 'N/A' }}</span>
        </p>
      </div>
    </div>

    <div class="card-footer">
      <div class="stat-item rating-stat">
        <span class="star-icon">★</span>
        <span v-if="averageRating" class="stat-value rating-num">{{ averageRating }}</span>
        <span v-else class="no-rating">No Ratings Yet</span>
      </div>

      <div class="stat-item comment-stat">
        <svg class="comment-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
        <span class="stat-value comment-num">{{ commentCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(50, 30, 72, 0.08);
  font-family: 'Shanti', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(50, 30, 72, 0.16);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-type-badge {
  font-family: 'Shalimar', cursive;
  color: #d4af37;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.content-year {
  font-size: 14px;
  font-weight: 700;
  color: #43637E;
}

.image-box {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background-color: #2c2c2c;
  overflow: hidden;
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
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.content-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #321E48;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-row {
  margin: 0;
  font-size: 13px;
  color: #43637E;
  display: flex;
  gap: 4px;
}

.meta-label {
  font-weight: 700;
  color: #321E48;
}

.meta-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #eef2f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Increased Star Icon size */
.star-icon {
  color: #f39c12;
  font-size: 30px; 
  line-height: 1;
}

/* Bigger & Bolder Rating Number */
.rating-num {
  font-size: 18px;
  font-weight: 800;
  color: #321E48;
  line-height: 1;
}

/* Original "No Ratings yet" style preserved */
.no-rating {
  font-size: 12px;
  font-style: italic;
  font-weight: 400;
  color: #888888;
}

.comment-icon {
  width: 22px;
  height: 22px;
  fill: #43637E;
}

.comment-num {
  font-size: 14px;
  color: #43637E;
}
</style>