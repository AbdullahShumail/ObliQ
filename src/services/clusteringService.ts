import { Idea, IdeaCluster } from '../types';
import Fuse from 'fuse.js';

export class ClusteringService {
  private static readonly SIMILARITY_THRESHOLD = 0.6;
  
  static async findClusters(ideas: Idea[]): Promise<IdeaCluster[]> {
    if (ideas.length < 2) return [];
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clusters: IdeaCluster[] = [];
    const processedIdeas = new Set<string>();
    
    // Create search index for semantic similarity
    const fuse = new Fuse(ideas, {
      keys: ['title', 'description', 'tags', 'painPoints', 'features'],
      threshold: this.SIMILARITY_THRESHOLD,
      includeScore: true
    });
    
    ideas.forEach(idea => {
      if (processedIdeas.has(idea.id)) return;
      
      // Find similar ideas
      const similarIdeas = fuse.search(idea.title + ' ' + idea.description)
        .filter(result => result.item.id !== idea.id && !processedIdeas.has(result.item.id))
        .map(result => result.item);
      
      if (similarIdeas.length > 0) {
        const clusterIdeas = [idea, ...similarIdeas];
        const theme = this.generateClusterTheme(clusterIdeas);
        
        const cluster: IdeaCluster = {
          id: crypto.randomUUID(),
          name: theme,
          ideaIds: clusterIdeas.map(i => i.id),
          theme,
          color: this.getClusterColor(clusters.length),
          createdAt: new Date()
        };
        
        clusters.push(cluster);
        clusterIdeas.forEach(i => processedIdeas.add(i.id));
      }
    });
    
    return clusters;
  }
  
  private static generateClusterTheme(ideas: Idea[]): string {
    const categories = ideas.map(i => i.category);
    const mostCommonCategory = this.getMostCommon(categories);
    
    const allTags = ideas.flatMap(i => i.tags);
    const commonTags = this.getMostCommon(allTags);
    
    if (commonTags && commonTags !== mostCommonCategory) {
      return `${commonTags} ${mostCommonCategory}`.replace(/^\w/, c => c.toUpperCase());
    }
    
    return `${mostCommonCategory} Ideas`.replace(/^\w/, c => c.toUpperCase());
  }
  
  private static getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    
    const counts = arr.reduce((acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T;
  }
  
  private static getClusterColor(index: number): string {
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-yellow-100 border-yellow-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300'
    ];
    return colors[index % colors.length];
  }
}