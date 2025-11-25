# AI Agent Setup Guide

This guide explains how to configure the AI Chat Agent with different providers (OpenAI, Anthropic, Google).

## Overview

The Omni Sales AI Agent supports three major AI providers:
- **OpenAI** (GPT-4, GPT-3.5 Turbo)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus)
- **Google** (Gemini Pro, Gemini Ultra)

## Configuration

### 1. Navigate to AI Agent Settings

Go to: **Admin → Settings → Advanced → AI Agent**

### 2. Enable the AI Agent

Toggle the "Enable AI Agent" switch to ON.

### 3. Configure AI Provider

#### OpenAI Setup

1. **Get API Key:**
   - Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (it won't be shown again)

2. **Configure in Omni Sales:**
   - Provider: `OpenAI`
   - Model: `gpt-4` or `gpt-3.5-turbo`
   - API Key: Paste your OpenAI API key
   - Max Tokens: `1000` (recommended)
   - Temperature: `0.7` (balance between creativity and consistency)

#### Anthropic (Claude) Setup

1. **Get API Key:**
   - Visit [console.anthropic.com](https://console.anthropic.com)
   - Go to API Keys section
   - Create a new API key

2. **Configure in Omni Sales:**
   - Provider: `Anthropic`
   - Model: `claude-3-5-sonnet-20241022` or `claude-3-opus-20240229`
   - API Key: Paste your Anthropic API key
   - Max Tokens: `1000`
   - Temperature: `0.7`

#### Google (Gemini) Setup

1. **Get API Key:**
   - Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Create a new API key

2. **Configure in Omni Sales:**
   - Provider: `Google`
   - Model: `gemini-pro` or `gemini-ultra`
   - API Key: Paste your Google API key
   - Max Tokens: `1000`
   - Temperature: `0.7`

## Widget Customization

### Appearance

- **Widget Position**: Choose between bottom-right or bottom-left
- **Widget Color**: Customize the chat widget color to match your brand
- **Greeting Message**: Personalize the initial message users see

### Behavior

- **Auto Open**: Set delay (in seconds) before auto-opening the chat widget
- **Business Hours**: Configure when the AI agent is available
- **Offline Message**: Message shown when outside business hours

## Knowledge Base

Add custom knowledge sources to make your AI agent more helpful:

1. Go to **Behavior** tab
2. Enable **Knowledge Base**
3. Add knowledge sources (product info, policies, FAQs)
4. The AI will use this information when responding to customers

## Advanced Features

### Escalation to Human

Configure keywords that trigger escalation to human support:
- Default keywords: "พูดคุยกับคน", "ติดต่อเจ้าหน้าที่"
- Add custom escalation keywords based on your needs

### Analytics

Enable conversation tracking to:
- Monitor AI performance
- Track user satisfaction
- Analyze common questions
- Improve responses over time

## API Pricing (as of 2025)

### OpenAI
- GPT-4: $0.03/1K tokens (input), $0.06/1K tokens (output)
- GPT-3.5 Turbo: $0.0015/1K tokens (input), $0.002/1K tokens (output)

### Anthropic
- Claude 3.5 Sonnet: $0.003/1K tokens (input), $0.015/1K tokens (output)
- Claude 3 Opus: $0.015/1K tokens (input), $0.075/1K tokens (output)

### Google
- Gemini Pro: Free for limited use, then $0.00025/1K characters
- Gemini Ultra: Pricing varies

## Best Practices

### 1. Choose the Right Model

- **GPT-4 / Claude Opus**: Best quality, higher cost - use for complex queries
- **GPT-3.5 / Claude Sonnet**: Good balance of quality and cost
- **Gemini Pro**: Cost-effective for high volume

### 2. Optimize Token Usage

- Set appropriate `max_tokens` based on response length needs
- Use conversation history limit (default: 10 messages)
- Clear old conversations periodically

### 3. Temperature Settings

- **0.3-0.5**: More consistent, factual responses
- **0.7**: Balanced (recommended for customer service)
- **0.9-1.0**: More creative, varied responses

### 4. Security

- Never share API keys publicly
- Rotate API keys regularly
- Monitor usage for anomalies
- Set up billing alerts with your AI provider

## Fallback Behavior

If the AI provider is unavailable or not configured:
- The system automatically falls back to keyword-based responses
- Basic keywords are supported (สินค้า, คำสั่งซื้อ, จัดส่ง, etc.)
- No API calls or costs incurred

## Troubleshooting

### Error: "AI Agent is not configured or disabled"

**Solution:** Ensure:
1. AI Agent is enabled in settings
2. Valid API key is configured
3. Provider and model are selected

### Error: "API request failed"

**Possible causes:**
1. Invalid API key
2. Insufficient API credits
3. Rate limit exceeded
4. Network connectivity issues

**Solution:**
1. Verify API key is correct
2. Check your API provider account balance
3. Wait a few minutes and try again
4. Check error logs for specific details

### Poor Response Quality

**Solutions:**
1. Adjust temperature (lower = more consistent)
2. Add more context to knowledge base
3. Increase max_tokens if responses are cut off
4. Try a different model (GPT-4 > GPT-3.5 for quality)

## Support

For technical support or questions:
- Email: support@omnisales.com
- Documentation: [docs.omnisales.com](https://docs.omnisales.com)
- GitHub Issues: [github.com/omnisales/omni-sales/issues](https://github.com/omnisales/omni-sales/issues)
