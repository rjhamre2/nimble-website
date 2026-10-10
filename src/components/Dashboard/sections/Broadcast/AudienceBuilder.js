import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiConfig } from '../../../../config/api';
import { 
  TrashIcon, 
  PlusIcon, 
  SparklesIcon, 
  TagIcon, 
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  FireIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XMarkIcon,
  CurrencyRupeeIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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

const LEAD_STAGES = [
  { id: 'NEW', label: 'New Lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'WON', label: 'Won / Customer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'LOST', label: 'Lost', color: 'bg-rose-50 text-rose-700 border-rose-200' }
];

const PRESETS = [
  {
    id: 'all_opted_in',
    title: 'All Active & Opted-In',
    description: 'All subscribed contacts ready for broadcast with verified marketing consent.',
    icon: ShieldCheckIcon,
    badge: 'Recommended',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-50 text-emerald-600',
    buildRules: () => ({
      matchType: 'AND',
      rules: [
        { id: 'pr_1', field: 'whatsapp_mkt_opt_in', operator: 'equals', value: 'true' },
        { id: 'pr_2', field: 'status', operator: 'equals', value: 'active' }
      ]
    })
  },
  {
    id: 'engaged_30d',
    title: 'Active in Last 30 Days',
    description: 'Contacts who have messaged or interacted with your business within the past month.',
    icon: FireIcon,
    badge: 'High Engagement',
    badgeColor: 'bg-amber-100 text-amber-800',
    iconBg: 'bg-amber-50 text-amber-600',
    buildRules: () => ({
      matchType: 'AND',
      rules: [
        { id: 'pr_1', field: 'last_interacted_at', operator: 'is_within_the_last', value: '30' }
      ]
    })
  },
  {
    id: 'new_leads_7d',
    title: 'New Leads (Last 7 Days)',
    description: 'Freshly acquired leads added to your CRM over the past 7 days.',
    icon: SparklesIcon,
    badge: 'Fresh',
    badgeColor: 'bg-blue-100 text-blue-800',
    iconBg: 'bg-blue-50 text-blue-600',
    buildRules: () => ({
      matchType: 'AND',
      rules: [
        { id: 'pr_1', field: 'created_at', operator: 'is_within_the_last', value: '7' }
      ]
    })
  },
  {
    id: 'high_intent_won',
    title: 'Customers & Hot Deals',
    description: 'Contacts currently in Qualified, Proposal, Negotiation, or Won stages.',
    icon: UserGroupIcon,
    badge: 'High Intent',
    badgeColor: 'bg-purple-100 text-purple-800',
    iconBg: 'bg-purple-50 text-purple-600',
    buildRules: () => ({
      matchType: 'OR',
      rules: [
        { id: 'pr_1', field: 'type', operator: 'equals', value: 'WON' },
        { id: 'pr_2', field: 'type', operator: 'equals', value: 'QUALIFIED' },
        { id: 'pr_3', field: 'type', operator: 'equals', value: 'NEGOTIATION' },
        { id: 'pr_4', field: 'type', operator: 'equals', value: 'PROPOSAL' }
      ]
    })
  },
  {
    id: 'dormant_60d',
    title: 'Win-Back / Dormant (60+ Days)',
    description: 'Inactive contacts who have not engaged in over 60 days to re-ignite interest.',
    icon: ClockIcon,
    badge: 'Re-engage',
    badgeColor: 'bg-slate-100 text-slate-800',
    iconBg: 'bg-slate-50 text-slate-600',
    buildRules: () => {
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        matchType: 'AND',
        rules: [
          { id: 'pr_1', field: 'last_interacted_at', operator: 'is_before', value: cutoff }
        ]
      };
    }
  },
  {
    id: 'all_contacts',
    title: 'Entire CRM Contact Base',
    description: 'Broadcast to all contacts in your database regardless of tags or activity.',
    icon: UserGroupIcon,
    badge: 'Full Blast',
    badgeColor: 'bg-gray-100 text-gray-700',
    iconBg: 'bg-gray-50 text-gray-600',
    buildRules: () => ({
      matchType: 'AND',
      rules: [
        { id: 'pr_1', field: 'phone_number', operator: 'is_not_empty', value: '' }
      ]
    })
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
    <div className={`space-y-4 ${!isRoot ? 'p-4 border border-slate-200 rounded-xl bg-slate-50/50 ml-4 md:ml-6 relative' : ''}`}>
      {!isRoot && (
        <div className="absolute -left-4 md:-left-6 top-1/2 w-4 md:w-6 border-t-2 border-slate-300"></div>
      )}

      {/* Group Logic Header */}
      <div className="flex items-center justify-between bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Match</span>
          <select
            className="border border-slate-300 px-2 py-1 rounded text-xs bg-white font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={group.matchType}
            onChange={(e) => onChange({ ...group, matchType: e.target.value })}
          >
            <option value="AND">ALL (AND)</option>
            <option value="OR">ANY (OR)</option>
          </select>
          <span className="text-xs text-slate-600">of the following conditions:</span>
        </div>
        {!isRoot && (
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Rules List */}
      <div className="space-y-2.5">
        {group.rules.map((rule) => {
          if (rule.rules) {
            return <RuleGroup key={rule.id} group={rule} onChange={(newGroup) => updateRule(rule.id, newGroup)} onRemove={() => removeRule(rule.id)} />;
          }

          let fieldType = 'text';
          for (const g of FIELD_GROUPS) {
            const opt = g.options.find(o => o.value === rule.field);
            if (opt) { fieldType = opt.type; break; }
          }
          if (rule.field === 'custom_field') fieldType = 'custom';

          const operators = getOperatorsForType(fieldType);

          if (!operators.find(o => o.value === rule.operator) && rule.operator !== 'is_not_empty') {
            setTimeout(() => updateRule(rule.id, { ...rule, operator: operators[0].value, value: '' }), 0);
          }

          return (
            <div key={rule.id} className="flex flex-col sm:flex-row gap-2 items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs">
              {/* Field Selector */}
              <div className="w-full sm:w-1/3 flex flex-col gap-1.5">
                <select
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                {(rule.field === 'custom_field' || (rule.field.startsWith('custom_') && rule.field !== 'custom_field')) && (
                  <input
                    type="text"
                    placeholder="Attribute key (e.g. ltv)"
                    className="w-full p-1.5 border border-blue-300 rounded text-xs bg-blue-50 focus:outline-none"
                    value={rule.field.startsWith('custom_') ? rule.field.replace('custom_', '') : ''}
                    onChange={(e) => updateRule(rule.id, { ...rule, field: `custom_${e.target.value.replace(/[^a-z0-9_]/g, '')}` })}
                  />
                )}
              </div>

              {/* Operator */}
              <div className="w-full sm:w-1/4">
                <select
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  value={rule.operator}
                  onChange={(e) => updateRule(rule.id, { ...rule, operator: e.target.value, value: '' })}
                >
                  {operators.map((op, i) => (
                    <option key={i} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Value Input */}
              <div className="flex-1 w-full">
                {rule.operator === 'is_not_empty' ? (
                  <div className="p-2 text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Exists & Not Empty
                  </div>
                ) : fieldType === 'boolean' ? (
                  <select
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-medium"
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
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                  />
                ) : fieldType === 'date' && rule.operator === 'is_within_the_last' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="1"
                      placeholder="30"
                      className="w-24 border border-slate-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                    />
                    <span className="text-xs text-slate-600 font-medium">days</span>
                  </div>
                ) : fieldType === 'array' ? (
                  <input
                    type="text"
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas (e.g. VIP, Promo)"
                    value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter matching value..."
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, { ...rule, value: e.target.value })}
                  />
                )}
              </div>

              {/* Delete Button */}
              <button 
                onClick={() => removeRule(rule.id)} 
                className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors self-center"
                title="Remove condition"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Filter Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button 
          onClick={handleAddRule} 
          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add Condition
        </button>
        <button 
          onClick={handleAddGroup} 
          className="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add Nested Group
        </button>
      </div>
    </div>
  );
};

// --- Main Audience Builder Component ---
const AudienceBuilder = ({ onSave, onCancel }) => {
  const { user, userData } = useAuth();
  const dbId = userData?.db_id || user?.db_id || user?.uid;

  // ─── Mode State: 'presets' | 'tags' | 'rules' ───
  const [builderMode, setBuilderMode] = useState('presets');
  const [activePresetId, setActivePresetId] = useState('all_opted_in');

  // Tag & Stage Mode State
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [tagMatchType, setTagMatchType] = useState('ANY'); // 'ANY' | 'ALL'
  const [availableTags, setAvailableTags] = useState(['VIP', 'Customer', 'Hot Lead', 'Website', 'Shopify', 'New Signup']);
  const [tagSearch, setTagSearch] = useState('');

  // Compliance Guard: WhatsApp Marketing Opt-In enforcement
  const [enforceOptIn, setEnforceOptIn] = useState(true);

  // Audience Name
  const [segmentName, setSegmentName] = useState('All Active & Opted-In');

  // Saved Audiences State (for templating)
  const [savedAudiences, setSavedAudiences] = useState([]);

  // Custom Rules Engine State
  const [customRuleGroup, setCustomRuleGroup] = useState({
    id: 'root',
    matchType: 'AND',
    rules: [
      { id: 'initial_1', field: 'type', operator: 'equals', value: 'WON' }
    ]
  });

  // Manual Overrides State
  const [alwaysIncludeStr, setAlwaysIncludeStr] = useState('');
  const [alwaysExcludeStr, setAlwaysExcludeStr] = useState('');

  // Preview & Cost Estimator State
  const [previewData, setPreviewData] = useState({ count: 0, sample: [] });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  const [sampleSearch, setSampleSearch] = useState('');

  // Parse Overrides
  const parseOverrides = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

  // Fetch unique tags & sample data on mount
  useEffect(() => {
    const fetchExistingTags = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const DB_BASE_URL = process.env.REACT_APP_DB_SERVER_URL || 'http://localhost:3000';
        const url = `${DB_BASE_URL}/api/contacts/user/${dbId}?limit=100`;
        const res = await fetch(url, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const tagsSet = new Set(['VIP', 'Customer', 'Hot Lead', 'Website', 'Shopify']);
          data.data.forEach(c => {
            if (Array.isArray(c.tags)) c.tags.forEach(t => tagsSet.add(t));
          });
          setAvailableTags(Array.from(tagsSet));
        }
      } catch (err) {
        // Fallback default tags
      }
    };
    if (dbId) fetchExistingTags();
  }, [dbId]);

  // Fetch saved audiences on mount
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
        console.error('Failed to load saved audiences', err);
      }
    };
    if (dbId) fetchAudiences();
  }, [dbId]);

  // Compute the Effective Rule Group based on current mode and compliance toggle
  const effectiveRuleGroup = useMemo(() => {
    let baseGroup = { matchType: 'AND', rules: [] };

    if (builderMode === 'presets') {
      const preset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];
      baseGroup = preset.buildRules();
    } else if (builderMode === 'tags') {
      const rules = [];

      // Lead Stage matching
      if (selectedStages.length === 1) {
        rules.push({ id: 'st_1', field: 'type', operator: 'equals', value: selectedStages[0] });
      } else if (selectedStages.length > 1) {
        rules.push({
          id: 'st_grp',
          matchType: 'OR',
          rules: selectedStages.map((st, i) => ({ id: `st_${i}`, field: 'type', operator: 'equals', value: st }))
        });
      }

      // Tags Inclusion
      if (selectedTags.length > 0) {
        rules.push({
          id: 'tg_inc',
          field: 'tags',
          operator: tagMatchType === 'ANY' ? 'includes_any_of' : 'includes_all_of',
          value: selectedTags
        });
      }

      // Tags Exclusion
      if (excludedTags.length > 0) {
        rules.push({
          id: 'tg_exc',
          field: 'tags',
          operator: 'does_not_include',
          value: excludedTags
        });
      }

      // If no criteria selected in tags mode, match all active
      if (rules.length === 0) {
        rules.push({ id: 'fallback', field: 'phone_number', operator: 'is_not_empty', value: '' });
      }

      baseGroup = { matchType: 'AND', rules };
    } else {
      // 'rules' mode
      baseGroup = customRuleGroup;
    }

    // Apply Compliance WhatsApp Opt-In Guard if active
    if (enforceOptIn) {
      const optInRule = { id: 'compliance_optin', field: 'whatsapp_mkt_opt_in', operator: 'equals', value: 'true' };
      // Check if already in rules
      const hasOptIn = JSON.stringify(baseGroup).includes('"whatsapp_mkt_opt_in"');
      if (!hasOptIn) {
        return {
          matchType: 'AND',
          rules: [optInRule, baseGroup]
        };
      }
    }

    return baseGroup;
  }, [builderMode, activePresetId, selectedStages, selectedTags, excludedTags, tagMatchType, customRuleGroup, enforceOptIn]);

  // Debounced Live Preview Fetcher
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
      fetchPreview(effectiveRuleGroup, alwaysIncludeStr, alwaysExcludeStr);
    }, 400);
    return () => clearTimeout(timer);
  }, [effectiveRuleGroup, alwaysIncludeStr, alwaysExcludeStr, fetchPreview]);

  // Save Segment Handler
  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      alert("Please provide a name for this audience segment.");
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
          ruleGroup: effectiveRuleGroup,
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

  // Load Saved Audience Template
  const handleLoadTemplate = (audienceId) => {
    if (!audienceId) return;
    const selected = savedAudiences.find(a => a.id === audienceId);
    if (selected) {
      setSegmentName(`${selected.name} (Copy)`);
      try {
        const parsed = typeof selected.rules_json === 'string'
          ? JSON.parse(selected.rules_json)
          : selected.rules_json;

        if (parsed.ruleGroup) {
          setCustomRuleGroup(parsed.ruleGroup);
          setBuilderMode('rules');
        }
        if (parsed.always_include) setAlwaysIncludeStr(parsed.always_include.join(', '));
        if (parsed.always_exclude) setAlwaysExcludeStr(parsed.always_exclude.join(', '));
      } catch (err) {
        console.error("Error parsing rules JSON from template", err);
      }
    }
  };

  // Toggle stage selection in Tags Mode
  const toggleStage = (stageId) => {
    setSelectedStages(prev => 
      prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
    );
  };

  // Toggle tag inclusion/exclusion
  const toggleTagInclusion = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
      setExcludedTags(prev => prev.filter(t => t !== tag));
    }
  };

  const toggleTagExclusion = (tag) => {
    if (excludedTags.includes(tag)) {
      setExcludedTags(prev => prev.filter(t => t !== tag));
    } else {
      setExcludedTags(prev => [...prev, tag]);
      setSelectedTags(prev => prev.filter(t => t !== tag));
    }
  };

  // Cost estimates: ~₹0.78 / $0.01 per conversation for WhatsApp Marketing in India/Global
  const estimatedCostINR = (previewData.count * 0.78).toFixed(2);
  const estimatedCostUSD = (previewData.count * 0.01).toFixed(2);

  // Filter sample contacts based on mini search
  const filteredSample = useMemo(() => {
    if (!sampleSearch.trim()) return previewData.sample;
    const q = sampleSearch.toLowerCase();
    return previewData.sample.filter(c => 
      `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q) ||
      (c.phone_number && c.phone_number.includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  }, [previewData.sample, sampleSearch]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full animate-fade-in text-slate-900 items-start">
      {/* ─── Main Builder Area ─── */}
      <div className="flex-1 min-w-0 w-full space-y-6">

        {/* 1. Audience Header Card */}
        <div className="bg-white rounded-2xl shadow-xs p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
                Audience Segment Builder
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target the right contacts for maximum engagement and compliance.
              </p>
            </div>

            {savedAudiences.length > 0 && (
              <div className="w-full md:w-64">
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-500 font-medium"
                  onChange={(e) => handleLoadTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>📂 Load Saved Segment...</option>
                  {savedAudiences.map(aud => (
                    <option key={aud.id} value={aud.id}>
                      {aud.name} ({aud.contact_count?.toLocaleString() || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Segment Name Input */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              placeholder="e.g. VIP Customers - Summer Launch"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-semibold text-slate-800 bg-slate-50/50"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
            />
          </div>

          {/* WhatsApp Marketing Opt-in Guard */}
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  WhatsApp Consent Protection
                </span>
                <span className="text-[11px] text-emerald-700">
                  Automatically excludes unsubscribed contacts to protect your WABA quality rating.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={enforceOptIn}
                onChange={(e) => setEnforceOptIn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* 2. Builder Mode Switcher */}
        <div className="bg-white rounded-2xl shadow-xs p-6 border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Choose Audience Source
            </h3>
            
            {/* Mode Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setBuilderMode('presets');
                  setSegmentName('All Active & Opted-In');
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  builderMode === 'presets'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SparklesIcon className="w-4 h-4" />
                Quick Presets
              </button>
              <button
                type="button"
                onClick={() => {
                  setBuilderMode('tags');
                  setSegmentName('Segment by Tags');
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  builderMode === 'tags'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TagIcon className="w-4 h-4" />
                Tags & Lead Stages
              </button>
              <button
                type="button"
                onClick={() => {
                  setBuilderMode('rules');
                  setSegmentName('Custom Rule Filter');
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  builderMode === 'rules'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Custom Rules
              </button>
            </div>
          </div>

          {/* ─── MODE A: PRESETS ─── */}
          {builderMode === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setActivePresetId(preset.id);
                      setSegmentName(preset.title);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${preset.iconBg}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{preset.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-blue-600 font-medium">1-Click Segment</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── MODE B: TAGS & LEAD STAGES ─── */}
          {builderMode === 'tags' && (
            <div className="space-y-6">
              {/* Lead Stages */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Filter by Lead Stages
                </label>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STAGES.map(stage => {
                    const isSelected = selectedStages.includes(stage.id);
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => toggleStage(stage.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {stage.label}
                        {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                  {selectedStages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStages([])}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear Stages
                    </button>
                  )}
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Select Tags to Target
                  </label>
                  
                  {/* Match logic */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Match:</span>
                    <button
                      type="button"
                      onClick={() => setTagMatchType('ANY')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        tagMatchType === 'ANY' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      ANY Tag (OR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTagMatchType('ALL')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        tagMatchType === 'ALL' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      ALL Tags (AND)
                    </button>
                  </div>
                </div>

                {/* Tag Search */}
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search available tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Tags Badges */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {availableTags
                    .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map(tag => {
                      const isIncluded = selectedTags.includes(tag);
                      const isExcluded = excludedTags.includes(tag);

                      return (
                        <div
                          key={tag}
                          className={`inline-flex items-center rounded-xl border text-xs font-semibold overflow-hidden transition-all ${
                            isIncluded
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : isExcluded
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTagInclusion(tag)}
                            className="px-3 py-1.5 flex items-center gap-1.5 hover:bg-emerald-100/50"
                            title="Click to Include Tag"
                          >
                            <TagIcon className="w-3.5 h-3.5 opacity-60" />
                            <span>{tag}</span>
                            {isIncluded && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => toggleTagExclusion(tag)}
                            className={`px-1.5 py-1.5 border-l text-[10px] font-bold ${
                              isExcluded
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                            }`}
                            title="Exclude this tag from audience"
                          >
                            {isExcluded ? 'EXCLUDED' : '✕'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ─── MODE C: CUSTOM RULES ─── */}
          {builderMode === 'rules' && (
            <div>
              <RuleGroup group={customRuleGroup} onChange={setCustomRuleGroup} isRoot={true} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Sticky Insights & Summary Sidebar ─── */}
      <div className="w-full xl:w-[320px] 2xl:w-[360px] flex-shrink-0">
        <div className="sticky top-6 bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          
          {/* Target Reach Banner */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-center text-white relative">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Total Audience Reach</p>
            
            <div className="text-5xl font-extrabold my-2 flex justify-center items-center h-14 tracking-tight">
              {isCalculating ? (
                <div className="flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              ) : (
                previewData.count.toLocaleString()
              )}
            </div>

            <p className="text-xs font-medium text-blue-100">Eligible WhatsApp Contacts</p>

            {/* Recalculate indicator */}
            {isCalculating && (
              <span className="absolute top-3 right-3 text-xs text-blue-200 flex items-center gap-1">
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              </span>
            )}
          </div>

          {/* Cost & Delivery Estimation */}
          <div className="p-4 bg-blue-50/70 border-b border-blue-100/80 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-900 font-semibold flex items-center gap-1">
                Estimated Meta Cost:
              </span>
              <div className="flex items-center gap-1 font-bold text-blue-950">
                {currency === 'INR' ? `₹${estimatedCostINR}` : `$${estimatedCostUSD}`}
                <button
                  type="button"
                  onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
                  className="ml-1 text-[10px] text-blue-600 underline font-semibold cursor-pointer"
                >
                  ({currency === 'INR' ? 'switch to USD' : 'switch to INR'})
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Consent Enforced:</span>
              <span className={`font-semibold ${enforceOptIn ? 'text-emerald-600' : 'text-amber-600'}`}>
                {enforceOptIn ? '✅ Active (Opt-In Only)' : '⚠️ All Contacts Included'}
              </span>
            </div>
          </div>

          {/* Live Sample Preview List */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Audience Preview Sample
              </p>
              {previewData.count > 0 && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Showing {previewData.sample.length} of {previewData.count}
                </span>
              )}
            </div>

            {previewData.sample.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredSample.map((contact, i) => {
                  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
                  const initials = fullName.slice(0, 2).toUpperCase();

                  return (
                    <div key={contact.contact_id || i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{contact.phone_number}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md uppercase shrink-0">
                        {contact.type || 'CONTACT'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <UserGroupIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-500">No contacts match the selected criteria.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or presets.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveSegment}
              disabled={isSaving || previewData.count === 0 || !segmentName.trim()}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>Use Audience ({previewData.count})</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AudienceBuilder;