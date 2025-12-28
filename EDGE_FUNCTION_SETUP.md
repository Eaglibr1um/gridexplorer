# ChatGPT Edge Function Setup

## ✅ Edge Function Deployed

The `chatgpt` edge function has been successfully deployed to your Supabase project.

## 🔑 Required Setup

### 1. Set OpenAI API Key

You need to set the `OPENAI_API_KEY` environment variable in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add a new secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)

Alternatively, you can use the Supabase CLI:
```bash
supabase secrets set OPENAI_API_KEY=your-api-key-here
```

## 📝 Usage

### Basic Example

```typescript
import { callChatGPT } from '../services/chatgptService';

// Simple question
const response = await callChatGPT({
  message: "What is the capital of France?",
});

console.log(response.response); // "The capital of France is Paris."
```

### With System Prompt

```typescript
const response = await callChatGPT({
  message: "Explain quantum physics",
  systemPrompt: "You are a helpful science tutor. Explain concepts in simple terms.",
  model: "gpt-4o-mini",
  temperature: 0.7,
});
```

### With Custom Model

```typescript
// Use GPT-4o-mini (default, cost-effective)
const response = await callChatGPT({
  message: "Write a short story",
  model: "gpt-4o-mini",
});

// Use GPT-4o (more capable)
const response = await callChatGPT({
  message: "Analyze this complex problem",
  model: "gpt-4o",
});

// Use GPT-4 Turbo (most capable)
const response = await callChatGPT({
  message: "Solve this advanced math problem",
  model: "gpt-4-turbo",
  temperature: 0.3, // Lower temperature for more focused responses
});
```

### With Temperature Control

```typescript
// Creative responses (higher temperature)
const creativeResponse = await callChatGPT({
  message: "Write a creative poem",
  temperature: 1.5, // More creative
});

// Focused responses (lower temperature)
const focusedResponse = await callChatGPT({
  message: "What is 2+2?",
  temperature: 0.3, // More deterministic
});
```

### With Token Limits

```typescript
const response = await callChatGPT({
  message: "Summarize this article",
  max_tokens: 200, // Limit response length
});
```

## 🎯 Use Cases

The edge function is generic and can be used for various purposes by adjusting the prompt:

### 1. General Q&A
```typescript
const response = await callChatGPT({
  message: "How does photosynthesis work?",
});
```

### 2. Tutoring/Education
```typescript
const response = await callChatGPT({
  message: "Explain the water cycle to a 10-year-old",
  systemPrompt: "You are a patient and encouraging tutor. Use simple language and examples.",
  temperature: 0.7,
});
```

### 3. Code Help
```typescript
const response = await callChatGPT({
  message: "How do I sort an array in JavaScript?",
  systemPrompt: "You are a helpful programming assistant. Provide clear code examples.",
  model: "gpt-4o-mini",
});
```

### 4. Content Generation
```typescript
const response = await callChatGPT({
  message: "Write a short story about a robot learning to paint",
  systemPrompt: "You are a creative writer.",
  temperature: 1.2,
  max_tokens: 500,
});
```

### 5. Analysis
```typescript
const response = await callChatGPT({
  message: "Analyze the pros and cons of renewable energy",
  systemPrompt: "You are an analytical expert. Provide balanced, factual analysis.",
  temperature: 0.5,
});
```

## 📋 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `message` | string | ✅ Yes | - | The user's prompt/question |
| `systemPrompt` | string | ❌ No | - | Optional system prompt to set AI behavior |
| `model` | string | ❌ No | `gpt-4o-mini` | Model to use (e.g., `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`) |
| `temperature` | number | ❌ No | `1` | Creativity level (0-2). Lower = more focused, Higher = more creative |
| `max_tokens` | number | ❌ No | - | Maximum tokens in response |
| `stream` | boolean | ❌ No | `false` | Whether to stream the response (not fully implemented yet) |

## 📤 Response Format

```typescript
{
  success: true,
  response: string,        // The AI's response text
  model: string,           // Model used (e.g., "gpt-4o-mini")
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

## ⚠️ Error Handling

```typescript
try {
  const response = await callChatGPT({
    message: "Your question here",
  });
  console.log(response.response);
} catch (error) {
  console.error('Error calling ChatGPT:', error);
  // Handle error (e.g., show user-friendly message)
}
```

## 🔒 Security Notes

- The OpenAI API key is stored securely in Supabase secrets
- The edge function validates all inputs
- CORS is properly configured
- Only POST requests are allowed

## 💡 Tips

1. **Model Selection**: 
   - Use `gpt-4o-mini` for most use cases (cost-effective)
   - Use `gpt-4o` for more complex reasoning
   - Use `gpt-4-turbo` for the most capable responses

2. **Temperature Guidelines**:
   - `0.0-0.3`: Factual, deterministic (Q&A, math)
   - `0.4-0.7`: Balanced (general use)
   - `0.8-1.2`: Creative (writing, brainstorming)
   - `1.3-2.0`: Very creative (experimental)

3. **System Prompts**: Use system prompts to customize the AI's behavior for different use cases without changing the edge function code.

4. **Token Limits**: Set `max_tokens` to control response length and costs.

## 🚀 Next Steps

You can now use this edge function throughout your application by importing `callChatGPT` from `src/services/chatgptService.ts` and customizing the prompts based on your specific use cases!








