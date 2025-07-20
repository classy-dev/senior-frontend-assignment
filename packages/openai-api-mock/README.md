# OpenAI API Mock

This is a Node.js module for mocking OpenAI API responses in a development environment .

[![Tests](https://github.com/chihebnabil/openai-api-mock/actions/workflows/test.yml/badge.svg)](https://github.com/chihebnabil/openai-api-mock/actions/workflows/test.yml)

It's useful for testing and development purposes when you don't want to make actual API calls.

The module supports the following OpenAI API endpoints:
- chat completions
- chat completions with streaming
- chat completions with functions
- image generations

> This module is powering the sandbox mode for [Aipify](https://aipify.co).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Consistent Outputs for Testing](#consistent-outputs-for-testing)
- [Intercepted URLs](#intercepted-urls)
- [TypeScript Support](#typescript-support)
- [Dependencies](#dependencies)
- [License](#license)

## Installation

You can install this module using npm as a dev dependency :

```sh
npm install -D openai-api-mock
```

## Usage

The module supports both ESM and CommonJS imports:

```js
// ESM
import { mockOpenAIResponse } from 'openai-api-mock';

// CommonJS
const { mockOpenAIResponse } = require('openai-api-mock');
```

Then, call the mockOpenAIResponse function to set up the mock response:

```js
// Basic usage
mockOpenAIResponse();

// Force mocking regardless of environment
mockOpenAIResponse(true);

// With configuration options
mockOpenAIResponse(false, {
    includeErrors: true,    // Simulate random API errors
    latency: 1000,         // Add 1 second delay to responses
    logRequests: true,     // Log incoming requests to console
    seed: 12345,           // Seed for consistent/deterministic responses
    useFixedResponses: true // Use predefined fixed response templates
});
```

The function accepts two parameters:
- `force` (boolean): Determines whether the mock response should be used regardless of the environment. If false or not provided, mocking only occurs in development environment.
- `options` (object): Additional configuration options
  - `includeErrors` (boolean): When true, randomly simulates API errors
  - `latency` (number): Adds artificial delay to responses in milliseconds
  - `logRequests` (boolean): Logs incoming requests to console for debugging
  - `seed` (number|string): Seed value for consistent/deterministic responses using faker.js
  - `useFixedResponses` (boolean): Use predefined fixed response templates for completely consistent responses

The function returns an object with control methods:
```js
const mock = mockOpenAIResponse();

// Check if mocking is active
console.log(mock.isActive);

// Stop all mocks
mock.stopMocking();

// Seed management for consistent outputs
mock.setSeed(12345);        // Set a new seed for deterministic responses
mock.resetSeed();           // Reset to random responses

// Template management
const templates = mock.getResponseTemplates(); // Get available templates
const customTemplate = mock.createResponseTemplate('SIMPLE_CHAT', {
    choices: [{ message: { content: 'Custom response' } }]
});

// Add custom endpoint mock (uses api.openai.com as base url)
mock.addCustomEndpoint('POST', '/v1/custom', (uri, body) => {
    return [200, { custom: 'response' }];
});
```

### Example responses

```js
// Call the mockOpenAIResponse function once to set up the mock
mockOpenAIResponse() 

// Now, when you call the OpenAI API, it will return a mock response
const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You're an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ]
});
 ```
In this example, the `response` constant will contain mock data, simulating a response from the OpenAI API:

```javascript
{
    choices: [
        {
          finish_reason: 'stop',
          index: 0,
          message: [Object],
          logprobs: null
        }
      ],
      created: 1707040459,
      id: 'chatcmpl-tggOnwW8Lp2XiwQ8dmHHAcNYJ8CfzR',
      model: 'gpt-3.5-mock',
      object: 'chat.completion',
      usage: { completion_tokens: 17, prompt_tokens: 57, total_tokens: 74 }
}
```
The library also supports mocking `stream` responses

```js
// Call the mockOpenAIResponse function once to set up the mock
mockOpenAIResponse() 
// Now, when you call the OpenAI API, it will return a mock response
const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                stream : true,
                messages: [
                    { role: 'system', content: "You're an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ]
});

// then read it 
for await (const part of response) {
    console.log(part.choices[0]?.delta?.content || '')
}
```

## Consistent Outputs for Testing

The library provides several mechanisms to achieve consistent, deterministic outputs for reliable testing:

### Seed-based Consistency

Use seeds to ensure reproducible responses across test runs:

```js
// Set up mock with a fixed seed
const mock = mockOpenAIResponse(true, { seed: 12345 });

// Multiple calls will return identical responses
const response1 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }]
});

const response2 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }]
});

// response1 and response2 will be identical
console.log(JSON.stringify(response1) === JSON.stringify(response2)); // true
```

### Fixed Response Templates

For maximum consistency, use predefined response templates:

```js
// Enable fixed responses
const mock = mockOpenAIResponse(true, { useFixedResponses: true });

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Any message' }]
});

// Will always return the same fixed response
console.log(response.choices[0].message.content); 
// "This is a consistent test response."
```

### Runtime Seed Management

Change seeds during runtime for different test scenarios:

```js
const mock = mockOpenAIResponse(true);

// Test scenario A
mock.setSeed(12345);
const responseA = await openai.chat.completions.create({...});

// Test scenario B  
mock.setSeed(54321);
const responseB = await openai.chat.completions.create({...});

// Reset to random behavior
mock.resetSeed();
const responseRandom = await openai.chat.completions.create({...});
```

For comprehensive examples and best practices, see [CONSISTENCY_EXAMPLES.md](./CONSISTENCY_EXAMPLES.md).
```

## Intercepted URLs

This module uses the `nock` library to intercept HTTP calls to the following OpenAI API endpoints:

- `https://api.openai.com/v1/chat/completions`: This endpoint is used for generating chat completions.
- `https://api.openai.com/v1/images/generations`: This endpoint is used for generating images.


## TypeScript Support

This package includes TypeScript definitions out of the box. After installing the package, you can use it with full type support:

```typescript
import { mockOpenAIResponse, MockOptions } from 'openai-api-mock';

// Configure with TypeScript types
const options: MockOptions = {
    includeErrors: true,       // Optional: simulate random API errors
    latency: 1000,            // Optional: add 1 second delay
    logRequests: true,        // Optional: log requests to console
    seed: 12345,              // Optional: seed for consistent responses
    useFixedResponses: true   // Optional: use fixed response templates
};

const mock = mockOpenAIResponse(true, options);

// TypeScript provides full type checking and autocompletion
console.log(mock.isActive);  // boolean
mock.stopMocking();         // function
mock.setSeed(54321);        // function with type checking
mock.resetSeed();           // function

// Template methods with type safety
const templates = mock.getResponseTemplates();  // Record<string, any>
const customTemplate = mock.createResponseTemplate('SIMPLE_CHAT', {
    choices: [{ message: { content: 'Custom content' } }]
});

// Custom endpoints with type safety
mock.addCustomEndpoint('POST', '/v1/custom', (uri, body) => {
    return [200, { custom: 'response' }];
});
```

## Dependencies
This module depends on the following npm packages:

- nock : For intercepting HTTP calls.
- @faker-js/faker : For generating fake data.

## License
This project is licensed under the MIT License.
