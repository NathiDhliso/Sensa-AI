// Phase 3: Rich Media & Advanced Collaboration - Collaborative Templates
// Template management system for sharing and reusing mindmap structures

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, Plus, Search, Filter, Star, StarOff, Download, Upload,
  Share2, Copy, Edit3, Trash2, Eye, Users, Clock, Tag, Grid, List,
  BookOpen, Lightbulb, Target, Briefcase, GraduationCap, Heart,
  X, Save, Settings, MoreHorizontal, FolderPlus, SortAsc, SortDesc
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { Button } from '../../components';

interface MindMapTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  nodes: Node[];
  edges: Edge[];
  thumbnail?: string;
  isPublic: boolean;
  isStarred?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  ratingCount: number;
  collaborators: string[];
  version: string;
  changelog?: string;
}

type TemplateCategory = 'business' | 'education' | 'personal' | 'creative' | 'project' | 'brainstorming' | 'analysis' | 'planning';

interface CollaborativeTemplatesProps {
  onTemplateSelect?: (template: MindMapTemplate) => void;
  onClose?: () => void;
  mode?: 'select' | 'manage';
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'usage' | 'rating';
type FilterBy = 'all' | 'my-templates' | 'starred' | 'public' | 'recent';

export const CollaborativeTemplates: React.FC<CollaborativeTemplatesProps> = ({
  onTemplateSelect,
  onClose,
  mode = 'select'
}) => {
  // State management
  const [templates, setTemplates] = useState<MindMapTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MindMapTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateDetails, setShowTemplateDetails] = useState<MindMapTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'business' as TemplateCategory,
    tags: [] as string[],
    isPublic: false
  });
  const [tagInput, setTagInput] = useState('');
  
  // Collaboration store
  const { currentUser } = useCollaborationStore();
  
  // Template categories with icons
  const categories = [
    { id: 'business', name: 'Business', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: 'bg-green-100 text-green-600' },
    { id: 'personal', name: 'Personal', icon: Heart, color: 'bg-pink-100 text-pink-600' },
    { id: 'creative', name: 'Creative', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'project', name: 'Project', icon: Target, color: 'bg-purple-100 text-purple-600' },
    { id: 'brainstorming', name: 'Brainstorming', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'analysis', name: 'Analysis', icon: Search, color: 'bg-gray-100 text-gray-600' },
    { id: 'planning', name: 'Planning', icon: Layout, color: 'bg-orange-100 text-orange-600' }
  ];
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // Filter and sort templates when dependencies change
  useEffect(() => {
    let filtered = [...templates];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }
    
    // Apply additional filters
    switch (filterBy) {
      case 'my-templates':
        filtered = filtered.filter(template => template.createdBy === currentUser?.id);
        break;
      case 'starred':
        filtered = filtered.filter(template => template.isStarred);
        break;
      case 'public':
        filtered = filtered.filter(template => template.isPublic);
        break;
      case 'recent':
        filtered = filtered.filter(template => {
          const daysSinceCreated = (Date.now() - template.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreated <= 7;
        });
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'usage':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, categoryFilter, filterBy, sortBy, sortOrder, currentUser]);
  
  // Load templates from backend
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to load templates
      // For now, using mock data
      const mockTemplates: MindMapTemplate[] = [
        {
          id: '1',
          name: 'Project Planning Template',
          description: 'Comprehensive template for project planning with milestones, tasks, and resources',
          category: 'project',
          tags: ['planning', 'project', 'milestones', 'tasks'],
          nodes: [],
          edges: [],
          isPublic: true,
          isStarred: true,
          createdBy: 'user1',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          usageCount: 45,
          rating: 4.8,
          ratingCount: 12,
          collaborators: ['user2', 'user3'],
          version: '1.2'
        },
        {
          id: '2',
          name: 'Business Strategy Canvas',
          description: 'Strategic planning template for business model development',
          category: 'business',
          tags: ['strategy', 'business', 'canvas', 'planning'],
          nodes: [],
          edges: [],
          isPublic: true,
          createdBy: 'user2',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          usageCount: 32,
          rating: 4.5,
          ratingCount: 8,
          collaborators: ['user1'],
          version: '1.0'
        },
        {
          id: '3',
          name: 'Learning Path Designer',
          description: 'Educational template for designing learning paths and curriculum',
          category: 'education',
          tags: ['education', 'learning', 'curriculum', 'path'],
          nodes: [],
          edges: [],
          isPublic: false,
          createdBy: currentUser?.id || 'current-user',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          usageCount: 8,
          rating: 4.2,
          ratingCount: 3,
          collaborators: [],
          version: '1.1'
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  // Toggle template star
  const toggleTemplateStar = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isStarred: !template.isStarred }
        : template
    ));
  }, []);
  
  // Toggle template selection
  const toggleTemplateSelection = useCallback((templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  }, []);
  
  // Create new template
  const createTemplate = useCallback(async () => {
    if (!newTemplate.name.trim() || !currentUser) return;
    
    try {
      const template: MindMapTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        tags: newTemplate.tags,
        nodes: [], // TODO: Get from current mindmap
        edges: [], // TODO: Get from current mindmap
        isPublic: newTemplate.isPublic,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0,
        ratingCount: 0,
        collaborators: [],
        version: '1.0'
      };
      
      setTemplates(prev => [template, ...prev]);
      setShowCreateModal(false);
      
      // Reset form
      setNewTemplate({
        name: '',
        description: '',
        category: 'business',
        tags: [],
        isPublic: false
      });
      
      // TODO: Save to backend
      
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  }, [newTemplate, currentUser]);
  
  // Add tag to new template
  const addTag = useCallback(() => {
    if (tagInput.trim() && !newTemplate.tags.includes(tagInput.trim())) {
      setNewTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, newTemplate.tags]);
  
  // Remove tag from new template
  const removeTag = useCallback((tagToRemove: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);
  
  // Delete selected templates
  const deleteSelectedTemplates = useCallback(async () => {
    if (selectedTemplates.size === 0) return;
    
    try {
      setTemplates(prev => prev.filter(template => !selectedTemplates.has(template.id)));
      setSelectedTemplates(new Set());
      
      // TODO: Delete from backend
      
    } catch (error) {
      console.error('Failed to delete templates:', error);
    }
  }, [selectedTemplates]);
  
  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };
  
  // Render template card (grid view)
  const renderTemplateCard = (template: MindMapTemplate) => {
    const categoryInfo = getCategoryInfo(template.category);
    const IconComponent = categoryInfo.icon;
    
    return (
      <motion.div
        key={template.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
          selectedTemplates.has(template.id) 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={() => {
          if (mode === 'select') {
            onTemplateSelect?.(template);
          } else {
            toggleTemplateSelection(template.id);
          }
        }}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">
              <IconComponent className="w-12 h-12" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
              {template.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTemplateStar(template.id);
              }}
              className={`ml-2 p-1 rounded transition-colors ${
                template.isStarred 
                  ? 'text-yellow-500' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              {template.isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {template.description}
          </p>
          
          {/* Category and tags */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
              <IconComponent className="w-3 h-3" />
              {categoryInfo.name}
            </span>
            {template.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 2}</span>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {template.usageCount}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {template.rating.toFixed(1)}
              </span>
            </div>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
          
          {/* Creator */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              by {template.createdBy === currentUser?.id ? 'You' : template.createdBy}
              {!template.isPublic && (
                <span className="ml-2 inline-flex items-center gap-1 text-orange-600">
                  <Eye className="w-3 h-3" />
                  Private
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTemplateDetails(template);
              }}
              className="p-1 bg-white bg-opacity-90 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement template duplication
              }}
              className="p-1 bg-white bg-opacity-90 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Selection indicator */}
        {mode === 'manage' && selectedTemplates.has(template.id) && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              {mode === 'select' ? 'Choose Template' : 'Manage Templates'}
            </h2>
            <span className="text-sm text-gray-500">({filteredTemplates.length} templates)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters and search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* View controls */}
            <div className="flex items-center gap-2">
              {mode === 'manage' && selectedTemplates.size > 0 && (
                <Button
                  onClick={deleteSelectedTemplates}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedTemplates.size})
                </Button>
              )}
              
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Category filters */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id as TemplateCategory)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    categoryFilter === category.id
                      ? category.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  {category.name}
                </button>
              );
            })}
          </div>
          
          {/* Additional filters and sorting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Templates</option>
                <option value="my-templates">My Templates</option>
                <option value="starred">Starred</option>
                <option value="public">Public</option>
                <option value="recent">Recent</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as SortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="usage-desc">Most Used</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Templates content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Layout className="w-16 h-16 mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-center mb-4">
                {searchQuery || categoryFilter !== 'all' || filterBy !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first template to get started'
                }
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              <AnimatePresence>
                {filteredTemplates.map(renderTemplateCard)}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        {/* Create template modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create New Template</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Name</label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter template name..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe your template..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as TemplateCategory }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a tag..."
                      />
                      <Button onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newTemplate.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newTemplate.isPublic}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isPublic" className="text-sm">
                      Make this template public (others can use it)
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      onClick={() => setShowCreateModal(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createTemplate}
                      disabled={!newTemplate.name.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Template details modal */}
        <AnimatePresence>
          {showTemplateDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{showTemplateDetails.name}</h3>
                  <button
                    onClick={() => setShowTemplateDetails(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Template details content */}
                <div className="space-y-4">
                  <p className="text-gray-600">{showTemplateDetails.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category</span>
                      <p className="text-sm">{getCategoryInfo(showTemplateDetails.category).name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-sm">{showTemplateDetails.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Usage Count</span>
                      <p className="text-sm">{showTemplateDetails.usageCount}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Rating</span>
                      <p className="text-sm">{showTemplateDetails.rating.toFixed(1)} ({showTemplateDetails.ratingCount} reviews)</p>
                    </div>
                  </div>
                  
                  {showTemplateDetails.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {showTemplateDetails.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      onClick={() => setShowTemplateDetails(null)}
                      variant="outline"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        onTemplateSelect?.(showTemplateDetails);
                        setShowTemplateDetails(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CollaborativeTemplates;