const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

// GET /api/news/business - Get business news
router.get('/business', async (req, res) => {
    try {
        const { country = 'us', pageSize = 20 } = req.query;
        const news = await newsService.getBusinessNews(country, parseInt(pageSize));
        
        res.json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error('Error fetching business news:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/technology - Get technology news
router.get('/technology', async (req, res) => {
    try {
        const { country = 'us', pageSize = 20 } = req.query;
        const news = await newsService.getTechNews(country, parseInt(pageSize));
        
        res.json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error('Error fetching tech news:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/search - Search news by keyword
router.get('/search', async (req, res) => {
    try {
        const { q, query, sortBy = 'publishedAt', pageSize = 20 } = req.query;
        const searchQuery = q || query;
        
        if (!searchQuery) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter (q or query) is required'
            });
        }

        const news = await newsService.searchNews(searchQuery, sortBy, parseInt(pageSize));
        
        res.json({
            success: true,
            count: news.length,
            query: searchQuery,
            data: news
        });
    } catch (error) {
        console.error('Error searching news:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/sources - Get news by specific sources
router.get('/sources', async (req, res) => {
    try {
        const { sources, pageSize = 20 } = req.query;
        
        if (!sources) {
            // If no sources specified, return popular sources list
            const popularSources = newsService.getPopularSources();
            return res.json({
                success: true,
                data: popularSources
            });
        }

        const news = await newsService.getNewsBySources(sources, parseInt(pageSize));
        
        res.json({
            success: true,
            count: news.length,
            sources,
            data: news
        });
    } catch (error) {
        console.error('Error fetching news by sources:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/hacker-news - Get Hacker News (no API key needed)
router.get('/hacker-news', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const news = await newsService.getHackerNews(parseInt(limit));
        
        res.json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error('Error fetching Hacker News:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/hacker-news/search - Search Hacker News
router.get('/hacker-news/search', async (req, res) => {
    try {
        const { q, query } = req.query;
        const searchQuery = q || query;
        
        if (!searchQuery) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter (q or query) is required'
            });
        }

        const news = await newsService.searchHackerNews(searchQuery);
        
        res.json({
            success: true,
            count: news.length,
            query: searchQuery,
            data: news
        });
    } catch (error) {
        console.error('Error searching Hacker News:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/categories - Get news categories
router.get('/categories', (req, res) => {
    try {
        const categories = newsService.getCategories();
        
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/sources-list - Get available news sources
router.get('/sources-list', async (req, res) => {
    try {
        const { category = 'business', country = 'us' } = req.query;
        const sources = await newsService.getSources(category, country);
        
        res.json({
            success: true,
            count: sources.length,
            data: sources
        });
    } catch (error) {
        console.error('Error fetching sources list:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/top-headlines - Get top headlines (all categories)
router.get('/top-headlines', async (req, res) => {
    try {
        const { country = 'us', category, pageSize = 20 } = req.query;
        
        // If category is specified, fetch by category
        if (category) {
            let news;
            switch(category.toLowerCase()) {
                case 'business':
                    news = await newsService.getBusinessNews(country, parseInt(pageSize));
                    break;
                case 'technology':
                case 'tech':
                    news = await newsService.getTechNews(country, parseInt(pageSize));
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid category. Available: business, technology'
                    });
            }
            
            return res.json({
                success: true,
                count: news.length,
                category,
                data: news
            });
        }
        
        // Otherwise, get mixed business and tech news
        const [businessNews, techNews] = await Promise.all([
            newsService.getBusinessNews(country, parseInt(pageSize) / 2),
            newsService.getTechNews(country, parseInt(pageSize) / 2)
        ]);
        
        const combinedNews = [...businessNews, ...techNews]
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        res.json({
            success: true,
            count: combinedNews.length,
            data: combinedNews
        });
    } catch (error) {
        console.error('Error fetching top headlines:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/trending - Get trending news (mixed sources)
router.get('/trending', async (req, res) => {
    try {
        const { limit = 15 } = req.query;
        
        // Get from multiple sources
        const [hackerNews, businessNews] = await Promise.all([
            newsService.getHackerNews(Math.ceil(parseInt(limit) / 2)),
            newsService.getBusinessNews('us', Math.ceil(parseInt(limit) / 2))
        ]);
        
        const trendingNews = [...hackerNews, ...businessNews]
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, parseInt(limit));
        
        res.json({
            success: true,
            count: trendingNews.length,
            data: trendingNews
        });
    } catch (error) {
        console.error('Error fetching trending news:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/by-category/:category - Get news by specific category
router.get('/by-category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { country = 'us', pageSize = 20 } = req.query;
        
        let news;
        switch(category.toLowerCase()) {
            case 'business':
                news = await newsService.getBusinessNews(country, parseInt(pageSize));
                break;
            case 'technology':
            case 'tech':
                news = await newsService.getTechNews(country, parseInt(pageSize));
                break;
            case 'startups':
                news = await newsService.searchNews('startups', 'publishedAt', parseInt(pageSize));
                break;
            case 'finance':
                news = await newsService.searchNews('finance stock market', 'publishedAt', parseInt(pageSize));
                break;
            case 'career':
                news = await newsService.searchNews('career jobs hiring', 'publishedAt', parseInt(pageSize));
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid category. Available: business, technology, startups, finance, career'
                });
        }
        
        res.json({
            success: true,
            count: news.length,
            category,
            data: news
        });
    } catch (error) {
        console.error('Error fetching category news:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/news/health - Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'News API routes are working',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/news/business',
            'GET /api/news/technology',
            'GET /api/news/search?q=query',
            'GET /api/news/sources',
            'GET /api/news/hacker-news',
            'GET /api/news/hacker-news/search?q=query',
            'GET /api/news/categories',
            'GET /api/news/top-headlines',
            'GET /api/news/trending',
            'GET /api/news/by-category/:category'
        ]
    });
});

module.exports = router;