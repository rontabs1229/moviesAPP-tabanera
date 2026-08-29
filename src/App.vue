<script setup>
	import { onMounted } from 'vue';
	import { useGlobalStore } from './stores/global';
	import Navbar from './components/Navbar.vue';
	import Footer from './components/Footer.vue';
	const globalStore = useGlobalStore();
	onMounted(async () => {
	  const token = sessionStorage.getItem('token');
	  if (token) {
	    await globalStore.getUserDetails(token);
	  }
	});
</script>
<template>
  <Navbar />
	  <main>
	    <router-view />
	  </main>
  <Footer />
</template>