// services/blogService.js
const axios = require('axios');

class BlogService {
  constructor() {
    // DEV.to API base URL (free, no auth required for reading)
    this.baseURL = 'https://dev.to/api';
  }

  /**
   * Fetch latest blog articles
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Articles per page (default: 10, max: 1000)
   * @returns {Promise<Array>} Array of blog articles
   */
  async getLatestArticles(page = 1, perPage = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/articles`, {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
  }

  /**
   * Fetch articles by tag
   * @param {string} tag - Tag to filter by
   * @param {number} page - Page number
   * @param {number} perPage - Articles per page
   * @returns {Promise<Array>} Array of filtered articles
   */
  async getArticlesByTag(tag, page = 1, perPage = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/articles`, {
        params: {
          tag,
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch articles by tag: ${error.message}`);
    }
  }

  /**
   * Fetch a single article by ID
   * @param {number} id - Article ID
   * @returns {Promise<Object>} Article details
   */
  async getArticleById(id) {
    try {
      const response = await axios.get(`${this.baseURL}/articles/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }
  }

  /**
   * Search articles
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} perPage - Articles per page
   * @returns {Promise<Array>} Array of search results
   */
  async searchArticles(query, page = 1, perPage = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/articles`, {
        params: {
          page,
          per_page: perPage
        }
      });
      
      // Filter articles by search query
      const filtered = response.data.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      throw new Error(`Failed to search articles: ${error.message}`);
    }
  }

  /**
   * Fetch articles by username
   * @param {string} username - DEV.to username
   * @returns {Promise<Array>} Array of user's articles
   */
  async getArticlesByUser(username) {
    try {
      const response = await axios.get(`${this.baseURL}/articles`, {
        params: {
          username
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user articles: ${error.message}`);
    }
  }
}

module.exports = new BlogService();