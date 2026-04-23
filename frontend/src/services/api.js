import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

export const notesAPI = {
    getAll: (userId) => API.get(`/notes?userId=${userId}`),
    getTrends: (userId) => API.get(`/notes/trends?userId=${userId}`),
    create: (noteData) => API.post('/notes', noteData),
    update: (id, noteData) => API.put(`/notes/${id}`, noteData),
    delete: (id) => API.delete(`/notes/${id}`),
};

export default API;