
const Denuncia = require('../models/Denuncia');
const { gerarProtocolo, enviarNotificacao } = require('../utils/helpers');
const asyncHandler = require('../middlewares/asyncHandler');


exports.criarDenuncia = asyncHandler(async (req, res) => {
    const {
        categoria,
        orgao,
        local,
        descricao,
        contato
    } = req.body;


    const protocolo = gerarProtocolo();

    
    const arquivos = req.files ? req.files.map(file => ({
        nome: file.originalname,
        caminho: file.path,
        tamanho: file.size,
        tipo: file.mimetype
    })) : [];

    
    const denuncia = await Denuncia.create({
        protocolo,
        categoria,
        orgao,
        local,
        descricao,
        contato,
        arquivos,
        status: 'Pendente',
        dataRegistro: new Date(),
        ip: req.ip, 
        userAgent: req.get('user-agent')
    });


    await enviarNotificacao({
        tipo: 'nova_denuncia',
        protocolo,
        categoria
    });

 
    console.log(`✅ Nova denúncia criada: ${protocolo}`);

    res.status(201).json({
        success: true,
        message: 'Denúncia registrada com sucesso',
        data: {
            protocolo,
            dataRegistro: denuncia.dataRegistro,
            status: denuncia.status
        }
    });
});


exports.consultarPorProtocolo = asyncHandler(async (req, res) => {
    const { protocolo } = req.params;

    const denuncia = await Denuncia.findOne({ protocolo });

    if (!denuncia) {
        return res.status(404).json({
            success: false,
            message: 'Protocolo não encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            protocolo: denuncia.protocolo,
            categoria: denuncia.categoria,
            orgao: denuncia.orgao,
            local: denuncia.local,
            descricao: denuncia.descricao,
            status: denuncia.status,
            dataRegistro: denuncia.dataRegistro,
            dataAtualizacao: denuncia.dataAtualizacao,
            arquivos: denuncia.arquivos.map(a => a.nome)
        }
    });
});


exports.listarDenuncias = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const categoria = req.query.categoria;


    const filtros = {};
    if (status) filtros.status = status;
    if (categoria) filtros.categoria = categoria;


    const denuncias = await Denuncia.find(filtros)
        .sort({ dataRegistro: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-ip -userAgent'); 

    const total = await Denuncia.countDocuments(filtros);

    res.status(200).json({
        success: true,
        data: denuncias,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});


exports.obterDenuncia = asyncHandler(async (req, res) => {
    const denuncia = await Denuncia.findById(req.params.id);

    if (!denuncia) {
        return res.status(404).json({
            success: false,
            message: 'Denúncia não encontrada'
        });
    }

    res.status(200).json({
        success: true,
        data: denuncia
    });
});


exports.atualizarStatus = asyncHandler(async (req, res) => {
    const { status, motivoAlteracao } = req.body;

  
    const statusValidos = ['Pendente', 'Em Andamento', 'Resolvida', 'Arquivada'];
    if (!statusValidos.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status inválido'
        });
    }

    const denuncia = await Denuncia.findById(req.params.id);

    if (!denuncia) {
        return res.status(404).json({
            success: false,
            message: 'Denúncia não encontrada'
        });
    }


    denuncia.status = status;
    denuncia.dataAtualizacao = new Date();


    denuncia.historico.push({
        data: new Date(),
        statusAnterior: denuncia.status,
        statusNovo: status,
        motivo: motivoAlteracao,
        usuario: req.user ? req.user.id : 'Sistema'
    });

    await denuncia.save();

    if (denuncia.contato) {
        await enviarNotificacao({
            tipo: 'atualizacao_status',
            protocolo: denuncia.protocolo,
            status,
            contato: denuncia.contato
        });
    }

    res.status(200).json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: denuncia
    });
});


exports.adicionarObservacao = asyncHandler(async (req, res) => {
    const { observacao } = req.body;

    const denuncia = await Denuncia.findById(req.params.id);

    if (!denuncia) {
        return res.status(404).json({
            success: false,
            message: 'Denúncia não encontrada'
        });
    }

    denuncia.observacoesInternas.push({
        data: new Date(),
        texto: observacao,
        usuario: req.user ? req.user.id : 'Sistema'
    });

    await denuncia.save();

    res.status(200).json({
        success: true,
        message: 'Observação adicionada com sucesso',
        data: denuncia
    });
});


exports.excluirDenuncia = asyncHandler(async (req, res) => {
    const denuncia = await Denuncia.findById(req.params.id);

    if (!denuncia) {
        return res.status(404).json({
            success: false,
            message: 'Denúncia não encontrada'
        });
    }

    denuncia.excluida = true;
    denuncia.dataExclusao = new Date();
    await denuncia.save();

    res.status(200).json({
        success: true,
        message: 'Denúncia excluída com sucesso'
    });
});


exports.listarCategorias = asyncHandler(async (req, res) => {
    const categorias = [
        { id: 'corrupcao', nome: 'Corrupção' },
        { id: 'desvio', nome: 'Desvio de Recursos' },
        { id: 'nepotismo', nome: 'Nepotismo' },
        { id: 'abuso', nome: 'Abuso de Poder' },
        { id: 'fraude', nome: 'Fraude em Licitação' },
        { id: 'servicos', nome: 'Má Prestação de Serviços' },
        { id: 'infraestrutura', nome: 'Problemas de Infraestrutura' },
        { id: 'outros', nome: 'Outros' }
    ];

    res.status(200).json({
        success: true,
        data: categorias
    });
});