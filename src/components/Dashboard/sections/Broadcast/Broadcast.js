import React, { useState, useEffect, useCallback } from 'react';
import { apiConfig } from '../../../../config/api'; 
import AudienceBuilder from './AudienceBuilder';
import BroadcastAnalytics from './BroadcastAnalytics';
import { extractVariablesFromTemplate, TemplateEditor, TemplateLibrary, UserTemplatesList } from './Templates';

const Broadcast = ({ user, userData, loading }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [templateSubView, setTemplateSubView] = useState(null);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [userTemplates, setUserTemplates] = useState([]);
  const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(false);

  // Audience builder state
  const [selectedAudienceId, setSelectedAudienceId] = useState(null);
  const [selectedAudienceName, setSelectedAudienceName] = useState('');
  const [showAudienceBuilder, setShowAudienceBuilder] = useState(false);
  const [savedAudiences, setSavedAudiences] = useState([]);
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);

  // Selecting template to send in the broadcast
  const [broadcastSelectedTemplate, setBroadcastSelectedTemplate] = useState(null);
  const [broadcastTemplateVariables, setBroadcastTemplateVariables] = useState([]);
  const [broadcastVariableMapping, setBroadcastVariableMapping] = useState({});

  // Broadcast Submission State
  const [broadcastName, setBroadcastName] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState({ type: '', message: '' });

  // Scheduling State
  const [scheduledTimezone, setScheduledTimezone] = useState('IST');
  const [scheduledHour, setScheduledHour] = useState('12');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledPeriod, setScheduledPeriod] = useState('AM');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sendTimeMode, setSendTimeMode] = useState('now');

  // ==========================================
  // API FETCH FUNCTIONS
  // ==========================================
  const fetchUserTemplates = useCallback(async () => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) return;
      setIsLoadingUserTemplates(true);
      const url = `${apiConfig.dbServerConfig.baseURL}/api/templates/${dbId}/templates`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const result = await response.json();
      const templates = result.data || result.templates || result || [];
      setUserTemplates(Array.isArray(templates) ? templates : []);
    } catch (error) {
      setUserTemplates([]);
    } finally {
      setIsLoadingUserTemplates(false);
    }
  }, [user, userData]);

  const fetchSavedAudiences = useCallback(async () => {
    setIsLoadingAudiences(true);
    setShowAudienceSelector(true); 
    try {
      const dbId = userData?.db_id || user?.db_id || user?.uid;
      const token = localStorage.getItem('authToken');
      const apiUrl = apiConfig?.endpoints?.audience?.getUserAudiences?.(dbId) || `/api/audience/user/${dbId}`;
      const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setSavedAudiences(data.data || []);
      else throw new Error(data.error);
    } catch (error) {
      alert('Failed to load saved segments. Make sure the server is running.');
    } finally {
      setIsLoadingAudiences(false);
    }
  }, [user, userData]);

  const handleSendBroadcast = async () => {
    if (!broadcastName.trim() || !broadcastSelectedTemplate || !selectedAudienceId) {
      setBroadcastStatus({ type: 'error', message: 'Please provide a broadcast name, select a template, and choose an audience.' });
      return;
    }

    let isMappingValid = true;
    let mappingErrorMsg = '';

    ['header', 'body'].forEach(compType => {
      if (!broadcastTemplateVariables[compType]) return;
      broadcastTemplateVariables[compType].forEach(varName => {
        const config = broadcastVariableMapping[compType]?.[varName];
        if (!config) { isMappingValid = false; mappingErrorMsg = `Mapping configuration missing for {{${varName}}}.`; return; }
        if (config.type === 'dynamic' && !config.field) { isMappingValid = false; mappingErrorMsg = `Please select a contact field for dynamic variable {{${varName}}}.`; return; }
        if (config.type === 'static' && (!config.text || config.text.trim() === '')) { isMappingValid = false; mappingErrorMsg = `Please enter text for static variable {{${varName}}}.`; return; }
      });
    });

    if (!isMappingValid) return setBroadcastStatus({ type: 'error', message: mappingErrorMsg });

    setIsSendingBroadcast(true);
    setBroadcastStatus({ type: '', message: '' });

    try {
      const dbId = userData?.db_id || user?.db_id;
      const templateId = broadcastSelectedTemplate.template_id || broadcastSelectedTemplate.id || broadcastSelectedTemplate._id;
      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ userId: dbId, name: broadcastName, templateId: templateId, audienceListId: selectedAudienceId, variableMapping: broadcastVariableMapping })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate broadcast');

      setBroadcastStatus({ type: 'success', message: `Success! ${data.queuedCount} messages have been queued for delivery.` });
      setBroadcastName(''); setBroadcastSelectedTemplate(null); setSelectedAudienceId(null);
      setTimeout(() => { setBroadcastView('analytics'); setBroadcastStatus({ type: '', message: '' }); }, 2000);
    } catch (error) {
      setBroadcastStatus({ type: 'error', message: error.message });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if ((templateSubView === 'your-templates' || broadcastView === 'new-broadcast') && user && userData && !loading) {
      fetchUserTemplates();
    }
  }, [templateSubView, broadcastView, user, userData, loading, fetchUserTemplates]);

  useEffect(() => {
    if (broadcastSelectedTemplate) {
      const extractedVars = extractVariablesFromTemplate(broadcastSelectedTemplate);
      setBroadcastTemplateVariables(extractedVars);
      const initialMapping = { header: {}, body: {} };
      ['header', 'body'].forEach(compType => {
        extractedVars[compType].forEach(vName => {
          let defaultField = 'first_name';
          if (vName.includes('company')) defaultField = 'custom_attributes.company';
          initialMapping[compType][vName] = { type: 'dynamic', field: defaultField, fallback: '' };
        });
      });
      setBroadcastVariableMapping(initialMapping);
    } else {
      setBroadcastTemplateVariables({ header: [], body: [] });
      setBroadcastVariableMapping({ header: {}, body: {} });
    }
  }, [broadcastSelectedTemplate]);

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      <div className="rounded-lg shadow-sm border border-gray-200 flex flex-col bg-white flex-1 min-h-0">
        
        {/* Top Navigation Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0 w-full relative z-20">
          <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className={`flex items-center gap-2 px-4 sm:px-6 py-3 hide-scroll w-full ${showTemplatesDropdown ? 'overflow-visible' : 'overflow-x-auto md:overflow-visible'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            <button onClick={() => setBroadcastView('new-broadcast')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${broadcastView === 'new-broadcast' ? 'bg-blue-50 text-blue-700 border border-blue-300' : 'text-gray-700 hover:bg-gray-50 border border-transparent'}`}>
              New Broadcast
            </button>
            
            <div className="relative flex-shrink-0" onMouseEnter={() => setShowTemplatesDropdown(true)} onMouseLeave={() => setShowTemplatesDropdown(false)}>
              <button onClick={() => { setBroadcastView('templates'); setTemplateSubView('template-library'); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap w-full ${broadcastView === 'templates' ? 'bg-blue-50 text-blue-700 border border-blue-300' : 'text-gray-700 hover:bg-gray-50 border border-transparent'}`}>
                Templates
              </button>
              {showTemplatesDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[180px]">
                  <button onClick={() => { if (selectedTemplate && !window.confirm('Abandon changes?')) return; setSelectedTemplate(null); setBroadcastView('templates'); setTemplateSubView('template-library'); setShowTemplatesDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${broadcastView === 'templates' && templateSubView === 'template-library' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    Template library
                  </button>
                  <button onClick={() => { if (selectedTemplate && !window.confirm('Abandon changes?')) return; setSelectedTemplate(null); setBroadcastView('templates'); setTemplateSubView('your-templates'); setShowTemplatesDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-b-lg transition-colors ${broadcastView === 'templates' && templateSubView === 'your-templates' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    Your templates
                  </button>
                </div>
              )}
            </div>
            
            <button onClick={() => setBroadcastView('analytics')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${broadcastView === 'analytics' ? 'bg-blue-50 text-blue-700 border border-blue-300' : 'text-gray-700 hover:bg-gray-50 border border-transparent'}`}>
              Analytics
            </button>
            
            <button onClick={() => setBroadcastView('scheduled-broadcasts')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${broadcastView === 'scheduled-broadcasts' ? 'bg-blue-50 text-blue-700 border border-blue-300' : 'text-gray-700 hover:bg-gray-50 border border-transparent'}`}>
              Scheduled Broadcasts
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {broadcastView === 'templates' && (
            <div className="space-y-6">
              {selectedTemplate ? (
                <TemplateEditor 
                  user={user} 
                  userData={userData} 
                  initialTemplate={selectedTemplate} 
                  onCancel={() => setSelectedTemplate(null)}
                  onSuccess={() => {
                    setSelectedTemplate(null);
                    setBroadcastView('templates');
                    setTemplateSubView('your-templates');
                    fetchUserTemplates();
                  }}
                />
              ) : null}

              {!selectedTemplate && templateSubView === 'template-library' && (
                <TemplateLibrary onSelectTemplate={(template) => setSelectedTemplate(template)} />
              )}

              {!selectedTemplate && templateSubView === 'your-templates' && (
                <UserTemplatesList 
                  user={user} 
                  userData={userData} 
                  templates={userTemplates} 
                  isLoading={isLoadingUserTemplates} 
                  onEditTemplate={(template) => setSelectedTemplate(template)}
                  setTemplates={setUserTemplates}
                />
              )}

              {!selectedTemplate && !templateSubView && (
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Templates</h2>
                    <p className="text-sm text-gray-600 mb-4">Select "Template library" or "Your templates" from the sidebar to get started.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {broadcastView === 'broadcast-history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Broadcast History</h2>
                <p className="text-sm text-gray-600 mb-4">View all your past broadcast messages and their performance.</p>
              </div>
              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="p-8 text-center text-gray-500 text-sm">No broadcast history</div>
              </div>
            </div>
          )}

          {broadcastView === 'scheduled-broadcasts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scheduled Broadcasts</h2>
                <p className="text-sm text-gray-600 mb-4">Manage your scheduled broadcast messages.</p>
              </div>
              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="p-8 text-center text-gray-500 text-sm">No scheduled broadcasts</div>
              </div>
            </div>
          )}

          {broadcastView === 'analytics' && (
            <BroadcastAnalytics onNewBroadcastClick={() => setBroadcastView('new-broadcast')} />
          )}

          {broadcastView === 'new-broadcast' && (
            <div className="space-y-4 max-w-4xl">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter broadcast name" value={broadcastName} onChange={(e) => setBroadcastName(e.target.value)} />
              </div>

              {/* Select Template Message Section */}
              {(() => {
                const approvedTemplates = userTemplates.filter(t => t.template_status?.toLowerCase() === 'approved' || t.status?.toLowerCase() === 'approved');
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Select template message</label>
                      <button onClick={() => { setBroadcastView('templates'); setTemplateSubView('template-library'); }} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 transition-colors shrink-0">
                        Create template
                      </button>
                    </div>
                    {isLoadingUserTemplates ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm animate-pulse">Loading approved templates...</div>
                    ) : approvedTemplates.length > 0 ? (
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white" value={broadcastSelectedTemplate?.template_id || ''} onChange={(e) => setBroadcastSelectedTemplate(approvedTemplates.find(t => (t.template_id || t.id || t._id) === e.target.value))}>
                        <option value="" disabled>-- Select an approved template --</option>
                        {approvedTemplates.map(template => <option key={template.template_id} value={template.template_id}>{(template.object || template).name || "Unnamed Template"}</option>)}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-2.5 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <span className="text-yellow-500 text-base leading-none">⚠️</span>
                        <p className="text-xs text-gray-600">You don't have any approved templates yet. Click the button above to build one.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Audience Selection */}
              <div className="border-t pt-6 mt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Who is your audience?</h2>
                </div>
                {showAudienceBuilder ? (
                  <AudienceBuilder onCancel={() => setShowAudienceBuilder(false)} onSave={(listId, name) => { setSelectedAudienceId(listId); setSelectedAudienceName(name); setShowAudienceBuilder(false); }} />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {selectedAudienceId ? (
                      <div className="flex justify-between items-center bg-white p-4 border border-blue-200 rounded-lg shadow-sm">
                        <div><p className="text-sm font-bold">Selected: {selectedAudienceName}</p></div>
                        <button onClick={() => setShowAudienceBuilder(true)} className="text-sm text-blue-600 font-medium">Change</button>
                      </div>
                    ) : showAudienceSelector ? (
                      <div>
                        <div className="flex justify-between mb-4"><h3 className="font-semibold text-sm">Select Saved Segment</h3><button onClick={() => setShowAudienceSelector(false)} className="text-xs">Cancel</button></div>
                        {isLoadingAudiences ? <div className="py-4 text-center">Loading...</div> : savedAudiences.map(audience => (
                          <button key={audience.id} onClick={() => { setSelectedAudienceId(audience.id); setSelectedAudienceName(audience.name); setShowAudienceSelector(false); }} className="block w-full text-left p-3 mb-2 border rounded hover:bg-blue-50">{audience.name}</button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center gap-4 py-4">
                        <button onClick={fetchSavedAudiences} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">Select Saved Segment</button>
                        <button onClick={() => setShowAudienceBuilder(true)} className="px-4 py-2 bg-black text-white rounded-lg shadow-sm text-sm">Build New Audience</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="border-t pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">When do you want to send it?</h2>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="radio" value="now" checked={sendTimeMode === 'now'} onChange={(e) => setSendTimeMode(e.target.value)} />
                  <span className="text-sm text-gray-700">Send now</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="schedule" checked={sendTimeMode === 'schedule'} onChange={(e) => setSendTimeMode(e.target.value)} />
                  <span className="text-sm text-gray-700">Schedule for a specific time</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="border-t pt-6 mt-6">
                {broadcastStatus.message && <div className={`p-4 mb-4 rounded-lg ${broadcastStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{broadcastStatus.message}</div>}
                <div className="flex justify-end">
                  <button onClick={handleSendBroadcast} disabled={isSendingBroadcast} className={`px-6 py-3 font-medium text-white rounded-lg shadow-sm ${isSendingBroadcast ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSendingBroadcast ? (sendTimeMode === 'now' ? 'Queuing...' : 'Scheduling...') : (sendTimeMode === 'now' ? 'Send Broadcast' : 'Schedule Broadcast')}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Broadcast;