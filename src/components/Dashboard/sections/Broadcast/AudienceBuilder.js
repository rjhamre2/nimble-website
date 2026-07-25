import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiConfig } from '../../../../config/api';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// --- Configuration Constants ---
const FIELD_GROUPS = [
  {
    label: 'Compliance',
    options: [
      { value: 'whatsapp_mkt_opt_in', label: 'WhatsApp Opt-in', type: 'boolean' },
      { value: 'status', label: 'Status', type: 'text' }
    ]
  },
  {
    label: 'Segmentation',
    options: [
      { value: 'type', label: 'Lead Stage (Type)', type: 'text' },
      { value: 'source', label: 'Source', type: 'text' },
      { value: 'tags', label: 'Tags', type: 'array' }
    ]
  },
  {
    label: 'Engagement',
    options: [
      { value: 'last_interacted_at', label: 'Last Interacted', type: 'date' },
      { value: 'created_at', label: 'Created At', type: 'date' }
    ]
  },
  {
    label: 'Custom Data',
    options: [
      { value: 'company', label: 'Company', type: 'text' },
      { value: 'title', label: 'Job Title', type: 'text' },
      { value: 'custom_field', label: 'Other Custom Field...', type: 'custom' }
    ]
  }
];

const getOperatorsForType = (type) => {
  switch (type) {
    case 'array':
      return [
        { value: 'includes_any_of', label: 'Includes any of' },
        { value: 'includes_all_of', label: 'Includes all of' },
        { value: 'does_not_include', label: 'Does not include' }
      ];
    case 'date':
      return [
        { value: 'is_within_the_last', label: 'Is within the last (days)' },
        { value: 'is_exactly', label: 'Is exactly' },
        { value: 'is_before', label: 'Is before' }
      ];
    case 'boolean':
      return [
        { value: 'equals', label: 'Is' }
      ];
    default: // text, custom
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Does not equal' },
        { value: 'contains', label: 'Contains' },
        { value: 'is_not_empty', label: 'Is not empty' }
      ];
  }
};

