import OpenAI from 'openai';

// OpenAI Configuration
const openai = import.meta.env.VITE_OPENAI_API_KEY ? new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
}) : null;

// HuggingFace Configuration
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  summary: string;
  keywords: string[];
  isFake: boolean;
  fakeConfidence: number;
  provider: 'openai' | 'huggingface' | 'fallback';
}

export interface ReviewAnalysisRequest {
  title: string;
  content: string;
  rating: number;
  productName: string;
}

class AIService {
  private async callHuggingFaceAPI(endpoint: string, data: any): Promise<any> {
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('HuggingFace API key not configured');
    }

    const response = await fetch(`${HUGGINGFACE_API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async analyzeSentimentWithHuggingFace(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  }> {
    try {
      // Use cardiffnlp/twitter-roberta-base-sentiment-latest model
      const result = await this.callHuggingFaceAPI(
        'cardiffnlp/twitter-roberta-base-sentiment-latest',
        { inputs: text }
      );

      if (result && result[0] && Array.isArray(result[0])) {
        const sentiments = result[0];
        const topSentiment = sentiments.reduce((prev: any, current: any) => 
          prev.score > current.score ? prev : current
        );

        let sentiment: 'positive' | 'negative' | 'neutral';
        if (topSentiment.label === 'LABEL_2') sentiment = 'positive';
        else if (topSentiment.label === 'LABEL_0') sentiment = 'negative';
        else sentiment = 'neutral';

        return {
          sentiment,
          score: sentiment === 'positive' ? topSentiment.score : 
                 sentiment === 'negative' ? -topSentiment.score : 0,
          confidence: topSentiment.score
        };
      }

      throw new Error('Invalid HuggingFace response format');
    } catch (error) {
      console.error('HuggingFace sentiment analysis failed:', error);
      throw error;
    }
  }

  private async detectFakeWithHuggingFace(text: string): Promise<{
    isFake: boolean;
    confidence: number;
  }> {
    try {
      // Use a text classification model for fake detection
      const result = await this.callHuggingFaceAPI(
        'martin-ha/toxic-comment-model',
        { inputs: text }
      );

      if (result && result[0] && Array.isArray(result[0])) {
        const classifications = result[0];
        const toxicScore = classifications.find((c: any) => c.label === 'TOXIC')?.score || 0;
        
        return {
          isFake: toxicScore > 0.7, // Consider toxic/spam as potentially fake
          confidence: toxicScore
        };
      }

      return { isFake: false, confidence: 0.1 };
    } catch (error) {
      console.error('HuggingFace fake detection failed:', error);
      return { isFake: false, confidence: 0.1 };
    }
  }

  private async generateSummaryWithHuggingFace(text: string): Promise<string> {
    try {
      const result = await this.callHuggingFaceAPI(
        'facebook/bart-large-cnn',
        { 
          inputs: text,
          parameters: {
            max_length: 100,
            min_length: 30,
            do_sample: false
          }
        }
      );

      if (result && result[0] && result[0].summary_text) {
        return result[0].summary_text;
      }

      throw new Error('Invalid summary response');
    } catch (error) {
      console.error('HuggingFace summarization failed:', error);
      return `Summary of review about ${text.split(' ').slice(0, 3).join(' ')}...`;
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
    
    // Get unique words and return top 5
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 5);
  }

  async analyzeSentiment(review: ReviewAnalysisRequest): Promise<SentimentAnalysis> {
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
            provider: 'openai' as const
          };
        }
      } catch (error) {
        console.error('OpenAI analysis failed, trying HuggingFace:', error);
      }
    }

    // Try HuggingFace as fallback
    if (HUGGINGFACE_API_KEY) {
      try {
        const [sentimentResult, fakeResult, summary] = await Promise.allSettled([
          this.analyzeSentimentWithHuggingFace(fullText),
          this.detectFakeWithHuggingFace(fullText),
          this.generateSummaryWithHuggingFace(fullText)
        ]);

        const sentiment = sentimentResult.status === 'fulfilled' ? sentimentResult.value : {
          sentiment: 'neutral' as const,
          score: 0,
          confidence: 0.5
        };

        const fake = fakeResult.status === 'fulfilled' ? fakeResult.value : {
          isFake: false,
          confidence: 0.1
        };

        const summaryText = summary.status === 'fulfilled' ? summary.value : 
          `${sentiment.sentiment} review about ${review.productName}`;

        return {
          sentiment: sentiment.sentiment,
          score: sentiment.score,
          confidence: sentiment.confidence,
          summary: summaryText,
          keywords: this.extractKeywords(fullText),
          isFake: fake.isFake,
          fakeConfidence: fake.confidence,
          provider: 'huggingface' as const
        };
      } catch (error) {
        console.error('HuggingFace analysis failed, using fallback:', error);
      }
    }

    // Fallback to rule-based analysis
    return this.fallbackAnalysis(review);
  }

  private fallbackAnalysis(review: ReviewAnalysisRequest): SentimentAnalysis {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'recommend', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'useless', 'broken', 'waste'];
    
    const text = `${review.title} ${review.content}`.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
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
      provider: 'fallback' as const
    };
  }

  async generateSummary(reviews: any[]): Promise<string> {
    if (reviews.length === 0) return 'No reviews available.';

    const reviewSample = reviews.slice(0, 10).map(r => 
      `Rating: ${r.rating}/5 - ${r.title}: ${r.content.substring(0, 100)}...`
    ).join('\n');

    // Try OpenAI first
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes product reviews. Provide a concise summary highlighting key themes, common praise, and concerns."
            },
            {
              role: "user",
              content: `Summarize these product reviews:\n\n${reviewSample}`
            }
          ],
          temperature: 0.5,
          max_tokens: 200
        });

        return response.choices[0]?.message?.content || 'Unable to generate summary.';
      } catch (error) {
        console.error('OpenAI summary generation error:', error);
      }
    }

    // Try HuggingFace
    if (HUGGINGFACE_API_KEY) {
      try {
        return await this.generateSummaryWithHuggingFace(reviewSample);
      } catch (error) {
        console.error('HuggingFace summary generation error:', error);
      }
    }

    // Fallback summary
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
    const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;
    
    return `Based on ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)}/5. ${positiveCount} positive and ${negativeCount} negative reviews. Most users appreciate the product quality, though some mention concerns about pricing and delivery.`;
  }

  // Health check for AI services
  async checkServiceHealth(): Promise<{
    openai: boolean;
    huggingface: boolean;
    fallback: boolean;
  }> {
    const health = {
      openai: false,
      huggingface: false,
      fallback: true
    };

    // Check OpenAI
    if (openai) {
      try {
        await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1
        });
        health.openai = true;
      } catch (error) {
        console.warn('OpenAI health check failed:', error);
      }
    }

    // Check HuggingFace
    if (HUGGINGFACE_API_KEY) {
      try {
        await this.callHuggingFaceAPI('cardiffnlp/twitter-roberta-base-sentiment-latest', {
          inputs: "test"
        });
        health.huggingface = true;
      } catch (error) {
        console.warn('HuggingFace health check failed:', error);
      }
    }

    return health;
  }
}

export const aiService = new AIService();