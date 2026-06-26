import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiConfig } from '../../../../../config/api';
import { parseTemplateForForm, validateTemplateClientSide, validateFileExtension } from './templateUtils';
import MediaCarouselEditor from './MediaCarouselEditor';

export const TemplateEditor = ({ user, userData, initialTemplate, onCancel, onSuccess }) => {
    // --- Tab State ---
    const [activeTab, setActiveTab] = useState('custom');

    // --- Shared & Existing States ---
    const [templateName, setTemplateName] = useState('');
    const [templateCategory, setTemplateCategory] = useState('');
    const [templateLanguage, setTemplateLanguage] = useState('English(US)');
    const [templateBody, setTemplateBody] = useState('');
    const [templateFooter, setTemplateFooter] = useState('');
    const [templateSampleContent, setTemplateSampleContent] = useState('');
    const [templateButtons, setTemplateButtons] = useState([]);

    const [broadcastTitleType, setBroadcastTitleType] = useState('none');
    const [broadcastTitleText, setBroadcastTitleText] = useState('');
    const [broadcastTitleImageLink, setBroadcastTitleImageLink] = useState('');
    const [broadcastTitleVideoLink, setBroadcastTitleVideoLink] = useState('');
    const [broadcastTitleDocumentLink, setBroadcastTitleDocumentLink] = useState('');
    const [broadcastTitleImageFile, setBroadcastTitleImageFile] = useState(null);
    const [broadcastTitleVideoFile, setBroadcastTitleVideoFile] = useState(null);
    const [broadcastTitleDocumentFile, setBroadcastTitleDocumentFile] = useState(null);
    const [broadcastTitleImageHandle, setBroadcastTitleImageHandle] = useState('');
    const [broadcastTitleMediaKey, setBroadcastTitleMediaKey] = useState('');
    const [broadcastTitleImageMediaId, setBroadcastTitleImageMediaId] = useState('');
    const [broadcastTitleVideoHandle, setBroadcastTitleVideoHandle] = useState('');
    const [broadcastTitleDocumentHandle, setBroadcastTitleDocumentHandle] = useState('');

    const [broadcastTitleLocationLatitude, setBroadcastTitleLocationLatitude] = useState('');
    const [broadcastTitleLocationLongitude, setBroadcastTitleLocationLongitude] = useState('');
    const [broadcastTitleLocationName, setBroadcastTitleLocationName] = useState('');
    const [broadcastTitleLocationAddress, setBroadcastTitleLocationAddress] = useState('');
    const [broadcastTitleError, setBroadcastTitleError] = useState('');
    const [showJSONModal, setShowJSONModal] = useState(false);

    const [broadcastTitleVariables, setBroadcastTitleVariables] = useState([]);
    const [showAddVariable, setShowAddVariable] = useState(false);
    const [newVariableName, setNewVariableName] = useState('');
    const [newVariableValue, setNewVariableValue] = useState('');
    const broadcastTitleTextRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [bodyVariables, setBodyVariables] = useState([]);
    const [showAddBodyVariable, setShowAddBodyVariable] = useState(false);
    const [newBodyVariableName, setNewBodyVariableName] = useState('');
    const [newBodyVariableValue, setNewBodyVariableValue] = useState('');
    const bodyTextRef = useRef(null);

    const [newButtonType, setNewButtonType] = useState('');
    const [newButtonText, setNewButtonText] = useState('');
    const [newButtonValue, setNewButtonValue] = useState('');
    const [editingButtonIndex, setEditingButtonIndex] = useState(null);

    const [headerMediaSource, setHeaderMediaSource] = useState('upload');
    const bodySelection = useRef({ start: 0, end: 0 });
    const headerSelection = useRef({ start: 0, end: 0 });

    const [isMediaUploading, setIsMediaUploading] = useState(false);

    // Ref to trigger save functions inside MediaCarouselEditor
    const carouselRef = useRef(null);

    const isBuilderDisabled = !templateName.trim() || !templateCategory || !templateLanguage;

    const populateFormFromAPITemplate = useCallback((template) => {
        const parsedTemplate = parseTemplateForForm(template);

        // Extract raw components array to hunt for saved example values
        const templateData = template.object || template;
        const components = templateData.components || [];

        // --- NEW: AUTO-FILL HEADER VARIABLES & S3 KEY ---
        let finalHeaderVars = [];
        const headerComp = components.find(c => c.type?.toUpperCase() === 'HEADER');

        if (headerComp) {
            const format = headerComp.format?.toUpperCase();

            if (format === 'TEXT' && headerComp.example?.header_text_named_params) {
                // 1. Text Variable Assignment
                finalHeaderVars = headerComp.example.header_text_named_params.map(param => ({
                    name: param.param_name,
                    value: param.example || ''
                }));
            } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) {
                // 2. S3 Key assignment (Using the correct existing state!)
                setBroadcastTitleMediaKey(headerComp.s3_key || '');
            }
        }
        // --- NEW: AUTO-FILL BODY VARIABLES ---
        let finalBodyVars = [];
        const bodyComp = components.find(c => c.type?.toUpperCase() === 'BODY');
        if (bodyComp?.example?.body_text_named_params) {
            // Build the state directly from the backend examples
            finalBodyVars = bodyComp.example.body_text_named_params.map(param => ({
                name: param.param_name,
                value: param.example || ''
            }));
        }
        console.log("final body vars = ", (finalBodyVars));
        // Map the newly prefilled variables into State
        setBroadcastTitleVariables(finalHeaderVars);
        setTemplateBody(parsedTemplate.templateBody);
        setBodyVariables(finalBodyVars);

        setTemplateName(parsedTemplate.templateName);
        setTemplateCategory(parsedTemplate.templateCategory);
        setTemplateLanguage(parsedTemplate.templateLanguage);
        setBroadcastTitleType(parsedTemplate.broadcastTileType);
        setBroadcastTitleText(parsedTemplate.headerText);
        setBroadcastTitleImageHandle(parsedTemplate.broadcastTitleImageHandle);
        setBroadcastTitleVideoHandle(parsedTemplate.broadcastTitleVideoHandle);
        setBroadcastTitleDocumentHandle(parsedTemplate.broadcastTitleDocumentHandle);
        setBroadcastTitleLocationLatitude(parsedTemplate.broadcastTitleLocationLatitude);
        setBroadcastTitleLocationLongitude(parsedTemplate.broadcastTitleLocationLongitude);
        setBroadcastTitleLocationName(parsedTemplate.broadcastTitleLocationName);
        setBroadcastTitleLocationAddress(parsedTemplate.broadcastTitleLocationAddress);
        setTemplateFooter(parsedTemplate.templateFooter);
        setTemplateButtons(parsedTemplate.templateButtons);

        const isDraft = template.template_status === 'draft';
        if (!isDraft) {
            if (parsedTemplate.templateButtons) {
                const processedButtons = parsedTemplate.templateButtons.map(btn => {
                    // If it's a button type that takes a value, move the parsed value to placeholder and leave value blank
                    if (['URL', 'PHONE', 'COPY_CODE'].includes(btn.type)) {
                        return { ...btn, placeholder: btn.value, value: '' };
                    }
                    return btn;
                });
                setTemplateButtons(processedButtons);
            }
        }
        // ------------------------------------
        console.log("buttons found = ", parsedTemplate.templateButtons);
        setBroadcastTitleError('');
        setBroadcastTitleImageLink('');
        setBroadcastTitleVideoLink('');
        setBroadcastTitleDocumentLink('');
        setBroadcastTitleImageFile(null);
        setBroadcastTitleVideoFile(null);
        setBroadcastTitleDocumentFile(null);
        setTemplateSampleContent('');
        setShowAddVariable(false);
        setNewVariableName('');
        setNewVariableValue('');
        setShowAddBodyVariable(false);
        setNewBodyVariableName('');
        setNewBodyVariableValue('');
    }, []);

    useEffect(() => {
        if (!initialTemplate) return;

        // --- 1. SAFELY PARSE THE OBJECT ---
        let templateData = initialTemplate.object || initialTemplate;

        // Defensively parse the data just in case the database returned a stringified JSON
        if (typeof templateData === 'string') {
            try {
                templateData = JSON.parse(templateData);
            } catch (e) {
                console.error("Failed to parse template object", e);
            }
        }

        // --- 2. SMART TAB DETECTION ---
        const components = templateData.components || [];
        const isCarouselComponent = Array.isArray(components) && components.some(c => c.type?.toLowerCase() === 'carousel');

        // Look for the flag at the root level OR buried inside the parsed object
        const explicitType = initialTemplate.template_type || templateData.template_type;

        if (explicitType === 'carousel' || explicitType === 'media_carousel' || isCarouselComponent) {
            setActiveTab('carousel');
        } else {
            setActiveTab('custom');
        }
        // --------------------------------

        if (Object.keys(initialTemplate).length === 0) {
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
        } else {
            const templateData = initialTemplate.object || initialTemplate;
            const hasComponents = templateData.components && Array.isArray(templateData.components);
            if (hasComponents) {
                populateFormFromAPITemplate(initialTemplate);
            } else {
                setTemplateName(initialTemplate.name || '');
                let category = '';
                if (initialTemplate.category) {
                    const categoryMap = { 'AUTHENTICATION': 'Authentication', 'MARKETING': 'Marketing', 'UTILITY': 'Utility' };
                    category = categoryMap[initialTemplate.category] || initialTemplate.category;
                }
                setTemplateCategory(category);
                const apiToDisplayLanguage = { 'en_US': 'English(US)', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'hi': 'Hindi' };
                const apiLanguage = initialTemplate.language || 'en_US';
                setTemplateLanguage(apiToDisplayLanguage[apiLanguage] || 'English(US)');
                setTemplateBody(initialTemplate.content || '');
                setTemplateFooter(initialTemplate.footer || '');
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
            }
        }
    }, [initialTemplate, populateFormFromAPITemplate]);

    // ✅ ADD THESE NEW HANDLERS
    const handleTitleTextChange = (newText) => {
        setBroadcastTitleText(newText);

        setBroadcastTitleVariables((prev) => {
            const matches = newText.match(/\{\{[\w_]+\}\}/g) || [];
            const activeNamesInText = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].slice(0, 1);
            let hasChanges = false;
            const nextVars = prev.filter(v => {
                if (!activeNamesInText.includes(v.name)) {
                    hasChanges = true;
                    return false;
                }
                return true;
            });
            activeNamesInText.forEach(name => {
                if (!nextVars.some(v => v.name === name)) {
                    nextVars.push({ name: name, value: '' });
                    hasChanges = true;
                }
            });
            return hasChanges ? nextVars : prev;
        });
    };

    const handleBodyTextChange = (newText) => {
        setTemplateBody(newText);

        setBodyVariables((prev) => {
            const matches = newText.match(/\{\{[\w_]+\}\}/g) || [];
            const activeNamesInText = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
            let hasChanges = false;

            const normalizedPrev = prev.map((v, index) => {
                if (typeof v === 'string') {
                    hasChanges = true;
                    return { name: activeNamesInText[index] || String(index + 1), value: v };
                }
                return v;
            });

            const nextVars = normalizedPrev.filter(v => {
                if (!activeNamesInText.includes(v.name)) {
                    hasChanges = true;
                    return false;
                }
                return true;
            });

            activeNamesInText.forEach(name => {
                if (!nextVars.some(v => v.name === name)) {
                    nextVars.push({ name: name, value: '' });
                    hasChanges = true;
                }
            });

            return hasChanges ? nextVars : prev;
        });
    };

    const uploadImageToAPI = useCallback(async (file) => {
        try {
            const dbId = userData?.db_id || user?.db_id;
            if (!dbId) throw new Error('User ID not found');
            const dbServerUrl = apiConfig.dbServerConfig.baseURL;
            if (!dbServerUrl) throw new Error('DB Server URL is not configured');

            const uploadUrl = `${dbServerUrl}/api/templates/${dbId}/templates/upload_media`;
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            let handle = result.data?.uploaded_file_handle || result.uploaded_file_handle || result.data?.handle?.handle || result.handle?.handle || result.data?.handle || result.handle || null;
            if (handle && typeof handle !== 'string') handle = handle.handle || handle.uploaded_file_handle || null;
            const imageS3Key = result.data?.s3_key || result.s3_key || result.data?.key || result.key || null;
            const mediaId = result.data?.media_id || result.media_id || null;
            console.log('s3_key = ', imageS3Key);
            return { handle: handle || '', s3_key: imageS3Key || '', mediaId: mediaId || '' };
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            throw error;
        }
    }, [user, userData]);

    const generateTemplateJSON = useCallback((overrideHandle = null, overrideS3Key = null) => {
        const components = [];
        if (broadcastTitleType === 'text' && broadcastTitleText) {
            // ... text logic stays the same ...
            const headerComponent = { type: "header", format: "TEXT", text: broadcastTitleText };
            const variablePattern = /\{\{([\w_]+)\}\}/g;
            const matches = [...broadcastTitleText.matchAll(variablePattern)];
            if (matches.length > 0) {
                headerComponent.example = {
                    header_text_named_params: matches.map(match => {
                        const varName = match[1];
                        const stateVar = broadcastTitleVariables.find(v => v.name === varName);
                        return { param_name: varName, example: stateVar.value.trim() };
                    })
                };
            }
            components.push(headerComponent);
        } else if (broadcastTitleType === 'image' && (broadcastTitleImageHandle || broadcastTitleImageLink || broadcastTitleImageFile || overrideHandle)) {
            let handle = overrideHandle || broadcastTitleImageHandle || broadcastTitleImageLink;
            let s3_key = overrideS3Key || broadcastTitleMediaKey || '';

            if (handle && typeof handle === 'object') handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
            handle = String(handle || '');
            if (handle) components.push({ type: "header", format: "IMAGE", example: { header_handle: [handle] }, s3_key: s3_key });

        } else if (broadcastTitleType === 'video' && (broadcastTitleVideoHandle || broadcastTitleVideoLink || broadcastTitleVideoFile || overrideHandle)) {
            let handle = overrideHandle || broadcastTitleVideoHandle || broadcastTitleVideoLink;
            let s3_key = overrideS3Key || broadcastTitleMediaKey || '';

            if (handle && typeof handle === 'object') handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
            handle = String(handle || '');
            if (handle) components.push({ type: "header", format: "VIDEO", example: { header_handle: [handle] }, s3_key: s3_key });

        } else if (broadcastTitleType === 'document' && (broadcastTitleDocumentHandle || broadcastTitleDocumentLink || broadcastTitleDocumentFile || overrideHandle)) {
            let handle = overrideHandle || broadcastTitleDocumentHandle || broadcastTitleDocumentLink;
            let s3_key = overrideS3Key || broadcastTitleMediaKey || '';

            if (handle && typeof handle === 'object') handle = handle.handle || handle.uploaded_file_handle || JSON.stringify(handle);
            handle = String(handle || '');
            if (handle) components.push({ type: "header", format: "DOCUMENT", example: { header_handle: [handle] }, s3_key: s3_key });

        } else if (broadcastTitleType === 'location' && broadcastTitleLocationLatitude && broadcastTitleLocationLongitude) {
            // ... location logic stays the same ...
            if (templateCategory === 'Utility' || templateCategory === 'Marketing') {
                components.push({
                    type: "header",
                    parameters: [{
                        type: "location",
                        location: { latitude: broadcastTitleLocationLatitude, longitude: broadcastTitleLocationLongitude, name: broadcastTitleLocationName || "", address: broadcastTitleLocationAddress || "" }
                    }]
                });
            }
        }

        // ... Body, Footer, and Button logic stays exactly the same ...
        if (templateBody) {
            const bodyComponent = { type: "body", text: templateBody };
            const variablePattern = /\{\{([\w_]+)\}\}/g;
            const matches = [...templateBody.matchAll(variablePattern)];
            if (matches.length > 0) {
                bodyComponent.example = {
                    body_text_named_params: matches.map(match => {
                        const varName = match[1];
                        const stateVar = bodyVariables.find(v => v.name === varName);
                        return { param_name: varName, example: stateVar.value.trim() };
                    })
                };
            }
            components.push(bodyComponent);
        }

        if (templateFooter) {
            components.push({ type: "footer", text: templateFooter });
        }

        if (Array.isArray(templateButtons) && templateButtons.length > 0) {
            const buttonsArray = [];
            templateButtons.forEach(button => {
                if (button.type === 'COPY_CODE') {
                    buttonsArray.push({ type: "COPY_CODE", example: button.value, text: "Copy offer code" });
                } else if (button.type === 'PHONE_NUMBER') {
                    buttonsArray.push({ type: "PHONE_NUMBER", text: button.text, phone_number: button.value });
                } else if (button.type === 'URL' || button.type === 'otp') {
                    const urlButton = { type: "URL", text: button.text, url: button.value || "" };
                    if (button.value && button.value.includes('{{')) {
                        let exampleUrl = button.value.replace(/\{\{[\w_]+\}\}/g, 'example');
                        urlButton.example = [exampleUrl];
                    }
                    buttonsArray.push(urlButton);
                } else if (button.type === 'QUICK_REPLY') {
                    buttonsArray.push({ type: "QUICK_REPLY", text: button.text });
                }
            });
            if (buttonsArray.length > 0) {
                components.push({ type: "buttons", buttons: buttonsArray });
            }
        }

        const categoryMap = { 'Authentication': 'authentication', 'Marketing': 'marketing', 'Utility': 'utility' };
        const languageMap = { 'English(US)': 'en_US', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Hindi': 'hi', 'Other': 'en_US' };

        return {
            name: templateName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            category: categoryMap[templateCategory] || templateCategory.toLowerCase(),
            language: languageMap[templateLanguage] || 'en_US',
            parameter_format: "named",
            components: components
        };

        // Notice that broadcastTitleMediaKey is added to this dependency array below!
    }, [templateName, templateCategory, templateLanguage, broadcastTitleType, broadcastTitleText, broadcastTitleImageLink, broadcastTitleImageHandle, broadcastTitleVideoLink, broadcastTitleVideoHandle, broadcastTitleDocumentLink, broadcastTitleDocumentHandle, broadcastTitleLocationLatitude, broadcastTitleLocationLongitude, broadcastTitleLocationName, broadcastTitleLocationAddress, broadcastTitleVariables, templateBody, bodyVariables, templateFooter, templateButtons, broadcastTitleMediaKey]);

    const handleFinalSubmit = async (isDraft = false) => {
        try {
            setIsSubmitting(true);
            if (!templateName || !templateCategory || !templateBody) {
                alert('Please fill in Template Name, Category, and Body.');
                setIsSubmitting(false);
                return;
            }

            const missingHeaderVars = broadcastTitleVariables.filter(v => !v.value || v.value.trim() === '');
            if (missingHeaderVars.length > 0) {
                alert(`Please provide a sample value for the header variable: {{${missingHeaderVars[0].name}}}`);
                setIsSubmitting(false);
                return;
            }

            const missingBodyVars = bodyVariables.filter(v => !v.value || v.value.trim() === '');
            if (missingBodyVars.length > 0) {
                alert(`Please provide a sample value for the body variable: {{${missingBodyVars[0].name}}}`);
                setIsSubmitting(false);
                return;
            }

            let activeMediaId = broadcastTitleImageMediaId;
            const fileToUpload = broadcastTitleImageFile || broadcastTitleVideoFile || broadcastTitleDocumentFile;

            // Default to state variables in case the file was already uploaded inline earlier
            let uploadMediaS3Key = broadcastTitleMediaKey;
            let uploadMediaHandle = null;

            if (fileToUpload && !activeMediaId) {
                // Validate the file extension before uploading
                if (!validateFileExtension(fileToUpload)) {
                    alert('Invalid file type. Please upload a PDF, JPEG, PNG, or MP4 file.');
                    setIsSubmitting(false);
                    return;
                }

                const uploadResult = await uploadImageToAPI(fileToUpload);
                activeMediaId = uploadResult.mediaId;
                uploadMediaS3Key = uploadResult.s3_key;
                uploadMediaHandle = uploadResult.handle;

                setBroadcastTitleImageMediaId(activeMediaId);
                setBroadcastTitleMediaKey(uploadMediaS3Key);

                if (broadcastTitleType === 'image') setBroadcastTitleImageHandle(uploadMediaHandle);
                else if (broadcastTitleType === 'video') setBroadcastTitleVideoHandle(uploadMediaHandle);
                else if (broadcastTitleType === 'document') setBroadcastTitleDocumentHandle(uploadMediaHandle);
            }

            // Pass both overrides directly to the JSON generator
            const templateJSON = generateTemplateJSON(uploadMediaHandle, uploadMediaS3Key);
            const dbId = userData?.db_id || user?.db_id;
            const dbServerUrl = apiConfig.dbServerConfig.baseURL;
            const templateId = initialTemplate?.template_id || null;

            if (!isDraft) {
                //Run client side payload validation only when submitting to meta
                const validation = validateTemplateClientSide(templateJSON);
                if (!validation.isValid) {
                    alert(`Validation Error: ${validation.error}`);
                    setIsSubmitting(false);
                    return; // Stop the submission immediately!
                }
            }
            let url;
            let method = 'POST';

            if (isDraft) {
                url = templateId ? `${dbServerUrl}/api/templates/${dbId}/templates/${templateId}` : `${dbServerUrl}/api/templates/${dbId}/templates`;
                method = templateId ? 'PUT' : 'POST';
            } else {

                url = templateId ? `${dbServerUrl}/api/templates/${dbId}/templates/${templateId}/submit` : `${dbServerUrl}/api/templates/${dbId}/templates/submit`;
            }

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
            if (onSuccess) onSuccess(); // Trigger tab switch for both Drafts and Submits!
        } catch (error) {
            console.error('❌ Submission Error:', error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderHeaderHighlightedText = () => {
        if (!broadcastTitleText) return <span className="text-gray-400">Enter broadcast title text</span>;
        const parts = broadcastTitleText.split(/(\{\{[\w_]+\}\})/g);
        return parts.map((part, i) => {
            if (part.match(/^\{\{[\w_]+\}\}$/)) return <span key={i} className="text-blue-700 bg-blue-100 rounded">{part}</span>;
            return <span key={i}>{part}</span>;
        });
    };

    const renderHighlightedText = () => {
        if (!templateBody) return <span className="text-gray-400">Type your message here...</span>;
        const parts = templateBody.split(/(\{\{[\w_]+\}\})/g);
        return parts.map((part, i) => {
            if (part.match(/^\{\{[\w_]+\}\}$/)) return <span key={i} className="text-blue-700 bg-blue-100 rounded">{part}</span>;
            return <span key={i}>{part}</span>;
        });
    };


    // Replaces {{variable}} with the sample value for the preview mockup
    const renderPreviewText = (text, variables) => {
        if (!text) return '';
        let previewText = text;
        variables.forEach(v => {
            // If the user typed a sample value, show it. Otherwise, fallback to the {{name}}
            const displayValue = v.value ? v.value : `{{${v.name}}}`;
            // Use regex to replace all instances of this specific variable
            previewText = previewText.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), displayValue);
        });
        return previewText;
    };

    return (
        <div className="space-y-6">
            {/* Top Action Bar - Now ALWAYS visible */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={onCancel} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>New Templates</span>
                </button>

                <div className="flex justify-end space-x-3">
                    {activeTab === 'custom' && (
                        <button type="button" onClick={() => setShowJSONModal(true)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">View JSON</button>
                    )}
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => activeTab === 'custom' ? handleFinalSubmit(true) : carouselRef.current?.handleSave(true)}
                        className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Saving...' : 'Save as draft'}
                    </button>
                    <button
                        type="button"
                        onClick={() => activeTab === 'custom' ? handleFinalSubmit(false) : carouselRef.current?.handleSave(false)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Save and submit
                    </button>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex space-x-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('custom')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'custom'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Custom
                </button>
                <button
                    onClick={() => setActiveTab('carousel')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'carousel'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Media Carousel
                </button>
            </div>

            {/* TAB CONTENT RENDERER */}
            {activeTab === 'custom' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* LEFT COLUMN: FORM */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                                <input type="text" value={templateName} onChange={(e) => {
                                    let value = e.target.value.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
                                    if (value.length <= 512) setTemplateName(value);
                                }} maxLength={512} className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border" placeholder="Template Name" />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select value={templateCategory} onChange={(e) => {
                                    const newCategory = e.target.value;
                                    setTemplateCategory(newCategory);
                                    if (broadcastTitleType === 'location' && newCategory !== 'Utility' && newCategory !== 'Marketing') {
                                        setBroadcastTitleError('Location headers can only be used in templates categorized as UTILITY or MARKETING.');
                                        setBroadcastTitleType('none');
                                    } else if (broadcastTitleType === 'location') setBroadcastTitleError('');
                                }} className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border">
                                    <option value="">Select Category</option>
                                    <option value="Authentication">Authentication</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Utility">Utility</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                <select value={templateLanguage} onChange={(e) => setTemplateLanguage(e.target.value)} className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border">
                                    <option value="English(US)">English(US)</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ${isBuilderDisabled ? 'opacity-40 grayscale pointer-events-none select-none' : 'opacity-100'}`}>
                            {isBuilderDisabled && (
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6 text-blue-800 text-sm font-medium animate-pulse">
                                    👋 Please enter a Template Name, Category, and Language above to start building your message.
                                </div>
                            )}
                            {(templateCategory === '' || templateCategory !== 'Authentication') && (
                                <>
                                    <div className="mb-6">
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Template title (Optional)</label>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            {['none', 'text', 'image', 'video', 'document', 'location'].map((type) => (
                                                <label key={type} className="flex items-center cursor-pointer">
                                                    <input type="radio" name="broadcastTitleType" value={type} checked={broadcastTitleType === type} disabled={type === 'location' && templateCategory !== 'Utility' && templateCategory !== 'Marketing' && templateCategory !== ''} onChange={(e) => {
                                                        setBroadcastTitleType(e.target.value);
                                                        setBroadcastTitleError('');
                                                        if (e.target.value !== 'text') setBroadcastTitleVariables([]);
                                                    }} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                                    <span className="text-sm capitalize text-gray-700">{type}</span>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-4">
                                            {broadcastTitleType === 'text' && (
                                                <div className="space-y-3">
                                                    <div className="relative mb-2 flex flex-col">
                                                        <div className="absolute inset-0 w-full h-full px-3 py-2 pr-16 border border-transparent text-sm whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden">
                                                            {renderHeaderHighlightedText()}
                                                        </div>
                                                        <textarea ref={broadcastTitleTextRef} value={broadcastTitleText} onChange={(e) => handleTitleTextChange(e.target.value)} onBlur={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onKeyUp={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onClick={(e) => { headerSelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onScroll={(e) => { e.target.previousSibling.scrollTop = e.target.scrollTop; }} onKeyDown={(e) => {
                                                            const plainTextLength = broadcastTitleText.length - (broadcastTitleText.match(/\{\{[\w_]+\}\}/g) || []).join('').length;
                                                            if (plainTextLength >= 60 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                                                e.preventDefault();
                                                            }
                                                            if (e.key === 'Backspace') {
                                                                const textarea = e.target;
                                                                if (textarea.selectionStart === textarea.selectionEnd) {
                                                                    const match = broadcastTitleText.substring(0, textarea.selectionStart).match(/\{\{[\w_]+\}\}$/);
                                                                    if (match) {
                                                                        e.preventDefault();
                                                                        const newText = broadcastTitleText.substring(0, textarea.selectionStart - match[0].length) + broadcastTitleText.substring(textarea.selectionStart);
                                                                        handleTitleTextChange(newText); // <-- Changed here
                                                                        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(textarea.selectionStart - match[0].length, textarea.selectionStart - match[0].length); }, 0);
                                                                    }
                                                                }
                                                            }
                                                        }} className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[2.5rem] text-sm z-10 resize-none" style={{ color: 'transparent', caretColor: 'black', backgroundColor: 'transparent' }} spellCheck={false} />
                                                    </div>
                                                    {broadcastTitleVariables.length === 0 ? (
                                                        <button type="button" onClick={() => setShowAddVariable(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add variable</button>
                                                    ) : (
                                                        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded text-xs mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-blue-700 font-bold">{`{{${broadcastTitleVariables[0].name}}}`}</span>
                                                                <span className="text-gray-400">=</span>
                                                                <input type="text" value={broadcastTitleVariables[0].value} onChange={(e) => setBroadcastTitleVariables(prev => [{ ...prev[0], value: e.target.value }])} className={`px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 ${!broadcastTitleVariables[0].value ? 'border-red-400 bg-red-50 placeholder-red-300' : 'border-gray-300 bg-white'}`} placeholder="Required sample..." />
                                                            </div>
                                                            <button onClick={() => {
                                                                const newText = broadcastTitleText.replace(new RegExp(`\\{\\{${broadcastTitleVariables[0].name}\\}\\}`, 'g'), '');
                                                                handleTitleTextChange(newText);
                                                            }} className="text-red-500 hover:text-red-700 font-bold">✕</button>                                                        </div>
                                                    )}
                                                    {showAddVariable && (
                                                        <div className="mt-3 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Variable Name</label>
                                                                    <input type="text" value={newVariableName} onChange={(e) => setNewVariableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. name" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Sample Value</label>
                                                                    <input type="text" value={newVariableValue} onChange={(e) => setNewVariableValue(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. John" />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => {
                                                                    const varName = newVariableName.trim();
                                                                    if (!varName) return;
                                                                    if (broadcastTitleVariables.length >= 1) return alert("WhatsApp headers can only contain one variable.");
                                                                    const placeholder = `{{${varName}}}`;
                                                                    const startPos = headerSelection.current.start || broadcastTitleText.length;
                                                                    setBroadcastTitleText(broadcastTitleText.substring(0, startPos) + placeholder + broadcastTitleText.substring(headerSelection.current.end || broadcastTitleText.length));
                                                                    setBroadcastTitleVariables([{ name: varName, value: newVariableValue.trim() }]);
                                                                    setShowAddVariable(false); setNewVariableName(''); setNewVariableValue('');
                                                                }} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded">Insert Variable</button>
                                                                <button type="button" onClick={() => setShowAddVariable(false)} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded">Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {['image', 'video', 'document'].includes(broadcastTitleType) && (
                                                <div className="space-y-3 mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-center gap-2 mb-3 bg-white p-1 rounded-md border border-gray-300 w-fit shadow-sm">
                                                        <button type="button" onClick={() => setHeaderMediaSource('upload')} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${headerMediaSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Upload File</button>
                                                        <button type="button" onClick={() => setHeaderMediaSource('link')} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${headerMediaSource === 'link' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Paste Link</button>
                                                    </div>
                                                    {headerMediaSource === 'link' ? (
                                                        <input type="text" placeholder={`Paste ${broadcastTitleType} link here...`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" value={broadcastTitleType === 'image' ? broadcastTitleImageLink : broadcastTitleType === 'video' ? broadcastTitleVideoLink : broadcastTitleDocumentLink} onChange={(e) => {
                                                            if (broadcastTitleType === 'image') setBroadcastTitleImageLink(e.target.value);
                                                            if (broadcastTitleType === 'video') setBroadcastTitleVideoLink(e.target.value);
                                                            if (broadcastTitleType === 'document') setBroadcastTitleDocumentLink(e.target.value);
                                                        }} />
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-4">
                                                                {isMediaUploading ? (
                                                                    <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-blue-600 flex items-center gap-2 shadow-sm">
                                                                        <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Uploading {broadcastTitleType}...
                                                                    </div>
                                                                ) : (
                                                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 text-blue-600 shadow-sm transition-colors">
                                                                        <span>+ Choose {broadcastTitleType}</span>
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept={broadcastTitleType === 'image' ? 'image/*' : broadcastTitleType === 'video' ? 'video/mp4' : '.pdf'}
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files[0];
                                                                                if (!file) return;

                                                                                // 1. Save the local file to state
                                                                                if (broadcastTitleType === 'image') setBroadcastTitleImageFile(file);
                                                                                if (broadcastTitleType === 'video') setBroadcastTitleVideoFile(file);
                                                                                if (broadcastTitleType === 'document') setBroadcastTitleDocumentFile(file);

                                                                                // 2. Trigger the upload API immediately and show loader
                                                                                setIsMediaUploading(true);
                                                                                try {
                                                                                    if (file) {
                                                                                        const isValid = validateFileExtension(file);
                                                                                        if (!isValid) {
                                                                                            alert('Invalid file type. Please upload a PDF, JPEG, PNG, or MP4 file.');
                                                                                            setIsMediaUploading(false);
                                                                                            if (broadcastTitleType === 'image') setBroadcastTitleImageFile(null);
                                                                                            if (broadcastTitleType === 'video') setBroadcastTitleVideoFile(null);
                                                                                            if (broadcastTitleType === 'document') setBroadcastTitleDocumentFile(null);
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                    const uploadResult = await uploadImageToAPI(file);

                                                                                    // 3. Save the returned handle directly to state
                                                                                    if (broadcastTitleType === 'image') {
                                                                                        setBroadcastTitleImageHandle(uploadResult.handle);
                                                                                        setBroadcastTitleImageMediaId(uploadResult.mediaId);
                                                                                        setBroadcastTitleMediaKey(uploadResult.s3_key);
                                                                                    } else if (broadcastTitleType === 'video') {
                                                                                        setBroadcastTitleVideoHandle(uploadResult.handle);
                                                                                        setBroadcastTitleMediaKey(uploadResult.s3_key);
                                                                                    } else if (broadcastTitleType === 'document') {
                                                                                        setBroadcastTitleDocumentHandle(uploadResult.handle);
                                                                                        setBroadcastTitleMediaKey(uploadResult.s3_key);
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error("Immediate upload failed:", error);
                                                                                    alert("Failed to upload the file. Please try again.");

                                                                                    // Clear the file state if the upload failed
                                                                                    if (broadcastTitleType === 'image') setBroadcastTitleImageFile(null);
                                                                                    if (broadcastTitleType === 'video') setBroadcastTitleVideoFile(null);
                                                                                    if (broadcastTitleType === 'document') setBroadcastTitleDocumentFile(null);
                                                                                } finally {
                                                                                    // 4. Hide loader regardless of success or failure
                                                                                    setIsMediaUploading(false);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </label>
                                                                )}

                                                                {/* Success Indicator (Optional but recommended for UX) */}
                                                                {!isMediaUploading && (broadcastTitleImageHandle || broadcastTitleVideoHandle || broadcastTitleDocumentHandle) && (
                                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                        Uploaded successfully
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {broadcastTitleType === 'location' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" placeholder="Latitude" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={broadcastTitleLocationLatitude} onChange={(e) => setBroadcastTitleLocationLatitude(e.target.value)} />
                                                    <input type="text" placeholder="Longitude" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={broadcastTitleLocationLongitude} onChange={(e) => setBroadcastTitleLocationLongitude(e.target.value)} />
                                                    <input type="text" placeholder="Location Name" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" value={broadcastTitleLocationName} onChange={(e) => setBroadcastTitleLocationName(e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 my-6"></div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 font-semibold mb-2">Body</label>
                                        <div className="relative mb-2 flex flex-col">
                                            <div className="absolute inset-0 w-full h-full px-3 py-2 border border-transparent text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden">
                                                {renderHighlightedText()}
                                            </div>
                                            <textarea ref={bodyTextRef} value={templateBody} onChange={(e) => handleBodyTextChange(e.target.value)} onBlur={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onKeyUp={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onClick={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }} onScroll={(e) => { e.target.previousSibling.scrollTop = e.target.scrollTop; }} onKeyDown={(e) => {
                                                if (templateBody.length >= 1024 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
                                                if (e.key === 'Backspace' && e.target.selectionStart === e.target.selectionEnd) {
                                                    const match = templateBody.substring(0, e.target.selectionStart).match(/\{\{[\w_]+\}\}$/);
                                                    if (match) {
                                                        e.preventDefault();
                                                        const newText = templateBody.substring(0, e.target.selectionStart - match[0].length) + templateBody.substring(e.target.selectionStart);
                                                        handleBodyTextChange(newText); // <-- Changed here
                                                        setTimeout(() => { e.target.focus(); e.target.setSelectionRange(e.target.selectionStart - match[0].length, e.target.selectionStart - match[0].length); }, 0);
                                                    }
                                                }
                                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[10rem] text-sm leading-relaxed z-10 resize-none" style={{ color: 'transparent', caretColor: 'black', backgroundColor: 'transparent' }} spellCheck={false} />
                                        </div>
                                        <button type="button" onClick={() => setShowAddBodyVariable(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">+ Add variable</button>
                                        {showAddBodyVariable && (
                                            <div className="mt-3 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Variable Name</label>
                                                        <input type="text" value={newBodyVariableName} onChange={(e) => setNewBodyVariableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. order_id" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Sample Value</label>
                                                        <input type="text" value={newBodyVariableValue} onChange={(e) => setNewBodyVariableValue(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded" placeholder="12345" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => {
                                                        const varName = newBodyVariableName.trim();
                                                        if (!varName || bodyVariables.some(v => v.name === varName)) return;
                                                        const placeholder = `{{${varName}}}`;
                                                        const startPos = bodySelection.current.start || templateBody.length;
                                                        setTemplateBody(templateBody.substring(0, startPos) + placeholder + templateBody.substring(bodySelection.current.end || templateBody.length));
                                                        setBodyVariables(prev => [...prev, { name: varName, value: newBodyVariableValue.trim() }]);
                                                        setShowAddBodyVariable(false); setNewBodyVariableName(''); setNewBodyVariableValue('');
                                                    }} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded">Insert Variable</button>
                                                    <button type="button" onClick={() => setShowAddBodyVariable(false)} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                        {bodyVariables.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-xs font-semibold text-gray-700">Active Variables:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {bodyVariables.map((v, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded shadow-sm text-[11px]">
                                                            <span className="font-mono font-bold text-blue-700">{`{{${v.name}}}`}</span>
                                                            <span className="text-gray-400">=</span>
                                                            <input type="text" value={v.value} onChange={(e) => setBodyVariables(prev => prev.map(item => item.name === v.name ? { ...item, value: e.target.value } : item))} className={`px-1.5 py-0.5 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 ${!v.value ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`} placeholder="Sample..." />
                                                            <button onClick={() => {
                                                                const newText = templateBody.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), '');
                                                                handleBodyTextChange(newText);
                                                            }} className="ml-1 text-red-500 font-bold">✕</button>                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-300 my-6"></div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 font-semibold mb-2">Footer (Optional)</label>
                                        <input type="text" value={templateFooter} onChange={(e) => setTemplateFooter(e.target.value)} maxLength={60} placeholder="Enter footer text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                                    </div>

                                    <div className="border-t border-gray-300 my-6"></div>
                                </>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Buttons</label>
                                    <span className="text-xs text-gray-500">{templateButtons.length}/10</span>
                                </div>

                                {templateButtons.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {templateButtons.map((button, index) => {
                                            // Check the current template status
                                            const isDraft = initialTemplate?.template_status === 'draft' || !initialTemplate?.template_status;
                                            // --- ✅ NEW INLINE EDITOR BLOCK ---
                                            if (editingButtonIndex === index) {
                                                return (
                                                    <div key={index} className="border border-blue-400 rounded-lg p-3 bg-blue-50 shadow-sm">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-xs font-bold text-blue-700 uppercase">Editing Button {index + 1}</span>
                                                            <button type="button" onClick={() => setEditingButtonIndex(null)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
                                                        </div>

                                                        <select
                                                            value={button.type}
                                                            onChange={(e) => {
                                                                const updated = [...templateButtons];
                                                                // ✅ Force text to "Copy offer code" if switching to COPY_CODE
                                                                const isCopyCode = e.target.value === 'COPY_CODE';
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    type: e.target.value,
                                                                    text: isCopyCode ? 'Copy offer code' : updated[index].text,
                                                                    value: ''
                                                                };
                                                                setTemplateButtons(updated);
                                                            }}
                                                            className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg bg-white"
                                                        >
                                                            <option value="">Select button type</option>
                                                            {(button.type === 'COPY_CODE' || templateButtons.filter(b => b.type === 'COPY_CODE').length === 0) && <option value="COPY_CODE">Copy Code</option>}
                                                            <option value="OTP">One-Time Password</option>
                                                            {(button.type === 'PHONE_NUMBER' || templateButtons.filter(b => b.type === 'PHONE_NUMBER').length === 0) && <option value="PHONE_NUMBER">Phone Number</option>}
                                                            {(button.type === 'QUICK_REPLY' || templateButtons.filter(b => b.type === 'QUICK_REPLY').length < 10) && <option value="QUICK_REPLY">Quick Reply</option>}
                                                            {(button.type === 'URL' || templateButtons.filter(b => b.type === 'URL').length < 2) && <option value="URL">URL</option>}
                                                        </select>

                                                        <input
                                                            type="text"
                                                            // ✅ Force display value for COPY_CODE
                                                            value={button.type === 'COPY_CODE' ? 'Copy offer code' : button.text}
                                                            // ✅ Disable editing if COPY_CODE
                                                            disabled={button.type === 'COPY_CODE'}
                                                            onChange={(e) => {
                                                                const updated = [...templateButtons];
                                                                updated[index] = { ...updated[index], text: e.target.value };
                                                                setTemplateButtons(updated);
                                                            }}
                                                            // ✅ Add gray background and restricted cursor if disabled
                                                            className={`w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg ${button.type === 'COPY_CODE' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                                                                }`}
                                                            placeholder="Button text"
                                                            maxLength={25}
                                                        />

                                                        {['COPY_CODE', 'PHONE_NUMBER', 'URL'].includes(button.type) && (
                                                            <input
                                                                type="text"
                                                                value={button.value || button.placeholder || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...templateButtons];
                                                                    updated[index] = { ...updated[index], value: e.target.value };
                                                                    setTemplateButtons(updated);
                                                                }}
                                                                className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg bg-white"
                                                                placeholder="Value (e.g. Link, Phone, Code)"
                                                            />
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!button.type || !button.text.trim()) return alert('Please fill in the button text and type.');
                                                                setEditingButtonIndex(null);
                                                            }}
                                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded font-medium w-full"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            // --- END INLINE EDITOR ---
                                            return (
                                                <div key={index} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-gray-700">{button.type}</span>
                                                        <div className="flex gap-3">
                                                            {/* Only show Edit if it's NOT a draft */}
                                                            {(
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingButtonIndex(index);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = templateButtons.filter((_, i) => i !== index);
                                                                    updated.filter(b => b.type === 'QUICK_REPLY').forEach((btn, idx) => btn.index = idx);
                                                                    setTemplateButtons(updated);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-gray-700">
                                                        <div className="mb-1"><strong>Text:</strong> {button.text}</div>

                                                        {/* If it takes a value (URL/Phone), handle Draft vs Non-Draft display */}
                                                        {['URL', 'PHONE', 'COPY_CODE'].includes(button.type) && (
                                                            <div className="flex flex-col gap-1 mt-2">
                                                                <span>
                                                                    {{
                                                                        url: 'URL',
                                                                        phone: 'Phone Number',
                                                                        COPY_CODE: 'Copy Code'
                                                                    }[button.type] || 'Value:'}
                                                                </span>
                                                                {isDraft ? (
                                                                    <input
                                                                        type="text"
                                                                        value={button.value || ''}
                                                                        onChange={(e) => {
                                                                            // Update the value directly in the active array
                                                                            const updated = [...templateButtons];
                                                                            updated[index].value = e.target.value;
                                                                            setTemplateButtons(updated);
                                                                        }}
                                                                        placeholder={button.placeholder || button.value || ''}
                                                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                    />
                                                                ) : (
                                                                    <span>{button.value}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {templateButtons.length < 10 && (
                                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                                        <select
                                            value={newButtonType}
                                            onChange={(e) => {
                                                const selectedType = e.target.value;
                                                setNewButtonType(selectedType);
                                                setNewButtonValue('');

                                                // ✅ Instantly force the text state if they select COPY_CODE
                                                if (selectedType === 'COPY_CODE') {
                                                    setNewButtonText('Copy offer code');
                                                } else {
                                                    setNewButtonText('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg bg-white"
                                        >
                                            <option value="">Select button type</option>
                                            {templateButtons.filter(b => b.type === 'COPY_CODE').length === 0 && <option value="COPY_CODE">Copy Code</option>}
                                            <option value="OTP">One-Time Password</option>
                                            <option value="PHONE_NUMBER">Phone Number</option>
                                            {templateButtons.filter(b => b.type === 'QUICK_REPLY').length < 10 && <option value="QUICK_REPLY">Quick Reply</option>}
                                            {templateButtons.filter(b => b.type === 'URL').length < 2 && <option value="URL">URL</option>}
                                        </select>

                                        <input
                                            type="text"
                                            // ✅ Force the display value and disable editing if COPY_CODE
                                            value={newButtonType === 'COPY_CODE' ? 'Copy offer code' : newButtonText}
                                            disabled={newButtonType === 'COPY_CODE'}
                                            onChange={(e) => setNewButtonText(e.target.value)}
                                            className={`w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg ${newButtonType === 'COPY_CODE' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                                                }`}
                                            placeholder="Button text"
                                            maxLength={20}
                                        />

                                        {['COPY_CODE', 'PHONE_NUMBER', 'URL'].includes(newButtonType) && (
                                            <input
                                                type="text"
                                                value={newButtonValue}
                                                onChange={(e) => setNewButtonValue(e.target.value)}
                                                className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg bg-white"
                                                placeholder="Value"
                                            />
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!newButtonType || !newButtonText.trim()) return alert('Fill button info');

                                                // ✅ Safety check: Ensure the exact required text is used in the final object
                                                const finalButtonText = newButtonType === 'COPY_CODE' ? 'Copy offer code' : newButtonText.trim();

                                                const newButton = { type: newButtonType, text: finalButtonText, value: newButtonValue.trim() };
                                                if (newButtonType === 'QUICK_REPLY') newButton.index = templateButtons.filter(b => b.type === 'QUICK_REPLY').length;

                                                setTemplateButtons([...templateButtons, newButton]);
                                                setNewButtonType(''); setNewButtonText(''); setNewButtonValue('');
                                            }}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded"
                                        >
                                            Add Button
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div>
                        <div className="sticky top-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                            <div className="flex justify-center">
                                <div className="relative w-[260px] h-[520px] bg-gray-900 rounded-[2.5rem] p-1.5 shadow-2xl flex items-center justify-center text-gray-400 text-xs italic">
                                    <div className="w-full h-full bg-[#ece5dd] rounded-[2rem] overflow-hidden flex flex-col pt-12 pb-4 px-2 text-black not-italic" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23d4d4d4' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' opacity='0.1'/%3E%3C/svg%3E")` }}>
                                        {(templateBody || broadcastTitleType !== 'none') ? (
                                            <div className="bg-white rounded-lg p-2 text-xs shadow-sm self-start max-w-[90%]">
                                                {broadcastTitleType === 'text' && <div className="font-bold mb-1">
                                                    {renderPreviewText(broadcastTitleText, broadcastTitleVariables)}
                                                </div>}
                                                {['image', 'video', 'document'].includes(broadcastTitleType) && (
                                                    <div className="mb-1 rounded overflow-hidden">
                                                        {(() => {
                                                            // 1. Determine the source URL
                                                            let sourceUrl = '';
                                                            if (broadcastTitleMediaKey) {
                                                                // Ensure proper slash formatting between the Bucket URL and the S3 Key
                                                                const baseUrl = process.env.REACT_APP_S3_MEDIA_BUCKET_URL?.replace(/\/$/, '') + '/';
                                                                sourceUrl = baseUrl + broadcastTitleMediaKey;
                                                            } else if (headerMediaSource === 'link') {
                                                                if (broadcastTitleType === 'image') sourceUrl = broadcastTitleImageLink;
                                                                if (broadcastTitleType === 'video') sourceUrl = broadcastTitleVideoLink;
                                                                if (broadcastTitleType === 'document') sourceUrl = broadcastTitleDocumentLink;
                                                            }

                                                            // 2. Show loading state if currently uploading
                                                            if (isMediaUploading) {
                                                                return (
                                                                    <div className="h-32 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 animate-pulse rounded">
                                                                        Uploading {broadcastTitleType}...
                                                                    </div>
                                                                );
                                                            }

                                                            // 3. Show placeholder if no media is selected yet
                                                            if (!sourceUrl) {
                                                                return (
                                                                    <div className="h-20 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 rounded">
                                                                        [{broadcastTitleType.toUpperCase()}]
                                                                    </div>
                                                                );
                                                            }

                                                            // 4. Render the actual media based on type
                                                            if (broadcastTitleType === 'image') {
                                                                return <img src={sourceUrl} alt="Header Preview" className="w-full h-auto max-h-40 object-cover rounded" />;
                                                            } else if (broadcastTitleType === 'video') {
                                                                return <video src={sourceUrl} controls className="w-full h-auto max-h-40 rounded bg-black" />;
                                                            } else if (broadcastTitleType === 'document') {
                                                                return (
                                                                    <div className="p-2 bg-gray-100 rounded flex items-center gap-2 border border-gray-200">
                                                                        <div className="h-8 w-8 bg-red-100 text-red-600 rounded flex items-center justify-center text-[10px] font-bold">
                                                                            DOC
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-700 truncate flex-1" title={sourceUrl}>
                                                                            {broadcastTitleMediaKey ? broadcastTitleMediaKey.split('/').pop() : 'Attached Document'}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                                <div className="whitespace-pre-wrap">{renderPreviewText(templateBody, bodyVariables)}</div>
                                                {templateFooter && <div className="text-[10px] text-gray-500 mt-1">{templateFooter}</div>}
                                            </div>
                                        ) : <span className="text-gray-500">Preview will appear here</span>}
                                        {templateButtons.map((b, i) => (
                                            <div key={i} className="mt-1 bg-white text-blue-500 text-center py-1.5 rounded-lg text-xs shadow-sm self-start w-[90%] font-medium">{b.text}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <MediaCarouselEditor
                    ref={carouselRef}
                    user={user}
                    userData={userData}
                    initialTemplate={initialTemplate}
                    onSuccess={onSuccess}
                    templateName={templateName}
                    setTemplateName={setTemplateName}
                    templateLanguage={templateLanguage}
                    setTemplateLanguage={setTemplateLanguage}
                    setIsSubmitting={setIsSubmitting}
                />
            )}

            {showJSONModal && activeTab === 'custom' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowJSONModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Template JSON</h2>
                            <button onClick={() => setShowJSONModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4 overflow-auto flex-1">
                            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-800">{JSON.stringify(generateTemplateJSON(), null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};