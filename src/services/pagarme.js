const axios = require('axios')
const api_key = process.env.PAGARME_API_KEY

const api = axios.create({
  baseURL: 'https://api.pagar.me/1',
});

module.exports = async (endpoint, data, method = 'post') => {
  try {
    const response = await api[method](endpoint, {
      api_key,
      ...data,
    });

    return { error: false, data: response.data };
  } catch (err) {
    return {
      error: true,
      message: JSON.stringify(err.response.data.errors[0]),
    };
  }
};