# Help Article Templates and Content Structure

This document provides templates and examples for creating help articles in the knowledge base.

## Article Template Structure

Every help article should follow this structure:

```markdown
# Article Title

Brief introduction paragraph that summarizes what the article covers.

## Prerequisites

- Requirement 1
- Requirement 2
- Requirement 3

## Step-by-Step Guide

### Step 1: First Action

Detailed explanation of the first step...

### Step 2: Second Action

Detailed explanation of the second step...

### Step 3: Third Action

Detailed explanation of the third step...

## Common Issues

### Issue 1

**Problem:** Description of the problem
**Solution:** How to fix it

### Issue 2

**Problem:** Description of the problem
**Solution:** How to fix it

## Related Articles

- [Article Name 1](link)
- [Article Name 2](link)

## Need More Help?

Contact our support team at support@example.com or submit a ticket.
```

## Content Templates by Category

### 1. Getting Started Template

```markdown
# Getting Started with [Feature Name]

Welcome to [Feature Name]! This guide will help you get up and running in just a few minutes.

## What is [Feature Name]?

[Feature Name] is a [brief description of what it does and why it's useful].

## Quick Start (5 minutes)

### Step 1: Access the Feature

1. Log in to your account
2. Navigate to [Menu] > [Submenu]
3. Click on [Feature Name]

### Step 2: Initial Setup

1. Configure your [settings]
2. Set your [preferences]
3. Complete your [profile/setup]

### Step 3: First Action

1. Click [Button Name]
2. Fill in the required information
3. Click Save

## What's Next?

Now that you've completed the basic setup, you can:

- [Action 1] - [Link to article]
- [Action 2] - [Link to article]
- [Action 3] - [Link to article]

## Video Tutorial

[Embed video or link to video tutorial]

## Need Help?

If you encounter any issues, check out our [Troubleshooting Guide](link) or contact support.
```

### 2. How-To Guide Template

```markdown
# How to [Accomplish Task]

Learn how to [accomplish specific task] in [estimated time].

## Before You Begin

Make sure you have:
- [Prerequisite 1]
- [Prerequisite 2]
- [Access/permissions needed]

## Instructions

### Method 1: [Quick Method]

Best for: [Use case description]

1. **Step 1:** [Action]
   - Additional detail if needed
   - Screenshot or image

2. **Step 2:** [Action]
   - Additional detail if needed
   - Screenshot or image

3. **Step 3:** [Action]
   - Additional detail if needed
   - Screenshot or image

### Method 2: [Alternative Method]

Best for: [Different use case]

1. **Step 1:** [Action]
2. **Step 2:** [Action]
3. **Step 3:** [Action]

## Tips and Best Practices

- **Tip 1:** [Helpful tip]
- **Tip 2:** [Helpful tip]
- **Tip 3:** [Helpful tip]

## Troubleshooting

**Problem:** [Common issue]
**Solution:** [How to fix]

**Problem:** [Another issue]
**Solution:** [How to fix]

## Related Topics

- [Related Article 1]
- [Related Article 2]
- [Related Article 3]
```

### 3. Troubleshooting Template

```markdown
# Troubleshooting [Feature/Issue Name]

This article helps you resolve common issues with [Feature Name].

## Symptoms

You might experience one or more of these symptoms:
- Symptom 1
- Symptom 2
- Symptom 3

## Quick Fixes

Try these solutions first:

1. **Refresh the page** - Many issues can be resolved with a simple refresh
2. **Clear cache** - Clear your browser cache and cookies
3. **Check your connection** - Ensure you have a stable internet connection

## Common Problems and Solutions

### Problem 1: [Issue Description]

**Symptoms:**
- [What the user sees]

**Cause:**
- [What causes this issue]

**Solution:**

1. Step 1
2. Step 2
3. Step 3

**Prevention:**
- [How to avoid this in the future]

### Problem 2: [Issue Description]

**Symptoms:**
- [What the user sees]

**Cause:**
- [What causes this issue]

**Solution:**

1. Step 1
2. Step 2
3. Step 3

## Still Having Issues?

If the above solutions don't work:

1. Check our [Status Page](link) for known issues
2. Search our [Community Forum](link) for similar problems
3. Contact [Support Team](link) with the following information:
   - Your account email
   - Steps to reproduce the issue
   - Screenshots or error messages
   - Browser and operating system version
```

### 4. API Documentation Template

```markdown
# [API Endpoint Name] API

Learn how to use the [Endpoint Name] API to [accomplish task].

## Endpoint

```
POST /api/endpoint-name
```

## Authentication

This endpoint requires authentication. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | string | Yes | Description of param1 |
| param2 | number | No | Description of param2 |
| param3 | boolean | No | Description of param3 |

## Request Example

```json
{
  "param1": "value1",
  "param2": 123,
  "param3": true
}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "status": "completed"
  }
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid parameters",
  "message": "param1 is required"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const response = await fetch('/api/endpoint-name', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    param1: 'value1',
    param2: 123
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.post(
    'https://api.example.com/api/endpoint-name',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'param1': 'value1',
        'param2': 123
    }
)

data = response.json()
print(data)
```

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Related Endpoints

- [Related Endpoint 1]
- [Related Endpoint 2]
```

### 5. FAQ Template

