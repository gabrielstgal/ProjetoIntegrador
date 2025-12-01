
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('='.repeat(50));
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log('='.repeat(50));

        // Eventos de conexão
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose conectado ao MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Erro de conexão MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ Mongoose desconectado do MongoDB');
        });

        // Fechar conexão quando o processo terminar
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔌 Conexão MongoDB fechada devido ao término da aplicação');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;