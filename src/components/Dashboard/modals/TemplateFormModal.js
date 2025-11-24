import React, { useState, useEffect } from 'react';

const TemplateFormModal = ({ isOpen, template, onClose }) => {
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('English');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [sampleContent, setSampleContent] = useState('');
  const [buttons, setButtons] = useState('');

  // Pre-populate form when template changes
  useEffect(() => {
    if (template) {
      setTemplateName(template.name || '');
      setCategory(template.tags ? template.tags.join(', ') : '');
      setLanguage('English');
      setBody(template.content || '');
      setFooter('');
      setSampleContent('');
      setButtons('');
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const bodyCharCount = body.length;
  const footerCharCount = footer.length;
  const sampleContentCharCount = sampleContent.length;

  // Generate preview with sample content replaced
  const generatePreview = () => {
    let preview = body;
    
    // Replace sample content placeholders if provided
    if (sampleContent) {
      // This is a simple replacement - you might want more sophisticated logic
      preview = preview.replace(/\[.*?\]/g, sampleContent);
    }
    
    return preview;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Template Form</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Body
                </label>
                <span className="text-xs text-gray-500">
                  {bodyCharCount}/1024
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 italic">
                  Content for authentication message templates can't be edited. You can add/remove additional content from the option below
                </p>
              </div>
              <textarea
                value={body}
                onChange={(e) => {
                  if (e.target.value.length <= 1024) {
                    setBody(e.target.value);
                  }
                }}
                rows={8}
                maxLength={1024}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter template body"
              />
            </div>

            {/* Footer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Footer
                </label>
                <span className="text-xs text-gray-500">
                  {footerCharCount}/60
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2 italic">
                (Optional) Footers are great to add any disclaimers or to add a thoughtful PS
              </p>
              <textarea
                value={footer}
                onChange={(e) => {
                  if (e.target.value.length <= 60) {
                    setFooter(e.target.value);
                  }
                }}
                rows={2}
                maxLength={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter footer (optional)"
              />
            </div>

            {/* Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buttons
              </label>
              <input
                type="text"
                value={buttons}
                onChange={(e) => setButtons(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter button text (optional)"
              />
            </div>

            {/* Sample Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sample Content
                </label>
                <span className="text-xs text-gray-500">
                  {sampleContentCharCount}/200
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2 italic">
                Just enter sample content here (it doesn't need to be exact!)
              </p>
              <textarea
                value={sampleContent}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setSampleContent(e.target.value);
                  }
                }}
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter sample content"
              />
              <p className="text-xs text-gray-500 mt-1">
                Make sure not to include any actual user or customer information, and provide only sample content in your examples. <a href="#" className="text-blue-600 hover:underline">Learn more</a>
              </p>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[400px]">
                <div className="space-y-2">
                  {body && (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatePreview()}
                    </div>
                  )}
                  {footer && (
                    <div className="text-xs text-gray-600 mt-4 pt-4 border-t border-gray-300">
                      {footer}
                    </div>
                  )}
                  {buttons && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        {buttons}
                      </button>
                    </div>
                  )}
                  {!body && (
                    <p className="text-gray-400 text-sm italic">Preview will appear here</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => {
              // Handle form submission here
              console.log('Template form submitted:', {
                templateName,
                category,
                language,
                body,
                footer,
                buttons,
                sampleContent
              });
              onClose();
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateFormModal;

