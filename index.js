const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const GROQ_KEYS = (process.env.GROQ_KEYS || '').split(',').map(k => k.trim()).filter(k => k);
console.log(`Loaded ${GROQ_KEYS.length} API keys.`);
let currentKeyIndex = 0;

app.post('/api/tutor', async (req, res) => {
    const { messages, model, temperature, max_tokens } = req.body;
    console.log(`Processing request with model: ${model}`);

    const makeApiCall = async (retryCount = 0) => {
        try {
            const currentKey = GROQ_KEYS[currentKeyIndex];
            if (!currentKey) throw new Error('No API keys configured');

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model,
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1024
            }, {
                headers: {
                    'Authorization': `Bearer ${currentKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            const status = error.response ? error.response.status : 500;
            const errorMsg = error.response?.data?.error?.message || error.message;

            if ((status === 429 || status === 503 || errorMsg.toLowerCase().includes('discontinued')) && retryCount < GROQ_KEYS.length) {
                console.warn(`Key ${currentKeyIndex + 1} failed. Rotating...`);
                currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
                return makeApiCall(retryCount + 1);
            }
            throw new Error(errorMsg);
        }
    };

    try {
        const data = await makeApiCall();
        res.json(data);
    } catch (error) {
        console.error('Backend Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Main server loop with error prevention
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err.message);
});

// Export for Vercel
module.exports = app;

const PORT = process.env.PORT || 5000;
// Local development server (won't run on Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
