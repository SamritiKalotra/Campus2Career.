// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogService = require('../services/blogService');

/**
 * @route   GET /api/blogs
 * @desc    Get latest blog articles
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    
    const articles = await blogService.getLatestArticles(page, perPage);
    
    res.json({
      success: true,
      count: articles.length,
      page,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blogs/tag/:tag
 * @desc    Get articles by tag
 * @access  Public
 */
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    
    const articles = await blogService.getArticlesByTag(tag, page, perPage);
    
    res.json({
      success: true,
      count: articles.length,
      tag,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blogs/:id
 * @desc    Get single article by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await blogService.getArticleById(id);
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blogs/search/query
 * @desc    Search articles
 * @access  Public
 */
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    
    const articles = await blogService.searchArticles(q, page, perPage);
    
    res.json({
      success: true,
      count: articles.length,
      query: q,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blogs/user/:username
 * @desc    Get articles by username
 * @access  Public
 */
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const articles = await blogService.getArticlesByUser(username);
    
    res.json({
      success: true,
      count: articles.length,
      username,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;