```markdown
# Frequently Asked Questions - [Topic]

Find answers to the most common questions about [Topic].

## General Questions

### What is [Feature/Product]?

[Answer with 2-3 sentences]

### How much does it cost?

[Answer with pricing information and link to pricing page]

### Is there a free trial?

[Answer about trial availability]

## Account & Billing

### How do I update my payment method?

1. Go to Settings > Billing
2. Click "Update Payment Method"
3. Enter your new card details
4. Click Save

### Can I cancel my subscription?

Yes, you can cancel anytime. [Link to cancellation guide]

### Will I get a refund if I cancel?

[Refund policy explanation]

## Technical Questions

### What browsers are supported?

We support the latest versions of:
- Chrome
- Firefox
- Safari
- Edge

### Is there a mobile app?

[Answer about mobile app availability]

### How do I export my data?

[Instructions for data export]

## Security & Privacy

### Is my data secure?

[Security measures explanation]

### Do you sell my data?

[Privacy policy statement]

### How do I delete my account?

[Instructions for account deletion]

## Still have questions?

Can't find what you're looking for? [Contact our support team](link) or browse our [full documentation](link).
```

## Sample Article Content

### Example 1: Getting Started Article

```json
{
  "title": "Getting Started with Order Management",
  "slug": "getting-started-order-management",
  "description": "Learn how to create and manage orders in just 5 minutes",
  "category_id": "getting-started",
  "content": "# Getting Started with Order Management\n\nWelcome to Order Management! This guide will help you create your first order in just 5 minutes.\n\n## What is Order Management?\n\nOur Order Management system helps you track, process, and fulfill customer orders from a single dashboard. You can manage orders from multiple sales channels, update order status, and track shipments.\n\n## Quick Start (5 minutes)\n\n### Step 1: Access Orders\n\n1. Log in to your dashboard\n2. Click on **Orders** in the main menu\n3. You'll see your orders dashboard\n\n### Step 2: Create Your First Order\n\n1. Click the **New Order** button\n2. Select a customer or create a new one\n3. Add products to the order\n4. Review the order summary\n5. Click **Create Order**\n\n### Step 3: Process the Order\n\n1. Click on your newly created order\n2. Click **Process Payment**\n3. Update the order status to \"Processing\"\n4. Add tracking information when ready to ship\n\n## What's Next?\n\nNow that you've created your first order, you can:\n\n- [Set up automated order notifications](link)\n- [Configure shipping methods](link)\n- [Create order templates](link)\n\n## Need Help?\n\nIf you encounter any issues, check out our [Order Management Troubleshooting Guide](link) or contact support.",
  "tags": ["quick-start", "tutorial", "orders"],
  "is_featured": true,
  "status": "published"
}
```

### Example 2: Troubleshooting Article

```json
{
  "title": "Troubleshooting Payment Processing Issues",
  "slug": "troubleshooting-payment-processing",
  "description": "Solutions for common payment processing problems",
  "category_id": "troubleshooting",
  "content": "# Troubleshooting Payment Processing Issues\n\nThis article helps you resolve common payment processing issues.\n\n## Quick Fixes\n\nTry these solutions first:\n\n1. **Verify payment details** - Double-check card number, expiry, and CVV\n2. **Check card balance** - Ensure sufficient funds are available\n3. **Try a different card** - Use an alternative payment method\n\n## Common Problems\n\n### Payment Declined\n\n**Cause:** Card issuer declined the transaction\n\n**Solution:**\n1. Contact your bank to authorize the payment\n2. Try a different payment method\n3. Check if the card has international restrictions\n\n### Transaction Timeout\n\n**Cause:** Slow internet connection or server issues\n\n**Solution:**\n1. Check your internet connection\n2. Wait 5 minutes before retrying\n3. If the issue persists, contact support\n\n### Invalid Card Details\n\n**Cause:** Incorrect card information entered\n\n**Solution:**\n1. Verify card number is correct\n2. Check expiry date format (MM/YY)\n3. Ensure CVV is entered correctly\n\n## Still Having Issues?\n\nContact our support team with:\n- Transaction ID (if available)\n- Payment method used\n- Error message received\n- Time and date of attempt",
  "tags": ["common-issue", "payments", "troubleshooting"],
  "status": "published"
}
```

## Writing Best Practices

1. **Use Clear, Simple Language**
   - Write for a general audience
   - Avoid jargon unless necessary
   - Define technical terms when first used

2. **Be Concise**
   - Get to the point quickly
   - Use bullet points and numbered lists
   - Break up long paragraphs

3. **Include Visuals**
   - Screenshots with annotations
   - Diagrams for complex processes
   - Videos for step-by-step tutorials

4. **Keep Content Updated**
   - Review articles quarterly
   - Update screenshots when UI changes
   - Archive outdated content

5. **Optimize for Search**
   - Use descriptive titles
   - Include relevant keywords naturally
   - Add comprehensive meta descriptions

6. **Test Instructions**
   - Follow your own instructions
   - Have someone else test them
   - Update based on feedback

## Content Formatting Guidelines

### Headings

- Use H1 for article title (only one per article)
- Use H2 for major sections
- Use H3 for subsections
- Use H4 for minor subsections

### Code Blocks

Use syntax highlighting for code:

\`\`\`javascript
// JavaScript example
const example = "code";
\`\`\`

### Callouts

**Note:** Use for helpful information
**Warning:** Use for important cautions
**Tip:** Use for best practices

### Links

- Use descriptive link text
- Link to related articles
- Open external links in new tabs

## SEO Guidelines

### Title

- 50-60 characters
- Include primary keyword
- Make it descriptive and compelling

### Description

- 150-160 characters
- Include primary and secondary keywords
- Summarize the article's value

### Keywords

- 5-10 relevant keywords
- Include variations
- Focus on user intent

## Metadata Template

```json
{
  "title": "Primary Keyword - Secondary Keyword | Brand",
  "meta_title": "How to [Action] - Complete Guide [Year]",
  "meta_description": "Learn how to [action] with our step-by-step guide. Includes [feature], [feature], and [feature]. [Time estimate] to complete.",
  "meta_keywords": "keyword1, keyword2, keyword3, long-tail keyword",
  "slug": "descriptive-url-slug"
}
```
