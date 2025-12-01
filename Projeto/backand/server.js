
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

const denunciasRoutes = require('./routes/routes');

// Remover rotas não existentes para evitar erro
// const estatisticasRoutes = require('./routes/estatisticas');
// const adminRoutes = require('./routes/admin');
let estatisticasRoutes = (req, res, next) => next();
let adminRoutes = (req, res, next) => next();
try { estatisticasRoutes = require('./routes/estatisticas'); } catch {} 
try { adminRoutes = require('./routes/admin'); } catch {}
const errorHandler = (req, res, next) => next();
const logger = (req, res, next) => next();
try { Object.assign(errorHandler, require('./middlewares/errorHandler')); } catch {}
try { Object.assign(logger, require('./middlewares/logger')); } catch {}

dotenv.config();

const app = express();


app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined'));

app.use(logger);

app.use(express.static(path.join(__dirname, '../public')));


app.get('/', (req, res) => {
    res.json({
        message: 'API Sistema de Denúncias - Governo da Paraíba',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            denuncias: '/api/denuncias',
            estatisticas: '/api/estatisticas',
            admin: '/api/admin'
        }
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api/denuncias', denunciasRoutes);
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/admin', adminRoutes);


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.path
    });
});

app.use(errorHandler);


const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor rodando em ${NODE_ENV} mode`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('='.repeat(50));
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Erro não tratado:', err);
    // Fechar servidor gracefully
    server.close(() => process.exit(1));
});

module.exports = app;