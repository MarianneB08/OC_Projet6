const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non autorisé !' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Sauce supprimée' }))
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => res.status(500).json({error}));
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non autorisé' });
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));
};


exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            switch (req.body.like) {
                case 1: // Lorsque l'utilisateur clique sur "like" pour ajouter un "like"
                    if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {
                        Sauce.updateOne(
                            { _id: req.params.id },
                            {
                                $inc: { likes: 1 },
                                $push: { usersLiked: req.body.userId }
                            }
                        )
                            .then(() => res.status(201).json({ message: "Like +1" }))
                            .catch(error => res.status(400).json({ error }));
                    }
                    break;
                case -1: // Lorsque l'utilisateur clique sur "dislike" pour ajouter un "dislike"
                    if (!sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
                        Sauce.updateOne(
                            { _id: req.params.id },
                            {
                                $inc: { dislikes: 1 },
                                $push: { usersDisliked: req.body.userId }
                            }
                        )
                            .then(() => res.status(201).json({ message: "Dislike +1" }))
                            .catch(error => res.status(400).json({ error }));
                    }
                    break;
                case 0: // Lorsque l'utilisateur reclique sur "like"/"dislike" pour revenir à aucun avis
                    if (sauce.usersLiked.includes(req.body.userId)) { // Clic sur "like" et retour à 0
                        Sauce.updateOne(
                            { _id: req.params.id },
                            {
                                $inc: { likes: -1 },
                                $pull: { usersLiked: req.body.userId }
                            }
                        )
                            .then(() => res.status(201).json({ message: "Like 0" }))
                            .catch(error => res.status(400).json({ error }));
                    } if (sauce.usersDisliked.includes(req.body.userId)) { // Clic sur "dislike" et retour à 0
                        Sauce.updateOne(
                            { _id: req.params.id },
                            {
                                $inc: { dislikes: -1 },
                                $pull: { usersDisliked: req.body.userId }
                            }
                        )
                            .then(() => res.status(201).json({ message: "Dislike 0" }))
                            .catch(error => res.status(400).json({ error }));
                    }
                    break;
            }
        })
        .catch(error => res.status(404).json({ error }));
};