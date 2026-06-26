import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiConfig } from '../../../../../config/api'; // Adjust this path if needed

export const TemplateLibrary = ({ onSelectTemplate }) => {
  const [selectedTemplateTag, setSelectedTemplateTag] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  // New API-driven states
  const [libraryTemplates, setLibraryTemplates] = useState([]);
  const [availableTags, setAvailableTags] = useState(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch templates from the backend on mount
  useEffect(() => {
    const fetchDefaultTemplates = async () => {
      try {
        setIsLoading(true);
        const dbServerUrl = apiConfig.dbServerConfig.baseURL;
        
        // Fetching from the endpoint you created earlier
        const response = await fetch(`${dbServerUrl}/api/templates/defaults`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch template library');
        }
        
        const result = await response.json();
        
        // Handle variations in how your API might wrap the response
        const fetchedTemplates = result.data || result || [];
        
        // Map the backend data to ensure the UI has easy access to name, content, and tags
        const mappedTemplates = fetchedTemplates.map(item => {
           const tmplObj = item.object || item;
           const components = tmplObj.components || [];
           const bodyComp = components.find(c => c.type === 'body' || c.type === 'BODY');
           
           // Ensure tags exist (falling back to the 'industry' field you set up in the backend)
           const itemTags = item.tags || (item.industry ? [item.industry] : []) || [];
           
           // EXTRACT TEMPLATE TYPE (Fallback to 'custom' if missing)
           const templateType = item.template_type || tmplObj.template_type || 'custom';
           console.log(`Template "${tmplObj.name}" has type: ${templateType}`);
           
           return {
             ...item,
             name: tmplObj.name || item.name || 'Unnamed Template',
             content: bodyComp ? bodyComp.text : '',
             tags: itemTags,
             template_type: templateType // Explicitly add this for the editor to use
           };
        });

        setLibraryTemplates(mappedTemplates);

        // Dynamically generate the list of unique tags based on what the API returned
        const uniqueTags = new Set(['All']);
        mappedTemplates.forEach(t => {
          if (Array.isArray(t.tags)) {
            t.tags.forEach(tag => uniqueTags.add(tag));
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

  // Filter the dynamically fetched templates
  let filteredTemplates = libraryTemplates;
  
  if (selectedTemplateTag !== 'All') {
    filteredTemplates = filteredTemplates.filter(template => 
      template.tags?.includes(selectedTemplateTag)
    );
  }

  if (templateSearchQuery.trim()) {
    const query = templateSearchQuery.toLowerCase().trim();
    filteredTemplates = filteredTemplates.filter(template => {
      return template.name?.toLowerCase().includes(query) || 
             template.tags?.some(tag => tag.toLowerCase().includes(query)) || 
             template.content?.toLowerCase().includes(query);
    });
  }

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Template Library</h2>
          <p className="text-sm text-gray-600">Select or create your template and submit it for WhatsApp approval.</p>
        </div>
        {/* Sending an empty object sets initialTemplate to null-like, defaulting to 'custom' tab */}
        <button onClick={() => onSelectTemplate({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
          New Template Message
        </button>
      </div>

      {/* Show Error State if API Fails */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
          <p className="text-sm font-medium">Failed to load templates: {error}</p>
        </div>
      )}

      {/* Dynamic Tag Filter Buttons */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {availableTags.map((tag) => {
          const count = tag === 'All' 
            ? libraryTemplates.length 
            : libraryTemplates.filter(t => t.tags?.includes(tag)).length;
            
          if (count === 0 && tag !== 'All') return null;
          
          return (
            <button 
              key={tag} 
              onClick={() => setSelectedTemplateTag(tag)} 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedTemplateTag === tag 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tag} <span className="text-gray-500">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search templates by name, tag, or content..." 
          value={templateSearchQuery} 
          onChange={(e) => setTemplateSearchQuery(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
        />
      </div>

      {/* Loading Skeleton / Grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading templates...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id || template.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                    <span className="text-xs text-gray-500">{template.tags ? template.tags.join(', ') : ''}</span>
                  </div>
                  {/* Passes the fully mapped object including template_type */}
                  <button onClick={() => onSelectTemplate(template)} className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 ml-2 transition-colors">
                    Use sample
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 flex-1 overflow-y-auto max-h-48">
                  {template.content}
                </p>
              </div>
            ))}
          </div>
          {filteredTemplates.length === 0 && !error && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-sm">No templates found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </>
  );
};