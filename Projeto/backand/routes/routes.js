
const express = require('express');
const router = express.Router();
const denunciasController = require('../controllers/denunciaController');
const upload = require('../middlewares/uploud');


router.post('/', 
    upload.array('arquivos', 5), 
    denunciasController.criarDenuncia
);

router.get('/protocolo/:protocolo', 
    denunciasController.consultarPorProtocolo
);

router.get('/categorias', 
    denunciasController.listarCategorias
);


router.get('/', 
    denunciasController.listarDenuncias
);

router.get('/:id', 
    denunciasController.obterDenuncia
);

router.put('/:id/status', 
    denunciasController.atualizarStatus
);

router.post('/:id/observacao', 
    denunciasController.adicionarObservacao
);

router.delete('/:id', 
    denunciasController.excluirDenuncia
);

module.exports = router;