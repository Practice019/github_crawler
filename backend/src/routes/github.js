const express = require('express');
const router = express.Router();
const githubController = require('../controllers/github');
const projectIntroController = require('../controllers/projectIntro');

router.get('/trending', githubController.getTrendingProjects);
router.get('/trending/:language', githubController.getTrendingByLanguage);

router.get('/trending/intros', projectIntroController.getTrendingWithIntros);
router.get('/intro/:owner/:repo', projectIntroController.getProjectIntro);
router.get('/analyze/:owner/:repo', projectIntroController.analyzeRepo);
router.post('/intros/batch', projectIntroController.getBatchIntros);

module.exports = router;
