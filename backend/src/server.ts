import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRoutes from './api';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuración de CORS para permitir peticiones desde el frontend
// que corre en un origen diferente (ej. http://localhost:8000)
app.use(cors({
  origin: 'http://localhost:8000', // Reemplazar con el origen de tu frontend si es diferente
  credentials: true, // Permitir el envío de cookies
}));


// Middlewares
app.use(bodyParser.json());
app.use(cookieParser());

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de bienvenida para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Guild Dashboard Backend is running!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Backend server is listening on http://localhost:${port}`);
});
