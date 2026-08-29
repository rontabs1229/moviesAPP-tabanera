import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_MOVIES_APP_API
});

api.interceptors.request.use((config) => {
	if (!config.headers.Authorization) {
		const token = sessionStorage.getItem('token');
		if(token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
})

export default api;