const githubService = require('../services/github');

exports.getTrendingProjects = async (req, res, next) => {
  try {
    const { since, language } = req.query;
    const projects = await githubService.getTrendingProjects({ since, language });
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
};

exports.getTrendingByLanguage = async (req, res, next) => {
  try {
    const { language } = req.params;
    const { since } = req.query;
    const projects = await githubService.getTrendingByLanguage(language, { since });
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
};
