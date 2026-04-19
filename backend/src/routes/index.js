const express = require('express');
const router = express.Router();
const userCtrl    = require('../controllers/userController');
const wardrobeCtrl = require('../controllers/wardrobeController');
const weatherCtrl = require('../controllers/weatherController');

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Users
router.get  ('/users/:deviceId',           userCtrl.getOrCreateUser);
router.post ('/users/:deviceId/register',  userCtrl.register);
router.post ('/users/login',               userCtrl.login);
router.patch('/users/:deviceId',           userCtrl.updateSettings);

// Wardrobe
router.get   ('/users/:deviceId/wardrobe',               wardrobeCtrl.getItems);
router.post  ('/users/:deviceId/wardrobe',               wardrobeCtrl.addItem);
router.patch ('/users/:deviceId/wardrobe/:itemId/photo', wardrobeCtrl.updatePhoto);
router.delete('/users/:deviceId/wardrobe/:itemId',       wardrobeCtrl.deleteItem);

// Weather
router.get('/weather/:city',         weatherCtrl.getWeather);
router.get('/recommendations/:city', weatherCtrl.getRecommendations);

module.exports = router;