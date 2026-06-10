import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiConfig } from '../../../../config/api'; // Adjust path as needed
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { broadcastTemplates, getTemplatesByTag, getAllTags } from '../../../../data/broadcastTemplates'; // Adjust path
import AudienceBuilder from './AudienceBuilder';
import BroadcastAnalytics from './BroadcastAnalytics';

// Helper to extract all variables from a Meta template object, grouped by component
const extractVariablesFromTemplate = (template) => {
  if (!template) return { header: [], body: [] };
  const templateData = template.object || template;
  const vars = { header: new Set(), body: new Set() };
  const components = templateData.components || [];

  components.forEach(comp => {
    const type = comp.type?.toLowerCase();
    if (comp.text && (type === 'header' || type === 'body')) {
      const matches = comp.text.match(/\{\{[\w_]+\}\}/g);
      if (matches) {
        matches.forEach(m => vars[type].add(m.replace(/[{}]/g, '')));
      }
    }
  });

  return {
    header: Array.from(vars.header),
    body: Array.from(vars.body)
  };
};

const Broadcast = ({ user, userData, loading }) => {
  // ==========================================
  // STATE MANAGEMENT (Moved from Dashboard)
  // ==========================================
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [templateSubView, setTemplateSubView] = useState(null);
  const [selectedTemplateTag, setSelectedTemplateTag] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [userTemplates, setUserTemplates] = useState([]);
  const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(false);

  //Audience builder state
  const [selectedAudienceId, setSelectedAudienceId] = useState(null);
  const [selectedAudienceName, setSelectedAudienceName] = useState('');
  const [showAudienceBuilder, setShowAudienceBuilder] = useState(false);
  const [savedAudiences, setSavedAudiences] = useState([]);
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);

  //Selecting template to send in the broadcast
  const [broadcastSelectedTemplate, setBroadcastSelectedTemplate] = useState(null);
  const [broadcastTemplateVariables, setBroadcastTemplateVariables] = useState([]);
  const [broadcastVariableMapping, setBroadcastVariableMapping] = useState({});

  // Broadcast Submission State
  const [broadcastName, setBroadcastName] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState({ type: '', message: '' });

  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('English(US)');
  const [templateBody, setTemplateBody] = useState('');
  const [templateFooter, setTemplateFooter] = useState('');
  const [templateSampleContent, setTemplateSampleContent] = useState('');
  const [templateButtons, setTemplateButtons] = useState([]);

  // Broadcast title state
  const [broadcastTitleType, setBroadcastTitleType] = useState('none');
  const [broadcastTitleText, setBroadcastTitleText] = useState('');
  const [broadcastTitleImageLink, setBroadcastTitleImageLink] = useState('');
  const [broadcastTitleVideoLink, setBroadcastTitleVideoLink] = useState('');
  const [broadcastTitleDocumentLink, setBroadcastTitleDocumentLink] = useState('');
  const [broadcastTitleImageFile, setBroadcastTitleImageFile] = useState(null);
  const [broadcastTitleVideoFile, setBroadcastTitleVideoFile] = useState(null);
  const [broadcastTitleDocumentFile, setBroadcastTitleDocumentFile] = useState(null);
  const [broadcastTitleImageHandle, setBroadcastTitleImageHandle] = useState('');
  const [broadcastTitleImageMediaId, setBroadcastTitleImageMediaId] = useState('');
  const [broadcastTitleVideoHandle, setBroadcastTitleVideoHandle] = useState('');
  const [broadcastTitleDocumentHandle, setBroadcastTitleDocumentHandle] = useState('');

  // Location state
  const [broadcastTitleLocationLatitude, setBroadcastTitleLocationLatitude] = useState('');
  const [broadcastTitleLocationLongitude, setBroadcastTitleLocationLongitude] = useState('');
  const [broadcastTitleLocationName, setBroadcastTitleLocationName] = useState('');
  const [broadcastTitleLocationAddress, setBroadcastTitleLocationAddress] = useState('');
  const [broadcastTitleError, setBroadcastTitleError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showJSONModal, setShowJSONModal] = useState(false);

  // Variables state
  const [broadcastTitleVariables, setBroadcastTitleVariables] = useState([]);
  const [showAddVariable, setShowAddVariable] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const broadcastTitleTextRef = useRef(null);
  const skipNextEffectUpdate = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bodyVariables, setBodyVariables] = useState([]);
  const [showAddBodyVariable, setShowAddBodyVariable] = useState(false);
  const [newBodyVariableName, setNewBodyVariableName] = useState('');
  const [newBodyVariableValue, setNewBodyVariableValue] = useState('');
  const bodyTextRef = useRef(null);
  const skipNextBodyEffectUpdate = useRef(false);
  const [bodyError, setBodyError] = useState('');

  // Button state
  const [newButtonType, setNewButtonType] = useState('');
  const [newButtonText, setNewButtonText] = useState('');
  const [newButtonValue, setNewButtonValue] = useState('');

  // Add this near your other broadcastTitle state variables
  const [headerMediaSource, setHeaderMediaSource] = useState('upload'); // 'upload' or 'link'

  // Scheduling State
  const [scheduledTimezone, setScheduledTimezone] = useState('IST');
  const [scheduledHour, setScheduledHour] = useState('12');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledPeriod, setScheduledPeriod] = useState('AM');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sendTimeMode, setSendTimeMode] = useState('now');


  const lastBodySelection = useRef(null);
  const bodySelection = useRef({ start: 0, end: 0 });
  const headerSelection = useRef({ start: 0, end: 0 });
  // Add this inside the Broadcast component
  const isBuilderDisabled = !templateName.trim() || !templateCategory || !templateLanguage;
  // ==========================================
  // HELPER FUNCTIONS (Moved from Dashboard)
  // ==========================================

  const populateFormFromAPITemplate = useCallback((template) => {
    // Extract template object - it might be in template.object if saved as draft
    const templateData = template.object || template;

    // Basic template info
    setTemplateName(templateData.name || '');

    // Map category from template to dropdown format
    let category = '';
    if (templateData.category) {
      const categoryMap = {
        'AUTHENTICATION': 'Authentication',
        'MARKETING': 'Marketing',
        'UTILITY': 'Utility'
      };
      category = categoryMap[templateData.category] || templateData.category;
    }
    setTemplateCategory(category);

    // Map API language code to display name
    const apiToDisplayLanguage = {
      'en_US': 'English(US)',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi'
    };
    const apiLanguage = templateData.language || 'en_US';
    const displayLanguage = apiToDisplayLanguage[apiLanguage] || 'English(US)';
    setTemplateLanguage(displayLanguage);

    // Parse components array
    const components = templateData.components || [];

    // Reset all fields first
    setBroadcastTitleType('none');
    setBroadcastTitleText('');
    setBroadcastTitleImageLink('');
    setBroadcastTitleVideoLink('');
    setBroadcastTitleDocumentLink('');
    setBroadcastTitleImageFile(null);
    setBroadcastTitleVideoFile(null);
    setBroadcastTitleDocumentFile(null);
    setBroadcastTitleImageHandle(null);
    setBroadcastTitleVideoHandle(null);
    setBroadcastTitleDocumentHandle(null);
    setBroadcastTitleLocationLatitude('');
    setBroadcastTitleLocationLongitude('');
    setBroadcastTitleLocationName('');
    setBroadcastTitleLocationAddress('');
    setBroadcastTitleError('');
    setBroadcastTitleVariables([]);
    setTemplateBody('');
    setBodyVariables([]);
    setTemplateFooter('');
    setTemplateButtons([]);

    // Parse each component
    components.forEach(component => {
      // Header component
      if (component.type === 'header' || component.type === 'HEADER') {
        if (component.format === 'text' || component.format === 'TEXT') {
          setBroadcastTitleType('text');
          let headerText = component.text || '';

          // Extract variables from example if present
          if (component.example && component.example.header_text_named_params) {
            const variables = component.example.header_text_named_params.map(param => {
              // Extract variable name from {{variable_name}} format
              const varName = param.param_name.replace(/[{}]/g, '');
              return {
                name: varName,
                value: param.example || varName
              };
            });
            setBroadcastTitleVariables(variables);

            // Ensure variables are in {{variable_name}} format in the text
            // The text from API should already have them, but we ensure consistency
            if (variables.length > 0) {
              variables.forEach(variable => {
                const varPattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
                if (!headerText.match(varPattern)) {
                  // If variable not found in {{}} format, try to find it without braces
                  const plainVarPattern = new RegExp(variable.name, 'g');
                  if (headerText.match(plainVarPattern)) {
                    headerText = headerText.replace(plainVarPattern, `{{${variable.name}}}`);
                  }
                }
              });
            }
          }

          // Set the text - the useEffect will handle converting {{variable}} to spans
          setBroadcastTitleText(headerText);
        } else if (component.format === 'IMAGE') {
          setBroadcastTitleType('image');
          // Extract handle from header_handle array
          if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
            const handle = component.example.header_handle[0];
            // Handle can be a string or an object with handle property
            if (typeof handle === 'string') {
              setBroadcastTitleImageHandle(handle);
            } else if (handle && handle.handle) {
              setBroadcastTitleImageHandle(handle.handle);
            }
          }
        } else if (component.format === 'VIDEO') {
          setBroadcastTitleType('video');
          if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
            const handle = component.example.header_handle[0];
            if (typeof handle === 'string') {
              setBroadcastTitleVideoHandle(handle);
            } else if (handle && handle.handle) {
              setBroadcastTitleVideoHandle(handle.handle);
            }
          }
        } else if (component.format === 'DOCUMENT') {
          setBroadcastTitleType('document');
          if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
            const handle = component.example.header_handle[0];
            if (typeof handle === 'string') {
              setBroadcastTitleDocumentHandle(handle);
            } else if (handle && handle.handle) {
              setBroadcastTitleDocumentHandle(handle.handle);
            }
          }
        } else if (component.parameters && Array.isArray(component.parameters)) {
          // Check for location parameter
          const locationParam = component.parameters.find(p => p.type === 'location' && p.location);
          if (locationParam && locationParam.location) {
            setBroadcastTitleType('location');
            setBroadcastTitleLocationLatitude(locationParam.location.latitude || '');
            setBroadcastTitleLocationLongitude(locationParam.location.longitude || '');
            setBroadcastTitleLocationName(locationParam.location.name || '');
            setBroadcastTitleLocationAddress(locationParam.location.address || '');
          }
        }
      }

      // Body component
      if (component.type === 'body' || component.type === 'BODY') {
        let bodyText = component.text || '';

        // Extract variables from example if present
        if (component.example && component.example.body_text_named_params) {
          const variables = component.example.body_text_named_params.map(param => {
            const varName = param.param_name.replace(/[{}]/g, '');
            return {
              name: varName,
              value: param.example || varName
            };
          });
          setBodyVariables(variables);
        }

        setTemplateBody(bodyText);
      }

      // Footer component
      if (component.type === 'FOOTER' || component.type === 'footer') {
        setTemplateFooter(component.text || '');
      }

      // Button components
      if (component.type === 'COPY_CODE') {
        setTemplateButtons(prev => [...prev, {
          type: 'copy_code',
          text: 'Copy Code',
          value: component.example || ''
        }]);
      } else if (component.type === 'PHONE_NUMBER') {
        setTemplateButtons(prev => [...prev, {
          type: 'phone',
          text: component.text || '',
          value: component.phone_number || ''
        }]);
      } else if (component.type === 'URL') {
        setTemplateButtons(prev => [...prev, {
          type: 'url',
          text: component.text || '',
          value: component.url || ''
        }]);
      } else if (component.type === 'QUICK_REPLY') {
        setTemplateButtons(prev => [...prev, {
          type: 'quick_reply',
          text: component.text || '',
          value: ''
        }]);
      }
    });

    // Reset other fields
    setTemplateSampleContent('');
    setShowAddVariable(false);
    setNewVariableName('');
    setNewVariableValue('');
    setShowAddBodyVariable(false);
    setNewBodyVariableName('');
    setNewBodyVariableValue('');
  }, []);

  // Function to upload image to API
  const uploadImageToAPI = useCallback(async (file) => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        throw new Error('User ID not found');
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('DB Server URL is not configured');
      }

      const uploadUrl = `${dbServerUrl}/api/users/${dbId}/templates/upload_media`;

      console.log('📤 Uploading image to:', uploadUrl);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Image upload response:', result);

      // Extract uploaded_file_handle and media_id from response
      // Example response:
      // {
      //   success: true,
      //   data: {
      //     media_id: "...",
      //     uploaded_file_handle: "...",
      //     ...
      //   }
      // }
      // or similar variations as noted below.

      let handle = null;

      // Try different paths to find the handle string
      if (result.data?.uploaded_file_handle) {
        handle = result.data.uploaded_file_handle;
      } else if (result.uploaded_file_handle) {
        handle = result.uploaded_file_handle;
      } else if (result.data?.handle?.handle) {
        // Nested structure: { data: { handle: { handle: "..." } } }
        handle = result.data.handle.handle;
      } else if (result.handle?.handle) {
        // Nested structure: { handle: { handle: "..." } }
        handle = result.handle.handle;
      } else if (result.data?.handle && typeof result.data.handle === 'string') {
        handle = result.data.handle;
      } else if (result.handle && typeof result.handle === 'string') {
        handle = result.handle;
      }

      // Ensure handle is a string
      if (handle && typeof handle !== 'string') {
        // If it's still an object, try to extract the string value
        handle = handle.handle || handle.uploaded_file_handle || null;
      }

      const imageUrl = result.data?.s3_url || result.s3_url || result.data?.url || result.url || null;
      const mediaId = result.data?.media_id || result.media_id || null;
      return { handle: handle || '', url: imageUrl || '', mediaId: mediaId || '' };
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }, [user, userData]);

  // Function to fetch user templates
  const fetchUserTemplates = useCallback(async () => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        console.log('⚠️ No db_id found, skipping template fetch');
        return;
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        console.error('❌ DB Server URL is not configured!');
        return;
      }

      setIsLoadingUserTemplates(true);
      const url = `${dbServerUrl}/api/users/${dbId}/templates`;

      console.log('📤 Fetching user templates:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fetch failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ User templates fetched:', result);

      // Extract templates array from response
      const templates = result.data || result.templates || result || [];
      setUserTemplates(Array.isArray(templates) ? templates : []);
    } catch (error) {
      console.error('❌ Error fetching user templates:', error);
      setUserTemplates([]);
    } finally {
      setIsLoadingUserTemplates(false);
    }
  }, [user, userData]);

  // Function to fetch saved audience segments
  const fetchSavedAudiences = useCallback(async () => {
    setIsLoadingAudiences(true);
    setShowAudienceSelector(true); // Open the UI area immediately 

    try {
      const dbId = userData?.db_id || user?.db_id || user?.uid;
      const token = localStorage.getItem('authToken');

      // Fallback if it's not in apiConfig yet
      const apiUrl = apiConfig?.endpoints?.audience?.getUserAudiences?.(dbId)
        || `/api/audience/user/${dbId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setSavedAudiences(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch audiences:', error);
      alert('Failed to load saved segments. Make sure the server is running.');
    } finally {
      setIsLoadingAudiences(false);
    }
  }, [user, userData]);

  // Function to save template as draft
  const saveTemplateAsDraft = useCallback(async (templateJSON, templateId = null) => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        throw new Error('User ID not found');
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('DB Server URL is not configured');
      }

      // If templateId is provided, use PUT to update existing template
      // Otherwise, use POST to create new template
      const isUpdate = templateId !== null && templateId !== undefined;
      const url = isUpdate
        ? `${dbServerUrl}/api/users/${dbId}/templates/${templateId}`
        : `${dbServerUrl}/api/users/${dbId}/templates`;

      console.log(`📤 ${isUpdate ? 'Updating' : 'Saving'} template as draft:`, url);
      console.log('📤 Template JSON:', templateJSON);
      if (isUpdate) {
        console.log('📤 Template ID:', templateId);
      }

      const payload = {
        template_status: 'draft',
        object: templateJSON
      };

      // Attach media_id at the top level (not inside object)
      if (broadcastTitleImageMediaId) {
        payload.media_id = broadcastTitleImageMediaId;
      }

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Template ${isUpdate ? 'updated' : 'saved'} as draft:`, result);

      return result;
    } catch (error) {
      console.error('❌ Error saving template as draft:', error);
      throw error;
    }
  }, [user, userData, broadcastTitleImageMediaId]);

  // Function to generate template JSON object
  const generateTemplateJSON = useCallback(() => {
    const components = [];

    // 1. Header Component
    if (broadcastTitleType === 'text' && broadcastTitleText) {
      const headerComponent = {
        type: "header", // META REQUIRES LOWERCASE FOR NAMED PARAMS
        format: "TEXT",
        text: broadcastTitleText
      };

      // Extract variables safely using Regex
      const variablePattern = /\{\{([\w_]+)\}\}/g;
      const matches = [...broadcastTitleText.matchAll(variablePattern)];

      if (matches.length > 0) {
        headerComponent.example = {
          header_text_named_params: matches.map(match => {
            const varName = match[1];
            const stateVar = broadcastTitleVariables.find(v => v.name === varName);
            return {
              param_name: varName, // No curly braces!
              example: stateVar && stateVar.value ? stateVar.value : `sample_${varName}`
            };
          })
        };
      }
      components.push(headerComponent);
    } else if (broadcastTitleType === 'image' && (broadcastTitleImageHandle || broadcastTitleImageLink || broadcastTitleImageFile)) {
      let handle = broadcastTitleImageHandle || broadcastTitleImageLink;
      if (handle && typeof handle === 'object') {
        handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
      }
      handle = String(handle || '');

      if (handle) {
        components.push({
          type: "header",
          format: "IMAGE",
          example: { header_handle: [handle] }
        });
      }
    } else if (broadcastTitleType === 'video' && (broadcastTitleVideoHandle || broadcastTitleVideoLink || broadcastTitleVideoFile)) {
      let handle = broadcastTitleVideoHandle || broadcastTitleVideoLink;
      if (handle && typeof handle === 'object') {
        handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
      }
      handle = String(handle || '');

      if (handle) {
        components.push({
          type: "header",
          format: "VIDEO",
          example: { header_handle: [handle] }
        });
      }
    } else if (broadcastTitleType === 'document' && (broadcastTitleDocumentHandle || broadcastTitleDocumentLink || broadcastTitleDocumentFile)) {
      let handle = broadcastTitleDocumentHandle || broadcastTitleDocumentLink;
      if (handle && typeof handle === 'object') {
        handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
      }
      handle = String(handle || '');

      if (handle) {
        components.push({
          type: "header",
          format: "DOCUMENT",
          example: { header_handle: [handle] }
        });
      }
    } else if (broadcastTitleType === 'location' && broadcastTitleLocationLatitude && broadcastTitleLocationLongitude) {
      if (templateCategory === 'Utility' || templateCategory === 'Marketing') {
        components.push({
          type: "header",
          parameters: [{
            type: "location",
            location: {
              latitude: broadcastTitleLocationLatitude,
              longitude: broadcastTitleLocationLongitude,
              name: broadcastTitleLocationName || "",
              address: broadcastTitleLocationAddress || ""
            }
          }]
        });
      }
    }

    // 2. Body Component
    if (templateBody) {
      const bodyComponent = {
        type: "body", // META REQUIRES LOWERCASE
        text: templateBody
      };

      // Extract variables safely using Regex
      const variablePattern = /\{\{([\w_]+)\}\}/g;
      const matches = [...templateBody.matchAll(variablePattern)];

      if (matches.length > 0) {
        bodyComponent.example = {
          body_text_named_params: matches.map(match => {
            const varName = match[1];
            const stateVar = bodyVariables.find(v => v.name === varName);
            return {
              param_name: varName, // No curly braces!
              example: stateVar && stateVar.value ? stateVar.value : `sample_${varName}`
            };
          })
        };
      }
      components.push(bodyComponent);
    }

    // 3. Footer Component
    if (templateFooter) {
      components.push({
        type: "footer", // LOWERCASE
        text: templateFooter
      });
    }

    // 4. Buttons Component
    if (Array.isArray(templateButtons) && templateButtons.length > 0) {
      const buttonsArray = [];

      templateButtons.forEach(button => {
        if (button.type === 'copy_code') {
          buttonsArray.push({
            type: "COPY_CODE",
            example: button.value || button.text
          });
        } else if (button.type === 'phone') {
          buttonsArray.push({
            type: "PHONE_NUMBER",
            text: button.text,
            phone_number: button.value
          });
        } else if (button.type === 'url' || button.type === 'otp') {
          const urlButton = {
            type: "URL",
            text: button.text,
            url: button.value || ""
          };
          if (button.value && button.value.includes('{{')) {
            let exampleUrl = button.value.replace(/\{\{[\w_]+\}\}/g, 'example');
            urlButton.example = [exampleUrl];
          }
          buttonsArray.push(urlButton);
        } else if (button.type === 'quick_reply') {
          buttonsArray.push({
            type: "QUICK_REPLY",
            text: button.text
          });
        }
      });

      if (buttonsArray.length > 0) {
        components.push({
          type: "buttons", // LOWERCASE
          buttons: buttonsArray
        });
      }
    }

    // Build the final template object with strict lowercase formatting
    const categoryMap = {
      'Authentication': 'authentication',
      'Marketing': 'marketing',
      'Utility': 'utility'
    };

    const languageMap = {
      'English(US)': 'en_US',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Hindi': 'hi',
      'Other': 'en_US'
    };

    const templateObject = {
      name: templateName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      category: categoryMap[templateCategory] || templateCategory.toLowerCase(),
      language: languageMap[templateLanguage] || 'en_US',
      parameter_format: "named", // Fully supported with lowercase schema!
      components: components
    };

    return templateObject;
  }, [
    templateName,
    templateCategory,
    templateLanguage,
    broadcastTitleType,
    broadcastTitleText,
    broadcastTitleImageLink,
    broadcastTitleImageHandle,
    broadcastTitleVideoLink,
    broadcastTitleVideoHandle,
    broadcastTitleDocumentLink,
    broadcastTitleDocumentHandle,
    broadcastTitleLocationLatitude,
    broadcastTitleLocationLongitude,
    broadcastTitleLocationName,
    broadcastTitleLocationAddress,
    broadcastTitleVariables,
    templateBody,
    bodyVariables,
    templateFooter,
    templateButtons
  ]);

  // ==========================================
  // USE EFFECTS (Moved from Dashboard)
  // ==========================================

  // Populate form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      // Check if this is an API template (has object.components or components array)
      const templateData = selectedTemplate.object || selectedTemplate;
      const hasComponents = templateData.components && Array.isArray(templateData.components);

      if (hasComponents) {
        // This is an API template format - use the parser function
        populateFormFromAPITemplate(selectedTemplate);
      } else {
        // This is a template library format - use the old logic
        setTemplateName(selectedTemplate.name || '');

        // Map category from template to dropdown format
        let category = '';
        if (selectedTemplate.category) {
          const categoryMap = {
            'AUTHENTICATION': 'Authentication',
            'MARKETING': 'Marketing',
            'UTILITY': 'Utility'
          };
          category = categoryMap[selectedTemplate.category] || selectedTemplate.category;
        }
        setTemplateCategory(category);

        // Map API language code to display name
        const apiToDisplayLanguage = {
          'en_US': 'English(US)',
          'es': 'Spanish',
          'fr': 'French',
          'de': 'German',
          'hi': 'Hindi'
        };
        const apiLanguage = selectedTemplate.language || 'en_US';
        const displayLanguage = apiToDisplayLanguage[apiLanguage] || 'English(US)';
        setTemplateLanguage(displayLanguage);
        setTemplateBody(selectedTemplate.content || '');
        setTemplateFooter(selectedTemplate.footer || '');
        setTemplateSampleContent('');
        setTemplateButtons([]);
        // Reset broadcast title when selecting a new template
        setBroadcastTitleType('none');
        setBroadcastTitleText('');
        setBroadcastTitleImageLink('');
        setBroadcastTitleVideoLink('');
        setBroadcastTitleDocumentLink('');
        setBroadcastTitleImageFile(null);
        setBroadcastTitleVideoFile(null);
        setBroadcastTitleDocumentFile(null);
        setBroadcastTitleLocationLatitude('');
        setBroadcastTitleLocationLongitude('');
        setBroadcastTitleLocationName('');
        setBroadcastTitleLocationAddress('');
        setBroadcastTitleError('');
        setBroadcastTitleVariables([]);
        setShowAddVariable(false);
        setNewVariableName('');
        setNewVariableValue('');
        // Reset body variables when selecting a new template
        setBodyVariables([]);
        setShowAddBodyVariable(false);
        setNewBodyVariableName('');
        setNewBodyVariableValue('');
      }
    }
  }, [selectedTemplate, populateFormFromAPITemplate]);

  // Fetch templates when "Your Templates" OR "New Broadcast" tab is viewed
  useEffect(() => {
    if ((templateSubView === 'your-templates' || broadcastView === 'new-broadcast') && user && userData && !loading) {
      fetchUserTemplates();
    }
  }, [templateSubView, broadcastView, user, userData, loading, fetchUserTemplates]);

  // 1. Auto-sync Active Variables List for HEADER
  useEffect(() => {
    setBroadcastTitleVariables((prev) => {
      const matches = broadcastTitleText.match(/\{\{[\w_]+\}\}/g) || [];

      // Get unique variable names, and enforce Meta's strict 1-variable limit for headers
      const activeNamesInText = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].slice(0, 1);

      let hasChanges = false;

      // Keep existing variables (to preserve sample values) and remove deleted ones
      const nextVars = prev.filter(v => {
        if (!activeNamesInText.includes(v.name)) {
          hasChanges = true;
          return false;
        }
        return true;
      });

      // Add brand new variables that were pasted or typed manually
      activeNamesInText.forEach(name => {
        if (!nextVars.some(v => v.name === name)) {
          nextVars.push({ name: name, value: '' }); // Add with empty sample
          hasChanges = true;
        }
      });

      if (hasChanges) return nextVars;
      return prev;
    });
  }, [broadcastTitleText]);

  // Auto-extract variables when a template is selected for a broadcast
  useEffect(() => {
    if (broadcastSelectedTemplate) {
      const extractedVars = extractVariablesFromTemplate(broadcastSelectedTemplate);
      setBroadcastTemplateVariables(extractedVars);

      // Initialize default mappings grouped by component type
      const initialMapping = { header: {}, body: {} };

      ['header', 'body'].forEach(compType => {
        extractedVars[compType].forEach(vName => {
          let defaultField = 'first_name';
          if (vName.includes('company')) defaultField = 'custom_attributes.company';

          // Match the exact schema expected by the backend worker and validator
          initialMapping[compType][vName] = {
            type: 'dynamic',
            field: defaultField,
            fallback: ''
          };
        });
      });

      setBroadcastVariableMapping(initialMapping);
    } else {
      setBroadcastTemplateVariables({ header: [], body: [] });
      setBroadcastVariableMapping({ header: {}, body: {} });
    }
  }, [broadcastSelectedTemplate]);

  // 2. Helper function to render the blue background text for HEADER
  const renderHeaderHighlightedText = () => {
    if (!broadcastTitleText) {
      return <span className="text-gray-400">Enter broadcast title text</span>;
    }

    const parts = broadcastTitleText.split(/(\{\{[\w_]+\}\})/g);
    return parts.map((part, i) => {
      if (part.match(/^\{\{[\w_]+\}\}$/)) {
        return (
          <span key={i} className="text-blue-700 bg-blue-100 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // 1. Auto-sync Active Variables List for BODY
  useEffect(() => {
    setBodyVariables((prev) => {
      const matches = templateBody.match(/\{\{[\w_]+\}\}/g) || [];

      // Get unique variable names (Set prevents duplicates if they paste {{discount}} twice)
      const activeNamesInText = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];

      let hasChanges = false;

      // Keep existing variables (to preserve sample values) and remove deleted ones
      const nextVars = prev.filter(v => {
        if (!activeNamesInText.includes(v.name)) {
          hasChanges = true;
          return false;
        }
        return true;
      });

      // Add brand new variables that were pasted or typed manually
      activeNamesInText.forEach(name => {
        if (!nextVars.some(v => v.name === name)) {
          nextVars.push({ name: name, value: '' }); // Add with empty sample
          hasChanges = true;
        }
      });

      if (hasChanges) return nextVars;
      return prev;
    });
  }, [templateBody]);


  // 2. Helper function to render the blue background text
  // 2. Helper function to render the blue background text
  const renderHighlightedText = () => {
    if (!templateBody) {
      return <span className="text-gray-400">Type your message here...</span>;
    }

    const parts = templateBody.split(/(\{\{[\w_]+\}\})/g);
    return parts.map((part, i) => {
      if (part.match(/^\{\{[\w_]+\}\}$/)) {
        // FIX: Removed 'px-1' and 'font-mono' to keep character widths identical
        return (
          <span key={i} className="text-blue-700 bg-blue-100 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Helper Functions

  // Function to initiate the broadcast
  const handleSendBroadcast = async () => {
    // Basic validation
    if (!broadcastName.trim() || !broadcastSelectedTemplate || !selectedAudienceId) {
      setBroadcastStatus({
        type: 'error',
        message: 'Please provide a broadcast name, select a template, and choose an audience.'
      });
      return;
    }

    // --- LAYER 1 FRONTEND VALIDATION ---
    let isMappingValid = true;
    let mappingErrorMsg = '';

    ['header', 'body'].forEach(compType => {
      if (!broadcastTemplateVariables[compType]) return;

      broadcastTemplateVariables[compType].forEach(varName => {
        const config = broadcastVariableMapping[compType]?.[varName];
        if (!config) {
          isMappingValid = false; mappingErrorMsg = `Mapping configuration missing for {{${varName}}}.`; return;
        }
        if (config.type === 'dynamic' && !config.field) {
          isMappingValid = false; mappingErrorMsg = `Please select a contact field for dynamic variable {{${varName}}}.`; return;
        }
        if (config.type === 'static' && (!config.text || config.text.trim() === '')) {
          isMappingValid = false; mappingErrorMsg = `Please enter text for static variable {{${varName}}}.`; return;
        }
      });
    });

    if (!isMappingValid) {
      setBroadcastStatus({ type: 'error', message: mappingErrorMsg });
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastStatus({ type: '', message: '' });

    try {
      const dbId = userData?.db_id || user?.db_id;
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;

      const templateId = broadcastSelectedTemplate.template_id || broadcastSelectedTemplate.id || broadcastSelectedTemplate._id;

      const response = await fetch(`${dbServerUrl}/api/broadcasts/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId: dbId,
          name: broadcastName,
          templateId: templateId,
          audienceListId: selectedAudienceId,
          variableMapping: broadcastVariableMapping // <-- Pass mapping to backend
        })
      });

      const data = await response.json();
      // ... (Rest of the try/catch logic remains exactly the same)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate broadcast');
      }

      setBroadcastStatus({
        type: 'success',
        message: `Success! ${data.queuedCount} messages have been queued for delivery.`
      });

      // Reset the form
      setBroadcastName('');
      setBroadcastSelectedTemplate(null);
      setSelectedAudienceId(null);

      // Optional: Redirect to history or analytics after 2 seconds
      setTimeout(() => {
        setBroadcastView('analytics');
        setBroadcastStatus({ type: '', message: '' });
      }, 2000);

    } catch (error) {
      console.error('Broadcast Error:', error);
      setBroadcastStatus({ type: 'error', message: error.message });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================

  const handleFinalSubmit = async (isDraft = false) => {
    try {
      setIsSubmitting(true);

      // 1. Validation
      if (!templateName || !templateCategory || !templateBody) {
        alert('Please fill in Template Name, Category, and Body.');
        setIsSubmitting(false);
        return;
      }

      // 2. Upload Media if a file exists and hasn't been uploaded yet
      let activeMediaId = broadcastTitleImageMediaId;
      const fileToUpload = broadcastTitleImageFile || broadcastTitleVideoFile || broadcastTitleDocumentFile;

      if (fileToUpload && !activeMediaId) {
        console.log("🚀 Starting media upload before submission...");
        const uploadResult = await uploadImageToAPI(fileToUpload);
        activeMediaId = uploadResult.mediaId;
        setBroadcastTitleImageMediaId(activeMediaId);
      }

      // 3. Generate JSON
      const templateJSON = generateTemplateJSON();
      const dbId = userData?.db_id || user?.db_id;
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      const templateId = selectedTemplate?.template_id || null;

      // 4. Determine Endpoint
      let url;
      let method = 'POST';

      if (isDraft) {
        url = templateId
          ? `${dbServerUrl}/api/users/${dbId}/templates/${templateId}`
          : `${dbServerUrl}/api/users/${dbId}/templates`;
        method = templateId ? 'PUT' : 'POST';
      } else {
        url = templateId
          ? `${dbServerUrl}/api/users/${dbId}/templates/${templateId}/submit`
          : `${dbServerUrl}/api/users/${dbId}/templates/submit`;
      }

      // 5. Execute Request
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          template_status: isDraft ? 'draft' : 'pending',
          object: templateJSON,
          media_id: activeMediaId || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to process template request');

      alert(isDraft ? 'Draft saved!' : 'Template submitted for approval!');

      // Reset View
      if (!isDraft) {
        setSelectedTemplate(null);
        setBroadcastView('templates');
        setTemplateSubView('your-templates');
        fetchUserTemplates();
      }

    } catch (error) {
      console.error('❌ Submission Error:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="w-full h-full flex flex-col min-h-0 relative">
    <div className="rounded-lg shadow-sm border border-gray-200 flex flex-col bg-white flex-1 min-h-0">
        {/* Top Navigation Tabs */}
          {/* FIX 1: Added 'relative z-20' so the navigation bar stacks ABOVE the content area */}
          <div className="border-b border-gray-200 flex-shrink-0 w-full relative z-20">
            <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
            
            {/* FIX 2: Dynamically toggle overflow so it never clips the dropdown menu */}
            <div className={`flex items-center gap-2 px-4 sm:px-6 py-3 hide-scroll w-full ${showTemplatesDropdown ? 'overflow-visible' : 'overflow-x-auto md:overflow-visible'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              
              <button 
                onClick={() => setBroadcastView('new-broadcast')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  broadcastView === 'new-broadcast' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                New Broadcast
              </button>
              
              {/* Templates button with dropdown */}
              <div 
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowTemplatesDropdown(true)}
                onMouseLeave={() => setShowTemplatesDropdown(false)}
              >
                <button 
                  onClick={() => {
                    setBroadcastView('templates');
                    setTemplateSubView('template-library'); // Default to template library
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap w-full ${
                    broadcastView === 'templates' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  Templates
                </button>
                {/* Dropdown menu */}
                {showTemplatesDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[180px]">
                    <button
                      onClick={() => {
                        // Check if a template is currently open
                        if (selectedTemplate) {
                          const confirmAbandon = window.confirm('Are you sure you want to abandon the current template? Any unsaved changes will be lost.');
                          if (!confirmAbandon) {
                            return; // User cancelled, don't navigate
                          }
                          // Clear the selected template to close the form
                          setSelectedTemplate(null);
                        }
                        setBroadcastView('templates');
                        setTemplateSubView('template-library');
                        setShowTemplatesDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                        broadcastView === 'templates' && templateSubView === 'template-library'
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Template library
                    </button>
                    <button
                      onClick={() => {
                        // Check if a template is currently open
                        if (selectedTemplate) {
                          const confirmAbandon = window.confirm('Are you sure you want to abandon the current template? Any unsaved changes will be lost.');
                          if (!confirmAbandon) {
                            return; // User cancelled, don't navigate
                          }
                          // Clear the selected template to close the form
                          setSelectedTemplate(null);
                        }
                        setBroadcastView('templates');
                        setTemplateSubView('your-templates');
                        setShowTemplatesDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium rounded-b-lg transition-colors ${
                        broadcastView === 'templates' && templateSubView === 'your-templates'
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Your templates
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setBroadcastView('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  broadcastView === 'analytics' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                Analytics
              </button>
              
              <button 
                onClick={() => setBroadcastView('scheduled-broadcasts')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  broadcastView === 'scheduled-broadcasts' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                Scheduled Broadcasts
              </button>
            </div>
          </div>
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {broadcastView === 'templates' && (
            <div className="space-y-6">
              {selectedTemplate ? (
                // Show template form when a template is selected (from either template library or your templates)
                <div className="space-y-6">
                  {/* Back button and header */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateName('');
                        setTemplateCategory('');
                        setTemplateLanguage('English(US)');
                        setTemplateBody('');
                        setTemplateFooter('');
                        setTemplateSampleContent('');
                        setTemplateButtons([]);
                        setBroadcastTitleType('none');
                        setBroadcastTitleText('');
                        setBroadcastTitleImageLink('');
                        setBroadcastTitleVideoLink('');
                        setBroadcastTitleDocumentLink('');
                        setBroadcastTitleImageFile(null);
                        setBroadcastTitleVideoFile(null);
                        setBroadcastTitleDocumentFile(null);
                        setBroadcastTitleLocationLatitude('');
                        setBroadcastTitleLocationLongitude('');
                        setBroadcastTitleLocationName('');
                        setBroadcastTitleLocationAddress('');
                        setBroadcastTitleError('');
                        setBroadcastTitleVariables([]);
                        setShowAddVariable(false);
                        setNewVariableName('');
                        setNewVariableValue('');
                        setBodyVariables([]);
                        setShowAddBodyVariable(false);
                        setNewBodyVariableName('');
                        setNewBodyVariableValue('');
                        setNewButtonType('');
                        setNewButtonText('');
                        setNewButtonValue('');
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      <span>New Templates</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          const templateJSON = generateTemplateJSON();
                          setShowJSONModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        View JSON
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateName('');
                          setTemplateCategory('');
                          setTemplateLanguage('English(US)');
                          setTemplateBody('');
                          setTemplateFooter('');
                          setTemplateSampleContent('');
                          setTemplateButtons([]);
                          setBroadcastTitleType('none');
                          setBroadcastTitleText('');
                          setBroadcastTitleImageLink('');
                          setBroadcastTitleVideoLink('');
                          setBroadcastTitleDocumentLink('');
                          setBroadcastTitleImageFile(null);
                          setBroadcastTitleVideoFile(null);
                          setBroadcastTitleDocumentFile(null);
                          setBroadcastTitleLocationLatitude('');
                          setBroadcastTitleLocationLongitude('');
                          setBroadcastTitleLocationName('');
                          setBroadcastTitleLocationAddress('');
                          setBroadcastTitleError('');
                          setBroadcastTitleVariables([]);
                          setShowAddVariable(false);
                          setNewVariableName('');
                          setNewVariableValue('');
                          setBodyVariables([]);
                          setShowAddBodyVariable(false);
                          setNewBodyVariableName('');
                          setNewBodyVariableValue('');
                          setNewButtonType('');
                          setNewButtonText('');
                          setNewButtonValue('');
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting} // Disable while uploading
                        className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleFinalSubmit(true)} // 'true' tells the function it's a draft
                      >
                        {isSubmitting ? 'Saving...' : 'Save as draft'}
                      </button>

                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        onClick={async () => {
                          try {
                            // Validate required fields
                            if (!templateName || !templateCategory || !templateBody) {
                              alert('Please fill in all required fields (Template Name, Category, and Body)');
                              return;
                            }

                            // Validate location header can only be used with UTILITY or MARKETING
                            if (broadcastTitleType === 'location' &&
                              templateCategory !== 'Utility' &&
                              templateCategory !== 'Marketing') {
                              alert('Location headers can only be used in templates categorized as UTILITY or MARKETING.');
                              return;
                            }

                            // Generate template JSON
                            const templateJSON = generateTemplateJSON();

                            // Get template ID if editing a draft template
                            const templateId = selectedTemplate?.template_id || null;

                            if (templateId) {
                              // Submit existing draft template
                              const dbId = userData?.db_id || user?.db_id;
                              if (!dbId) {
                                throw new Error('User ID not found');
                              }

                              const dbServerUrl = apiConfig.dbServerConfig.baseURL;
                              if (!dbServerUrl) {
                                throw new Error('DB Server URL is not configured');
                              }

                              const submitUrl = `${dbServerUrl}/api/users/${dbId}/templates/${templateId}/submit`;
                              console.log('📤 [Submit Template] Calling API:', submitUrl);

                              const token = localStorage.getItem('authToken');
                              const response = await fetch(submitUrl, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': token ? `Bearer ${token}` : '',
                                },
                                body: JSON.stringify({
                                  object: templateJSON,
                                  media_id: broadcastTitleImageMediaId || undefined // Link the S3 media to this template
                                })
                              });

                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.error || `Failed to submit template: ${response.status} ${response.statusText}`);
                              }

                              const result = await response.json();
                              console.log('✅ [Submit Template] Template submitted successfully:', result);

                              alert('Template submitted successfully!');
                            } else {
                              // New template - submit directly
                              const dbId = userData?.db_id || user?.db_id;
                              if (!dbId) {
                                throw new Error('User ID not found');
                              }

                              const dbServerUrl = apiConfig.dbServerConfig.baseURL;
                              if (!dbServerUrl) {
                                throw new Error('DB Server URL is not configured');
                              }

                              const submitUrl = `${dbServerUrl}/api/users/${dbId}/templates/submit`;
                              console.log('📤 [Submit New Template] Calling API:', submitUrl);

                              const token = localStorage.getItem('authToken');
                              const response = await fetch(submitUrl, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': token ? `Bearer ${token}` : '',
                                },
                                body: JSON.stringify({
                                  object: templateJSON,
                                  media_id: broadcastTitleImageMediaId || undefined // Link the S3 media to this template
                                })
                              });

                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.error || `Failed to submit template: ${response.status} ${response.statusText}`);
                              }

                              const result = await response.json();
                              console.log('✅ [Submit New Template] Template submitted successfully:', result);

                              alert('Template submitted successfully!');
                            }

                            // Reset form after submission
                            setSelectedTemplate(null);
                            setTemplateName('');
                            setTemplateCategory('');
                            setTemplateLanguage('English(US)');
                            setTemplateBody('');
                            setTemplateFooter('');
                            setTemplateSampleContent('');
                            setTemplateButtons([]);
                            setBroadcastTitleType('none');
                            setBroadcastTitleText('');
                            setBroadcastTitleImageLink('');
                            setBroadcastTitleVideoLink('');
                            setBroadcastTitleDocumentLink('');
                            setBroadcastTitleImageFile(null);
                            setBroadcastTitleVideoFile(null);
                            setBroadcastTitleDocumentFile(null);
                            setBroadcastTitleLocationLatitude('');
                            setBroadcastTitleLocationLongitude('');
                            setBroadcastTitleLocationName('');
                            setBroadcastTitleLocationAddress('');
                            setBroadcastTitleError('');
                            setBroadcastTitleVariables([]);
                            setShowAddVariable(false);
                            setNewVariableName('');
                            setNewVariableValue('');
                            setBodyVariables([]);
                            setShowAddBodyVariable(false);
                            setNewBodyVariableName('');
                            setNewBodyVariableValue('');
                            setNewButtonType('');
                            setNewButtonText('');
                            setNewButtonValue('');
                          } catch (error) {
                            console.error('❌ [Submit Template] Error:', error);
                            alert(error.message || 'Failed to submit template. Please try again.');
                          }
                        }}
                      >
                        Save and submit
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                      {/* 1. ALWAYS VISIBLE: Template Name, Category, and Language in a single row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Template Name */}
                        <div className="flex flex-col">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Name
                          </label>
                          <input
                            type="text"
                            value={templateName}
                            onChange={(e) => {
                              let value = e.target.value.toLowerCase();
                              value = value.replace(/\s/g, '_');
                              value = value.replace(/[^a-z0-9_]/g, '');
                              if (value.length <= 512) {
                                setTemplateName(value);
                              }
                            }}
                            maxLength={512}
                            className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                            placeholder="Template Name"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Only lowercase alphanumeric characters and underscores, up to 512 characters
                          </p>
                        </div>

                        {/* Category */}
                        <div className="flex flex-col">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={templateCategory}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              setTemplateCategory(newCategory);
                              if (broadcastTitleType === 'location' && newCategory !== 'Utility' && newCategory !== 'Marketing') {
                                setBroadcastTitleError('Location headers can only be used in templates categorized as UTILITY or MARKETING.');
                                setBroadcastTitleType('none');
                                setBroadcastTitleLocationLatitude('');
                                setBroadcastTitleLocationLongitude('');
                                setBroadcastTitleLocationName('');
                                setBroadcastTitleLocationAddress('');
                              } else if (broadcastTitleType === 'location') {
                                setBroadcastTitleError('');
                              }
                            }}
                            className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                          >
                            <option value="">Select Category</option>
                            <option value="Authentication">Authentication</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Utility">Utility</option>
                          </select>
                        </div>

                        {/* Language */}
                        <div className="flex flex-col">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            value={templateLanguage}
                            onChange={(e) => setTemplateLanguage(e.target.value)}
                            className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                          >
                            <option value="English(US)">English(US)</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* The Builder Section */}
                      <div className={`transition-all duration-300 ${isBuilderDisabled ? 'opacity-40 grayscale pointer-events-none select-none' : 'opacity-100'}`}>

                        {/* Add a helpful overlay message when disabled */}
                        {isBuilderDisabled && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6 text-blue-800 text-sm font-medium animate-pulse">
                            👋 Please enter a Template Name, Category, and Language above to start building your message.
                          </div>
                        )}
                        {(templateCategory === '' || templateCategory !== 'Authentication') && (
                          <>
                            {/* 1. Broadcast Title (Header) */}
                            <div className="mb-6">
                              <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Broadcast title (Optional)
                                </label>
                                <p className="text-xs text-gray-600 mt-1">
                                  Highlight your brand by using images, videos, or documents.
                                </p>
                              </div>

                              {/* Radio Buttons for Header Type */}
                              <div className="flex flex-wrap gap-4 mb-4">
                                {['none', 'text', 'image', 'video', 'document', 'location'].map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="broadcastTitleType"
                                      value={type}
                                      checked={broadcastTitleType === type}
                                      disabled={type === 'location' && templateCategory !== 'Utility' && templateCategory !== 'Marketing' && templateCategory !== ''}
                                      onChange={(e) => {
                                        setBroadcastTitleType(e.target.value);
                                        setBroadcastTitleError('');
                                        if (e.target.value !== 'text') setBroadcastTitleVariables([]);
                                      }}
                                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm capitalize text-gray-700">{type}</span>
                                  </label>
                                ))}
                              </div>

                              {/* Dynamic Header Inputs */}
                              <div className="mt-4">
                                {broadcastTitleType === 'text' && (
                                  <div className="space-y-3">
                                    <div className="relative mb-2 flex flex-col">
                                      {/* Background Layer */}
                                      <div
                                        className="absolute inset-0 w-full h-full px-3 py-2 pr-16 border border-transparent text-sm whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden"
                                      >
                                        {renderHeaderHighlightedText()}
                                      </div>

                                      {/* Foreground Layer */}
                                      <textarea
                                        ref={broadcastTitleTextRef}
                                        value={broadcastTitleText}
                                        onChange={(e) => setBroadcastTitleText(e.target.value)}
                                        onBlur={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                        onKeyUp={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                        onClick={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                        onScroll={(e) => {
                                          e.target.previousSibling.scrollTop = e.target.scrollTop;
                                        }}
                                        onKeyDown={(e) => {
                                          // 1. Prevent Typing beyond 60 chars
                                          const isNavKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key);
                                          const isControlKey = e.ctrlKey || e.metaKey;

                                          const variablePattern = /\{\{[\w_]+\}\}/g;
                                          const variableMatches = broadcastTitleText.match(variablePattern) || [];
                                          const variableLength = variableMatches.join('').length;
                                          const plainTextLength = broadcastTitleText.length - variableLength;

                                          if (plainTextLength >= 60 && !isNavKey && !isControlKey) {
                                            e.preventDefault();
                                          }

                                          // 2. Block Deletion on Backspace for whole variable
                                          if (e.key === 'Backspace') {
                                            const textarea = e.target;
                                            const startPos = textarea.selectionStart;

                                            if (startPos === textarea.selectionEnd) {
                                              const textBeforeCursor = broadcastTitleText.substring(0, startPos);
                                              const match = textBeforeCursor.match(/\{\{[\w_]+\}\}$/);

                                              if (match) {
                                                e.preventDefault();
                                                const varToDelete = match[0];
                                                const newText = broadcastTitleText.substring(0, startPos - varToDelete.length) + broadcastTitleText.substring(startPos);
                                                setBroadcastTitleText(newText);

                                                setTimeout(() => {
                                                  textarea.focus();
                                                  const newPos = startPos - varToDelete.length;
                                                  textarea.setSelectionRange(newPos, newPos);
                                                }, 0);
                                              }
                                            }
                                          }
                                        }}
                                        onPaste={(e) => {
                                          e.preventDefault();
                                          const pastedText = (e.clipboardData || window.clipboardData).getData('text/plain');

                                          const variablePattern = /\{\{[\w_]+\}\}/g;
                                          const variableMatches = broadcastTitleText.match(variablePattern) || [];
                                          const variableLength = variableMatches.join('').length;
                                          const plainTextLength = broadcastTitleText.length - variableLength;

                                          const availableSpace = 60 - plainTextLength;
                                          if (availableSpace <= 0) return;

                                          const textToInsert = pastedText.substring(0, availableSpace);
                                          const textarea = e.target;
                                          const startPos = textarea.selectionStart || broadcastTitleText.length;
                                          const endPos = textarea.selectionEnd || broadcastTitleText.length;

                                          const newText = broadcastTitleText.substring(0, startPos) + textToInsert + broadcastTitleText.substring(endPos);
                                          setBroadcastTitleText(newText);

                                          setTimeout(() => {
                                            textarea.focus();
                                            const newPos = startPos + textToInsert.length;
                                            textarea.setSelectionRange(newPos, newPos);
                                          }, 0);
                                        }}
                                        className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[2.5rem] text-sm z-10 resize-none"
                                        style={{
                                          color: 'transparent',
                                          caretColor: 'black',
                                          backgroundColor: 'transparent'
                                        }}
                                        spellCheck={false}
                                      />

                                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium z-20 pointer-events-none ${(() => {
                                          const varPattern = /\{\{[\w_]+\}\}/g;
                                          const vars = broadcastTitleText.match(varPattern) || [];
                                          return (broadcastTitleText.length - vars.join('').length) >= 60 ? 'text-red-600' : 'text-gray-400';
                                        })()
                                        }`}>
                                        {(() => {
                                          const varPattern = /\{\{[\w_]+\}\}/g;
                                          const vars = broadcastTitleText.match(varPattern) || [];
                                          return broadcastTitleText.length - vars.join('').length;
                                        })()}/60
                                      </span>
                                    </div>

                                    {/* Variable Toggle (Header) */}
                                    {broadcastTitleVariables.length === 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setShowAddVariable(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        + Add variable
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded text-xs mt-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-blue-700 font-bold">{`{{${broadcastTitleVariables[0].name}}}`}</span>
                                          <span className="text-gray-400">=</span>
                                          {/* EDITABLE SAMPLE INPUT */}
                                          <input
                                            type="text"
                                            value={broadcastTitleVariables[0].value}
                                            onChange={(e) => {
                                              const newVal = e.target.value;
                                              setBroadcastTitleVariables(prev => [{ ...prev[0], value: newVal }]);
                                            }}
                                            className={`px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 ${!broadcastTitleVariables[0].value ? 'border-red-400 bg-red-50 placeholder-red-300' : 'border-gray-300 bg-white'
                                              }`}
                                            placeholder="Required sample..."
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            setBroadcastTitleText(prev => prev.replace(new RegExp(`\\{\\{${broadcastTitleVariables[0].name}\\}\\}`, 'g'), ''));
                                            setBroadcastTitleVariables([]);
                                          }}
                                          className="text-red-500 hover:text-red-700 font-bold"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )}

                                    {/* Header Variable Input Form */}
                                    {showAddVariable && (
                                      <div className="mt-3 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Variable Name</label>
                                            <input
                                              type="text"
                                              value={newVariableName}
                                              onChange={(e) => setNewVariableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="e.g. name"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Sample Value</label>
                                            <input
                                              type="text"
                                              value={newVariableValue}
                                              onChange={(e) => setNewVariableValue(e.target.value)}
                                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="e.g. John"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const varName = newVariableName.trim();
                                              if (!varName) return;

                                              if (broadcastTitleVariables.length >= 1) {
                                                alert("WhatsApp headers can only contain one variable.");
                                                return;
                                              }

                                              const placeholder = `{{${varName}}}`;
                                              const textarea = broadcastTitleTextRef.current;

                                              const startPos = headerSelection.current.start || broadcastTitleText.length;
                                              const endPos = headerSelection.current.end || broadcastTitleText.length;

                                              const newText = broadcastTitleText.substring(0, startPos) + placeholder + broadcastTitleText.substring(endPos);

                                              setBroadcastTitleText(newText);
                                              setBroadcastTitleVariables([{ name: varName, value: newVariableValue.trim() }]);

                                              setShowAddVariable(false);
                                              setNewVariableName('');
                                              setNewVariableValue('');

                                              setTimeout(() => {
                                                textarea.focus();
                                                const newCursorPos = startPos + placeholder.length;
                                                textarea.setSelectionRange(newCursorPos, newCursorPos);
                                                headerSelection.current = { start: newCursorPos, end: newCursorPos };
                                              }, 10);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                          >
                                            Insert Variable
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowAddVariable(false);
                                              setNewVariableName('');
                                              setNewVariableValue('');
                                            }}
                                            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 2. Image/Video/Document Link or Upload */}
                                {['image', 'video', 'document'].includes(broadcastTitleType) && (
                                  <div className="space-y-3 mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">

                                    {/* Toggle switch for Upload vs Link */}
                                    <div className="flex items-center gap-2 mb-3 bg-white p-1 rounded-md border border-gray-300 w-fit shadow-sm">
                                      <button
                                        type="button"
                                        onClick={() => setHeaderMediaSource('upload')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${headerMediaSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                          }`}
                                      >
                                        Upload File
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setHeaderMediaSource('link')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${headerMediaSource === 'link' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                          }`}
                                      >
                                        Paste Link
                                      </button>
                                    </div>

                                    {/* Input area based on toggle */}
                                    {headerMediaSource === 'link' ? (
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder={`Paste ${broadcastTitleType} link here...`}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          value={
                                            broadcastTitleType === 'image' ? broadcastTitleImageLink :
                                              broadcastTitleType === 'video' ? broadcastTitleVideoLink : broadcastTitleDocumentLink
                                          }
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (broadcastTitleType === 'image') setBroadcastTitleImageLink(val);
                                            if (broadcastTitleType === 'video') setBroadcastTitleVideoLink(val);
                                            if (broadcastTitleType === 'document') setBroadcastTitleDocumentLink(val);
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-4">
                                          <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors text-blue-600 shadow-sm">
                                            <span>+ Choose {broadcastTitleType}</span>
                                            <input
                                              type="file"
                                              className="hidden"
                                              accept={broadcastTitleType === 'image' ? 'image/*' : broadcastTitleType === 'video' ? 'video/mp4' : '.pdf'}
                                              onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (broadcastTitleType === 'image') setBroadcastTitleImageFile(file);
                                                if (broadcastTitleType === 'video') setBroadcastTitleVideoFile(file);
                                                if (broadcastTitleType === 'document') setBroadcastTitleDocumentFile(file);
                                              }}
                                            />
                                          </label>
                                          <span className="text-[10px] text-gray-500 italic">
                                            Max size: {broadcastTitleType === 'video' ? '16MB' : '5MB'}
                                          </span>
                                        </div>

                                        {/* Show the selected file name so the user knows it was attached */}
                                        {broadcastTitleType === 'image' && broadcastTitleImageFile && (
                                          <span className="text-xs text-green-600 font-medium ml-1">✓ {broadcastTitleImageFile.name}</span>
                                        )}
                                        {broadcastTitleType === 'video' && broadcastTitleVideoFile && (
                                          <span className="text-xs text-green-600 font-medium ml-1">✓ {broadcastTitleVideoFile.name}</span>
                                        )}
                                        {broadcastTitleType === 'document' && broadcastTitleDocumentFile && (
                                          <span className="text-xs text-green-600 font-medium ml-1">✓ {broadcastTitleDocumentFile.name}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 3. Location Inputs */}
                                {broadcastTitleType === 'location' && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Latitude"
                                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={broadcastTitleLocationLatitude}
                                      onChange={(e) => setBroadcastTitleLocationLatitude(e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Longitude"
                                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={broadcastTitleLocationLongitude}
                                      onChange={(e) => setBroadcastTitleLocationLongitude(e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Location Name"
                                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={broadcastTitleLocationName}
                                      onChange={(e) => setBroadcastTitleLocationName(e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-gray-300 my-6"></div>



                            {/* 2. Body Section JSX */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 font-semibold">Body</label>
                                <span className={`text-xs ${templateBody.length >= 1024 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {(() => {
                                    const variablePattern = /\{\{[\w_]+\}\}/g;
                                    const vars = templateBody.match(variablePattern) || [];
                                    return templateBody.length - vars.join('').length;
                                  })()}/1024
                                </span>
                              </div>

                              {/* THE OVERLAY TRICK */}
                              <div className="relative mb-2 flex flex-col">
                                {/* Background layer (Handles the blue highlights) */}
                                <div
                                  className="absolute inset-0 w-full h-full px-3 py-2 border border-transparent text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden"
                                >
                                  {renderHighlightedText()}
                                </div>

                                {/* Foreground layer (The actual textarea) */}
                                <textarea
                                  ref={bodyTextRef}
                                  value={templateBody}
                                  onChange={(e) => setTemplateBody(e.target.value)}
                                  onBlur={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                  onKeyUp={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                  onClick={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                                  onScroll={(e) => {
                                    // Keeps the highlight background perfectly scrolled with the text
                                    e.target.previousSibling.scrollTop = e.target.scrollTop;
                                  }}
                                  onKeyDown={(e) => {
                                    // --- Length Limiter ---
                                    const isNavKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key);
                                    if (templateBody.length >= 1024 && !isNavKey && !e.ctrlKey && !e.metaKey) e.preventDefault();

                                    // --- Block Deletion on Backspace ---
                                    if (e.key === 'Backspace') {
                                      const textarea = e.target;
                                      const startPos = textarea.selectionStart;

                                      // Only trigger if no text is currently highlighted by the user
                                      if (startPos === textarea.selectionEnd) {
                                        const textBeforeCursor = templateBody.substring(0, startPos);
                                        // Check if the text immediately before the cursor is a variable
                                        const match = textBeforeCursor.match(/\{\{[\w_]+\}\}$/);

                                        if (match) {
                                          e.preventDefault(); // Stop standard 1-character backspace
                                          const varToDelete = match[0];

                                          // Remove the entire variable from the text
                                          const newText = templateBody.substring(0, startPos - varToDelete.length) + templateBody.substring(startPos);
                                          setTemplateBody(newText);

                                          // Reset the cursor to exactly where the variable used to be
                                          setTimeout(() => {
                                            textarea.focus();
                                            const newPos = startPos - varToDelete.length;
                                            textarea.setSelectionRange(newPos, newPos);
                                          }, 0);
                                        }
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[10rem] text-sm leading-relaxed z-10 resize-none"
                                  style={{
                                    // Make the native text invisible, but keep the typing cursor black
                                    color: 'transparent',
                                    caretColor: 'black',
                                    backgroundColor: 'transparent'
                                  }}
                                  spellCheck={false} // Prevents red squiggles from desyncing the overlay
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddBodyVariable(true);
                                  setNewBodyVariableName('');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
                              >
                                + Add variable
                              </button>

                              {/* Named Variable Input Form */}
                              {showAddBodyVariable && (
                                <div className="mt-3 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Variable Name</label>
                                      <input
                                        type="text"
                                        value={newBodyVariableName}
                                        onChange={(e) => setNewBodyVariableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                                        placeholder="e.g. order_id"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Sample Value</label>
                                      <input
                                        type="text"
                                        value={newBodyVariableValue}
                                        onChange={(e) => setNewBodyVariableValue(e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                                        placeholder="12345"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const varName = newBodyVariableName.trim();
                                        if (!varName) return;

                                        if (bodyVariables.some(v => v.name === varName)) {
                                          alert("Variable name already exists!");
                                          return;
                                        }

                                        const placeholder = `{{${varName}}}`;
                                        const textarea = bodyTextRef.current;

                                        // 1. Grab the exact coordinates saved before the textarea lost focus
                                        const startPos = bodySelection.current.start || templateBody.length;
                                        const endPos = bodySelection.current.end || templateBody.length;

                                        // 2. Insert into text
                                        const newText = templateBody.substring(0, startPos) + placeholder + templateBody.substring(endPos);

                                        setTemplateBody(newText);
                                        setBodyVariables(prev => [...prev, { name: varName, value: newBodyVariableValue.trim() }]);

                                        setShowAddBodyVariable(false);
                                        setNewBodyVariableName('');
                                        setNewBodyVariableValue('');

                                        // 3. Put cursor exactly after the closing braces
                                        setTimeout(() => {
                                          textarea.focus();
                                          const newCursorPos = startPos + placeholder.length; // Places it at {{name}}|
                                          textarea.setSelectionRange(newCursorPos, newCursorPos);

                                          // Update our ref so it stays perfectly in sync
                                          bodySelection.current = { start: newCursorPos, end: newCursorPos };
                                        }, 10);
                                      }}
                                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Insert Variable
                                    </button>
                                    <button type="button" onClick={() => setShowAddBodyVariable(false)} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded">Cancel</button>
                                  </div>
                                </div>
                              )}

                              {/* Display Active Variables (Body) */}
                              {bodyVariables.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-xs font-semibold text-gray-700">Active Variables:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {bodyVariables.map((v, i) => (
                                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded shadow-sm text-[11px]">
                                        <span className="font-mono font-bold text-blue-700">{`{{${v.name}}}`}</span>
                                        <span className="text-gray-400">=</span>
                                        {/* EDITABLE SAMPLE INPUT */}
                                        <input
                                          type="text"
                                          value={v.value}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setBodyVariables(prev => prev.map(item => item.name === v.name ? { ...item, value: newVal } : item));
                                          }}
                                          className={`px-1.5 py-0.5 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 ${!v.value ? 'border-red-400 bg-red-50 placeholder-red-300' : 'border-gray-200 bg-white'
                                            }`}
                                          placeholder="Sample..."
                                        />
                                        <button
                                          onClick={() => {
                                            setTemplateBody(prev => prev.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), ''));
                                          }}
                                          className="ml-1 text-red-500 hover:text-red-700 font-bold"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-gray-300 my-6"></div>

                            {/* Footer Section */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 font-semibold">
                                  Footer <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                                </label>
                                <span className={`text-xs ${templateFooter.length >= 60 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {templateFooter.length}/60
                                </span>
                              </div>

                              <div className="relative">
                                <input
                                  type="text"
                                  value={templateFooter}
                                  onChange={(e) => setTemplateFooter(e.target.value)}
                                  maxLength={60}
                                  placeholder="Enter footer text (e.g., Reply STOP to unsubscribe)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                />
                                <p className="text-[10px] text-gray-500 mt-1.5">
                                  Footers are short, plain text placed at the bottom of your message. Variables are not allowed.
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-gray-300 my-6"></div>
                          </>
                        )}
                        {/* Buttons (Always visible when info is filled) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Buttons
                            </label>
                            <span className="text-xs text-gray-500">
                              {Array.isArray(templateButtons) ? templateButtons.length : 0}/10
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            A template can have up to 10 buttons total. Quick reply buttons will be automatically grouped in the generated JSON.
                          </p>

                          {/* Button List */}
                          {Array.isArray(templateButtons) && templateButtons.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {templateButtons.map((button, index) => {
                                const buttonTypeLabels = {
                                  copy_code: 'Copy Code',
                                  otp: 'One-Time Password',
                                  phone: 'Phone Number',
                                  quick_reply: 'Quick Reply',
                                  url: 'URL'
                                };

                                return (
                                  <div key={index} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-700">
                                          {buttonTypeLabels[button.type] || button.type}
                                        </span>
                                        {button.index !== undefined && (
                                          <span className="text-xs text-gray-500">(Index: {button.index})</span>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = templateButtons.filter((_, i) => i !== index);
                                          const quickReplyButtons = updated.filter(b => b.type === 'quick_reply');
                                          quickReplyButtons.forEach((btn, idx) => {
                                            btn.index = idx;
                                          });
                                          setTemplateButtons(updated);
                                        }}
                                        className="text-red-600 hover:text-red-700 text-xs"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      <div><strong>Text:</strong> {button.text}</div>
                                      {button.value && (
                                        <div><strong>Value:</strong> {button.value}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Add Button */}
                          {Array.isArray(templateButtons) && templateButtons.length < 10 && (
                            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Button Type
                                </label>
                                <select
                                  value={newButtonType}
                                  onChange={(e) => {
                                    setNewButtonType(e.target.value);
                                    setNewButtonValue('');
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select button type</option>
                                  {Array.isArray(templateButtons) && templateButtons.filter(b => b.type === 'copy_code').length === 0 && (
                                    <option value="copy_code">Copy Code (1 allowed)</option>
                                  )}
                                  <option value="otp">One-Time Password</option>
                                  <option value="phone">Phone Number</option>
                                  {Array.isArray(templateButtons) && templateButtons.filter(b => b.type === 'quick_reply').length < 10 && (
                                    <option value="quick_reply">Quick Reply ({templateButtons.filter(b => b.type === 'quick_reply').length}/10)</option>
                                  )}
                                  {Array.isArray(templateButtons) && templateButtons.filter(b => b.type === 'url').length < 2 && (
                                    <option value="url">URL ({templateButtons.filter(b => b.type === 'url').length}/2)</option>
                                  )}
                                </select>
                              </div>

                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Button Text
                                </label>
                                <input
                                  type="text"
                                  value={newButtonText}
                                  onChange={(e) => setNewButtonText(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter button text"
                                  maxLength={20}
                                />
                              </div>

                              {(newButtonType === 'copy_code' || newButtonType === 'phone' || newButtonType === 'url') && (
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    {newButtonType === 'copy_code' ? 'Copy Text' : newButtonType === 'phone' ? 'Phone Number' : 'URL'}
                                  </label>
                                  <input
                                    type="text"
                                    value={newButtonValue}
                                    onChange={(e) => setNewButtonValue(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={newButtonType === 'copy_code' ? 'Enter text to copy' : newButtonType === 'phone' ? 'Enter phone number (e.g., +1234567890)' : 'Enter URL (e.g., https://example.com)'}
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (!newButtonType || !newButtonText.trim()) {
                                    alert('Please select a button type and enter button text');
                                    return;
                                  }

                                  const currentCount = Array.isArray(templateButtons) ? templateButtons.filter(b => b.type === newButtonType).length : 0;
                                  const limits = {
                                    copy_code: 1,
                                    phone: Infinity,
                                    quick_reply: 10,
                                    url: 2
                                  };

                                  if (limits[newButtonType] !== Infinity && currentCount >= (limits[newButtonType] || 10)) {
                                    alert(`Maximum ${limits[newButtonType]} ${newButtonType} button(s) allowed`);
                                    return;
                                  }

                                  let buttonValue = '';
                                  if (newButtonType === 'copy_code' || newButtonType === 'phone' || newButtonType === 'url') {
                                    buttonValue = newButtonValue.trim();
                                    if (!buttonValue) {
                                      const valueLabels = {
                                        copy_code: 'copy text',
                                        phone: 'phone number',
                                        url: 'URL'
                                      };
                                      alert(`Please enter ${valueLabels[newButtonType]}`);
                                      return;
                                    }
                                  }

                                  const newButton = {
                                    type: newButtonType,
                                    text: newButtonText.trim(),
                                    value: buttonValue
                                  };

                                  if (newButtonType === 'quick_reply') {
                                    newButton.index = Array.isArray(templateButtons) ? templateButtons.filter(b => b.type === 'quick_reply').length : 0;
                                  }

                                  setTemplateButtons([...(Array.isArray(templateButtons) ? templateButtons : []), newButton]);
                                  setNewButtonType('');
                                  setNewButtonText('');
                                  setNewButtonValue('');
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Add Button
                              </button>
                            </div>
                          )}

                          {Array.isArray(templateButtons) && templateButtons.length >= 10 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Maximum 10 buttons reached
                            </p>
                          )}
                        </div>

                        {/* Divider after Buttons */}
                        <div className="border-t border-gray-300 my-6"></div>
                      </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div>
                      <div className="sticky top-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                        {/* Mobile Phone Mockup with WhatsApp Preview */}
                        <div className="flex justify-center">
                          <div className="relative w-[260px] h-[520px] bg-gray-900 rounded-[2.5rem] p-1.5 shadow-2xl">
                            {/* Phone Frame */}
                            <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden border-[3px] border-gray-800">
                              {/* Status Bar */}
                              <div className="bg-[#075e54] h-10 flex items-center justify-between px-3 text-white text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span>9:41</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                  </svg>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>

                              {/* WhatsApp Header */}
                              <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-medium text-xs truncate">Business Name</div>
                                  <div className="text-[#d4edda] text-[10px]">online</div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </div>
                              </div>

                              {/* Chat Area */}
                              <div className="bg-[#ece5dd] h-[calc(100%-10rem)] overflow-y-auto p-3" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23d4d4d4' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' opacity='0.1'/%3E%3C/svg%3E")`
                              }}>
                                {/* Template Message Bubble */}
                                {(templateBody || broadcastTitleType !== 'none') ? (
                                  <div className="flex justify-start mb-2">
                                    <div className="max-w-[85%] bg-white rounded-lg shadow-sm p-2.5 relative">
                                      {/* Message Header Badge */}
                                      <div className="absolute -top-1.5 left-2.5 bg-[#25d366] text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                                        TEMPLATE
                                      </div>
                                      <div className="pt-1.5">
                                        {/* Broadcast Title - Text */}
                                        {broadcastTitleType === 'text' && broadcastTitleText && (
                                          <div className="font-bold text-xs text-gray-800 mb-2">
                                            {(() => {
                                              // Replace variables with their example values
                                              let displayText = broadcastTitleText;
                                              broadcastTitleVariables.forEach(variable => {
                                                const varPattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
                                                const replacement = variable.value || variable.name;
                                                displayText = displayText.replace(varPattern, replacement);
                                              });
                                              return displayText;
                                            })()}
                                          </div>
                                        )}

                                        {/* Broadcast Title - Image */}
                                        {broadcastTitleType === 'image' && (
                                          <>
                                            {broadcastTitleImageLink && (
                                              <div className="mb-2">
                                                <img
                                                  src={broadcastTitleImageLink}
                                                  alt="Broadcast"
                                                  className="w-full rounded-lg object-cover max-h-32"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                  }}
                                                />
                                              </div>
                                            )}
                                            {broadcastTitleImageFile && (
                                              <div className="mb-2">
                                                <img
                                                  src={URL.createObjectURL(broadcastTitleImageFile)}
                                                  alt="Broadcast"
                                                  className="w-full rounded-lg object-cover max-h-32"
                                                />
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* Broadcast Title - Video */}
                                        {broadcastTitleType === 'video' && (
                                          <>
                                            {broadcastTitleVideoLink && (
                                              <div className="mb-2 relative">
                                                <video
                                                  src={broadcastTitleVideoLink}
                                                  className="w-full rounded-lg object-cover max-h-32"
                                                  controls={false}
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                  }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                  </svg>
                                                </div>
                                              </div>
                                            )}
                                            {broadcastTitleVideoFile && (
                                              <div className="mb-2 relative">
                                                <video
                                                  src={URL.createObjectURL(broadcastTitleVideoFile)}
                                                  className="w-full rounded-lg object-cover max-h-32"
                                                  controls={false}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                  </svg>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* Broadcast Title - Document */}
                                        {broadcastTitleType === 'document' && (
                                          <>
                                            {broadcastTitleDocumentLink && (
                                              <div className="mb-2 border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                <iframe
                                                  src={broadcastTitleDocumentLink}
                                                  className="w-full h-32"
                                                  title="Document preview"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                  }}
                                                />
                                              </div>
                                            )}
                                            {broadcastTitleDocumentFile && (
                                              <div className="mb-2 border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                <iframe
                                                  src={URL.createObjectURL(broadcastTitleDocumentFile)}
                                                  className="w-full h-32"
                                                  title="Document preview"
                                                />
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* Broadcast Title - Location */}
                                        {broadcastTitleType === 'location' && (
                                          <>
                                            {broadcastTitleLocationLatitude && broadcastTitleLocationLongitude && (
                                              <div className="mb-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                                                <div className="flex items-start gap-2">
                                                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  </svg>
                                                  <div className="flex-1 min-w-0">
                                                    {broadcastTitleLocationName && (
                                                      <p className="text-xs font-medium text-gray-900 mb-0.5">{broadcastTitleLocationName}</p>
                                                    )}
                                                    {broadcastTitleLocationAddress && (
                                                      <p className="text-xs text-gray-600 mb-0.5">{broadcastTitleLocationAddress}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                      {broadcastTitleLocationLatitude}, {broadcastTitleLocationLongitude}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* Message Body */}
                                        {templateBody && (
                                          <div className="text-xs text-gray-800 whitespace-pre-wrap mb-1.5">
                                            {(() => {
                                              // First replace variables with their example values
                                              let displayBody = templateBody;
                                              bodyVariables.forEach(variable => {
                                                const varPattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
                                                const replacement = variable.value || variable.name;
                                                displayBody = displayBody.replace(varPattern, replacement);
                                              });
                                              // Return body as-is (sample content replacement removed)
                                              return displayBody;
                                            })()}
                                          </div>
                                        )}

                                        {/* Footer */}
                                        {templateFooter && (
                                          <div className="text-[9px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200">
                                            {templateFooter}
                                          </div>
                                        )}

                                        {/* Buttons */}
                                        {Array.isArray(templateButtons) && templateButtons.length > 0 && (
                                          <div className="mt-2 space-y-1.5">
                                            {templateButtons.map((button, index) => {
                                              // Determine button style based on type
                                              let buttonClass = "w-full px-2.5 py-1.5 text-white text-[10px] rounded-lg transition-colors text-center";

                                              if (button.type === 'quick_reply') {
                                                buttonClass += " bg-gray-600 hover:bg-gray-700";
                                              } else {
                                                buttonClass += " bg-[#25d366] hover:bg-[#20ba5a]";
                                              }

                                              return (
                                                <button key={index} className={buttonClass}>
                                                  {button.text}
                                                  {button.type === 'phone' && button.value && (
                                                    <span className="ml-1 text-[9px] opacity-75">📞</span>
                                                  )}
                                                  {button.type === 'url' && button.value && (
                                                    <span className="ml-1 text-[9px] opacity-75">🔗</span>
                                                  )}
                                                  {button.type === 'copy_code' && (
                                                    <span className="ml-1 text-[9px] opacity-75">📋</span>
                                                  )}
                                                  {button.type === 'otp' && (
                                                    <span className="ml-1 text-[9px] opacity-75">🔐</span>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Timestamp */}
                                        <div className="text-[9px] text-gray-400 mt-1.5 text-right">
                                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-400 text-xs italic">Preview will appear here</p>
                                  </div>
                                )}
                              </div>

                              {/* Input Area (Optional - for visual completeness) */}
                              <div className="bg-gray-100 h-12 border-t border-gray-200 flex items-center px-3">
                                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-gray-500">
                                  Type a message
                                </div>
                                <div className="ml-1.5 w-8 h-8 bg-[#25d366] rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              {!selectedTemplate && templateSubView === 'template-library' && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Template Library</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Select or create your template and submit it for WhatsApp approval. All templates must adhere to WhatsApp's guidelines.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        // Set selectedTemplate to empty object to show form, but don't populate fields
                        setSelectedTemplate({});
                        // Reset all form fields
                        setTemplateName('');
                        setTemplateCategory('');
                        setTemplateLanguage('English');
                        setTemplateBody('');
                        setTemplateFooter('');
                        setTemplateSampleContent('');
                        setTemplateButtons([]);
                        setBroadcastTitleType('none');
                        setBroadcastTitleText('');
                        setBroadcastTitleImageLink('');
                        setBroadcastTitleVideoLink('');
                        setBroadcastTitleDocumentLink('');
                        setBroadcastTitleImageFile(null);
                        setBroadcastTitleVideoFile(null);
                        setBroadcastTitleDocumentFile(null);
                        setBroadcastTitleLocationLatitude('');
                        setBroadcastTitleLocationLongitude('');
                        setBroadcastTitleLocationName('');
                        setBroadcastTitleLocationAddress('');
                        setBroadcastTitleError('');
                        setBroadcastTitleVariables([]);
                        setShowAddVariable(false);
                        setNewVariableName('');
                        setNewVariableValue('');
                        setBodyVariables([]);
                        setShowAddBodyVariable(false);
                        setNewBodyVariableName('');
                        setNewBodyVariableValue('');
                        setNewButtonType('');
                        setNewButtonText('');
                        setNewButtonValue('');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      New Template Message
                    </button>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English</option>
                    </select>
                  </div>

                  {/* Tag Filter Buttons */}
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    {getAllTags().map((tag) => {
                      // Get initial group templates
                      const baseTemplates = tag === 'All'
                        ? broadcastTemplates
                        : getTemplatesByTag(tag);
                      
                      // Filter down to only those with an ecommerce/e-commerce tag
                      const ecommerceTemplates = baseTemplates.filter(t => 
                        t.tags?.some(tg => tg.toLowerCase().includes('ecommerce') || tg.toLowerCase().includes('e-commerce'))
                      );
                      
                      const count = ecommerceTemplates.length;

                      // Hide filter buttons that have 0 matching ecommerce templates
                      if (count === 0 && tag !== 'All') return null;

                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTemplateTag(tag)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedTemplateTag === tag
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {tag} <span className="text-gray-500">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search templates by name, tag, or content..."
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Templates grouped by selected tag and filtered by search */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      // First filter by tag
                      let filteredTemplates = getTemplatesByTag(selectedTemplateTag);

                      // Then filter by search query if provided
                      if (templateSearchQuery.trim()) {
                        const query = templateSearchQuery.toLowerCase().trim();
                        filteredTemplates = filteredTemplates.filter(template => {
                          const nameMatch = template.name?.toLowerCase().includes(query);
                          const tagsMatch = template.tags?.some(tag => tag.toLowerCase().includes(query));
                          const contentMatch = template.content?.toLowerCase().includes(query);
                          return nameMatch || tagsMatch || contentMatch;
                        });
                      }

                      return filteredTemplates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                              <span className="text-xs text-gray-500">{template.tags ? template.tags.join(', ') : ''}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                              }}
                              className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors flex-shrink-0 ml-2"
                            >
                              Use sample
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 flex-1 overflow-y-auto max-h-48">
                            {template.content}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Show message if no templates found */}
                  {(() => {
                    let filteredTemplates = getTemplatesByTag(selectedTemplateTag);
                    if (templateSearchQuery.trim()) {
                      const query = templateSearchQuery.toLowerCase().trim();
                      filteredTemplates = filteredTemplates.filter(template => {
                        const nameMatch = template.name?.toLowerCase().includes(query);
                        const tagsMatch = template.tags?.some(tag => tag.toLowerCase().includes(query));
                        const contentMatch = template.content?.toLowerCase().includes(query);
                        return nameMatch || tagsMatch || contentMatch;
                      });
                    }
                    return filteredTemplates.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-sm">
                          {templateSearchQuery.trim()
                            ? `No templates found matching "${templateSearchQuery}"`
                            : 'No templates available'}
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}
              {!selectedTemplate && templateSubView === 'your-templates' && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Templates</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your custom templates here.
                      </p>
                    </div>
                  </div>

                  {isLoadingUserTemplates ? (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-500">Loading templates...</p>
                    </div>
                  ) : userTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userTemplates.map((template, index) => {
                        // Extract template data - it might be in template.object if saved as draft
                        const templateData = template.object || template;
                        const templateName = templateData.name || template.name || `Template ${index + 1}`;
                        const templateCategory = templateData.category || template.category || '';
                        const templateBody = templateData.components?.find(c => c.type === 'body' || c.type === 'BODY')?.text || templateData.body || template.content || '';
                        const templateStatus = template.template_status || template.status || 'draft';

                        // Extract header component to check for media
                        const headerComponent = templateData.components?.find(c =>
                          (c.type === 'header' || c.type === 'HEADER') &&
                          (c.format === 'IMAGE' || c.format === 'VIDEO' || c.format === 'DOCUMENT')
                        );

                        // Extract media from template.media
                        const s3Url = template.s3_url || template.media?.s3_url || null;
                        const mediaType = template.file_type || template.media?.file_type || '';
                        const mediaFileName = template.file_name || template.media?.file_name || '';

                        return (
                          <div key={template.id || template._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1 truncate">{templateName}</h3>
                                <div className="flex items-center gap-2">
                                  {templateCategory && (
                                    <span className="text-xs text-gray-500">{templateCategory}</span>
                                  )}
                                  <span className={`text-xs px-2 py-0.5 rounded ${templateStatus === 'draft'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : templateStatus === 'pending'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {templateStatus}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  onClick={() => {
                                    // Load template data into form - pass the full template object
                                    setSelectedTemplate(template);
                                  }}
                                  className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors flex-shrink-0"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const confirmDelete = window.confirm(`Are you sure you want to delete the template "${templateName}"?`);
                                      if (!confirmDelete) return;

                                      const dbId = userData?.db_id || user?.db_id;
                                      if (!dbId) {
                                        alert('User ID not found. Cannot delete template.');
                                        return;
                                      }

                                      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
                                      if (!dbServerUrl) {
                                        alert('DB Server URL is not configured. Cannot delete template.');
                                        return;
                                      }

                                      const templateIdToDelete = template.template_id;
                                      if (!templateIdToDelete) {
                                        alert('Template ID not found. Cannot delete template.');
                                        return;
                                      }

                                      const deleteUrl = `${dbServerUrl}/api/users/${dbId}/templates/${templateIdToDelete}`;
                                      console.log('🗑 Deleting template:', deleteUrl);

                                      const response = await fetch(deleteUrl, {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                      });

                                      if (!response.ok) {
                                        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
                                        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                                      }

                                      // Optimistically remove from local state
                                      setUserTemplates((prev) =>
                                        prev.filter((t) => (t.template_id || t.id || t._id || '') !== templateIdToDelete)
                                      );

                                      alert('Template deleted successfully.');
                                    } catch (error) {
                                      console.error('❌ Error deleting template:', error);
                                      alert(error.message || 'Failed to delete template. Please try again.');
                                    }
                                  }}
                                  className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Display media using blazing fast S3 presigned URLs */}
                            {headerComponent && s3Url && (
                              <div className="mb-3">
                                {headerComponent.format === 'IMAGE' && mediaType.startsWith('image/') && (
                                  <div className="rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                      src={s3Url}
                                      alt={mediaFileName || 'Template image'}
                                      className="w-full h-auto max-h-48 object-cover"
                                    />
                                  </div>
                                )}
                                {headerComponent.format === 'VIDEO' && mediaType.startsWith('video/') && (
                                  <div className="rounded-lg overflow-hidden border border-gray-200">
                                    <video
                                      src={s3Url}
                                      controls
                                      className="w-full h-auto max-h-48"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                )}
                                {headerComponent.format === 'DOCUMENT' && mediaType === 'application/pdf' && (
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{mediaFileName || 'Document'}</p>
                                      <p className="text-xs text-gray-500">PDF Document</p>
                                    </div>
                                    <a
                                      href={s3Url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                                    >
                                      View Document
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 flex-1 overflow-y-auto max-h-48">
                              {templateBody}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No custom templates yet. Create your first template to get started.</p>
                    </div>
                  )}
                </div>
              )}
              {!selectedTemplate && !templateSubView ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Templates</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Select "Template library" or "Your templates" from the sidebar to get started.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {broadcastView === 'broadcast-history' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Broadcast History</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    View all your past broadcast messages and their performance.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Past Broadcasts</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Export
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No broadcast history</p>
                  <p className="text-xs text-gray-500 mb-4">You haven't sent any broadcasts yet.</p>
                  <p className="text-xs text-gray-600 mb-4">
                    Start sending broadcast messages and they will appear here.
                  </p>
                  <button
                    onClick={() => setBroadcastView('new-broadcast')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    New Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}

          {broadcastView === 'scheduled-broadcasts' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scheduled Broadcasts</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your scheduled broadcast messages.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Upcoming Broadcasts</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Export
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No scheduled broadcasts</p>
                  <p className="text-xs text-gray-500 mb-4">You don't have any scheduled broadcasts yet.</p>
                  <p className="text-xs text-gray-600 mb-4">
                    Schedule a broadcast message and it will appear here.
                  </p>
                  <button
                    onClick={() => setBroadcastView('new-broadcast')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    New Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}

          {broadcastView === 'analytics' && (
            <BroadcastAnalytics 
              onNewBroadcastClick={() => setBroadcastView('new-broadcast')} 
            />
          )}

            {broadcastView === 'new-broadcast' && (
              <div className="space-y-4">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter broadcast name"
                    value={broadcastName}
                    onChange={(e) => setBroadcastName(e.target.value)}
                  />
                </div>

                {/* Select Template Message Section */}
                  {(() => {
                    // Filter out only approved templates
                    const approvedTemplates = userTemplates.filter(t => 
                      t.template_status === 'APPROVED' || 
                      t.template_status === 'approved' ||
                      t.status === 'APPROVED' ||
                      t.status === 'approved'
                    );
                    
                    return (
                      <div className="mb-4">
                        {/* Header Row: Label + Permanent Styled Action Button */}
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Select template message</label>
                          <button 
                            onClick={() => {
                              setBroadcastView('templates');
                              setTemplateSubView('template-library');
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 transition-colors shrink-0"
                          >
                            Create template
                          </button>
                        </div>
                        
                        {isLoadingUserTemplates ? (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm animate-pulse">
                            Loading approved templates...
                          </div>
                        ) : approvedTemplates.length > 0 ? (
                          <div className="space-y-3">
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={broadcastSelectedTemplate ? (broadcastSelectedTemplate.template_id || broadcastSelectedTemplate.id || broadcastSelectedTemplate._id || '') : ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const template = approvedTemplates.find(t => (t.template_id || t.id || t._id) === selectedId);
                                setBroadcastSelectedTemplate(template);
                              }}
                            >
                              <option value="" disabled>-- Select an approved template --</option>
                              {approvedTemplates.map(template => {
                                const tId = template.template_id || template.id || template._id;
                                const templateData = template.object || template;
                                const tName = templateData.name || template.name || "Unnamed Template";
                                return (
                                  <option key={tId} value={tId}>{tName}</option>
                                );
                              })}
                            </select>
                          </div>
                        ) : (
                          /* Compact, Clean Warning Banner (No redundant button) */
                          <div className="w-full px-4 py-2.5 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                            <span className="text-yellow-500 text-base leading-none">⚠️</span>
                            <p className="text-xs text-gray-600">You don't have any approved templates yet. Click the button above to build one.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Who is your audience?</h2>
                    <p className="text-sm text-gray-600">Choose an existing segment or build a new one dynamically.</p>
                  </div>
                </div>

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
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {selectedAudienceId ? (
                      <div className="flex justify-between items-center bg-white p-4 border border-blue-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Selected Segment: {selectedAudienceName}</p>
                            <p className="text-xs text-gray-500">ID: {selectedAudienceId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowAudienceBuilder(true)} className="text-sm text-blue-600 font-medium hover:underline">Change</button>
                        </div>
                      </div>
                    ) : showAudienceSelector ? (
                      <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                          <h3 className="text-sm font-semibold text-gray-900">Select a Saved Segment</h3>
                          <button onClick={() => setShowAudienceSelector(false)} className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
                            ✕ Cancel
                          </button>
                        </div>

                        {isLoadingAudiences ? (
                          <div className="py-8 text-center text-sm font-medium text-blue-600 animate-pulse">
                            Loading your segments...
                          </div>
                        ) : savedAudiences.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                            {savedAudiences.map(audience => (
                              <button
                                key={audience.id}
                                onClick={() => {
                                  setSelectedAudienceId(audience.id);
                                  setSelectedAudienceName(audience.name);
                                  setShowAudienceSelector(false);
                                }}
                                className="flex flex-col items-start p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm transition-all text-left bg-white"
                              >
                                <span className="font-semibold text-sm text-gray-900 truncate w-full mb-1">{audience.name}</span>
                                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {audience.contact_count.toLocaleString()} Contacts
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center border border-dashed border-gray-300 rounded-lg bg-white">
                            <p className="text-sm text-gray-600 mb-3">You don't have any saved segments yet.</p>
                            <button
                              onClick={() => {
                                setShowAudienceSelector(false);
                                setShowAudienceBuilder(true);
                              }}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                              Build your first audience
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-600 mb-4">No audience selected for this broadcast.</p>
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={fetchSavedAudiences}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium shadow-sm transition-colors"
                          >
                            Select Saved Segment
                          </button>
                          <button
                            onClick={() => setShowAudienceBuilder(true)}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium shadow-sm transition-colors"
                          >
                            Build New Audience
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">When do you want to send it?</h2>
                <div className="space-y-3">
                  
                  {/* Send Now Radio */}
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input 
                      type="radio" 
                      name="send-time" 
                      value="now" 
                      checked={sendTimeMode === 'now'}
                      onChange={(e) => setSendTimeMode(e.target.value)}
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="text-sm text-gray-700">Send now</span>
                  </label>

                  {/* Schedule Radio + Inline Inputs */}
                  <div className="flex items-center flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <input 
                        type="radio" 
                        name="send-time" 
                        value="schedule" 
                        checked={sendTimeMode === 'schedule'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSendTimeMode(val);
                          
                          // Auto-populate with +15 mins from right now when selected
                          if (val === 'schedule') {
                            const targetTime = new Date(new Date().getTime() + 15 * 60000);
                            
                            const year = targetTime.getFullYear();
                            const month = String(targetTime.getMonth() + 1).padStart(2, '0');
                            const day = String(targetTime.getDate()).padStart(2, '0');
                            setScheduledDate(`${year}-${month}-${day}`);
                            
                            let h = targetTime.getHours();
                            const m = String(targetTime.getMinutes()).padStart(2, '0');
                            const period = h >= 12 ? 'PM' : 'AM';
                            
                            if (h === 0) h = 12;
                            else if (h > 12) h -= 12;
                            
                            setScheduledHour(String(h).padStart(2, '0'));
                            setScheduledMinute(m);
                            setScheduledPeriod(period);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm text-gray-700">Schedule for a specific time</span>
                    </label>

                    {/* Inline Scheduling Options */}
                    {sendTimeMode === 'schedule' && (() => {
                      // Calculate constraints based on Now + 15 mins
                      const now = new Date();
                      const minAllowedTime = new Date(now.getTime() + 15 * 60000);
                      
                      const minYear = minAllowedTime.getFullYear();
                      const minMonth = String(minAllowedTime.getMonth() + 1).padStart(2, '0');
                      const minDay = String(minAllowedTime.getDate()).padStart(2, '0');
                      const minDateFormatted = `${minYear}-${minMonth}-${minDay}`;
                      
                      const isMinDate = scheduledDate === minDateFormatted;
                      const minHour24 = minAllowedTime.getHours();
                      const minMinute = minAllowedTime.getMinutes();
                      const minPeriod = minHour24 >= 12 ? 'PM' : 'AM';

                      // Get currently selected hour in 24h format for minute calculations
                      let selectedHour24 = parseInt(scheduledHour || '12', 10);
                      if (scheduledPeriod === 'PM' && selectedHour24 !== 12) selectedHour24 += 12;
                      if (scheduledPeriod === 'AM' && selectedHour24 === 12) selectedHour24 = 0;

                      return (
                        <div className="flex items-center flex-wrap gap-3 animate-fade-in">
                          
                          {/* Date Selector */}
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={minDateFormatted} 
                            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />

                          {/* Time Selector (12-hour format) */}
                          <div className="flex items-center gap-1">
                            {/* Hour */}
                            <select
                              value={scheduledHour}
                              onChange={(e) => setScheduledHour(e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                                let h24 = h;
                                if (scheduledPeriod === 'PM' && h !== 12) h24 += 12;
                                if (scheduledPeriod === 'AM' && h === 12) h24 = 0;
                                
                                // Disable hours that fall before the minimum allowed hour today
                                const isDisabled = isMinDate && h24 < minHour24;

                                return (
                                  <option key={h} value={h.toString().padStart(2, '0')} disabled={isDisabled}>
                                    {h.toString().padStart(2, '0')}
                                  </option>
                                );
                              })}
                            </select>
                            
                            <span className="font-bold text-gray-500">:</span>
                            
                            {/* Minute */}
                            <select
                              value={scheduledMinute}
                              onChange={(e) => setScheduledMinute(e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              {Array.from({ length: 60 }, (_, i) => i).map(m => {
                                // Disable minutes that fall before the min allowed minute if in the min allowed hour
                                const isDisabled = isMinDate && selectedHour24 === minHour24 && m < minMinute;
                                
                                return (
                                  <option key={m} value={m.toString().padStart(2, '0')} disabled={isDisabled}>
                                    {m.toString().padStart(2, '0')}
                                  </option>
                                );
                              })}
                            </select>

                            {/* AM/PM */}
                            <select
                              value={scheduledPeriod}
                              onChange={(e) => setScheduledPeriod(e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ml-1"
                            >
                              {/* Disable AM if the minimum allowed time is PM today */}
                              <option value="AM" disabled={isMinDate && minPeriod === 'PM'}>AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>

                          {/* Time Zone Selector */}
                          <select
                            value={scheduledTimezone}
                            onChange={(e) => setScheduledTimezone(e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="IST">IST</option>
                            <option value="UTC">UTC</option>
                            <option value="EST">EST</option>
                            <option value="PST">PST</option>
                          </select>
                          
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
              {/* --- ADD THIS NEW BLOCK BELOW THE SCHEDULING SECTION --- */}
              <div className="border-t pt-6 mt-6">
                {broadcastStatus.message && (
                  <div className={`p-4 mb-4 rounded-lg ${broadcastStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {broadcastStatus.message}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                      onClick={handleSendBroadcast}
                      disabled={isSendingBroadcast}
                      className={`px-6 py-3 font-medium text-white rounded-lg transition-colors shadow-sm ${
                        isSendingBroadcast 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSendingBroadcast 
                        ? (sendTimeMode === 'now' ? 'Queuing Messages...' : 'Scheduling...') 
                        : (sendTimeMode === 'now' ? 'Send Broadcast' : 'Schedule Broadcast')}
                    </button>
                </div>
              </div>
              {/* --- END NEW BLOCK --- */}

            </div>
          )}
        </div>
    </div>

    {/* JSON Modal */}
    {showJSONModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowJSONModal(false)}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Template JSON</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const templateJSON = generateTemplateJSON();
                  const jsonString = JSON.stringify(templateJSON, null, 2);
                  navigator.clipboard.writeText(jsonString).then(() => {
                    alert('JSON copied to clipboard!');
                  }).catch(err => {
                    console.error('Failed to copy:', err);
                  });
                }}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setShowJSONModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 overflow-auto flex-1">
            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(generateTemplateJSON(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default Broadcast;