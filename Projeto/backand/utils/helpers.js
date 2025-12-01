
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.gerarProtocolo = () => {
    const ano = new Date().getFullYear();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `DEN-${ano}-${random}${timestamp}`;
};


exports.generateHash = (data) => {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
};

exports.generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};


exports.formatarData = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
};

exports.formatarDataHora = (date) => {
    return new Date(date).toLocaleString('pt-BR');
};

exports.sanitizeText = (text) => {
    if (!text) return '';
    return text
        .trim()
          .replace(/[<>]/g, '')
          .replace(/\s+/g, ' ');
};


exports.isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

exports.isValidCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
};

exports.isValidProtocolo = (protocolo) => {
    const regex = /^DEN-\d{4}-[A-Z0-9]+$/;
    return regex.test(protocolo);
};


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.enviarEmail = async (options) => {
    try {
        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email enviado: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        throw error;
    }
};

exports.enviarNotificacao = async (data) => {
    try {
        if (data.tipo === 'nova_denuncia') {
            await exports.enviarEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `Nova Denúncia Registrada - ${data.protocolo}`,
                html: `
                    <h2>Nova Denúncia Recebida</h2>
                    <p><strong>Protocolo:</strong> ${data.protocolo}</p>
                    <p><strong>Categoria:</strong> ${data.categoria}</p>
                    <p><strong>Data:</strong> ${exports.formatarDataHora(new Date())}</p>
                    <br>
                    <p>Acesse o painel administrativo para mais detalhes.</p>
                `,
                text: `Nova denúncia registrada com protocolo ${data.protocolo}`
            });
        } else if (data.tipo === 'atualizacao_status') {
            // Enviar atualização para o denunciante (se houver contato)
            if (data.contato) {
                await exports.enviarEmail({
                    to: data.contato,
                    subject: `Atualização da Denúncia ${data.protocolo}`,
                    html: `
                        <h2>Sua denúncia foi atualizada</h2>
                        <p><strong>Protocolo:</strong> ${data.protocolo}</p>
                        <p><strong>Novo Status:</strong> ${data.status}</p>
                        <br>
                        <p>Você pode consultar mais detalhes no sistema.</p>
                    `,
                    text: `Denúncia ${data.protocolo} atualizada para ${data.status}`
                });
            }
        }
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
};


exports.generateUniqueFileName = (originalName) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = originalName.split('.').pop();
    return `${timestamp}-${random}.${ext}`;
};

exports.isValidFileType = (mimetype) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimetype);
};

exports.formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};


exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

exports.gerarRelatorioPeriodo = (dataInicio, dataFim) => {
    const diff = dataFim - dataInicio;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    return {
        dataInicio: exports.formatarData(dataInicio),
        dataFim: exports.formatarData(dataFim),
        diasDecorridos: dias,
        meses: Math.floor(dias / 30)
    };
};

exports.removeSensitiveData = (obj, fields = ['password', 'ip', 'userAgent']) => {
    const sanitized = { ...obj };
    fields.forEach(field => delete sanitized[field]);
    return sanitized;
};