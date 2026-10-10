import React, { useState, useMemo } from 'react';
import { apiConfig } from '../../../../../config/api';
import { WhatsAppPhonePreview } from './WhatsAppPhonePreview';
import { 
  MagnifyingGlassIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  PlusIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

export const UserTemplatesList = ({ user, userData, templates, isLoading, onEditTemplate, setTemplates }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);

  const storeName = userData?.store_name || user?.displayName || user?.name || 'Your Brand';

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let list = Array.isArray(templates) ? templates : [];

    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(t => {
        const s = (t.template_status || t.status || 'draft').toUpperCase();
        return s === selectedStatusFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => {
        const templateData = t.object || t;
        const name = (templateData.name || t.name || '').toLowerCase();
        const category = (templateData.category || t.category || '').toLowerCase();
        const bodyText = (templateData.components?.find(c => c.type?.toUpperCase() === 'BODY')?.text || '').toLowerCase();
        return name.includes(q) || category.includes(q) || bodyText.includes(q);
      });
    }

    return list;
  }, [templates, selectedStatusFilter, searchQuery]);

  const handleDeleteTemplate = async (template) => {
    const templateData = template.object || template;
    const tName = templateData.name || template.name || 'this template';
    const confirmDelete = window.confirm(`Are you sure you want to delete "${tName}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    const dbId = userData?.db_id || user?.db_id || user?.uid;
    const tId = template.template_id || template.id || template._id;
    setDeletingTemplateId(tId);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/templates/${dbId}/templates/${tId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Delete failed');
      setTemplates(prev => prev.filter(t => (t.template_id || t.id || t._id) !== tId));
    } catch (err) {
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Approved
        </span>
      );
    }
    if (s === 'pending' || s === 'submitted' || s === 'submission attempted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <ClockIcon className="w-3 h-3 text-amber-500" />
          Pending Approval
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <ExclamationCircleIcon className="w-3 h-3 text-red-500" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your WhatsApp Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage and inspect custom templates rendered exactly as customers receive them on WhatsApp.</p>
        </div>
        <button 
          onClick={() => onEditTemplate({})} 
          className="btn-primary text-xs py-2 px-3.5 gap-1.5 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Create New Template
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Templates' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'DRAFT', label: 'Drafts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 text-xs py-2"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse bg-white space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              <div className="h-[400px] bg-slate-100 rounded-2xl"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-slate-200 bg-white">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-[#25D366]">
            <ChatBubbleLeftIcon className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {searchQuery ? 'No templates match your search' : 'No templates created yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery 
              ? 'Try searching with different keywords or clearing your status filter.' 
              : 'Create a customized WhatsApp marketing or notification template to engage your customers.'}
          </p>
          <button 
            onClick={() => onEditTemplate({})} 
            className="btn-primary mt-5 text-xs py-2 px-4 gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Create Your First Template
          </button>
        </div>
      )}

      {/* Templates Grid with WhatsApp Phone Screen Render */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => {
            const templateData = template.object || template;
            const tName = templateData.name || template.name || `Template ${index + 1}`;
            const tCat = templateData.category || template.category || 'MARKETING';
            const tStatus = template.template_status || template.status || 'draft';
            const tId = template.template_id || template.id || template._id;
            const isDeleting = deletingTemplateId === tId;

            return (
              <div 
                key={tId || index} 
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
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          {tCat}
                        </span>
                        {getStatusBadge(tStatus)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Phone Screen Mockup */}
                <div className="py-2 flex-1 flex items-center justify-center">
                  <WhatsAppPhonePreview 
                    template={template} 
                    storeName={storeName} 
                  />
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                  <button 
                    onClick={() => onEditTemplate(template)} 
                    className="flex-1 btn-outline text-xs py-2 px-3 gap-1.5 justify-center hover:border-blue-500 hover:text-blue-600 font-semibold"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    Edit Template
                  </button>

                  <button 
                    onClick={() => handleDeleteTemplate(template)}
                    disabled={isDeleting}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 disabled:opacity-50"
                    title="Delete Template"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserTemplatesList;