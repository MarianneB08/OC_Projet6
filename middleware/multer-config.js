const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        // Remplacement des espaces par des underscores dans le nom du fichier
        const filename = file.originalname.split(' ').join('_');
        // Supression de l'extension du nom du fichier original
        const name = filename.split('.')[0];
        // Récupération de l'extension dans le dictionnaire mimetype
        const extension = MIME_TYPES[file.mimetype];
        // Ajout du timestamp et de l'extension au nom du fichier
        // Retourne le nom final du fichier
        callback(null, name + Date.now() + '.' + extension);
    }
});

module.exports = multer({storage}).single('image');