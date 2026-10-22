// services/newsService.js
// NewsAPI.org - Get FREE API key from: https://newsapi.org/
const axios = require('axios');

class NewsService {
  constructor() {
    // Get your FREE API key from: https://newsapi.org/register
    this.apiKey = process.env.NEWS_API_KEY || 'YOUR_API_KEY_HERE';
    this.baseURL = 'https://newsapi.org/v2';
    
    // Alternative: Hacker News API (no auth required)
    this.hackerNewsURL = 'https://hacker-news.firebaseio.com/v0';
    this.hackerNewsAlgolia = 'https://hn.algolia.com/api/v1';
  }

  /**
   * Get top business news headlines
   * @param {string} country - Country code (us, in, gb, etc.)
   * @param {number} pageSize - Number of results (max 100)
   * @returns {Promise<Array>} News articles
   */
  async getBusinessNews(country = 'us', pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          category: 'business',
          country,
          pageSize
        }
      });

      return this.formatNewsArticles(response.data.articles);
    } catch (error) {
      throw new Error(`Failed to fetch business news: ${error.message}`);
    }
  }

  /**
   * Get technology news
   * @param {string} country - Country code
   * @param {number} pageSize - Number of results
   * @returns {Promise<Array>} Tech news articles
   */
  async getTechNews(country = 'us', pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          category: 'technology',
          country,
          pageSize
        }
      });

      return this.formatNewsArticles(response.data.articles);
    } catch (error) {
      throw new Error(`Failed to fetch tech news: ${error.message}`);
    }
  }

  /**
   * Search news by keyword
   * @param {string} query - Search query
   * @param {string} sortBy - Sort by: relevancy, popularity, publishedAt
   * @param {number} pageSize - Number of results
   * @returns {Promise<Array>} Search results
   */
  async searchNews(query, sortBy = 'publishedAt', pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/everything`, {
        params: {
          apiKey: this.apiKey,
          q: query,
          sortBy,
          pageSize,
          language: 'en'
        }
      });

      return this.formatNewsArticles(response.data.articles);
    } catch (error) {
      throw new Error(`Failed to search news: ${error.message}`);
    }
  }

  /**
   * Get news from specific sources
   * @param {string} sources - Comma-separated source IDs
   * @param {number} pageSize - Number of results
   * @returns {Promise<Array>} News articles
   */
  async getNewsBySources(sources, pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          sources,
          pageSize
        }
      });

      return this.formatNewsArticles(response.data.articles);
    } catch (error) {
      throw new Error(`Failed to fetch news by sources: ${error.message}`);
    }
  }

  /**
   * Get trending startup/tech news from Hacker News (No API key needed)
   * @param {number} limit - Number of stories
   * @returns {Promise<Array>} Hacker News stories
   */
  async getHackerNews(limit = 20) {
    try {
      // Get top story IDs
      const response = await axios.get(`${this.hackerNewsURL}/topstories.json`);
      const storyIds = response.data.slice(0, limit);

      // Fetch story details
      const stories = await Promise.all(
        storyIds.map(id => this.getHackerNewsStory(id))
      );

      return stories.filter(story => story !== null).map(story => ({
        id: story.id,
        title: story.title,
        description: story.text || 'Click to read more on Hacker News',
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: 'Hacker News',
        author: story.by,
        publishedAt: new Date(story.time * 1000).toISOString(),
        category: 'Technology',
        score: story.score,
        comments: story.descendants || 0
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Hacker News: ${error.message}`);
    }
  }

  /**
   * Get a single Hacker News story
   * @param {number} id - Story ID
   * @returns {Promise<Object>} Story details
   */
  async getHackerNewsStory(id) {
    try {
      const response = await axios.get(`${this.hackerNewsURL}/item/${id}.json`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Search Hacker News (No API key needed)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchHackerNews(query) {
    try {
      const response = await axios.get(`${this.hackerNewsAlgolia}/search`, {
        params: {
          query,
          tags: 'story',
          hitsPerPage: 20
        }
      });

      return response.data.hits.map(hit => ({
        id: hit.objectID,
        title: hit.title,
        description: hit.story_text || 'Click to read more',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'Hacker News',
        author: hit.author,
        publishedAt: hit.created_at,
        category: 'Technology',
        score: hit.points,
        comments: hit.num_comments
      }));
    } catch (error) {
      throw new Error(`Failed to search Hacker News: ${error.message}`);
    }
  }

  /**
   * Get news sources
   * @param {string} category - Category filter
   * @param {string} country - Country code
   * @returns {Promise<Array>} News sources
   */
  async getSources(category = 'business', country = 'us') {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines/sources`, {
        params: {
          apiKey: this.apiKey,
          category,
          country
        }
      });

      return response.data.sources;
    } catch (error) {
      throw new Error(`Failed to fetch sources: ${error.message}`);
    }
  }

  /**
   * Format news articles
   * @param {Array} articles - Raw articles
   * @returns {Array} Formatted articles
   */
  formatNewsArticles(articles) {
    return articles.map(article => ({
      id: this.generateId(article.url),
      title: article.title,
      description: article.description || 'No description available',
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage || 'https://via.placeholder.com/400x250?text=News',
      source: article.source.name,
      author: article.author || 'Unknown',
      publishedAt: article.publishedAt,
      category: this.categorizeArticle(article.title + ' ' + article.description)
    }));
  }

  /**
   * Generate unique ID from URL
   * @param {string} url - Article URL
   * @returns {string} Generated ID
   */
  generateId(url) {
    return url ? url.split('/').pop().substring(0, 20) : Math.random().toString(36).substr(2, 9);
  }

  /**
   * Categorize article based on content
   * @param {string} text - Article text
   * @returns {string} Category
   */
  categorizeArticle(text) {
    const lower = text.toLowerCase();
    if (lower.includes('stock') || lower.includes('market') || lower.includes('trading')) return 'Finance';
    if (lower.includes('startup') || lower.includes('tech') || lower.includes('ai')) return 'Technology';
    if (lower.includes('job') || lower.includes('career') || lower.includes('hiring')) return 'Career';
    return 'Business';
  }

  /**
   * Get news categories
   * @returns {Array} List of categories
   */
  getCategories() {
    return [
      { id: 1, name: 'Business', icon: '💼', color: '#2196F3' },
      { id: 2, name: 'Technology', icon: '💻', color: '#9C27B0' },
      { id: 3, name: 'Startups', icon: '🚀', color: '#FF5722' },
      { id: 4, name: 'Finance', icon: '💰', color: '#4CAF50' },
      { id: 5, name: 'Career', icon: '📊', color: '#FF9800' },
      { id: 6, name: 'Markets', icon: '📈', color: '#00BCD4' }
    ];
  }

  /**
   * Get popular news sources
   * @returns {Array} Popular sources
   */
  getPopularSources() {
    return [
      { id: 'techcrunch', name: 'TechCrunch' },
      { id: 'the-wall-street-journal', name: 'The Wall Street Journal' },
      { id: 'bloomberg', name: 'Bloomberg' },
      { id: 'business-insider', name: 'Business Insider' },
      { id: 'fortune', name: 'Fortune' },
      { id: 'financial-times', name: 'Financial Times' },
      { id: 'the-verge', name: 'The Verge' },
      { id: 'wired', name: 'Wired' }
    ];
  }
}

module.exports = new NewsService();