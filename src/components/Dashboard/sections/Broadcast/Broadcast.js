import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiConfig } from '../../../../config/api'; 
import AudienceBuilder from './AudienceBuilder';
import BroadcastAnalytics from './BroadcastAnalytics';
import { extractVariablesFromTemplate, TemplateEditor, TemplateLibrary, UserTemplatesList } from './Templates';

// ─── Timezone Definitions ───────────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'India (IST - UTC+5:30)' },
  { value: 'America/New_York', label: 'Eastern Time (US / Canada - UTC-5/4)' },
  { value: 'America/Chicago', label: 'Central Time (US / Canada - UTC-6/5)' },
  { value: 'America/Denver', label: 'Mountain Time (US / Canada - UTC-7/6)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US / Canada - UTC-8/7)' },
  { value: 'Europe/London', label: 'London (GMT / BST - UTC+0/1)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET / CEST - UTC+1/2)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST - UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore / Malaysia (SGT - UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST / AEDT - UTC+10/11)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

/**
 * Calculates exact UTC ISO-8601 string for a wall date/time in a specific IANA timezone
 */
function computeUtcIsoString(dateStr, hourStr, minStr, period, tz) {
  if (!dateStr) return null;
  let hour = parseInt(hourStr, 10);
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(hour)}:${pad(minStr)}:00`;

  const targetUtcAnchor = new Date(`${dateStr}T${timeStr}Z`);
  if (isNaN(targetUtcAnchor.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(targetUtcAnchor);
    const partMap = {};
    parts.forEach(p => { partMap[p.type] = p.value; });

    const inTzDate = new Date(`${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}Z`);
    const diffMs = inTzDate.getTime() - targetUtcAnchor.getTime();
    
    return new Date(targetUtcAnchor.getTime() - diffMs).toISOString();
  } catch (e) {
    return new Date(`${dateStr}T${timeStr}`).toISOString();
  }
}

/**
 * Formats a relative countdown string (e.g., "in 2 hours", "in 3 days")
 */
function formatTimeRemaining(isoDateStr) {
  if (!isoDateStr) return '';
  const diffMs = new Date(isoDateStr).getTime() - Date.now();
  if (diffMs <= 0) return 'Due now';
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return `in ${diffDays}d ${remHours > 0 ? `${remHours}h` : ''}`;
  }
  if (diffHours > 0) {
    const remMins = diffMinutes % 60;
    return `in ${diffHours}h ${remMins > 0 ? `${remMins}m` : ''}`;
  }
  return `in ${diffMinutes}m`;
}

// ─── Tab button helper ────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      'flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap flex-shrink-0',
      'border-b-2 transition-colors duration-150',
      active
        ? 'border-[#25D366] text-green-700'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200',
    ].join(' ')}
  >
    {children}
  </button>
);



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
  const [broadcastVariableMapping, setBroadcastVariableMapping] = useState({});

  // Broadcast Submission State
  const [broadcastName, setBroadcastName] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState({ type: '', message: '' });

  // Scheduling State
  const [scheduledTimezone, setScheduledTimezone] = useState(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TIMEZONE_OPTIONS.some(t => t.value === userTz) ? userTz : 'Asia/Kolkata';
    } catch (e) {
      return 'Asia/Kolkata';
    }
  });
  const [scheduledHour, setScheduledHour] = useState('10');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledPeriod, setScheduledPeriod] = useState('AM');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [sendTimeMode, setSendTimeMode] = useState('now');

  // Scheduled Broadcasts Management State
  const [scheduledList, setScheduledList] = useState([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [cancellingBroadcastId, setCancellingBroadcastId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [scheduledActionMsg, setScheduledActionMsg] = useState({ type: '', message: '' });

  // Calculated UTC scheduled timestamp
  const calculatedScheduledUtc = useMemo(() => {
    if (sendTimeMode !== 'schedule' || !scheduledDate) return null;
    return computeUtcIsoString(scheduledDate, scheduledHour, scheduledMinute, scheduledPeriod, scheduledTimezone);
  }, [sendTimeMode, scheduledDate, scheduledHour, scheduledMinute, scheduledPeriod, scheduledTimezone]);

  // ==========================================
  // API FETCH FUNCTIONS
  // ==========================================
  const fetchUserTemplates = useCallback(async () => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) return;
      setIsLoadingUserTemplates(true);
      const url = `${apiConfig.dbServerConfig.baseURL}/api/templates/${dbId}/templates`;
      const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
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

  const fetchScheduledBroadcasts = useCallback(async () => {
    const dbId = userData?.db_id || user?.db_id || user?.uid;
    if (!dbId) return;
    setIsLoadingScheduled(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/user/${dbId}/scheduled`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        setScheduledList(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch scheduled broadcasts');
      }
    } catch (error) {
      console.error('Error loading scheduled broadcasts:', error);
    } finally {
      setIsLoadingScheduled(false);
    }
  }, [user, userData]);

  const handleCancelScheduledBroadcast = async (broadcastId) => {
    setCancellingBroadcastId(broadcastId);
    setScheduledActionMsg({ type: '', message: '' });
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/${broadcastId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel broadcast');

      setScheduledList(prev => prev.filter(b => b.broadcast_id !== broadcastId));
      setConfirmCancelId(null);
      setScheduledActionMsg({ type: 'success', message: 'Broadcast cancelled successfully. It will not be sent.' });
      setTimeout(() => setScheduledActionMsg({ type: '', message: '' }), 4000);
    } catch (error) {
      setScheduledActionMsg({ type: 'error', message: error.message || 'Failed to cancel broadcast' });
    } finally {
      setCancellingBroadcastId(null);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastName.trim() || !broadcastSelectedTemplate || !selectedAudienceId) {
      setBroadcastStatus({ type: 'error', message: 'Please provide a broadcast name, select a template, and choose an audience.' });
      return;
    }

    let isMappingValid = true;
    let mappingErrorMsg = '';

    // 1. Validate Header & Body Variables
    ['header', 'body'].forEach(compType => {
      const variables = Object.keys(broadcastVariableMapping[compType] || {});
      
      variables.forEach(varName => {
        if (!isMappingValid) return; // Skip if we already found an error
        
        const config = broadcastVariableMapping[compType][varName];
        
        if (config.type === 'dynamic' && !config.field) { 
          isMappingValid = false; 
          mappingErrorMsg = `Please select a contact field for dynamic variable {{${varName}}}.`; 
        } else if (config.type === 'static' && (!config.text || config.text.trim() === '')) { 
          isMappingValid = false; 
          mappingErrorMsg = `Please enter text for static variable {{${varName}}}.`; 
        }
      });
    });

    // 2. Validate Button Variables
    if (isMappingValid && broadcastVariableMapping.buttons && broadcastVariableMapping.buttons.length > 0) {
      broadcastVariableMapping.buttons.forEach((btn) => {
        btn.parameters.forEach((param) => {
          if (!isMappingValid) return; // Skip if we already found an error

          const isCoupon = btn.sub_type === 'copy_code';
          const valueKey = isCoupon ? 'coupon_code' : 'text';
          const fieldType = param.fieldType || 'static';
          const varLabel = isCoupon ? `button_${btn.index}_code` : `button_${btn.index}_url`;

          if (fieldType === 'dynamic' && !param.field) {
            isMappingValid = false;
            mappingErrorMsg = `Please select a contact field for {{${varLabel}}}.`;
          } else if (fieldType === 'static' && (!param[valueKey] || param[valueKey].trim() === '')) {
            isMappingValid = false;
            mappingErrorMsg = `Please enter a value for static button variable {{${varLabel}}}.`;
          }
        });
      });
    }

    // Halt execution if any mapping validation failed
    if (!isMappingValid) {
      setBroadcastStatus({ type: 'error', message: mappingErrorMsg });
      return;
    }

    // 3. Validate Scheduling if schedule mode is active
    if (sendTimeMode === 'schedule') {
      if (!scheduledDate) {
        setBroadcastStatus({ type: 'error', message: 'Please select a date for scheduled delivery.' });
        return;
      }
      if (!calculatedScheduledUtc) {
        setBroadcastStatus({ type: 'error', message: 'Invalid scheduled date or time.' });
        return;
      }
      const scheduleTimeMs = new Date(calculatedScheduledUtc).getTime();
      if (scheduleTimeMs <= Date.now() + 60000) {
        setBroadcastStatus({ type: 'error', message: 'Scheduled time must be at least 1 minute in the future.' });
        return;
      }
    }

    setIsSendingBroadcast(true);
    setBroadcastStatus({ type: '', message: '' });

    try {
      const dbId = userData?.db_id || user?.db_id;
      const templateId = broadcastSelectedTemplate.template_id || broadcastSelectedTemplate.id || broadcastSelectedTemplate._id;
      
      const payload = { 
        userId: dbId, 
        name: broadcastName, 
        templateId: templateId, 
        audienceListId: selectedAudienceId, 
        variableMapping: broadcastVariableMapping,
        sendTimeMode: sendTimeMode,
        scheduledAt: sendTimeMode === 'schedule' ? calculatedScheduledUtc : null,
        timezone: scheduledTimezone
      };

      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate broadcast');

      if (sendTimeMode === 'schedule') {
        setBroadcastStatus({ 
          type: 'success', 
          message: `Campaign "${broadcastName}" scheduled successfully! It will dispatch automatically at the specified time.` 
        });
        setBroadcastName(''); 
        setBroadcastSelectedTemplate(null); 
        setSelectedAudienceId(null);
        fetchScheduledBroadcasts();
        setTimeout(() => { 
          setBroadcastView('scheduled-broadcasts'); 
          setBroadcastStatus({ type: '', message: '' }); 
        }, 2000);
      } else {
        setBroadcastStatus({ type: 'success', message: `Success! ${data.queuedCount} messages have been queued for immediate delivery.` });
        setBroadcastName(''); 
        setBroadcastSelectedTemplate(null); 
        setSelectedAudienceId(null);
        setTimeout(() => { 
          setBroadcastView('analytics'); 
          setBroadcastStatus({ type: '', message: '' }); 
        }, 2000);
      }
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
    if (broadcastView === 'scheduled-broadcasts' && user && userData && !loading) {
      fetchScheduledBroadcasts();
    }
  }, [templateSubView, broadcastView, user, userData, loading, fetchUserTemplates, fetchScheduledBroadcasts]);

