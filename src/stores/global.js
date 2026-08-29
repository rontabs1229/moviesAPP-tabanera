import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

export const useGlobalStore = defineStore('global', () => {
	const user = ref({
		token: sessionStorage.getItem('token') || null,
		email: null,
		isAdmin: false
	});

	async function getUserDetails(token) {
		const currentToken = token || user.value.token || sessionStorage.getItem('token');
		if (!currentToken) {
			clearUser();
			return;
		}
		try {
			const { data } = await api.get('/users/details', {
				headers: {
					Authorization: `Bearer ${currentToken}`
				}
			});
			const userData = data.user || data;
			sessionStorage.setItem('token', currentToken);
			user.value = {
				token: currentToken,
				email: userData.email,
				isAdmin: Boolean(userData.isAdmin)
			};
		} catch (error) {
			console.error("Failed to fetch user details:", error);
			clearUser();
		}
	}

	function clearUser() {
		sessionStorage.removeItem('token');
		user.value = {
			token: null,
			email: null,
			isAdmin: false
		};
	}

	function logout() {
		clearUser();
	}

	return {
		user,
		getUserDetails,
		clearUser,
		logout
	};
});