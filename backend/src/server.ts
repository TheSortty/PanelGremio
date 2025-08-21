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
// que corre en un origen diferente durante el desarrollo local (ej. http://localhost:5500)
const allowedOrigins = [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

const options: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Permitir peticiones sin origen (ej. apps móviles, Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.some(pattern => pattern.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Permitir el envío de cookies
};
app.use(cors(options));


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
