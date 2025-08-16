import axios from 'axios';

// 1. Lee la variable de entorno que configuramos en Vercel.
// Si no la encuentra (porque estamos en desarrollo local), usará la URL de localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 2. Crea una instancia de Axios con la URL base correcta.
const api = axios.create({
  baseURL: API_URL,
});

// 3. Configura un interceptor para añadir el token de autenticación
// a todas las peticiones que lo necesiten de forma automática.
api.interceptors.request.use(
  (config) => {
    // Obtiene el token desde el localStorage.
    const token = localStorage.getItem('authToken'); // Asegúrate de que el nombre 'authToken' sea consistente
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Exporta la instancia para usarla en toda la aplicación.

// Funciones específicas para Cupones
export const createCupon = (cuponData) => {
  return api.post('/cupones', cuponData);
};

export const updateCupon = (id, cuponData) => {
  return api.put(`/cupones/${id}`, cuponData);
};

// Podríamos añadir getCuponById si fuera necesario cargar un cupón individualmente
// export const getCuponById = (id) => {
//   return api.get(`/cupones/${id}`);
// };

// Funciones específicas para BlockedDates
export const getBlockedDates = () => {
  return api.get('/blocked-dates');
};

export const addBlockedDate = (date, reason) => {
  // Asegurarse de que la fecha se envía en formato YYYY-MM-DD
  // El backend esperará este formato.
  return api.post('/blocked-dates', { date, reason });
};

export const deleteBlockedDate = (dateString) => {
  // dateString debe estar en formato YYYY-MM-DD
  return api.delete(`/blocked-dates/${dateString}`);
};

// Funciones para la pasarela de pago
export const iniciarPago = (datosReserva) => {
  // Este endpoint es externo a nuestra API base, por lo que usamos axios directamente
  // con la URL completa proporcionada en las instrucciones.
  const pagoApiUrl = 'https://apialan-api.onrender.com/pagos/crear-preferencia';
  return axios.post(pagoApiUrl, datosReserva);
};

export const procesarPago = (datosPago) => {
  // Este endpoint SÍ es parte de nuestra API, por lo que usamos la instancia 'api'
  return api.post('/pagos/procesar-pago', datosPago);
};


export default api;