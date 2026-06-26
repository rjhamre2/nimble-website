import { isValid } from "zod";

export const extractVariablesFromTemplate = (template) => {
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

export const parseTemplateForForm = (template) => {
  const templateData = template.object || template;
  let category = '';
  
  if (templateData.category) {
    const categoryMap = {
      'AUTHENTICATION': 'Authentication',
      'MARKETING': 'Marketing',
      'UTILITY': 'Utility'
    };
    category = categoryMap[templateData.category] || templateData.category;
  }
  
  const apiToDisplayLanguage = {
    'en_US': 'English(US)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi'
  };
  
  const apiLanguage = templateData.language || 'en_US';
  const displayLanguage = apiToDisplayLanguage[apiLanguage] || 'English(US)';
  const components = templateData.components || [];

  let broadcastTileType = 'none'; 
  let broadcastTitleVariables = [];
  let headerText = '';
  let broadcastTitleImageHandle = '';
  let broadcastTitleVideoHandle = '';
  let broadcastTitleDocumentHandle = '';
  let broadcastTitleLocationLatitude = '';
  let broadcastTitleLocationLongitude = '';
  let broadcastTitleLocationName = '';
  let broadcastTitleLocationAddress = '';
  let templateBody = '';
  let bodyVariables = [];
  let templateFooter = '';
  const templateButtons = [];

  components.forEach(component => {
    if (component.type === 'header' || component.type === 'HEADER') {
      if (component.format === 'text' || component.format === 'TEXT') {
        broadcastTileType = 'text';
        headerText = component.text || ''; 
        if (component.example && component.example.header_text_named_params) {
          const variables = component.example.header_text_named_params.map(param => {
            const varName = param.param_name.replace(/[{}]/g, '');
            return { name: varName, value: param.example || varName };
          });
          broadcastTitleVariables = variables;
          if (variables.length > 0) {
            variables.forEach(variable => {
              const varPattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
              if (!headerText.match(varPattern)) {
                const plainVarPattern = new RegExp(variable.name, 'g');
                if (headerText.match(plainVarPattern)) {
                  headerText = headerText.replace(plainVarPattern, `{{${variable.name}}}`);
                }
              }
            });
          }
        }
      } else if (component.format === 'IMAGE') {
        broadcastTileType = 'image';
        if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
          const handle = component.example.header_handle[0];
          broadcastTitleImageHandle = typeof handle === 'string' ? handle : handle?.handle || '';
        }
      } else if (component.format === 'VIDEO') {
        broadcastTileType = 'video';
        if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
          const handle = component.example.header_handle[0];
          broadcastTitleVideoHandle = typeof handle === 'string' ? handle : handle?.handle || '';
        }
      } else if (component.format === 'DOCUMENT') {
        broadcastTileType = 'document';
        if (component.example && component.example.header_handle && component.example.header_handle.length > 0) {
          const handle = component.example.header_handle[0];
          broadcastTitleDocumentHandle = typeof handle === 'string' ? handle : handle?.handle || '';
        }
      } else if (component.parameters && Array.isArray(component.parameters)) {
        const locationParam = component.parameters.find(p => p.type === 'location' && p.location);
        if (locationParam && locationParam.location) {
          broadcastTileType = 'location';
          broadcastTitleLocationLatitude = locationParam.location.latitude || '';
          broadcastTitleLocationLongitude = locationParam.location.longitude || '';
          broadcastTitleLocationName = locationParam.location.name || '';
          broadcastTitleLocationAddress = locationParam.location.address || '';
        }
      }
    }

    if (component.type === 'body' || component.type === 'BODY') {
      templateBody = component.text || '';
      if (component.example && component.example.body_text_named_params) {
        bodyVariables = component.example.body_text_named_params.map(param => {
          const varName = param.param_name.replace(/[{}]/g, '');
          return { name: varName, value: param.example || varName };
        });
      }
    }

    if (component.type === 'FOOTER' || component.type === 'footer') {
      templateFooter = component.text || '';
    }
    
    if(component.type === 'BUTTONS' || component.type === 'buttons') {
        const buttons = component.buttons || [];
        buttons.forEach(btn => {
            if (btn.type === 'QUICK_REPLY') {
                templateButtons.push({ type: 'QUICK_REPLY', text: btn.text || '', value: '' });
            } else if (btn.type === 'URL' || btn.type === 'URL') {
                templateButtons.push({ type: 'URL', text: btn.text || '', value: btn.url || '' });
            } else if (btn.type === 'PHONE_NUMBER') {
                templateButtons.push({ type: 'PHONE_NUMBER', text: btn.text || '', value: btn.phone_number || '' });
            } else if (btn.type === 'COPY_CODE') {
                templateButtons.push({ type: 'COPY_CODE', text: btn.text || '', value: btn.example || '' });
            }
        });
    }
  });

  return {
    templateName: templateData.name || '', 
    templateCategory: category, 
    templateLanguage: displayLanguage,
    broadcastTileType, 
    broadcastTitleVariables, 
    headerText, 
    broadcastTitleImageHandle, 
    broadcastTitleVideoHandle, 
    broadcastTitleDocumentHandle,
    broadcastTitleLocationLatitude, 
    broadcastTitleLocationLongitude, 
    broadcastTitleLocationName, 
    broadcastTitleLocationAddress,
    templateBody, 
    bodyVariables, 
    templateFooter, 
    templateButtons
  };
};

// A client-side validator based on Meta's WhatsApp Template Rules
export const validateTemplateClientSide = (payload) => {
    if (!payload.name || !payload.category || !payload.language) {
        return { isValid: false, error: "Name, category, and language are required." };
    }

    if (!/^[a-z0-9_]+$/.test(payload.name)) {
        return { isValid: false, error: "Template name can only contain lowercase letters, numbers, and underscores." };
    }

    let hasBody = false;
    let urlButtonCount = 0;
    let phoneButtonCount = 0;
    let copyCodeCount = 0;

    for (const comp of payload.components) {
        // --- Header Rules ---
        if (comp.type === 'header') {
            if (comp.format === 'TEXT') {
                if (comp.text.length > 60) return { isValid: false, error: "Header text cannot exceed 60 characters." };
                const varMatches = comp.text.match(/\{\{[\w_]+\}\}/g) || [];
                if (varMatches.length > 1) return { isValid: false, error: "Header text can contain a maximum of 1 variable." };
            } else if(comp.format === 'IMAGE' || comp.format === 'VIDEO' || comp.format === 'DOCUMENT')
            {
                const handle = comp?.example?.header_handle;
                if (typeof handle?.[0] !== 'string' || handle[0].trim() === '') {
                  return {isValid: false, error: "Media header doesn't have a handle."};
                }
            }
        }

        // --- Body Rules ---
        if (comp.type === 'body') {
            hasBody = true;
            if (comp.text.length > 1024) return { isValid: false, error: "Body text cannot exceed 1024 characters." };
        }

        // --- Footer Rules ---
        if (comp.type === 'footer') {
            if (comp.text.length > 60) return { isValid: false, error: "Footer text cannot exceed 60 characters." };
        }

        // --- Button Rules ---
        if (comp.type === 'buttons') {
            if (comp.buttons.length > 10) return { isValid: false, error: "You can have a maximum of 10 buttons total." };

            for (const btn of comp.buttons) {
                // All buttons have a max text length of 25 chars
                if (btn.text && btn.text.length > 25) {
                    return { isValid: false, error: `Button text '${btn.text}' exceeds 25 characters.` };
                }

                if (btn.type === 'URL') {
                    urlButtonCount++;
                    if (urlButtonCount > 2) return { isValid: false, error: "You can have a maximum of 2 URL buttons." };
                    if (btn.url && btn.url.length > 2000) return { isValid: false, error: "URL cannot exceed 2000 characters." };
                    if (!btn.url || !btn.text) return {isValid: false, error: "url or text missing from button." };
                }
                
                if (btn.type === 'PHONE_NUMBER') {
                    phoneButtonCount++;
                    if (phoneButtonCount > 1) return { isValid: false, error: "You can have a maximum of 1 Phone Number button." };
                    if (btn.phone_number && btn.phone_number.length > 20) return { isValid: false, error: "Phone number exceeds 20 characters." };
                    if (!btn.phone_number || !btn.text) return {isValid: false, error: "Phone number of button text missing." };
                }

                if (btn.type === 'COPY_CODE') {
                    copyCodeCount++;
                    if (copyCodeCount > 1) return { isValid: false, error: "You can have a maximum of 1 Copy Code button." };
                }
            }
        }
    }

    if (!hasBody) {
        return { isValid: false, error: "A body component is strictly required by WhatsApp." };
    }

    // Passes all client-side checks
    return { isValid: true };
};

export const validateFileExtension = (file) => {
  if (!file || !file.name) return false;

  const ALLOWED_EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'png', 'mp4'];
  
  // Extract the extension: split by dot, grab the last segment, and lowercase it
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  return ALLOWED_EXTENSIONS.includes(fileExtension);
};