import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { apiConfig } from '../../../../../config/api';

const MediaCarouselEditor = forwardRef(({
    user,
    userData,
    initialTemplate,
    onSuccess,
    templateName,
    setTemplateName,
    templateLanguage,
    setTemplateLanguage,
    setIsSubmitting
}, ref) => {

    // --- Carousel States ---
    const [templateBody, setTemplateBody] = useState('');
    const [bodyVariables, setBodyVariables] = useState([]);
    const bodyTextRef = useRef(null);
    const bodySelection = useRef({ start: 0, end: 0 });

    const [showAddBodyVariable, setShowAddBodyVariable] = useState(false);
    const [newBodyVariableName, setNewBodyVariableName] = useState('');
    const [newBodyVariableValue, setNewBodyVariableValue] = useState('');

    const [cards, setCards] = useState([
        { id: 1, mediaFile: null, mediaPreviewUrl: '', mediaHandle: '', bodyText: '', buttons: [], draftButton: { type: '', text: '', value: '' } },
        { id: 2, mediaFile: null, mediaPreviewUrl: '', mediaHandle: '', bodyText: '', buttons: [], draftButton: { type: '', text: '', value: '' } }
    ]);

    //Buttons to be mandated for the user to fill if they come with default templates
    const [requiredSeedButtons, setRequiredSeedButtons] = useState([]);

    // --- JSON Generator strictly following Meta Guidelines ---
    const generateCarouselJSON = (processedCards) => {
        const languageMap = { 'English(US)': 'en_US', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Hindi': 'hi', 'Other': 'en_US' };
        const components = [];

        if (templateBody) {
            const bodyComponent = { type: "body", text: templateBody };
            const variablePattern = /\{\{([\w_]+)\}\}/g;
            const matches = [...templateBody.matchAll(variablePattern)];

            if (matches.length > 0) {
                bodyComponent.example = {
                    body_text_named_params: matches.map(match => {
                        const varName = match[1];
                        const stateVar = bodyVariables.find(v => v.name === varName);
                        return { param_name: varName, example: stateVar.value.trim() }; // STRICT: No fallback
                    })
                };
            }
            components.push(bodyComponent);
        }

        const carouselCards = processedCards.map((card) => {
            const cardComponents = [];

            if (card.mediaHandle || card.mediaPreviewUrl) {
                cardComponents.push({
                    type: "header",
                    format: card.mediaFile?.type?.includes('video') ? "video" : "image",
                    example: {
                        header_handle: card.mediaHandle ? [card.mediaHandle] : [],
                        // Inject the S3 URL directly into the JSON so it's saved in the DB
                        _draft_preview_url: card.mediaPreviewUrl || ''
                    }
                });
            }

            if (card.bodyText) {
                cardComponents.push({
                    type: "body",
                    text: card.bodyText
                });
            }

            if (card.buttons && card.buttons.length > 0) {
                const buttonsArray = [];
                card.buttons.forEach(button => {
                    if (button.type === 'phone_number') {
                        buttonsArray.push({ type: "phone_number", text: button.text, phone_number: button.value });
                    } else if (button.type === 'url') {
                        const urlButton = { type: "url", text: button.text, url: button.value || "" };
                        if (button.value && button.value.includes('{{')) {
                            let exampleUrl = button.value.replace(/\{\{[\w_]+\}\}/g, 'example');
                            urlButton.example = [exampleUrl];
                        }
                        buttonsArray.push(urlButton);
                    } else if (button.type === 'quick_reply') {
                        buttonsArray.push({ type: "quick_reply", text: button.text });
                    }
                });

                cardComponents.push({
                    type: "buttons",
                    buttons: buttonsArray
                });
            }

            return { components: cardComponents };
        });

        if (carouselCards.length > 0) {
            components.push({
                type: "carousel",
                cards: carouselCards
            });
        }

        return {
            name: templateName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            category: "marketing",
            language: languageMap[templateLanguage] || 'en_US',
            parameter_format: "named",
            template_type: "media_carousel",
            components: components
        };
    };

    useImperativeHandle(ref, () => ({
        handleSave: async (isDraft) => {
            try {
                if (setIsSubmitting) setIsSubmitting(true);

                if (!templateName || !templateBody) {
                    alert('Please fill in the Template Name and the main Body text.');
                    if (setIsSubmitting) setIsSubmitting(false);
                    return;
                }

                const missingBodyVars = bodyVariables.filter(v => !v.value || v.value.trim() === '');
                if (missingBodyVars.length > 0) {
                    alert(`Please provide a sample value for the body variable: {{${missingBodyVars[0].name}}}`);
                    if (setIsSubmitting) setIsSubmitting(false);
                    return;
                }

                const bodyMatches = templateBody.match(/\{\{[\w_]+\}\}/g) || [];
                const uniqueBodyVars = new Set(bodyMatches.map(m => m.replace(/[{}]/g, '')));

                if (uniqueBodyVars.size > 2) {
                    alert(`Meta Rule: Carousel body text can contain a maximum of 2 distinct variables. You currently have ${uniqueBodyVars.size} variables explicitly typed in the box.`);
                    if (setIsSubmitting) setIsSubmitting(false);
                    return;
                }

                // --- META VALIDATION: Enforce Uniformity ---
                const firstCardHasMedia = !!(cards[0].mediaFile || cards[0].mediaHandle);
                const firstCardHasBody = cards[0].bodyText.trim().length > 0;
                const firstCardButtonCount = cards[0].buttons.length;

                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const hasMedia = !!(card.mediaFile || card.mediaHandle);
                    const hasBody = card.bodyText.trim().length > 0;

                    if (!hasMedia) {
                        alert(`Card ${i + 1} is missing a media asset. All cards must have an image or video.`);
                        if (setIsSubmitting) setIsSubmitting(false);
                        return;
                    }
                    if (hasBody !== firstCardHasBody) {
                        alert(`Meta Rule: All cards must have the same components. Card 1 ${firstCardHasBody ? 'has' : 'does not have'} body text, but Card ${i + 1} ${hasBody ? 'has' : 'does not have'} body text.`);
                        if (setIsSubmitting) setIsSubmitting(false);
                        return;
                    }
                    if (card.buttons.length !== firstCardButtonCount) {
                        alert(`Meta Rule: All cards must have the same number of buttons. Card 1 has ${firstCardButtonCount} button(s), but Card ${i + 1} has ${card.buttons.length}.`);
                        if (setIsSubmitting) setIsSubmitting(false);
                        return;
                    }

                    for (let j = 0; j < firstCardButtonCount; j++) {
                        const btn = card.buttons[j];
                        const baseBtn = cards[0].buttons[j];

                        if (btn.type !== baseBtn.type) {
                            alert(`Meta Rule: Button types must match exactly across all cards. Card 1 has a '${baseBtn.type}' button at position ${j + 1}, but Card ${i + 1} has a '${btn.type}' button.`);
                            if (setIsSubmitting) setIsSubmitting(false);
                            return;
                        }

                        // NEW: Value enforcement
                        if ((btn.type === 'url' || btn.type === 'phone_number') && (!btn.value || !btn.value.trim())) {
                            alert(`Please enter a valid ${btn.type === 'url' ? 'URL' : 'phone number'} for the button on Card ${i + 1}.`);
                            if (setIsSubmitting) setIsSubmitting(false);
                            return;
                        }

                        if (btn.type === 'url' && btn.value.includes('{{')) {
                            const urlMatches = btn.value.match(/\{\{[\w_]+\}\}/g) || [];
                            if (urlMatches.length > 1) {
                                alert(`Meta Rule: URL buttons can contain a maximum of 1 variable. Card ${i + 1}'s URL button currently contains ${urlMatches.length} variables explicitly typed in the box.`);
                                if (setIsSubmitting) setIsSubmitting(false);
                                return;
                            }
                            if (!btn.value.trim().endsWith(urlMatches[0])) {
                                alert(`Meta Rule: The variable in a URL button MUST be explicitly appended to the very end of the URL string. Please fix the URL on Card ${i + 1}.`);
                                if (setIsSubmitting) setIsSubmitting(false);
                                return;
                            }
                        }
                    }
                }
                // -------------------------------------------

                const dbServerUrl = apiConfig.dbServerConfig.baseURL;
                const dbId = userData?.db_id || user?.db_id;

                const uploadMedia = async (file) => {
                    const uploadUrl = `${dbServerUrl}/api/templates/${dbId}/templates/upload_media`;
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                    if (!response.ok) throw new Error('Media upload failed');
                    const result = await response.json();
                    let handle = result.data?.uploaded_file_handle || result.uploaded_file_handle || result.handle;
                    let s3_key = result.data?.s3_key || result.s3_key || result.data?.key || result.key;
                    return { handle: handle || null, s3_key: s3_key || null };
                };

                const processedCards = await Promise.all(cards.map(async (card) => {
                    let updatedHandle = card.mediaHandle;
                    let updatedPreviewUrl = card.mediaPreviewUrl;

                    if (card.mediaFile && !updatedHandle) {
                        const uploadResult = await uploadMedia(card.mediaFile);
                        updatedHandle = uploadResult.handle;
                        updatedPreviewUrl = uploadResult.s3_key;
                        updatedPreviewUrl = `${process.env.REACT_APP_S3_MEDIA_BUCKET_URL}${updatedPreviewUrl}`;
                    }
                    return { ...card, mediaHandle: updatedHandle, mediaPreviewUrl: updatedPreviewUrl };
                }));

                setCards(processedCards);
                const templateJSON = generateCarouselJSON(processedCards);

                // --- NEW: SMART DRAFT EDITING LOGIC ---
                // Check if we are editing a draft that already exists in the database
                const isExistingDraft = initialTemplate && initialTemplate.template_id && initialTemplate.template_status === 'draft';

                let submitUrl;
                let fetchMethod;
                let bodyPayload;

                if (isExistingDraft) {
                    if (isDraft) {
                        // Scenario A: User is updating an existing draft
                        submitUrl = `${dbServerUrl}/api/templates/${dbId}/templates/${initialTemplate.template_id}`;
                        fetchMethod = 'PUT';
                        bodyPayload = { object: templateJSON };
                    } else {
                        // Scenario B: User edited a draft and now wants to Submit it to Meta
                        // Step 1: Update the draft in the database first to ensure latest edits are saved
                        await fetch(`${dbServerUrl}/api/templates/${dbId}/templates/${initialTemplate.template_id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                            },
                            body: JSON.stringify({ object: templateJSON })
                        });

                        // Step 2: Trigger the backend submission route
                        submitUrl = `${dbServerUrl}/api/templates/${dbId}/templates/${initialTemplate.template_id}/submit_carousel_template`;
                        fetchMethod = 'POST';
                        bodyPayload = {
                        template_status: isDraft ? 'draft' : 'pending',
                        object: templateJSON
                        };
                    }
                } else {
                    // Scenario C: User is creating a brand new template from scratch
                    const endpoint = isDraft ? 'draft_carousel_template' : 'submit_carousel_template';
                    submitUrl = `${dbServerUrl}/api/templates/${dbId}/${endpoint}`;
                    fetchMethod = 'POST';
                    bodyPayload = {
                        template_status: isDraft ? 'draft' : 'pending',
                        object: templateJSON
                    };
                }

                const response = await fetch(submitUrl, {
                    method: fetchMethod,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: JSON.stringify(bodyPayload)
                });
                // ----------------------------------------

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to submit carousel template');
                }

                alert(`Carousel ${isDraft ? 'Draft' : 'Template'} Saved Successfully!`);
                if (onSuccess) onSuccess();

            } catch (error) {
                console.error('❌ Submission Error:', error);
                alert(error.message);
            } finally {
                if (setIsSubmitting) setIsSubmitting(false);
            }
        }
    }));

    // --- TEMPLATE HYDRATION (Load from API with Seed Logic) ---
    useEffect(() => {
        if (!initialTemplate || Object.keys(initialTemplate).length === 0) return;

    // --- SAFELY PARSE THE OBJECT ---
    let templateData = initialTemplate.object || initialTemplate;
    if (typeof templateData === 'string') {
      try {
        templateData = JSON.parse(templateData);
      } catch (e) {
        console.error("Failed to parse carousel template object", e);
      }
    }

    const components = templateData.components || [];

        // 1. Parse Root Body & Variables
        const rootBody = components.find(c => c.type?.toLowerCase() === 'body');
        if (rootBody) {
            setTemplateBody(rootBody.text || '');
            if (rootBody.example?.body_text_named_params) {
                setBodyVariables(rootBody.example.body_text_named_params.map(p => ({
                    name: p.param_name,
                    value: p.example || ''
                })));
            }
        }

        // 2. Parse Root "Seed" Buttons (if available)
        const rootButtonsComp = components.find(c => c.type?.toLowerCase() === 'buttons');
        const rootReadyButtons = [];
        let rootDraftButton = { type: '', text: '', value: '' };
        const tempRequired = []; // NEW: Array to track what the backend requires

        if (rootButtonsComp && Array.isArray(rootButtonsComp.buttons)) {
            rootButtonsComp.buttons.forEach(b => {
                const btnType = b.type?.toLowerCase();

                // Remember that the backend mandated this button type
                tempRequired.push({ type: btnType, text: b.text || '' });

                // If it's a URL or Phone button, stage it in the draft area
                if (btnType === 'url' || btnType === 'phone_number') {
                    if (!rootDraftButton.type) {
                        rootDraftButton = {
                            type: btnType,
                            text: b.text || '',
                            value: '' // Explicitly clear the backend URL so the user must type it
                        };
                    }
                } else {
                    // Quick replies don't require values, so they go straight to active buttons
                    rootReadyButtons.push({
                        type: btnType,
                        text: b.text || '',
                        value: ''
                    });
                }
            });
        }

        // Save the mandated buttons into state
        setRequiredSeedButtons(tempRequired);

        // 3. Parse actual Carousel Cards (if resuming a saved draft/template)
        const carouselComp = components.find(c => c.type?.toLowerCase() === 'carousel');
        let loadedCards = [];

        if (carouselComp && Array.isArray(carouselComp.cards)) {
            loadedCards = carouselComp.cards.map((card, idx) => {
                const cardComps = card.components || [];
                const header = cardComps.find(c => c.type?.toLowerCase() === 'header');
                const body = cardComps.find(c => c.type?.toLowerCase() === 'body');
                const buttonsComp = cardComps.find(c => c.type?.toLowerCase() === 'buttons');

                const parsedButtons = [];
                if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
                    buttonsComp.buttons.forEach(b => {
                        parsedButtons.push({
                            type: b.type?.toLowerCase(),
                            text: b.text || '',
                            value: b.url || b.phone_number || ''
                        });
                    });
                }

                let handle = '';
                let savedPreviewUrl = ''; // NEW

                if (header?.example) {
                    if (header.example.header_handle?.[0]) {
                        handle = header.example.header_handle[0];
                    }
                    if (header.example._draft_preview_url) {
                        savedPreviewUrl = header.example._draft_preview_url; // EXTRACT
                    }
                }

                return {
                    id: Date.now() + idx,
                    mediaFile: null,
                    mediaPreviewUrl: savedPreviewUrl, // INJECT INTO STATE
                    mediaHandle: handle,
                    bodyText: body?.text || '',
                    // Use card-specific buttons if available, otherwise default to the seeded root buttons
                    buttons: parsedButtons.length > 0 ? parsedButtons : [...rootReadyButtons],
                    draftButton: parsedButtons.length > 0 ? { type: '', text: '', value: '' } : { ...rootDraftButton }
                };
            });
        }

        // Ensure a minimum of 2 cards (Injects seed buttons if starting from a fresh library template)
        while (loadedCards.length < 2) {
            loadedCards.push({
                id: Date.now() + Math.random(),
                mediaFile: null,
                mediaPreviewUrl: '',
                mediaHandle: '',
                bodyText: '',
                buttons: [...rootReadyButtons], // Inject ready seed buttons (like quick replies)
                draftButton: { ...rootDraftButton } // Inject the URL button into the editable draft area
            });
        }

        setCards(loadedCards);

        setCards(loadedCards);
    }, [initialTemplate]);

    useEffect(() => {
        const matches = templateBody.match(/\{\{[\w_]+\}\}/g) || [];
        const activeNamesInText = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].slice(0, 2);

        setBodyVariables((prev) => {
            const nextVars = prev.filter(v => activeNamesInText.includes(v.name));
            activeNamesInText.forEach(name => {
                if (!nextVars.some(v => v.name === name)) {
                    nextVars.push({ name: name, value: '' });
                }
            });
            return nextVars;
        });
    }, [templateBody]);

    const renderHighlightedText = () => {
        if (!templateBody) return <span className="text-gray-400">Add the Carousels body text here</span>;
        const parts = templateBody.split(/(\{\{[\w_]+\}\})/g);
        return parts.map((part, i) => {
            if (part.match(/^\{\{[\w_]+\}\}$/)) return <span key={i} className="text-blue-700 bg-blue-100 rounded">{part}</span>;
            return <span key={i}>{part}</span>;
        });
    };

    const getPreviewBodyText = () => {
        if (!templateBody) return '';
        let previewText = templateBody;

        bodyVariables.forEach(v => {
            if (v.value && v.value.trim() !== '') {
                const regex = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g');
                previewText = previewText.replace(regex, v.value);
            }
        });

        return previewText;
    };

    const addCard = () => {
        if (cards.length < 10) {
            setCards([...cards, { id: Date.now(), mediaFile: null, mediaPreviewUrl: '', mediaHandle: '', bodyText: '', buttons: [], draftButton: { type: '', text: '', value: '' } }]);
        }
    };

    const removeCard = (id) => {
        if (cards.length > 2) {
            setCards(cards.filter(card => card.id !== id));
        } else {
            alert("A carousel must have at least 2 cards.");
        }
    };

    const updateCard = (id, field, value) => {
        setCards(cards.map(card => card.id === id ? { ...card, [field]: value } : card));
    };

    const handleMediaUpload = (id, file) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setCards(cards.map(card => card.id === id ? { ...card, mediaFile: file, mediaPreviewUrl: previewUrl, mediaHandle: '' } : card));
        }
    };

    const updateDraftButton = (cardId, field, value) => {
        setCards(prevCards => prevCards.map(card => {
            if (card.id === cardId) {
                return { ...card, draftButton: { ...card.draftButton, [field]: value } };
            }
            return card;
        }));
    };

    const addCardButton = (cardId) => {
        setCards(prevCards => prevCards.map(card => {
            if (card.id === cardId && card.buttons.length < 2) {
                const { type, text, value } = card.draftButton;

                if (!type || !text.trim()) {
                    alert('Please select a button type and enter the button text.');
                    return card;
                }

                // NEW: Inline value validation when pressing Add Button
                if (type === 'url' && (!value || !value.trim())) {
                    alert('Please enter a valid URL for the URL button.');
                    return card;
                }
                if (type === 'phone_number' && (!value || !value.trim())) {
                    alert('Please enter a valid phone number.');
                    return card;
                }

                if (type === 'url' && value.includes('{{')) {
                    const varMatches = value.match(/\{\{[\w_]+\}\}/g) || [];
                    if (varMatches.length > 1) {
                        alert('Meta Rule: URL buttons can contain a maximum of 1 variable.');
                        return card;
                    }
                    if (!value.trim().endsWith(varMatches[0])) {
                        alert('Meta Rule: The variable in a URL button MUST be explicitly appended to the very end of the URL string.');
                        return card;
                    }
                }

                const newButton = { type, text: text.trim(), value: value.trim() };
                return { ...card, buttons: [...card.buttons, newButton], draftButton: { type: '', text: '', value: '' } };
            }
            return card;
        }));
    };

    const removeCardButton = (cardId, buttonIndex) => {
        setCards(prevCards => prevCards.map(card => {
            if (card.id === cardId) {
                const newButtons = card.buttons.filter((_, idx) => idx !== buttonIndex);
                return { ...card, buttons: newButtons };
            }
            return card;
        }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* LEFT COLUMN: FORM */}
            <div className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, ''))}
                            maxLength={512}
                            className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                            placeholder="Template Name"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <input type="text" value="Marketing" disabled className="w-full h-8 px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg box-border cursor-not-allowed" />
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

                <div className="border-t border-gray-300 my-6"></div>

                {/* Message Body */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 font-semibold mb-2">Body (Max 2 variables)</label>
                    <div className="relative mb-2 flex flex-col">
                        <div className="absolute inset-0 w-full h-full px-3 py-2 border border-transparent text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden">
                            {renderHighlightedText()}
                        </div>
                        <textarea
                            ref={bodyTextRef}
                            value={templateBody}
                            onChange={(e) => setTemplateBody(e.target.value)}
                            onBlur={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                            onKeyUp={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                            onClick={(e) => { bodySelection.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
                            onScroll={(e) => { e.target.previousSibling.scrollTop = e.target.scrollTop; }}
                            onKeyDown={(e) => {
                                if (templateBody.length >= 1024 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
                                if (e.key === 'Backspace' && e.target.selectionStart === e.target.selectionEnd) {
                                    const match = templateBody.substring(0, e.target.selectionStart).match(/\{\{[\w_]+\}\}$/);
                                    if (match) {
                                        e.preventDefault();
                                        setTemplateBody(templateBody.substring(0, e.target.selectionStart - match[0].length) + templateBody.substring(e.target.selectionStart));
                                        setTimeout(() => { e.target.focus(); e.target.setSelectionRange(e.target.selectionStart - match[0].length, e.target.selectionStart - match[0].length); }, 0);
                                    }
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[5rem] text-sm leading-relaxed z-10 resize-none bg-transparent"
                            style={{ color: 'transparent', caretColor: 'black' }}
                            spellCheck={false}
                        />
                    </div>

                    {bodyVariables.length < 2 && (
                        <button type="button" onClick={() => setShowAddBodyVariable(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">+ Add variable</button>
                    )}

                    {showAddBodyVariable && (
                        <div className="mt-2 mb-4 border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
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
                                    if (bodyVariables.length >= 2) return alert("Carousel body can only contain up to 2 variables.");
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
                        <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-700">Active Variables:</p>
                            <div className="flex flex-wrap gap-2">
                                {bodyVariables.map((v, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded shadow-sm text-[11px]">
                                        <span className="font-mono font-bold text-blue-700">{`{{${v.name}}}`}</span>
                                        <span className="text-gray-400">=</span>
                                        <input type="text" value={v.value} onChange={(e) => setBodyVariables(prev => prev.map(item => item.name === v.name ? { ...item, value: e.target.value } : item))} className={`px-1.5 py-0.5 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 ${!v.value ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`} placeholder="Sample..." />
                                        <button onClick={() => setTemplateBody(prev => prev.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), ''))} className="ml-1 text-red-500 font-bold">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-300 my-6"></div>

                {/* Carousel Cards Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700 font-semibold">Carousel Cards</label>
                        <span className="text-xs text-gray-500">{cards.length} / 10 Cards</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {cards.map((card, index) => (
                            <div key={card.id} className="min-w-[300px] w-[300px] border border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col snap-start relative shadow-sm">

                                {cards.length > 2 && (
                                    <button onClick={() => removeCard(card.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                        ✕
                                    </button>
                                )}

                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Card {index + 1}</h4>

                                <div className="mb-4">
                                    {card.mediaPreviewUrl ? (
                                        <div className="relative h-32 w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group">
                                            {card.mediaFile?.type?.includes('video') ? (
                                                <video src={card.mediaPreviewUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={card.mediaPreviewUrl} alt="Card media" className="w-full h-full object-cover" />
                                            )}
                                            <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <span className="text-white text-xs font-medium">Change Media</span>
                                                <input type="file" className="hidden" accept="image/*,video/mp4" onChange={(e) => handleMediaUpload(card.id, e.target.files[0])} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-colors bg-white">
                                            <span className="text-sm text-gray-500 font-medium">+ Upload Photo/Video</span>
                                            <input type="file" className="hidden" accept="image/*,video/mp4" onChange={(e) => handleMediaUpload(card.id, e.target.files[0])} />
                                        </label>
                                    )}
                                </div>

                                <div className="mb-4 flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Card Body</label>
                                    <textarea
                                        value={card.bodyText}
                                        onChange={(e) => updateCard(card.id, 'bodyText', e.target.value)}
                                        placeholder="Enter card description..."
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-16"
                                    />
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-gray-700">Buttons ({card.buttons.length}/2)</label>
                                    </div>

                                    {card.buttons.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {card.buttons.map((btn, btnIndex) => (
                                                <div key={btnIndex} className="p-2 bg-white border border-gray-200 rounded shadow-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{btn.type.replace('_', ' ')}</span>
                                                        <button onClick={() => removeCardButton(card.id, btnIndex)} className="text-red-500 hover:text-red-700 font-bold px-1">✕</button>
                                                    </div>
                                                    <div className="text-xs text-gray-800 font-medium truncate">{btn.text}</div>
                                                    {btn.value && <div className="text-[10px] text-gray-400 truncate mt-0.5">{btn.value}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {card.buttons.length < 2 && (
                                        <div className="p-2 border border-gray-200 bg-white rounded-lg space-y-2">
                                            <select
                                                value={card.draftButton.type}
                                                onChange={(e) => { updateDraftButton(card.id, 'type', e.target.value); updateDraftButton(card.id, 'value', ''); }}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                                            >
                                                <option value="">Select button type</option>
                                                <option value="phone_number">Phone Number</option>
                                                <option value="quick_reply">Quick Reply</option>
                                                <option value="url">URL</option>
                                            </select>

                                            <input
                                                type="text"
                                                value={card.draftButton.text}
                                                onChange={(e) => updateDraftButton(card.id, 'text', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                                                placeholder="Button text"
                                                maxLength={25}
                                            />

                                            {['phone_number', 'url'].includes(card.draftButton.type) && (
                                                <input
                                                    type="text"
                                                    value={card.draftButton.value}
                                                    onChange={(e) => updateDraftButton(card.id, 'value', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                                                    placeholder="Value (e.g. +12345, https://...)"
                                                    maxLength={card.draftButton.type === 'url' ? 2000 : 20}
                                                />
                                            )}

                                            <button
                                                onClick={() => addCardButton(card.id)}
                                                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors"
                                            >
                                                Add Button
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {cards.length < 10 && (
                            <div
                                onClick={addCard}
                                className="min-w-[120px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors text-gray-400 hover:text-blue-500"
                            >
                                <span className="text-4xl font-light mb-2">+</span>
                                <span className="text-xs font-medium">Add Card</span>
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

                        <div className="relative w-[300px] h-[520px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl flex items-center justify-center">
                            <div className="w-full h-full bg-[#ece5dd] rounded-[2rem] overflow-hidden flex flex-col pt-12 pb-4 text-black relative" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23d4d4d4' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' opacity='0.1'/%3E%3C/svg%3E")` }}>

                                <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">

                                    {templateBody && (
                                        <div className="bg-white rounded-lg p-2.5 text-sm shadow-sm self-start max-w-[90%] mb-2 break-words">
                                            <div className="whitespace-pre-wrap">{getPreviewBodyText()}</div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 overflow-x-auto snap-x custom-scrollbar pb-2 w-full pr-4">
                                        {cards.map((card, index) => (
                                            <div key={card.id} className="min-w-[220px] max-w-[220px] bg-white rounded-lg shadow-sm overflow-hidden snap-start flex flex-col border border-gray-100">

                                                <div className="h-[120px] bg-gray-200 w-full flex items-center justify-center text-gray-400 overflow-hidden relative">
                                                    {card.mediaPreviewUrl ? (
                                                        card.mediaFile?.type?.includes('video') ? (
                                                            <video src={card.mediaPreviewUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={card.mediaPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        )
                                                    ) : (
                                                        <span className="text-[10px] font-medium uppercase tracking-wider">No Media</span>
                                                    )}
                                                </div>

                                                <div className="p-2.5 flex-1 min-h-[40px] text-xs text-gray-800 break-words whitespace-pre-wrap">
                                                    {card.bodyText || <span className="text-gray-400 italic">Card text...</span>}
                                                </div>

                                                {card.buttons.length > 0 && (
                                                    <div className="flex flex-col border-t border-gray-100 bg-gray-50/50">
                                                        {card.buttons.map((btn, idx) => (
                                                            <div key={idx} className={`py-2.5 text-center text-[#00a884] text-[12px] font-medium cursor-default truncate px-2 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                                                                {btn.text || "Button"}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
});

export default MediaCarouselEditor;