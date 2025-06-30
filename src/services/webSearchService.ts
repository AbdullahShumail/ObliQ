import { ExistingProduct } from '../types';

export class WebSearchService {
  static async searchExistingProducts(ideaTitle: string, ideaDescription: string): Promise<ExistingProduct[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock search results - in production, integrate with Google Custom Search API or similar
    const mockResults: ExistingProduct[] = [
      {
        id: crypto.randomUUID(),
        name: 'Similar Startup Co.',
        description: 'A platform that does something similar to your idea with a different approach.',
        url: 'https://example-startup.com',
        similarity: 0.75,
        category: 'Technology',
        foundAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Competitor App',
        description: 'Mobile app addressing similar pain points but for a different market segment.',
        url: 'https://competitor-app.com',
        similarity: 0.65,
        category: 'Mobile App',
        foundAt: new Date()
      }
    ];
    
    // Return results based on idea content
    const searchTerms = `${ideaTitle} ${ideaDescription}`.toLowerCase();
    
    if (searchTerms.includes('social') || searchTerms.includes('community')) {
      return [
        {
          id: crypto.randomUUID(),
          name: 'Discord',
          description: 'Community platform for gamers and creators with voice, video, and text communication.',
          url: 'https://discord.com',
          similarity: 0.60,
          category: 'Social Platform',
          foundAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          name: 'Clubhouse',
          description: 'Audio-based social networking app for live conversations.',
          url: 'https://clubhouse.com',
          similarity: 0.55,
          category: 'Social Audio',
          foundAt: new Date()
        }
      ];
    }
    
    if (searchTerms.includes('education') || searchTerms.includes('learning')) {
      return [
        {
          id: crypto.randomUUID(),
          name: 'Khan Academy',
          description: 'Free online courses, lessons and practice for learners of all ages.',
          url: 'https://khanacademy.org',
          similarity: 0.70,
          category: 'EdTech',
          foundAt: new Date()
        }
      ];
    }
    
    if (searchTerms.includes('business') || searchTerms.includes('productivity')) {
      return [
        {
          id: crypto.randomUUID(),
          name: 'Notion',
          description: 'All-in-one workspace for notes, tasks, wikis, and databases.',
          url: 'https://notion.so',
          similarity: 0.65,
          category: 'Productivity',
          foundAt: new Date()
        }
      ];
    }
    
    // Return empty array if no matches to simulate unique idea
    return Math.random() > 0.7 ? [] : mockResults.slice(0, 1);
  }
  
  static async getMarketInsights(category: string): Promise<{
    trends: string[];
    opportunities: string[];
    challenges: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const insights = {
      tech: {
        trends: ['AI/ML integration', 'Edge computing', 'Web3 adoption'],
        opportunities: ['Developer tools', 'No-code platforms', 'AI automation'],
        challenges: ['Privacy regulations', 'Technical complexity', 'Market saturation']
      },
      business: {
        trends: ['Remote work tools', 'Sustainability focus', 'Digital transformation'],
        opportunities: ['SMB solutions', 'Process automation', 'Data analytics'],
        challenges: ['Economic uncertainty', 'Competition', 'Customer acquisition']
      },
      social: {
        trends: ['Creator economy', 'Community-first platforms', 'Audio content'],
        opportunities: ['Niche communities', 'Creator monetization', 'Social commerce'],
        challenges: ['Content moderation', 'User retention', 'Platform fatigue']
      },
      education: {
        trends: ['Personalized learning', 'Microlearning', 'Skills-based education'],
        opportunities: ['Corporate training', 'Certification programs', 'Learning analytics'],
        challenges: ['Engagement', 'Accessibility', 'Quality assurance']
      }
    };
    
    return insights[category as keyof typeof insights] || insights.tech;
  }
}