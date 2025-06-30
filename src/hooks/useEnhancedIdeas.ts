import { useState, useEffect, useCallback } from 'react';
import { Idea, IdeaCategory, LoadingState, IdeaCluster } from '../types';
import { EnhancedAIService } from '../services/enhancedAIService';
import { ClusteringService } from '../services/clusteringService';
import { MemoryService } from '../services/memoryService';
import { NotificationService } from '../services/notificationService';

const STORAGE_KEY = 'ai-idea-board-ideas';
const CLUSTERS_KEY = 'ai-idea-board-clusters';

export const useEnhancedIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [clusters, setClusters] = useState<IdeaCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: 'categorizing',
    message: '',
    progress: 0
  });

  useEffect(() => {
    const savedIdeas = localStorage.getItem(STORAGE_KEY);
    const savedClusters = localStorage.getItem(CLUSTERS_KEY);
    
    if (savedIdeas) {
      try {
        const parsedIdeas = JSON.parse(savedIdeas).map((idea: any) => ({
          ...idea,
          createdAt: new Date(idea.createdAt),
          updatedAt: new Date(idea.updatedAt),
          lastViewedAt: idea.lastViewedAt ? new Date(idea.lastViewedAt) : undefined,
        }));
        setIdeas(parsedIdeas);
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
      }
    }
    
    if (savedClusters) {
      try {
        const parsedClusters = JSON.parse(savedClusters).map((cluster: any) => ({
          ...cluster,
          createdAt: new Date(cluster.createdAt)
        }));
        setClusters(parsedClusters);
      } catch (error) {
        console.error('Error parsing saved clusters:', error);
      }
    }
    
    setLoading(false);
    
    // Set up AI service loading callback
    EnhancedAIService.setLoadingCallback(setLoadingState);
    
    // Update session
    MemoryService.updateSession({ 
      returningUser: MemoryService.isReturningUser(),
      totalIdeas: ideas.length 
    });
    
    // Generate smart notifications
    if (ideas.length > 0) {
      NotificationService.generateSmartNotifications(ideas);
    }
  }, []);

  const saveIdeas = useCallback((newIdeas: Idea[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas));
    setIdeas(newIdeas);
    
    // Update session
    MemoryService.updateSession({ totalIdeas: newIdeas.length });
  }, []);

  const saveClusters = useCallback((newClusters: IdeaCluster[]) => {
    localStorage.setItem(CLUSTERS_KEY, JSON.stringify(newClusters));
    setClusters(newClusters);
  }, []);

  const addIdea = useCallback(async (rawInput: string) => {
    try {
      const { idea: ideaData, existingProducts, suggestions } = await EnhancedAIService.processNewIdea(rawInput);
      
      const newIdea: Idea = {
        ...ideaData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastViewedAt: new Date(),
        aiSuggestions: suggestions
      };
      
      const updatedIdeas = [...ideas, newIdea];
      saveIdeas(updatedIdeas);
      
      // Update clusters
      const newClusters = await ClusteringService.findClusters(updatedIdeas);
      saveClusters(newClusters);
      
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      return newIdea;
    } catch (error) {
      console.error('Error adding idea:', error);
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [ideas, saveIdeas, saveClusters]);

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    const updatedIdeas = ideas.map(idea =>
      idea.id === id
        ? { 
            ...idea, 
            ...updates, 
            updatedAt: new Date(),
            lastViewedAt: new Date()
          }
        : idea
    );
    saveIdeas(updatedIdeas);
  }, [ideas, saveIdeas]);

  const deleteIdea = useCallback((id: string) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    saveIdeas(updatedIdeas);
    
    // Update clusters
    ClusteringService.findClusters(updatedIdeas).then(saveClusters);
  }, [ideas, saveIdeas, saveClusters]);

  const toggleStar = useCallback((id: string) => {
    updateIdea(id, { isStarred: !ideas.find(i => i.id === id)?.isStarred });
  }, [ideas, updateIdea]);

  const searchIdeas = useCallback((query: string) => {
    if (!query.trim()) return ideas;
    
    const lowercaseQuery = query.toLowerCase();
    return ideas.filter(idea =>
      idea.title.toLowerCase().includes(lowercaseQuery) ||
      idea.description.toLowerCase().includes(lowercaseQuery) ||
      idea.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      idea.painPoints.some(point => point.toLowerCase().includes(lowercaseQuery)) ||
      idea.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
    );
  }, [ideas]);

  const filterByCategory = useCallback((category: IdeaCategory | 'all') => {
    if (category === 'all') return ideas;
    return ideas.filter(idea => idea.category === category);
  }, [ideas]);

  const findIdeaByQuery = useCallback(async (query: string) => {
    return await MemoryService.findIdeaByQuery(query, ideas);
  }, [ideas]);

  const getMemoryInsights = useCallback(() => {
    return MemoryService.getMemoryInsights(ideas);
  }, [ideas]);

  return {
    ideas,
    clusters,
    loading,
    loadingState,
    addIdea,
    updateIdea,
    deleteIdea,
    toggleStar,
    searchIdeas,
    filterByCategory,
    findIdeaByQuery,
    getMemoryInsights,
  };
};