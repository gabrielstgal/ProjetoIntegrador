
let denuncias = [];
let contadorProtocolo = 1;

window.onload = function() {
    carregarDados();
    atualizarEstatisticas();
    inicializarEventos();
};

function inicializarEventos() {
    // Evento de upload de arquivos
    document.getElementById('arquivos').addEventListener('change', handleFileUpload);
    
    // Evento de submissão do formulário
    document.getElementById('formDenuncia').addEventListener('submit', registrarDenuncia);
}

function switchTab(tabName) {
    // Remove active de todos os botões e conteúdos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativa o tab selecionado
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Atualiza estatísticas se for a aba de estatísticas
    if (tabName === 'estatisticas') {
        atualizarEstatisticas();
        listarDenuncias();
    }
}

function handleFileUpload(e) {
    const fileList = document.getElementById('fileList');
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
        const fileNames = files.map(f => `📄 ${f.name}`).join('<br>');
        fileList.innerHTML = `<strong>Arquivos selecionados:</strong><br>${fileNames}`;
    } else {
        fileList.innerHTML = '';
    }
}

function registrarDenuncia(e) {
    e.preventDefault();
    
    // Gera protocolo único no formato DEN-ANO-NÚMERO
    const protocolo = gerarProtocolo();
    
    // Coleta dados do formulário
    const denuncia = {
        protocolo: protocolo,
        categoria: document.getElementById('categoria').value,
        orgao: document.getElementById('orgao').value,
        local: document.getElementById('local').value,
        descricao: document.getElementById('descricao').value,
        contato: document.getElementById('contato').value,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR'),
        status: 'Pendente',
        arquivos: obterNomesArquivos()
    };
    
    // Salva denúncia no sistema
    denuncias.push(denuncia);
    salvarDados();
    
    // Exibe mensagem de sucesso
    exibirSucesso(protocolo);
    
    // Limpa formulário
    limparFormulario();
}

function gerarProtocolo() {
    const protocolo = `DEN-2025-${String(contadorProtocolo).padStart(4, '0')}`;
    contadorProtocolo++;
    return protocolo;
}

function obterNomesArquivos() {
    const arquivosInput = document.getElementById('arquivos');
    return Array.from(arquivosInput.files).map(f => f.name);
}

function exibirSucesso(protocolo) {
    document.getElementById('protocoloGerado').textContent = protocolo;
    const alertElement = document.getElementById('successAlert');
    alertElement.classList.add('show');
    
    // Esconde alerta após 10 segundos
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 10000);
}

function limparFormulario() {
    document.getElementById('formDenuncia').reset();
    document.getElementById('fileList').innerHTML = '';
}

function consultarDenuncia() {
    const protocolo = document.getElementById('protocolo').value.trim();
    const loading = document.getElementById('loadingConsulta');
    const resultado = document.getElementById('resultadoConsulta');
    
    // Valida se o protocolo foi informado
    if (!protocolo) {
        exibirMensagemConsulta(resultado, 
            '<div class="alert alert-info show">Por favor, informe o número do protocolo.</div>');
        return;
    }
    
    // Simula carregamento (em produção, seria uma chamada ao servidor)
    loading.classList.add('show');
    resultado.innerHTML = '';
    
    setTimeout(() => {
        loading.classList.remove('show');
        processarConsulta(protocolo, resultado);
    }, 1000);
}

function processarConsulta(protocolo, resultado) {
    const denuncia = denuncias.find(d => d.protocolo === protocolo);
    
    if (denuncia) {
        resultado.innerHTML = gerarHTMLDenuncia(denuncia);
    } else {
        exibirMensagemConsulta(resultado, 
            '<div class="alert alert-info show">❌ Protocolo não encontrado. Verifique o número e tente novamente.</div>');
    }
}

function gerarHTMLDenuncia(denuncia) {
    return `
        <div class="denuncia-card">
            <div class="denuncia-header">
                <span class="protocolo">Protocolo: ${denuncia.protocolo}</span>
                <span class="status status-${normalizeStatus(denuncia.status)}">${denuncia.status}</span>
            </div>
            <div class="denuncia-info">
                <strong>Data:</strong> ${denuncia.data} às ${denuncia.hora}<br>
                <strong>Categoria:</strong> ${formatarCategoria(denuncia.categoria)}<br>
                ${denuncia.orgao ? `<strong>Órgão:</strong> ${denuncia.orgao}<br>` : ''}
                ${denuncia.local ? `<strong>Local:</strong> ${denuncia.local}<br>` : ''}
            </div>
            <div class="denuncia-desc">
                <strong>Descrição:</strong><br>
                ${denuncia.descricao}
            </div>
            ${denuncia.arquivos.length > 0 ? `
                <div style="margin-top: 15px;">
                    <strong>Anexos:</strong> ${denuncia.arquivos.join(', ')}
                </div>
            ` : ''}
        </div>
    `;
}

function exibirMensagemConsulta(elemento, mensagem) {
    elemento.innerHTML = mensagem;
}

function normalizeStatus(status) {
    return status.toLowerCase().replace('ê', 'e').replace(' ', '-');
}

function atualizarEstatisticas() {
    const total = denuncias.length;
    const andamento = contarPorStatus('Em Andamento');
    const resolvidas = contarPorStatus('Resolvida');
    
    document.getElementById('totalDenuncias').textContent = total;
    document.getElementById('emAndamento').textContent = andamento;
    document.getElementById('resolvidas').textContent = resolvidas;
}

function contarPorStatus(status) {
    return denuncias.filter(d => d.status === status).length;
}

function listarDenuncias() {
    const lista = document.getElementById('listaDenuncias');
    
    // Verifica se há denúncias
    if (denuncias.length === 0) {
        lista.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 40px;">Nenhuma denúncia registrada ainda.</p>';
        return;
    }
    
    // Mostra as 10 denúncias mais recentes (ordem reversa)
    const recentes = denuncias.slice(-10).reverse();
    
    lista.innerHTML = recentes.map(d => gerarCardResumo(d)).join('');
}

function gerarCardResumo(d) {
    const descricaoResumida = d.descricao.length > 200 
        ? d.descricao.substring(0, 200) + '...' 
        : d.descricao;
    
    return `
        <div class="denuncia-card">
            <div class="denuncia-header">
                <span class="protocolo">${d.protocolo}</span>
                <span class="status status-${normalizeStatus(d.status)}">${d.status}</span>
            </div>
            <div class="denuncia-info">
                <strong>Categoria:</strong> ${formatarCategoria(d.categoria)} | 
                <strong>Data:</strong> ${d.data}
                ${d.local ? ` | <strong>Local:</strong> ${d.local}` : ''}
            </div>
            <div class="denuncia-desc">
                ${descricaoResumida}
            </div>
        </div>
    `;
}

function formatarCategoria(cat) {
    const categorias = {
        'corrupcao': 'Corrupção',
        'desvio': 'Desvio de Recursos',
        'nepotismo': 'Nepotismo',
        'abuso': 'Abuso de Poder',
        'fraude': 'Fraude em Licitação',
        'servicos': 'Má Prestação de Serviços',
        'infraestrutura': 'Problemas de Infraestrutura',
        'outros': 'Outros'
    };
    return categorias[cat] || cat;
}


function salvarDados() {
    const dados = {
        denuncias: denuncias,
        contador: contadorProtocolo
    };
    
    try {
   
        console.log('Dados salvos:', dados);
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}


function carregarDados() {
    try {
        // Em produção: fetch('/api/denuncias').then(response => response.json())
        // Por enquanto, dados ficam apenas na sessão
        denuncias = [];
        contadorProtocolo = 1;
    } catch (error) {
        console.error('Erro ao carregar:', error);
    }
}


 
setInterval(() => {
    if (denuncias.length > 0 && Math.random() > 0.8) {
        const idx = Math.floor(Math.random() * denuncias.length);
        const statusPossiveis = ['Pendente', 'Em Andamento', 'Resolvida'];
        const novoStatus = statusPossiveis[Math.floor(Math.random() * statusPossiveis.length)];
        
        denuncias[idx].status = novoStatus;
        atualizarEstatisticas();
    }
}, 5000);