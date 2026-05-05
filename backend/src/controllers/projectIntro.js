const projectIntroService = require('../services/projectIntro');
const githubService = require('../services/github');

exports.getTrendingWithIntros = async (req, res, next) => {
  try {
    const { since, language } = req.query;
    const projects = await githubService.getTrendingProjects({ since, language });

    const withIntros = projects.map(repo => ({
      ...repo,
      introduction: projectIntroService.generateIntroFromRepoData(repo)
    }));

    res.json({ data: withIntros });
  } catch (error) {
    next(error);
  }
};

exports.getProjectIntro = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;
    const intro = await projectIntroService.getProjectIntro(fullName);
    res.json({ data: intro });
  } catch (error) {
    next(error);
  }
};

exports.getBatchIntros = async (req, res, next) => {
  try {
    const { repos } = req.body;
    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return res.status(400).json({ error: 'repos array is required' });
    }
    const results = await projectIntroService.getBatchProjectIntros(repos);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
};

exports.analyzeRepo = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;
    const intro = await projectIntroService.getProjectIntro(fullName);
    res.json({
      data: {
        summary: intro.summary,
        techStack: intro.techStack,
        useCases: intro.useCases,
        highlights: intro.highlights,
        markdown: intro.markdown
      }
    });
  } catch (error) {
    next(error);
  }
};
