<script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Notyf } from 'notyf';
  import 'notyf/notyf.min.css';
  import api from '../api';

  const route = useRoute();
  const router = useRouter();
  const movieId = route.params.movieId;

  let notyf = null;

  const isLoading = ref(true);
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  const form = ref({
    title: '',
    contentType: 'Movie',
    director: '',
    year: '',
    description: '',
    image: null
  });

  const selectedGenres = ref([]);
  const previewImageUrl = ref('');

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

  function toggleGenre(g) {
    const index = selectedGenres.value.indexOf(g);
    if (index > -1) {
      selectedGenres.value.splice(index, 1);
    } else {
      if (selectedGenres.value.length < 3) {
        selectedGenres.value.push(g);
      }
    }
  }

  function handleDescriptionInput() {
    if (form.value.description.length > 250) {
      form.value.description = form.value.description.slice(0, 250);
    }
  }

  async function fetchMovieDetails() {
    try {
      isLoading.value = true;
      const res = await api.get(`/movies/getMovie/${movieId}`);
      const movieData = res.data.movie || res.data;

      form.value.title = movieData.title || '';
      form.value.contentType = movieData.contentType || 'Movie';
      form.value.director = movieData.director || '';
      form.value.year = movieData.year || '';
      form.value.description = movieData.description || '';

      if (movieData.genre) {
        selectedGenres.value = movieData.genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean);
      }

      if (movieData.image && movieData.image.url) {
        previewImageUrl.value = movieData.image.url;
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      notyf?.error('Failed to load content details.');
      router.push('/admin');
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    notyf = new Notyf();
    fetchMovieDetails();
  });

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      form.value.image = file;
      previewImageUrl.value = URL.createObjectURL(file);
    }
  }

  async function handleSubmit() {
    errorMessage.value = '';

    if (!form.value.title || !form.value.director || !form.value.year || !form.value.contentType || !form.value.description) {
      errorMessage.value = 'Please fill out all required fields.';
      return;
    }

    if (selectedGenres.value.length === 0) {
      errorMessage.value = 'Please select at least one genre.';
      return;
    }

    if (form.value.description.length > 250) {
      errorMessage.value = 'Description cannot exceed 250 characters.';
      return;
    }

    try {
      isSubmitting.value = true;

      const formData = new FormData();
      formData.append('title', form.value.title);
      formData.append('contentType', form.value.contentType);
      formData.append('genre', selectedGenres.value.join(', '));
      formData.append('director', form.value.director);
      formData.append('year', form.value.year);
      formData.append('description', form.value.description);

      if (form.value.image) {
        formData.append('image', form.value.image);
      }

      await api.patch(`/movies/updateMovie/${movieId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      notyf?.success('Content updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating content:', error);
      errorMessage.value = error.response?.data?.message || 'Failed to update content.';
      notyf?.error('Failed to update content.');
    } finally {
      isSubmitting.value = false;
    }
  }

  function handleCancel() {
    router.back();
  }
</script>

<template>
  <div class="edit-page">
    <div class="edit-card">
      <div class="card-header">
        <h2 class="form-title">Edit Content</h2>
        <button type="button" class="back-btn" @click="handleCancel">✕ Cancel</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <p>Loading content details...</p>
      </div>

      <!-- Edit Form -->
      <form v-else @submit.prevent="handleSubmit" class="edit-form">
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <div class="form-grid">
          <div class="form-group">
            <label for="title" class="form-label">Title *</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="form-input"
              placeholder="Enter title"
            />
          </div>

          <div class="form-group">
            <label for="director" class="form-label">Director *</label>
            <input
              id="director"
              v-model="form.director"
              type="text"
              required
              class="form-input"
              placeholder="Director name"
            />
          </div>

          <div class="form-group">
            <label for="contentType" class="form-label">Content Type *</label>
            <select id="contentType" v-model="form.contentType" required class="form-select">
              <option value="Movie">K-Movie</option>
              <option value="Drama">K-Drama</option>
            </select>
          </div>

          <div class="form-group">
            <label for="year" class="form-label">Release Year *</label>
            <input
              id="year"
              v-model.number="form.year"
              type="number"
              min="1900"
              max="2099"
              required
              class="form-input"
              placeholder="e.g. 2023"
            />
          </div>

          <div class="form-group">
            <label for="poster" class="form-label">Poster Image</label>
            <input
              id="poster"
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="file-input"
            />
            <div v-if="previewImageUrl" class="image-preview">
              <img :src="previewImageUrl" alt="Poster preview" />
            </div>
          </div>

          <div class="form-group full-width-genre">
            <label class="form-label">Genre * (Select up to 3 in order)</label>
            <div class="genre-chips">
              <button
                v-for="g in genres"
                :key="g"
                type="button"
                class="genre-chip"
                :class="{ active: selectedGenres.includes(g) }"
                :disabled="!selectedGenres.includes(g) && selectedGenres.length >= 3"
                @click="toggleGenre(g)"
              >
                {{ g }}
                <span v-if="selectedGenres.includes(g)" class="order-badge">
                  {{ selectedGenres.indexOf(g) + 1 }}
                </span>
              </button>
            </div>
            <small class="genre-hint" v-if="selectedGenres.length">
              Selected: {{ selectedGenres.join(', ') }}
            </small>
          </div>
        </div>

        <div class="form-group full-width">
          <div class="label-row">
            <label for="description" class="form-label">Description / Synopsis *</label>
            <span class="char-counter" :class="{ 'limit-reached': form.description.length >= 240 }">
              {{ form.description.length }} / 250
            </span>
          </div>
          <textarea
            id="description"
            v-model="form.description"
            maxlength="250"
            rows="3"
            required
            class="form-textarea"
            placeholder="Enter plot summary..."
            @input="handleDescriptionInput"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel" :disabled="isSubmitting">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Update Content' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
  .edit-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background-color: #D9FFF4;
    padding: clamp(24px, 5vw, 48px) 16px;
    font-family: 'Shanti', sans-serif;
  }

  .edit-card {
    width: 100%;
    max-width: 650px;
    background-color: #ffffff;
    border-radius: 16px;
    padding: clamp(24px, 4vw, 36px);
    box-shadow: 0 12px 32px rgba(50, 30, 72, 0.12);
    align-self: flex-start;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 1px solid #eef2f5;
    padding-bottom: 12px;
  }

  .form-title {
    font-size: 22px;
    font-weight: 700;
    color: #321E48;
    margin: 0;
  }

  .back-btn {
    background: none;
    border: none;
    color: #43637E;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .back-btn:hover {
    color: #321E48;
  }

  .loading-state {
    text-align: center;
    padding: 40px 0;
    color: #43637E;
  }

  .error-banner {
    background-color: #fde8e8;
    color: #c0392b;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 700;
    color: #321E48;
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #43637E;
    background-color: #ffffff;
    color: #321E48;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #321E48;
  }

  .file-input {
    font-size: 12px;
    color: #43637E;
  }

  .image-preview {
    margin-top: 6px;
  }

  .image-preview img {
    max-width: 100px;
    max-height: 100px;
    object-fit: cover;
    border-radius: 6px;
  }

  .full-width-genre {
    grid-column: 1 / -1;
    margin-bottom: 4px;
  }

  .genre-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .genre-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #f0f4f8;
    color: #321E48;
    border: 1px solid #43637E;
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 12px;
    font-family: 'Shanti', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .genre-chip.active {
    background-color: #321E48;
    color: #ffffff;
    border-color: #321E48;
  }

  .genre-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .order-badge {
    background-color: #ffffff;
    color: #321E48;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
  }

  .genre-hint {
    margin-top: 4px;
    color: #43637E;
    font-size: 11px;
  }

  .full-width {
    margin-bottom: 16px;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .char-counter {
    font-size: 11px;
    color: #43637E;
  }

  .char-counter.limit-reached {
    color: #c0392b;
    font-weight: 700;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .btn-primary {
    background-color: #321E48;
    color: #ffffff;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #43637E;
  }

  .btn-secondary {
    background-color: #eef2f5;
    color: #43637E;
  }

  .btn-secondary:hover {
    background-color: #d3dde6;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>