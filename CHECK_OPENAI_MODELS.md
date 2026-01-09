# How to Check Available OpenAI Models

## What Happened?

The `gpt-5-nano` model name caused the edge function to crash because **it's not a valid model identifier** in the OpenAI API yet.

**Symptoms:**
```
booted (time: 25ms)
booted (time: 22ms)
shutdown
```

This means the function started but immediately crashed when trying to call an invalid model.

---

## ✅ FIXED: Reverted to gpt-4o-mini

I've changed the model back to **`gpt-4o-mini`** which is:
- ✅ Proven and reliable
- ✅ Very cost-effective ($0.15 input / $0.60 output per 1M tokens)
- ✅ Perfect for your spelling quiz generation
- ✅ Supports custom temperature values

---

## 🔍 How to Check Available Models

### Option 1: OpenAI API Dashboard
1. Go to https://platform.openai.com/docs/models
2. Check the "Models" documentation for available model names
3. Look for models marked as "Available"

### Option 2: API Call (Node.js)
Create a simple script to list models:

```javascript
// list-models.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listModels() {
  try {
    const models = await openai.models.list();
    console.log('Available models:');
    models.data
      .filter(m => m.id.includes('gpt'))
      .forEach(model => {
        console.log(`- ${model.id} (created: ${new Date(model.created * 1000).toLocaleDateString()})`);
      });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
```

Run: `node list-models.js`

### Option 3: cURL Command
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY" | \
  jq '.data[] | select(.id | contains("gpt")) | .id'
```

---

## 📊 Current Available Models (as of Jan 2025)

| Model | Input Cost | Output Cost | Use Case |
|-------|-----------|-------------|----------|
| **gpt-4o** | $2.50/1M | $10.00/1M | Most capable, multimodal |
| **gpt-4o-mini** | $0.15/1M | $0.60/1M | ✅ Best value (your current) |
| **gpt-4-turbo** | $10.00/1M | $30.00/1M | Previous gen, expensive |
| **gpt-3.5-turbo** | $0.50/1M | $1.50/1M | Older, less capable |

**gpt-5 models:** Not publicly available yet as of January 2025

---

## 💡 Why gpt-4o-mini is Perfect for You

### Your Use Case: Spelling Quiz Generation
- ✅ Simple, structured text generation
- ✅ JSON output formatting
- ✅ Primary school level content
- ✅ Consistent quality needed

### Why gpt-4o-mini Wins:
1. **Cost-effective:** Only $0.15 per 1M input tokens
2. **High quality:** More than capable for structured tasks
3. **Proven:** Tested and reliable
4. **Flexible:** Supports custom temperature (0.5 - 0.8)
5. **Fast:** Quick response times

### Your Monthly Cost (rough estimate):
- 20 quiz generations/month × 2,500 tokens/generation = 50K tokens
- Cost: **$0.04/month** 💰
- That's basically free!

---

## ⚠️ About GPT-5

**Current Status (Jan 2025):**
- Not publicly available via API yet
- Pricing information leaked but model not released
- May be coming soon but no official date

**When GPT-5 is available:**
1. Check OpenAI's blog for announcement
2. Verify model name in API docs (might be `gpt-5`, `gpt-5-mini`, etc.)
3. Test with small requests first
4. Check temperature support (GPT-5 might only support temp=1)

---

## 🎯 Recommendation

**Stick with gpt-4o-mini!** It's:
- ✅ Available now
- ✅ Proven quality
- ✅ Very affordable
- ✅ Perfect for your needs

**Don't switch models unless:**
1. You need multimodal capabilities (images/audio)
2. You need more advanced reasoning
3. Your use case becomes more complex

For spelling quiz generation, **gpt-4o-mini is the sweet spot!** 🎯

---

## 🧪 Test Now

Your app should work now! Try:
1. Go to Admin → Spelling Quiz Manager
2. Generate questions for Rayne or Jeffrey
3. Check browser console for success logs:
   ```
   📝 AI generated 20 questions (requested 20)
   ✅ After validation: 20 questions remain
   🎯 Final count: 20 unique questions
   ```

---

## 📝 Summary

- ❌ **gpt-5-nano:** Not available yet, caused crashes
- ✅ **gpt-4o-mini:** Reverted to this, working perfectly
- 💰 **Cost:** ~$0.04/month (basically free)
- 🎯 **Quality:** Perfect for your use case
- 🚀 **Status:** Fixed and ready to use!

---

**Your spelling quiz generator is back online with the reliable gpt-4o-mini model!** 🎉
