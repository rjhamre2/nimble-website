import React, { useState, useEffect, useMemo } from 'react';
import { apiConfig } from '../../../../../config/api';
import { WhatsAppPhonePreview } from './WhatsAppPhonePreview';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  PlusIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export const TemplateLibrary = ({ onSelectTemplate }) => {
  const [selectedTemplateTag, setSelectedTemplateTag] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  // API-driven states
  const [libraryTemplates, setLibraryTemplates] = useState([]);
  const [availableTags, setAvailableTags] = useState(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch default templates on mount
  useEffect(() => {
    const fetchDefaultTemplates = async () => {
      try {
        setIsLoading(true);
        const dbServerUrl = apiConfig.dbServerConfig.baseURL;
        const response = await fetch(`${dbServerUrl}/api/templates/defaults`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch template library');
        }
        
        const result = await response.json();
        const fetchedTemplates = result.data || result || [];
        
        const mappedTemplates = fetchedTemplates.map(item => {
          const tmplObj = item.object || item;
          const components = tmplObj.components || [];
          const bodyComp = components.find(c => c.type === 'body' || c.type === 'BODY');
          
          const itemTags = item.tags || (item.industry ? [item.industry] : []) || [];
          if (item.template_grouping) itemTags.push(item.template_grouping);
          if (item.template_type === 'media_carousel') itemTags.push('Carousel');

          const templateType = item.template_type || tmplObj.template_type || 'custom';
          
          return {
            ...item,
            name: tmplObj.name || item.name || 'Unnamed Template',
            content: bodyComp ? bodyComp.text : '',
            tags: Array.from(new Set(itemTags)),
            template_type: templateType
          };
        });

        setLibraryTemplates(mappedTemplates);

        // Unique tags list
        const uniqueTags = new Set(['All']);
        mappedTemplates.forEach(t => {
          if (Array.isArray(t.tags)) {
            t.tags.forEach(tag => {
              if (tag) uniqueTags.add(tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
            });
          }
        });
        setAvailableTags(Array.from(uniqueTags));
        
      } catch (err) {
        console.error('Error fetching default templates:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let list = libraryTemplates;

    if (selectedTemplateTag !== 'All') {
      const selectedLower = selectedTemplateTag.toLowerCase();
      list = list.filter(template => 
        template.tags?.some(tag => tag.toLowerCase() === selectedLower)
      );
    }

    if (templateSearchQuery.trim()) {
      const q = templateSearchQuery.toLowerCase().trim();
      list = list.filter(template => {
        return (
          template.name?.toLowerCase().includes(q) || 
          template.tags?.some(tag => tag.toLowerCase().includes(q)) || 
          template.content?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [libraryTemplates, selectedTemplateTag, templateSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Pre-Built Template Library</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <SparklesIcon className="w-3 h-3 text-emerald-500" />
              WhatsApp Verified Layouts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose from industry-tested, high-converting WhatsApp templates rendered in realistic phone previews.
          </p>
        </div>
        
        <button 
          onClick={() => onSelectTemplate({})} 
          className="btn-primary text-xs py-2 px-3.5 gap-1.5 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Create Custom Template
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs">
          <p className="font-semibold">Failed to load templates: {error}</p>
        </div>
      )}

      {/* Dynamic Tag Filter Buttons & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {availableTags.map((tag) => {
            const isAll = tag === 'All';
            const count = isAll 
              ? libraryTemplates.length 
              : libraryTemplates.filter(t => t.tags?.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())).length;
              
            if (count === 0 && !isAll) return null;
            
            return (
              <button 
                key={tag} 
                onClick={() => setSelectedTemplateTag(tag)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedTemplateTag === tag 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{tag}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTemplateTag === tag ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 flex-shrink-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search library templates..." 
            value={templateSearchQuery} 
            onChange={(e) => setTemplateSearchQuery(e.target.value)} 
            className="input pl-9 text-xs py-2" 
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse bg-white space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              <div className="h-[400px] bg-slate-100 rounded-2xl"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Grid with WhatsApp Phone Screen Render */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template, idx) => {
              const tmplObj = template.object || template;
              const tName = tmplObj.name || template.name || `Template ${idx + 1}`;
              const tCategory = tmplObj.category || template.category || 'MARKETING';

              return (
                <div 
                  key={template.id || template.name || idx} 
                  className="card p-4 bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Template Info Header */}
                  <div className="pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate leading-tight mb-1" title={tName}>
                          {tName}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            {tCategory}
                          </span>
                          {template.tags?.map((tg, tagIdx) => (
                            <span key={tagIdx} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Phone Screen Mockup */}
                  <div className="py-2 flex-1 flex items-center justify-center">
                    <WhatsAppPhonePreview 
                      template={template} 
                      storeName="Nimble Store" 
                    />
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <button 
                      onClick={() => onSelectTemplate(template)} 
                      className="w-full btn-primary text-xs py-2 px-3 gap-1.5 justify-center font-semibold shadow-xs"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      Use This Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && !error && (
            <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <TagIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No templates found</p>
              <p className="text-xs text-slate-400 max-w-xs">No template library matches "{templateSearchQuery || selectedTemplateTag}". Try clearing your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TemplateLibrary;