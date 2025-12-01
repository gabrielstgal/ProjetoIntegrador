🚨 Sistema de Denúncias Anônimas - Governo da Paraíba


Sistema web desenvolvido para permitir o registro e acompanhamento de denúncias de forma completamente anônima e segura para o Governo do Estado da Paraíba. O sistema é dividido em um frontend estático simples e um backend robusto em Node.js.

🌟 Funcionalidades Principais
Registro Anônimo de Denúncias: Formulário dedicado para registrar novas denúncias com garantia de anonimato.

Protocolo de Acompanhamento: Geração de um número de protocolo único (DEN-ANO-CÓDIGO) para consulta futura.

Anexos de Evidências: Suporte para upload de múltiplos arquivos (PDF, JPG, PNG, DOC/DOCX) com limites de tamanho (10MB) e quantidade (máximo 5 arquivos).

Consulta por Protocolo: Interface para que o denunciante verifique o status da sua denúncia.

Gestão de Denúncias (Backend): Endpoints para CRUD completo, incluindo atualização de status (Pendente, Em Andamento, Resolvida, Arquivada), adição de observações e exclusão lógica (soft delete).

Estatísticas Públicas: Visualização de métricas como total de denúncias, em andamento e resolvidas.

Notificação por Email: Envio de notificações para o administrador ao receber uma nova denúncia e para o denunciante (se fornecer contato anônimo) sobre atualizações de status.

🛠️ Tecnologias Utilizadas
Backend (Node.js/Express)
O backend está localizado na pasta Projeto/backand.

Linguagem: JavaScript/Node.js

Framework: Express

Banco de Dados: MongoDB (via Mongoose)

Upload de Arquivos: Multer

Segurança: Helmet, CORS, Express Rate Limit, Express Mongo Sanitize, XSS Clean

Autenticação/Autorização (Pronto para uso): bcryptjs, jsonwebtoken, express-validator

Frontend (Web)
O frontend está localizado na pasta html.

HTML5

CSS3

JavaScript (Puro)

⚙️ Configuração e Instalação
1. Configuração do Backend
Navegue até o diretório do backend:

Bash

cd projetoIntegrador-main/Projeto/backand
Instale as dependências:

Bash

npm install

Bash

npm start
# ou
npm start
O servidor será iniciado na porta configurada (padrão 5000).