useEffect(() => {
    if (broadcastSelectedTemplate) {
      const template = broadcastSelectedTemplate.object || broadcastSelectedTemplate;
      
      // Initialize with header, body, AND the array for buttons
      const initialMapping = { header: {}, body: {}, buttons: [] };
      
      template.components?.forEach(component => {
        const compType = component.type?.toLowerCase();

        // ==========================================
        // HEADER & BODY COMPONENTS
        // ==========================================
        if (compType === 'header' || compType === 'body') {
           const isTextFormat = compType === 'body' || component.format?.toLowerCase() === 'text';
           
           if (isTextFormat) {
             const paramKey = compType === 'header' ? 'header_text_named_params' : 'body_text_named_params';
             
             // 1. If Meta provides examples, map them automatically
             if (component.example && component.example[paramKey]) {
               component.example[paramKey].forEach(v => {
                 const varName = v.param_name;
                 const varSampleVal = v.example || '';

                 if (varName.toLowerCase().includes('name')) {
                   initialMapping[compType][varName] = { type: 'dynamic', field: 'first_name', text: varSampleVal, fallback: '' };
                 } else {
                   initialMapping[compType][varName] = { type: varSampleVal ? 'static' : 'dynamic', field: '', text: varSampleVal, fallback: '' };
                 }
               });
             } else {
                // 2. Fallback: If no examples exist, extract using regex
                const textWithVars = component.text || '';
                const matches = textWithVars.match(/\{\{[\w_]+\}\}/g);
                if (matches) {
                    matches.forEach(m => {
                        const varName = m.replace(/[{}]/g, '');
                        if (!initialMapping[compType][varName]) {
                            initialMapping[compType][varName] = { type: 'dynamic', field: '', text: '', fallback: '' };
                        }
                    });
                }
             }
           }
        }
        
        // ==========================================
        // BUTTONS COMPONENT (RESTORED)
        // ==========================================
        else if (compType === 'buttons') {
          if (component.buttons) {
            component.buttons.forEach((btn, index) => {
              
              let mappedValue = '';
              if (btn.example) {
                if (Array.isArray(btn.example)) {
                  mappedValue = btn.example[0];
                } else if (typeof btn.example === 'string') {
                  mappedValue = btn.example;
                } else if (btn.example.url_button_named_params) {
                  mappedValue = btn.example.url_button_named_params[0]?.example || '';
                }
              }

              if (mappedValue) {
                const subType = btn.type.toLowerCase(); 
                
                if (subType !== 'url') {
                  const buttonPayload = {
                    type: "button",
                    sub_type: subType,
                    index: String(index), 
                    parameters: []
                  };

                  if (subType === 'copy_code') {
                    buttonPayload.parameters.push({ type: "coupon_code", coupon_code: mappedValue });
                  } else {
                    buttonPayload.parameters.push({ type: "text", text: mappedValue });
                  }

                  // Push directly into our new buttons array in the state object
                  initialMapping.buttons.push(buttonPayload); 
                }
              }
            });
          }
        }
      });

      setBroadcastVariableMapping(initialMapping);
    } else {
      setBroadcastVariableMapping({ header: {}, body: {}, buttons: [] });
    }
  }, [broadcastSelectedTemplate]);

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50">

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0 z-20">
        <div className="flex items-center gap-1 px-4 sm:px-6 overflow-x-auto scrollbar-thin">

          {/* New Broadcast */}
          <TabBtn
            active={broadcastView === 'new-broadcast'}
            onClick={() => setBroadcastView('new-broadcast')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Broadcast
          </TabBtn>

          {/* Templates tab */}
          <TabBtn
            active={broadcastView === 'templates'}
            onClick={() => { setBroadcastView('templates'); setTemplateSubView('your-templates'); }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Templates
          </TabBtn>

          {/* Analytics */}
          <TabBtn
            active={broadcastView === 'analytics'}
            onClick={() => setBroadcastView('analytics')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </TabBtn>

          {/* Scheduled */}
          <TabBtn
            active={broadcastView === 'scheduled-broadcasts'}
            onClick={() => setBroadcastView('scheduled-broadcasts')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Scheduled
          </TabBtn>
        </div>
      </div>

      {/* ── Sub-tab bar (Templates) ── */}
      {broadcastView === 'templates' && (
        <div className="bg-white border-b border-slate-100 flex-shrink-0 px-4 sm:px-6">
          <div className="flex items-center gap-1">
            {[
              { key: 'your-templates',  label: 'Your Templates' },
              { key: 'template-library', label: 'Template Library' },
            ].map(sub => (
              <button
                key={sub.key}
                onClick={() => {
                  if (selectedTemplate && !window.confirm('Abandon changes?')) return;
                  setSelectedTemplate(null);
                  setTemplateSubView(sub.key);
                }}
                className={[
                  'px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors duration-150',
                  templateSubView === sub.key
                    ? 'border-[#25D366] text-green-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">

        {/* ── Templates ── */}
        {broadcastView === 'templates' && (
          <div className="space-y-6 max-w-7xl mx-auto">
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
              <div className="card p-8 text-center">
                <p className="text-sm text-slate-500">Select "Template library" or "Your templates" from the tab above to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Scheduled broadcasts ── */}
        {broadcastView === 'scheduled-broadcasts' && (
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Scheduled Broadcasts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage and monitor upcoming automated campaigns queued for dispatch.</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={fetchScheduledBroadcasts}
                  disabled={isLoadingScheduled}
                  className="btn-outline text-xs py-2 px-3 gap-1.5"
                  title="Refresh scheduled campaigns"
                >
                  <svg className={`w-3.5 h-3.5 ${isLoadingScheduled ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button onClick={() => setBroadcastView('new-broadcast')} className="btn-primary text-xs py-2 px-3 gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Schedule Broadcast
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {scheduledActionMsg.message && (
              <div className={`rounded-xl px-4 py-3 text-xs flex items-center justify-between gap-2 transition-all ${scheduledActionMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                <span>{scheduledActionMsg.message}</span>
                <button onClick={() => setScheduledActionMsg({ type: '', message: '' })} className="hover:opacity-75">
                  ✕
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingScheduled && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-5 animate-pulse bg-white space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="h-4 bg-slate-100 rounded"></div>
                      <div className="h-4 bg-slate-100 rounded"></div>
                      <div className="h-4 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingScheduled && scheduledList.length === 0 && (
              <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-slate-200 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-[#25D366]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">No scheduled broadcasts found</h3>
                <p className="text-xs text-slate-400 max-w-sm">When you schedule marketing campaigns for future automated dispatch, they will appear here with live countdowns and cancellation options.</p>
                <button onClick={() => setBroadcastView('new-broadcast')} className="btn-primary mt-6 text-xs py-2 px-4 gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Broadcast
                </button>
              </div>
            )}

            {/* List of Scheduled Broadcasts */}
            {!isLoadingScheduled && scheduledList.length > 0 && (
              <div className="space-y-3.5">
                {scheduledList.map(item => {
                  const isCancelling = cancellingBroadcastId === item.broadcast_id;
                  const isConfirming = confirmCancelId === item.broadcast_id;
                  const scheduledDateObj = new Date(item.scheduled_at);
                  const formattedDateTime = scheduledDateObj.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  const countdown = formatTimeRemaining(item.scheduled_at);

                  return (
                    <div key={item.broadcast_id} className="card p-5 bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Scheduled
                              </span>
                              {countdown && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  ⏳ {countdown}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Campaign ID: <span className="font-mono text-slate-500">{item.broadcast_id}</span></p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isConfirming ? (
                            <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                              <span className="text-[11px] font-medium text-red-700 px-1">Cancel campaign?</span>
                              <button
                                onClick={() => handleCancelScheduledBroadcast(item.broadcast_id)}
                                disabled={isCancelling}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                disabled={isCancelling}
                                className="px-2 py-1 text-xs font-medium rounded-md bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmCancelId(item.broadcast_id)}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel Schedule
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3.5 text-xs">
                        <div>
                          <span className="block text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">Audience Segment</span>
                          <span className="font-semibold text-slate-700">{item.audience_name || 'Custom Audience'}</span>
                          <span className="text-slate-400 text-[11px] block">({item.recipient_count || 0} contacts)</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">Template</span>
                          <span className="font-semibold text-slate-700 truncate block">{item.template_name || 'Approved WhatsApp Template'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">Scheduled Launch Time</span>
                          <span className="font-semibold text-slate-800 block">{formattedDateTime}</span>
                          <span className="text-slate-400 text-[11px] font-mono">{item.timezone || 'UTC'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">Created</span>
                          <span className="text-slate-600 block">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* ── Broadcast history ── */}
        {broadcastView === 'broadcast-history' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Broadcast History</h2>
            <div className="card p-8 text-center text-sm text-slate-400">No broadcast history found.</div>
          </div>
        )}

        {/* ── Analytics ── */}
        {broadcastView === 'analytics' && (
          <BroadcastAnalytics
            onNewBroadcastClick={() => setBroadcastView('new-broadcast')}
            user={user}
            userData={userData}
          />
        )}

        {/* ── New Broadcast ── */}
        {broadcastView === 'new-broadcast' && (
          <div className={`${showAudienceBuilder ? 'max-w-7xl' : 'max-w-3xl'} mx-auto space-y-6 transition-all duration-300`}>

            {/* Broadcast name */}
            <div className="card p-5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Broadcast Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Diwali Sale – Oct 2025"
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
              />
            </div>

            {/* Select Template */}
            {(() => {
              const approvedTemplates = userTemplates.filter(t =>
                t.template_status?.toLowerCase() === 'approved' || t.status?.toLowerCase() === 'approved'
              );
              return (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Template Message
                    </label>
                    <button
                      onClick={() => { setBroadcastView('templates'); setTemplateSubView('template-library'); }}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      + Create template
                    </button>
                  </div>
                  {isLoadingUserTemplates ? (
                    <div className="input text-slate-400 animate-pulse">Loading approved templates...</div>
                  ) : approvedTemplates.length > 0 ? (
                    <select
                      className="input"
                      value={broadcastSelectedTemplate?.template_id || ''}
                      onChange={(e) => setBroadcastSelectedTemplate(
                        approvedTemplates.find(t => (t.template_id || t.id || t._id) === e.target.value)
                      )}
                    >
                      <option value="" disabled>— Select an approved template —</option>
                      {approvedTemplates.map(t => (
                        <option key={t.template_id || t.id || t._id} value={t.template_id || t.id || t._id}>
                          {t.name || t.template_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-400 mb-3">No approved templates found.</p>
                      <button
                        onClick={() => { setBroadcastView('templates'); setTemplateSubView('template-library'); }}
                        className="btn-primary text-xs gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create your first template
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Variable Mapping */}
            {broadcastSelectedTemplate && (() => {
              const template = broadcastSelectedTemplate.object || broadcastSelectedTemplate;
              const hasVariables =
                Object.keys(broadcastVariableMapping.header || {}).length > 0 ||
                Object.keys(broadcastVariableMapping.body || {}).length > 0 ||
                (broadcastVariableMapping.buttons && broadcastVariableMapping.buttons.some(btn => btn.parameters?.length > 0));

              if (!hasVariables) return null;

              return (
                <div className="card p-5 space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-0.5">Personalisation</h3>
                    <p className="text-xs text-slate-400">Map template variables to contact fields or static text.</p>
                  </div>

                  {['header', 'body'].map(compType => {
                    const variables = Object.keys(broadcastVariableMapping[compType] || {});
                    if (!variables.length) return null;
                    return (
                      <div key={compType}>
                        <p className="text-xs font-semibold text-slate-700 mb-3 capitalize">{compType} variables</p>
                        <div className="space-y-3">
                          {variables.map(varName => {
                            const config = broadcastVariableMapping[compType][varName];
                            return (
                              <div key={varName} className="grid grid-cols-3 gap-3 items-center">
                                <div className="col-span-1 font-mono text-xs bg-slate-100 rounded-lg px-3 py-2 text-slate-600 truncate">
                                  {`{{${varName}}}`}
                                </div>
                                <select
                                  className="input text-xs py-2"
                                  value={config.type || 'dynamic'}
                                  onChange={e => {
                                    setBroadcastVariableMapping(prev => {
                                      const updated = { ...prev };
                                      updated[compType][varName] = { ...updated[compType][varName], type: e.target.value, field: '', text: '' };
                                      return updated;
                                    });
                                  }}
                                >
                                  <option value="dynamic">Contact Field</option>
                                  <option value="static">Static Text</option>
                                </select>
                                <div>
                                  {config.type === 'dynamic' ? (
                                    <select
                                      className="input text-xs py-2"
                                      value={config.field || ''}
                                      onChange={e => {
                                        setBroadcastVariableMapping(prev => {
                                          const updated = { ...prev };
                                          updated[compType][varName] = { ...updated[compType][varName], field: e.target.value };
                                          return updated;
                                        });
                                      }}
                                    >
                                      <option value="" disabled>— Select field —</option>
                                      <option value="first_name">First Name</option>
                                      <option value="last_name">Last Name</option>
                                      <option value="phone_number">Phone Number</option>
                                      <option value="email">Email</option>
                                      <option value="custom_attributes.company">Company</option>
                                      <option value="custom_attributes.order_number">Order Number</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      className="input text-xs py-2"
                                      placeholder="Static value..."
                                      value={config.text || ''}
                                      onChange={e => {
                                        setBroadcastVariableMapping(prev => {
                                          const updated = { ...prev };
                                          updated[compType][varName] = { ...updated[compType][varName], text: e.target.value };
                                          return updated;
                                        });
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Button variable mapping */}
                  {broadcastVariableMapping.buttons?.map((btn, btnIndex) => {
                    if (!btn.parameters?.length) return null;
                    const isCoupon = btn.sub_type === 'copy_code';
                    const valueKey = isCoupon ? 'coupon_code' : 'text';
                    return (
                      <div key={btnIndex}>
                        <p className="text-xs font-semibold text-slate-700 mb-3">
                          Button {btnIndex + 1} ({isCoupon ? 'Coupon Code' : 'URL Suffix'})
                        </p>
                        {btn.parameters.map((param, paramIndex) => {
                          const fieldType = param.fieldType || 'static';
                          return (
                            <div key={paramIndex} className="grid grid-cols-3 gap-3 items-center mb-3">
                              <div className="col-span-1 font-mono text-xs bg-slate-100 rounded-lg px-3 py-2 text-slate-600 truncate">
                                {`btn_${btnIndex}_${isCoupon ? 'code' : 'url'}`}
                              </div>
                              <select
                                className="input text-xs py-2"
                                value={fieldType}
                                onChange={e => {
                                  setBroadcastVariableMapping(prev => {
                                    const updated = { ...prev };
                                    updated.buttons[btnIndex].parameters[paramIndex].fieldType = e.target.value;
                                    return updated;
                                  });
                                }}
                              >
                                <option value="dynamic">Contact Field</option>
                                <option value="static">Static Text</option>
                              </select>
                              <div>
                                {fieldType === 'dynamic' ? (
                                  <select
                                    className="input text-xs py-2"
                                    value={param.field || ''}
                                    onChange={e => {
                                      setBroadcastVariableMapping(prev => {
                                        const updated = { ...prev };
                                        updated.buttons[btnIndex].parameters[paramIndex].field = e.target.value;
                                        return updated;
                                      });
                                    }}
                                  >
                                    <option value="" disabled>— Select field —</option>
                                    <option value="first_name">First Name</option>
                                    <option value="last_name">Last Name</option>
                                    <option value="phone_number">Phone Number</option>
                                    <option value="email">Email</option>
                                    <option value="custom_attributes.company">Company</option>
                                    <option value="custom_attributes.order_number">Order Number</option>
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    className="input text-xs py-2"
                                    placeholder={isCoupon ? 'Coupon code...' : 'URL suffix...'}
                                    value={param[valueKey] || ''}
                                    onChange={e => {
                                      setBroadcastVariableMapping(prev => {
                                        const updated = { ...prev };
                                        updated.buttons[btnIndex].parameters[paramIndex][valueKey] = e.target.value;
                                        return updated;
                                      });
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Audience */}
            <div className={`card ${showAudienceBuilder ? 'p-3 sm:p-5 bg-slate-50/40 border-slate-200/80 overflow-hidden' : 'p-5'}`}>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Who is your audience?</h3>
              {showAudienceBuilder ? (
                <AudienceBuilder
                  onCancel={() => setShowAudienceBuilder(false)}
                  onSave={(listId, name) => {
                    setSelectedAudienceId(listId);
                    setSelectedAudienceName(name);
                    setShowAudienceBuilder(false);
                  }}
                />
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  {selectedAudienceId ? (
                    <div className="flex items-center justify-between bg-white border border-[#25D366]/30 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                        <p className="text-sm font-semibold text-slate-800">{selectedAudienceName}</p>
                      </div>
                      <button onClick={() => setShowAudienceBuilder(true)} className="text-xs text-[#25D366] font-medium hover:underline">
                        Change
                      </button>
                    </div>
                  ) : showAudienceSelector ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-slate-700">Saved Segments</h4>
                        <button onClick={() => setShowAudienceSelector(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </div>
                      {isLoadingAudiences ? (
                        <div className="py-4 text-center text-sm text-slate-400">Loading...</div>
                      ) : (
                        savedAudiences.map(audience => (
                          <button
                            key={audience.id}
                            onClick={() => { setSelectedAudienceId(audience.id); setSelectedAudienceName(audience.name); setShowAudienceSelector(false); }}
                            className="block w-full text-left px-4 py-3 mb-2 text-sm rounded-lg border border-slate-200 bg-white hover:border-[#25D366] hover:bg-[#25D366]/5 transition-colors"
                          >
                            {audience.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-center gap-3 py-4">
                      <button onClick={fetchSavedAudiences} className="btn-outline text-xs py-2 px-4">
                        Select saved segment
                      </button>
                      <button onClick={() => setShowAudienceBuilder(true)} className="btn-primary text-xs py-2 px-4">
                        Build new audience
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">When to send?</h3>
                {sendTimeMode === 'schedule' && calculatedScheduledUtc && (
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    🚀 {formatTimeRemaining(calculatedScheduledUtc)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'now', label: 'Send immediately', desc: 'Dispatch to all contacts right away' },
                  { value: 'schedule', label: 'Schedule for a specific time', desc: 'Deliver automatically at a future date & time' }
                ].map(opt => (
                  <label 
                    key={opt.value} 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      sendTimeMode === opt.value 
                        ? 'border-[#25D366] bg-emerald-50/30 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      sendTimeMode === opt.value ? 'border-[#25D366]' : 'border-slate-300'
                    }`}>
                      {sendTimeMode === opt.value && <span className="w-2 h-2 rounded-full bg-[#25D366]" />}
                    </span>
                    <input 
                      type="radio" 
                      value={opt.value} 
                      checked={sendTimeMode === opt.value} 
                      onChange={e => setSendTimeMode(e.target.value)} 
                      className="sr-only" 
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">{opt.label}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Schedule Controls (When 'schedule' is selected) */}
              {sendTimeMode === 'schedule' && (
                <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Date Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Schedule Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="input text-xs py-2"
                      />
                    </div>

                    {/* Time (Hour : Min : AM/PM) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Schedule Time
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={scheduledHour}
                          onChange={e => setScheduledHour(e.target.value)}
                          className="input text-xs py-2 px-2 flex-1"
                        >
                          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="text-slate-400 font-bold">:</span>
                        <select
                          value={scheduledMinute}
                          onChange={e => setScheduledMinute(e.target.value)}
                          className="input text-xs py-2 px-2 flex-1"
                        >
                          {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                          {['AM', 'PM'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setScheduledPeriod(p)}
                              className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                scheduledPeriod === p 
                                  ? 'bg-slate-800 text-white' 
                                  : 'bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timezone Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Timezone
                      </label>
                      <select
                        value={scheduledTimezone}
                        onChange={e => setScheduledTimezone(e.target.value)}
                        className="input text-xs py-2"
                      >
                        {TIMEZONE_OPTIONS.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Dispatch Preview Notice */}
                  {calculatedScheduledUtc && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs text-slate-700">
                        <span>Campaign will be automatically dispatched on </span>
                        <span className="font-bold text-slate-900">
                          {new Date(calculatedScheduledUtc).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        <span className="text-slate-400 font-mono ml-1.5">({scheduledTimezone})</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status + Submit */}
            <div>
              {broadcastStatus.message && (
                <div className={`rounded-xl px-4 py-3 mb-4 text-sm flex items-start gap-2 ${broadcastStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                  {broadcastStatus.message}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleSendBroadcast}
                  disabled={isSendingBroadcast}
                  className="btn-primary px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSendingBroadcast ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {sendTimeMode === 'now' ? 'Queuing...' : 'Scheduling...'}
                    </>
                  ) : sendTimeMode === 'now' ? 'Send Broadcast' : 'Schedule Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Broadcast;
