
const multer = require('multer');
const path = require('path');
const { generateUniqueFileName, isValidFileType } = require('../utils/helpers');


const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        cb(null, uploadPath);
    },
    

    filename: (req, file, cb) => {
        const uniqueName = generateUniqueFileName(file.originalname);
        cb(null, uniqueName);
    }
});


const fileFilter = (req, file, cb) => {

    if (isValidFileType(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG, PNG, DOC ou DOCX.'), false);
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, 
        files: 5 
    }
});


const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo: 10MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Muitos arquivos. Máximo: 5 arquivos'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de arquivo inesperado'
            });
        }
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;