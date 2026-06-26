import React from 'react';
import { apiConfig } from '../../../../../config/api'; // Check/adjust this relative path

export const UserTemplatesList = ({ user, userData, templates, isLoading, onEditTemplate, setTemplates }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Templates</h2>
          <p className="text-sm text-gray-600 mb-4">Manage your custom templates here.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="border border-gray-200 rounded-lg p-8 text-center"><p className="text-gray-500">Loading templates...</p></div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, index) => {
            const templateData = template.object || template;
            const tName = templateData.name || template.name || `Template ${index + 1}`;
            const tCat = templateData.category || template.category || '';
            const tStatus = template.template_status || template.status || 'draft';
            return (
              <div key={template.id || template._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{tName}</h3>
                    <div className="flex items-center gap-2">
                      {tCat && <span className="text-xs text-gray-500">{tCat}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded ${tStatus === 'draft' ? 'bg-yellow-100 text-yellow-700' : tStatus.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {tStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => onEditTemplate(template)} className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={async () => {
                      try {
                        const confirmDelete = window.confirm(`Are you sure you want to delete "${tName}"?`);
                        if (!confirmDelete) return;
                        const dbId = userData?.db_id || user?.db_id;
                        const tId = template.template_id;
                        if (!dbId || !tId) return alert('Cannot delete: Missing ID');
                        const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/templates/${dbId}/templates/${tId}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Delete failed');
                        setTemplates(prev => prev.filter(t => (t.template_id || t.id || t._id) !== tId));
                        alert('Deleted successfully.');
                      } catch (err) { alert('Failed to delete template.'); }
                    }} className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-8 text-center"><p className="text-gray-500">No custom templates yet.</p></div>
      )}
    </div>
  );
};