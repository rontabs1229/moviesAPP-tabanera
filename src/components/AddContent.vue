<script setup>
  import { ref } from 'vue';
  import api from '../api';

  const emit = defineEmits(['contentAdded', 'cancel']);

  const title = ref('');
  const director = ref('');
  const year = ref(''); // Initialized as blank
  const selectedGenres = ref([]);
  const contentType = ref(''); // Initialized as blank for default select option
  const description = ref('');
  const selectedFile = ref(null);
  const previewUrl = ref(null);
  const isLoading = ref(false);
  const errorMessage = ref('');

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
    if (description.value.length > 250) {
      description.value = description.value.slice(0, 250);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
      }
      selectedFile.value = file;
      previewUrl.value = URL.createObjectURL(file);
    }
  }

  async function handleSubmit() {
    errorMessage.value = '';
    
    if (!title.value || !director.value || !year.value || !contentType.value || !description.value) {
      errorMessage.value = 'Please fill out all required fields.';
      return;
    }

    if (selectedGenres.value.length === 0) {
      errorMessage.value = 'Please select at least one genre.';
      return;
    }

    if (description.value.length > 250) {
      errorMessage.value = 'Description cannot exceed 250 characters.';
      return;
    }

    isLoading.value = true;

    try {
      const formData = new FormData();
      formData.append('title', title.value);
      formData.append('director', director.value);
      formData.append('year', year.value);
      formData.append('genre', selectedGenres.value.join(', '));
      formData.append('contentType', contentType.value);
      formData.append('description', description.value);

      if (selectedFile.value) {
        formData.append('image', selectedFile.value);
      }

      const response = await api.post('/movies/addMovie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      emit('contentAdded', response.data);
    } catch (error) {
      console.error('Error adding content:', error);
      errorMessage.value = error.response?.data?.message || 'Failed to add content.';
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <div class="add-content-panel">
    <div class="panel-header">
      <h3 class="panel-title">Add New Content</h3>
      <button type="button" class="close-btn" @click="emit('cancel')">✕</button>
    </div>

    <form @submit.prevent="handleSubmit" class="add-form">
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div class="form-grid">
        <div class="form-group">
          <label for="title">Title *</label>
          <input id="title" v-model="title" type="text" required placeholder="Content title..." class="form-input" />
        </div>

        <div class="form-group">
          <label for="director">Director *</label>
          <input id="director" v-model="director" type="text" required placeholder="Director name..." class="form-input" />
        </div>

        <div class="form-group">
          <label for="contentType">Content Type *</label>
          <select id="contentType" v-model="contentType" required class="form-select">
            <option value="" disabled selected>Please select</option>
            <option value="Movie">K-Movie</option>
            <option value="Drama">K-Drama</option>
          </select>
        </div>

        <div class="form-group">
          <label for="year">Release Year *</label>
          <input id="year" v-model.number="year" type="number" min="1900" max="2099" required placeholder="e.g. 2024" class="form-input" />
        </div>

        <div class="form-group">
          <label for="image">Poster Image</label>
          <input id="image" type="file" accept="image/*" @change="handleFileChange" class="file-input" />
          <div v-if="previewUrl" class="image-preview">
            <img :src="previewUrl" alt="Preview" />
          </div>
        </div>

        <div class="form-group full-width-genre">
          <label>Genre * (Select up to 3 in order)</label>
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
          <label for="description">Description / Synopsis *</label>
          <span class="char-counter" :class="{ 'limit-reached': description.length >= 240 }">
            {{ description.length }} / 250
          </span>
        </div>
        <textarea
          id="description"
          v-model="description"
          maxlength="250"
          rows="3"
          required
          placeholder="Enter description..."
          class="form-textarea"
          @input="handleDescriptionInput"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')" :disabled="isLoading">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : 'Save Content' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
  .add-content-panel {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(50, 30, 72, 0.12);
    margin-bottom: 24px;
    font-family: 'Shanti', sans-serif;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    border-bottom: 1px solid #eef2f5;
    padding-bottom: 12px;
  }

  .panel-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #321E48;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
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

  .form-group label {
    font-size: 13px;
    font-weight: 600;
    color: #321E48;
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    padding: 8px 12px;
    border: 1px solid #43637E;
    border-radius: 8px;
    outline: none;
    background-color: #ffffff;
    color: #321E48;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #321E48;
  }

  .file-input {
    font-size: 12px;
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

  .btn-secondary {
    background-color: #eef2f5;
    color: #43637E;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>