const express = require('express');
const cors = require('cors');
const { default: OpenAI } = require('openai');
const { mockOpenAIResponse } = require('@ai-chat/openai-api-mock');

// Enable OpenAI mocking BEFORE creating the client
mockOpenAIResponse(true, {
  seed: 12345,
  includeErrors: false,
  latency: 500,
  logRequests: true,
});

const app = express();
app.use(cors());
app.use(express.json());

// Create OpenAI client (will use mocked responses)
const openai = new OpenAI({
  apiKey: 'test-key',
});

// Proxy endpoint for chat completions
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { stream, ...params } = req.body;
    
    if (stream) {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamResponse = await openai.chat.completions.create({
        ...params,
        stream: true,
      });
      
      for await (const chunk of streamResponse) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await openai.chat.completions.create(params);
      res.json(response);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock OpenAI server running on http://localhost:${PORT}`);
  console.log('Using openai-api-mock for responses');
});