// --- Recursive Rule Group Component ---
const RuleGroup = ({ group, onChange, onRemove, isRoot = false }) => {
  const handleAddRule = () => {
    const newRules = [...group.rules, { id: Date.now().toString(), field: 'type', operator: 'equals', value: '' }];
    onChange({ ...group, rules: newRules });
  };

  const handleAddGroup = () => {
    const newRules = [...group.rules, { id: Date.now().toString(), matchType: 'AND', rules: [{ id: Date.now().toString() + '_1', field: 'tags', operator: 'includes_any_of', value: '' }] }];
    onChange({ ...group, rules: newRules });
  };

  const updateRule = (id, newRuleData) => {
    const newRules = group.rules.map(r => r.id === id ? newRuleData : r);
    onChange({ ...group, rules: newRules });
  };

  const removeRule = (id) => {
    const newRules = group.rules.filter(r => r.id !== id);
    onChange({ ...group, rules: newRules });
  };

  return (
    <div className={`space-y-4 ${!isRoot ? 'p-4 border border-gray-200 rounded-lg bg-white ml-6 relative' : ''}`}>
      {!isRoot && (
        <div className="absolute -left-6 top-1/2 w-6 border-t border-gray-300"></div>
      )}
      
      {/* Group Logic Header */}
      <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Match</span>
        <select 
          className="border border-gray-300 p-1 rounded text-sm bg-white font-bold text-blue-700"
          value={group.matchType} 
          onChange={(e) => onChange({ ...group, matchType: e.target.value })}
        >
          <option value="AND">ALL</option>
          <option value="OR">ANY</option>
        </select>
        <span className="text-sm font-medium text-gray-700">of the following rules:</span>
        {!isRoot && (
          <button onClick={onRemove} className="ml-auto text-gray-400 hover:text-red-500">
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {group.rules.map((rule) => {
          if (rule.rules) {
            // Render Nested Group
            return <RuleGroup key={rule.id} group={rule} onChange={(newGroup) => updateRule(rule.id, newGroup)} onRemove={() => removeRule(rule.id)} />;
          }

          // Render Single Rule Row
          let fieldType = 'text';
          for (const g of FIELD_GROUPS) {
            const opt = g.options.find(o => o.value === rule.field);
            if (opt) { fieldType = opt.type; break; }
          }
          if (rule.field === 'custom_field') fieldType = 'custom';

          const operators = getOperatorsForType(fieldType);

          // Force operator reset if switching to a field with incompatible operators
          if (!operators.find(o => o.value === rule.operator) && rule.operator !== 'is_not_empty') {
            setTimeout(() => updateRule(rule.id, { ...rule, operator: operators[0].value, value: '' }), 0);
          }

          return (
            <div key={rule.id} className="flex space-x-3 items-start relative pl-2 border-l-2 border-transparent hover:border-blue-300 transition-colors">
              {/* Column A: Field Selector */}
              <div className="w-1/3 flex flex-col gap-2">
                <select 
                  className="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  value={rule.field.startsWith('custom_') && rule.field !== 'custom_field' ? 'custom_field' : rule.field} 
                  onChange={(e) => updateRule(rule.id, { ...rule, field: e.target.value, value: '' })}
                >
                  {FIELD_GROUPS.map((fg, i) => (
                    <optgroup key={i} label={fg.label}>
                      {fg.options.map((opt, j) => (
                        <option key={j} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {/* Reveal custom input if they selected Custom Field */}
                {(rule.field === 'custom_field' || (rule.field.startsWith('custom_') && rule.field !== 'custom_field')) && (
                  <input 
                    type="text" 
                    placeholder="Enter variable key (e.g., ltv)"
                    className="w-full p-2 border border-blue-300 rounded text-sm bg-blue-50 focus:outline-none"
                    value={rule.field.startsWith('custom_') ? rule.field.replace('custom_', '') : ''}
                    onChange={(e) => updateRule(rule.id, { ...rule, field: `custom_${e.target.value.replace(/[^a-z0-9_]/g, '')}` })}
                  />
                )}
              </div>

              {/* Column B: Operator */}
              <div className="w-1/4">
                <select 
                  className="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  value={rule.operator} 
                  onChange={(e) => updateRule(rule.id, { ...rule, operator: e.target.value, value: '' })}
                >
                  {operators.map((op, i) => (
                    <option key={i} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              {/* Column C: Dynamic Value Input */}
              <div className="flex-1">
                {rule.operator === 'is_not_empty' ? (
                  <div className="p-2 text-sm text-gray-500 italic bg-gray-50 rounded border border-dashed border-gray-300">No value required</div>
                ) : fieldType === 'boolean' ? (
                  <select 
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    value={rule.value} 
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="true">True / Yes</option>
                    <option value="false">False / No</option>
                  </select>
                ) : fieldType === 'date' && rule.operator !== 'is_within_the_last' ? (
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    value={rule.value} 
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                  />
                ) : fieldType === 'date' && rule.operator === 'is_within_the_last' ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="1"
                      className="w-24 border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      value={rule.value} 
                      onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                ) : fieldType === 'array' ? (
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas (e.g. VIP, 2026_Sale)"
                    value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value} 
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                  />
                ) : (
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Value..."
                    value={rule.value} 
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                  />
                )}
              </div>

              {/* Delete Button */}
              <button onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-red-500 p-2 mt-0.5">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Filter Actions */}
      <div className="flex gap-4 pt-2">
        <button onClick={handleAddRule} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors">
          <PlusIcon className="h-4 w-4" /> Add filter
        </button>
        <button onClick={handleAddGroup} className="text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded border border-dashed border-gray-300 text-sm font-medium flex items-center gap-1 transition-colors">
          <PlusIcon className="h-4 w-4" /> Add rule group
        </button>
      </div>
    </div>
  );
};

// --- Main Audience Builder Component ---
const AudienceBuilder = ({ onSave, onCancel }) => {
  const { user, userData } = useAuth();
  const dbId = userData?.db_id || user?.db_id || user?.uid;

  const [segmentName, setSegmentName] = useState('');
  
  // Saved Audiences State (for templating)
  const [savedAudiences, setSavedAudiences] = useState([]);
  
  // The Root Rule Group State
  const [ruleGroup, setRuleGroup] = useState({
    id: 'root',
    matchType: 'AND',
    rules: [
      { id: 'initial_1', field: 'type', operator: 'equals', value: 'customer' }
    ]
  });

  // Manual Overrides State
  const [alwaysIncludeStr, setAlwaysIncludeStr] = useState('');
  const [alwaysExcludeStr, setAlwaysExcludeStr] = useState('');

  // Preview State
  const [previewData, setPreviewData] = useState({ count: 0, sample: [] });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse Overrides
  const parseOverrides = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

  // Fetch saved audiences on mount for the dropdown
  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const apiUrl = apiConfig?.endpoints?.audience?.getUserAudiences?.(dbId) || `/api/audience/user/${dbId}`;
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setSavedAudiences(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load saved audiences for templating', err);
      }
    };
    if (dbId) fetchAudiences();
  }, [dbId]);

  // Debounced Preview Fetcher
  const fetchPreview = useCallback(async (currentRuleGroup, currentInclude, currentExclude) => {
    setIsCalculating(true);
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = apiConfig?.endpoints?.audience?.preview?.() || '/api/audience/preview'; 
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: dbId,
          ruleGroup: currentRuleGroup,
          always_include: parseOverrides(currentInclude),
          always_exclude: parseOverrides(currentExclude)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPreviewData({ count: data.count, sample: data.preview || [] });
      }
    } catch (error) {
      console.error('Failed to fetch preview', error);
      setPreviewData({ count: 0, sample: [] }); 
    } finally {
      setIsCalculating(false);
    }
  }, [dbId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview(ruleGroup, alwaysIncludeStr, alwaysExcludeStr);
    }, 600);
    return () => clearTimeout(timer);
  }, [ruleGroup, alwaysIncludeStr, alwaysExcludeStr, fetchPreview]);

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      alert("Please provide a name for this segment.");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = apiConfig?.endpoints?.audience?.save?.() || '/api/audience/save'; 
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: dbId,
          name: segmentName,
          ruleGroup,
          always_include: parseOverrides(alwaysIncludeStr),
          always_exclude: parseOverrides(alwaysExcludeStr)
        })
      });

      const data = await response.json();
      if (data.success) {
        if (onSave) onSave(data.listId, segmentName);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Save error', error);
      alert('Failed to save segment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (audienceId) => {
    if (!audienceId) return;
    const selected = savedAudiences.find(a => a.id === audienceId);
    if (selected) {
      // Append "(Copy)" to clarify they are creating a new segment based on the old one
      setSegmentName(`${selected.name} (Copy)`);
      try {
        const parsed = typeof selected.rules_json === 'string' 
          ? JSON.parse(selected.rules_json) 
          : selected.rules_json;
          
        if (parsed.ruleGroup) setRuleGroup(parsed.ruleGroup);
        if (parsed.always_include) setAlwaysIncludeStr(parsed.always_include.join(', '));
        if (parsed.always_exclude) setAlwaysExcludeStr(parsed.always_exclude.join(', '));
      } catch (err) {
        console.error("Error parsing rules JSON from template", err);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-fade-in">
      {/* Main Builder Area */}
      <div className="flex-1 space-y-6">
        
        {/* Header with Template Loader */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Audience Name</label>
              <input 
                type="text" 
                placeholder="e.g., Inactive VIPs 2026" 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>
            
            {savedAudiences.length > 0 && (
              <div className="md:w-1/3">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                  Or load saved segment
                </label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-gray-700 cursor-pointer"
                  onChange={(e) => handleLoadTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select saved audience</option>
                  {savedAudiences.map(aud => (
                    <option key={aud.id} value={aud.id}>
                      {aud.name} ({aud.contact_count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Rules Engine */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Filter Engine</h3>
          <RuleGroup group={ruleGroup} onChange={setRuleGroup} isRoot={true} />
        </div>
{/* 
        {/* Manual Overrides 
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Manual Overrides</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-green-700 mb-1">Always Include (IDs / Phones)</label>
              <p className="text-xs text-gray-500 mb-2">Forces these contacts into the blast even if filters fail.</p>
              <textarea 
                className="w-full p-2 border border-green-300 rounded bg-green-50 focus:ring-2 focus:ring-green-500 outline-none text-sm h-20"
                placeholder="Comma separated IDs or numbers..."
                value={alwaysIncludeStr}
                onChange={(e) => setAlwaysIncludeStr(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-1">Always Exclude (Blacklist)</label>
              <p className="text-xs text-gray-500 mb-2">Prevents these contacts from receiving the blast.</p>
              <textarea 
                className="w-full p-2 border border-red-300 rounded bg-red-50 focus:ring-2 focus:ring-red-500 outline-none text-sm h-20"
                placeholder="Comma separated IDs or numbers..."
                value={alwaysExcludeStr}
                onChange={(e) => setAlwaysExcludeStr(e.target.value)}
              />
            </div>
          </div>
        </div>
*/}
      </div>

      {/* Sticky Feedback Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-6 bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden">
          
          <div className="bg-blue-600 p-4 text-center text-white">
            <p className="text-sm font-medium opacity-90 uppercase tracking-wider">Target Audience</p>
            <div className="text-4xl font-bold my-2 flex justify-center items-center h-10">
              {isCalculating ? (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              ) : (
                previewData.count.toLocaleString()
              )}
            </div>
            <p className="text-xs opacity-80">Contacts</p>
          </div>

          {/* Cost Estimator */}
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-sm">
            <span className="text-blue-800 font-medium">Estimated Meta Cost:</span>
            <span className="font-bold text-blue-900">
              ${(previewData.count * 0.01).toFixed(2)}
            </span>
          </div>

          {/* Mini Preview Table */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Preview Sample</p>
            {previewData.sample.length > 0 ? (
              <div className="space-y-3">
                {previewData.sample.map((contact, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="truncate pr-2">
                      <p className="font-medium text-gray-900 truncate">
                        {contact.first_name || ''} {contact.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{contact.phone_number}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase font-bold">
                      {contact.type || 'NEW'}
                    </span>
                  </div>
                ))}
                {previewData.count > 5 && (
                  <p className="text-xs text-center text-gray-400 mt-2 italic">+ {previewData.count - 5} more...</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center italic py-4">No contacts match these rules.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {onCancel && (
              <button 
                onClick={onCancel}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={handleSaveSegment}
              disabled={isSaving || previewData.count === 0 || !segmentName.trim()}
              className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Use Segment'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AudienceBuilder;