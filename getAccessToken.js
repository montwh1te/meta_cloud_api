const axios = require('axios');
require('dotenv').config();

async function getAccessToken() {
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://graph.facebook.com/v11.0/oauth/access_token',
            params: {
                grant_type: 'fb_exchange_token',
                client_id: process.env.APP_ID,
                client_secret: process.env.APP_SECRET,
                fb_exchange_token: process.env.REFRESH_TOKEN
            }
        });

        const newAccessToken = response.data.access_token;
        console.log('New access token:', newAccessToken);

        // Update the environment variable
        process.env.TOKEN = newAccessToken;

        return newAccessToken;
    } catch (error) {
        console.error('Error getting new access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { getAccessToken };
