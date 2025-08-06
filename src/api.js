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

// --- NUEVA FUNCIÓN (MOCKEADA) ---
// Función para obtener el desglose de precios calculado desde el backend
export const getPrecioDetallado = (params) => {
  console.log("Mock getPrecioDetallado called with:", params);
  // Simular la respuesta del backend
  const mockResponse = {
    data: {
      netoOriginal: 20000,
      montoDescuentoCupon: 0,
      netoConDescuento: 20000,
      iva: 3800, // Ya redondeado por el backend
      total: 23800, // Ya redondeado por el backend
      // No hay error de cupón en este mock
      errorCupon: null,
      // Opcional: devolver el estado del cupón si fue válido
      cuponAplicado: null
    }
  };

  // Simular un retraso de red
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockResponse);
    }, 300); // 300ms de retraso
  });
};


export default api;