
const mongoose = require('mongoose');

const ArquivoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    caminho: {
        type: String,
        required: true
    },
    tamanho: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    dataUpload: {
        type: Date,
        default: Date.now
    }
});

const HistoricoSchema = new mongoose.Schema({
    data: {
        type: Date,
        default: Date.now
    },
    statusAnterior: {
        type: String,
        required: true
    },
    statusNovo: {
        type: String,
        required: true
    },
    motivo: String,
    usuario: String
});

const ObservacaoSchema = new mongoose.Schema({
    data: {
        type: Date,
        default: Date.now
    },
    texto: {
        type: String,
        required: true
    },
    usuario: {
        type: String,
        required: true
    }
});

const DenunciaSchema = new mongoose.Schema({
    // Identificação única
    protocolo: {
        type: String,
        required: [true, 'Protocolo é obrigatório'],
        unique: true,
        index: true
    },

    // Dados da denúncia
    categoria: {
        type: String,
        required: [true, 'Categoria é obrigatória'],
        enum: [
            'corrupcao',
            'desvio',
            'nepotismo',
            'abuso',
            'fraude',
            'servicos',
            'infraestrutura',
            'outros'
        ]
    },

    orgao: {
        type: String,
        trim: true
    },

    local: {
        type: String,
        trim: true
    },

    descricao: {
        type: String,
        required: [true, 'Descrição é obrigatória'],
        minlength: [20, 'Descrição deve ter no mínimo 20 caracteres'],
        maxlength: [5000, 'Descrição não pode exceder 5000 caracteres']
    },

    // Contato anônimo (opcional)
    contato: {
        type: String,
        trim: true
    },

    // Status da denúncia
    status: {
        type: String,
        enum: ['Pendente', 'Em Andamento', 'Resolvida', 'Arquivada'],
        default: 'Pendente',
        index: true
    },

    // Prioridade
    prioridade: {
        type: String,
        enum: ['Baixa', 'Média', 'Alta', 'Urgente'],
        default: 'Média'
    },

    // Arquivos anexados
    arquivos: [ArquivoSchema],

    // Histórico de alterações
    historico: [HistoricoSchema],

    // Observações internas (não visíveis publicamente)
    observacoesInternas: [ObservacaoSchema],

    // Datas
    dataRegistro: {
        type: Date,
        default: Date.now,
        index: true
    },

    dataAtualizacao: {
        type: Date,
        default: Date.now
    },

    // Dados técnicos (para segurança, não identificação)
    ip: {
        type: String,
        select: false // Não retornar por padrão nas queries
    },

    userAgent: {
        type: String,
        select: false
    },

    // Soft delete
    excluida: {
        type: Boolean,
        default: false,
        index: true
    },

    dataExclusao: {
        type: Date
    },

    // Campos calculados
    diasAberta: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


DenunciaSchema.index({ status: 1, dataRegistro: -1 });
DenunciaSchema.index({ categoria: 1, status: 1 });
DenunciaSchema.index({ excluida: 1, dataRegistro: -1 });


DenunciaSchema.virtual('diasDesdeRegistro').get(function() {
    const hoje = new Date();
    const registro = new Date(this.dataRegistro);
    const diff = hoje - registro;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});


DenunciaSchema.pre('save', function(next) {
    this.dataAtualizacao = Date.now();
    
    // Calcular dias aberta
    if (this.status !== 'Resolvida' && this.status !== 'Arquivada') {
        const hoje = new Date();
        const registro = new Date(this.dataRegistro);
        const diff = hoje - registro;
        this.diasAberta = Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    next();
});

DenunciaSchema.pre(/^find/, function(next) {
    this.find({ excluida: { $ne: true } });
    next();
});


DenunciaSchema.statics.buscarPorPeriodo = async function(dataInicio, dataFim) {
    return this.find({
        dataRegistro: {
            $gte: dataInicio,
            $lte: dataFim
        }
    }).sort({ dataRegistro: -1 });
};

DenunciaSchema.statics.contarPorStatus = async function() {
    return this.aggregate([
        {
            $match: { excluida: false }
        },
        {
            $group: {
                _id: '$status',
                total: { $sum: 1 }
            }
        }
    ]);
};

DenunciaSchema.statics.contarPorCategoria = async function() {
    return this.aggregate([
        {
            $match: { excluida: false }
        },
        {
            $group: {
                _id: '$categoria',
                total: { $sum: 1 }
            }
        },
        {
            $sort: { total: -1 }
        }
    ]);
};

DenunciaSchema.statics.obterEstatisticas = async function() {
    const total = await this.countDocuments({ excluida: false });
    const pendentes = await this.countDocuments({ status: 'Pendente', excluida: false });
    const emAndamento = await this.countDocuments({ status: 'Em Andamento', excluida: false });
    const resolvidas = await this.countDocuments({ status: 'Resolvida', excluida: false });
    
    // Tempo médio de resolução
    const resolvidasComTempo = await this.find({
        status: 'Resolvida',
        excluida: false
    }).select('dataRegistro dataAtualizacao');
    
    let tempoMedioResolucao = 0;
    if (resolvidasComTempo.length > 0) {
        const somaDias = resolvidasComTempo.reduce((acc, denuncia) => {
            const diff = new Date(denuncia.dataAtualizacao) - new Date(denuncia.dataRegistro);
            return acc + Math.floor(diff / (1000 * 60 * 60 * 24));
        }, 0);
        tempoMedioResolucao = Math.round(somaDias / resolvidasComTempo.length);
    }
    
    return {
        total,
        pendentes,
        emAndamento,
        resolvidas,
        tempoMedioResolucao,
        taxaResolucao: total > 0 ? ((resolvidas / total) * 100).toFixed(2) : 0
    };
};


DenunciaSchema.methods.adicionarArquivo = function(arquivo) {
    this.arquivos.push(arquivo);
    return this.save();
};

DenunciaSchema.methods.estaAtrasada = function() {
    const diasLimite = {
        'Urgente': 2,
        'Alta': 5,
        'Média': 10,
        'Baixa': 20
    };
    
    return this.diasAberta > diasLimite[this.prioridade];
};

module.exports = mongoose.model('Denuncia', DenunciaSchema);