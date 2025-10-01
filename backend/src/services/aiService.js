import OpenAI from 'openai';

// OpenAI Configuration
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

class AIService {
  async analyzeSentiment(review) {
    const fullText = `${review.title} ${review.content}`;

    // Try OpenAI first
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert sentiment analysis and fake review detection AI. Respond only with valid JSON."
            },
            {
              role: "user",
              content: `Analyze this product review for sentiment, authenticity, and provide a summary:

Product: ${review.productName}
Title: ${review.title}
Rating: ${review.rating}/5
Review: ${review.content}

Respond with JSON: {
  "sentiment": "positive|negative|neutral",
  "score": number between -1 and 1,
  "confidence": number between 0 and 1,
  "summary": "brief summary",
  "keywords": ["array", "of", "keywords"],
  "isFake": boolean,
  "fakeConfidence": number between 0 and 1
}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const analysis = JSON.parse(content);
          return {
            ...analysis,
            provider: 'openai'
          };
        }
      } catch (error) {
        console.error('OpenAI analysis failed:', error);
      }
    }

    // Fallback to rule-based analysis
    return this.fallbackAnalysis(review);
  }

  fallbackAnalysis(review) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'recommend', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'useless', 'broken', 'waste'];
    
    const text = `${review.title} ${review.content}`.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment, score;
    
    if (review.rating >= 4 || positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.3 + (review.rating - 3) * 0.2 + (positiveCount * 0.1);
    } else if (review.rating <= 2 || negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.3 - (3 - review.rating) * 0.2 - (negativeCount * 0.1);
    } else {
      sentiment = 'neutral';
      score = (review.rating - 3) * 0.1;
    }

    return {
      sentiment,
      score: Math.max(-1, Math.min(1, score)),
      confidence: 0.6,
      summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} review about ${review.productName} with ${review.rating}/5 rating.`,
      keywords: this.extractKeywords(text),
      isFake: review.content.length < 20 || review.content.split(' ').length < 10,
      fakeConfidence: review.content.length < 20 ? 0.8 : 0.2,
      provider: 'fallback'
    };
  }

  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
    
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 5);
  }
}

export const aiService = new AIService();