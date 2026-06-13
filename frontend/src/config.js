const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? `http://${window.location.hostname}:5001` : 'https://aniruddha-sali.onrender.com');
