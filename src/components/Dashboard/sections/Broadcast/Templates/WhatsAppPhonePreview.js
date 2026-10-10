import React from 'react';
import { 
  ArrowTopRightOnSquareIcon, 
  PhoneIcon, 
  ChatBubbleLeftIcon, 
  DocumentTextIcon, 
  PlayIcon, 
  CheckIcon,
  TagIcon,
  ChevronLeftIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';

/**
 * Replaces WhatsApp template variable placeholders ({{1}}, {{name}}, etc.)
 * with example values or formatted preview tags.
 */
function formatWhatsAppText(text, exampleObj) {
  if (!text) return '';

  let formatted = text;

  // 1. If named param examples exist
  if (exampleObj?.body_text_named_params && Array.isArray(exampleObj.body_text_named_params)) {
    exampleObj.body_text_named_params.forEach(p => {
      if (p.param_name) {
        const val = p.example && p.example.trim() !== '' ? p.example : p.param_name;
        const regex = new RegExp(`\\{\\{${p.param_name}\\}\\}`, 'g');
        formatted = formatted.replace(regex, `<span class="font-semibold text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded text-[11px]">${val}</span>`);
      }
    });
  }

  // 2. If positional param examples exist (e.g. [["John", "20%"]])
  if (exampleObj?.body_text && Array.isArray(exampleObj.body_text)) {
    const params = Array.isArray(exampleObj.body_text[0]) ? exampleObj.body_text[0] : exampleObj.body_text;
    params.forEach((val, idx) => {
      const regex = new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g');
      formatted = formatted.replace(regex, `<span class="font-semibold text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded text-[11px]">${val || (idx + 1)}</span>`);
    });
  }

  // 3. Fallback for remaining unresolved {{vars}}
  formatted = formatted.replace(/\{\{([\w_]+)\}\}/g, '<span class="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[11px]">{$1}</span>');

  // 4. WhatsApp markdown formatting: *bold*, _italic_, ~strike~
  formatted = formatted.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
  formatted = formatted.replace(/~([^~]+)~/g, '<del class="text-slate-400">$1</del>');

  return formatted;
}

/**
 * Modern WhatsApp Phone Preview Component
 */
export const WhatsAppPhonePreview = ({ 
  template, 
  storeName = 'Nimble Store', 
  className = '' 
}) => {
  if (!template) return null;

  const templateData = template.object || template;
  const components = templateData.components || [];

  // Extract components
  const headerComp = components.find(c => c.type?.toUpperCase() === 'HEADER');
  const bodyComp = components.find(c => c.type?.toUpperCase() === 'BODY');
  const footerComp = components.find(c => c.type?.toUpperCase() === 'FOOTER');
  const buttonsComp = components.find(c => c.type?.toUpperCase() === 'BUTTONS');
  const carouselComp = components.find(c => c.type?.toUpperCase() === 'CAROUSEL');

  const isCarousel = template.template_type === 'media_carousel' || !!carouselComp;

  // Header format
  const headerFormat = (headerComp?.format || 'TEXT').toUpperCase();
  const headerText = headerComp?.text || '';
  const headerMediaUrl = template.s3_url || headerComp?.example?._draft_preview_url || headerComp?.url || null;

  // Formatted body HTML
  const bodyHtml = bodyComp?.text ? formatWhatsAppText(bodyComp.text, bodyComp.example) : '';
  const footerText = footerComp?.text || '';
  const buttons = buttonsComp?.buttons || [];

  return (
    <div className={`w-full flex justify-center ${className}`}>
      {/* Smartphone Outer Shell */}
      <div className="w-full max-w-[310px] bg-slate-900 rounded-[2.25rem] p-2.5 shadow-xl border-4 border-slate-800 relative flex flex-col select-none text-slate-800">
        
        {/* Top Speaker Notch / Dynamic Island */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-3 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-1.5 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-slate-900"></div>
          <div className="w-8 h-1 rounded-full bg-slate-800"></div>
        </div>

        {/* Screen Bezel Container */}
        <div 
          className="w-full h-[480px] bg-[#ECE5DD] rounded-[1.75rem] overflow-hidden flex flex-col relative shadow-inner"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23cfc7bd' stroke-width='0.4'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23grid)' opacity='0.3'/%3E%3C/svg%3E")`
          }}
        >
          {/* 1. Phone Status Bar */}
          <div className="bg-[#005c4b] text-white/90 px-3.5 pt-1.5 pb-1 flex items-center justify-between text-[10px] font-medium z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <div className="w-3.5 h-2 border border-white/80 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* 2. WhatsApp Chat Header */}
          <div className="bg-[#008069] text-white px-2.5 py-2 flex items-center justify-between shadow-md z-20">
            <div className="flex items-center gap-1.5 min-w-0">
              <ChevronLeftIcon className="w-4 h-4 text-white flex-shrink-0" />
              <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                🛍️
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-semibold truncate leading-tight">{storeName}</h4>
                  <span className="w-3 h-3 bg-[#25D366] text-white rounded-full flex items-center justify-center text-[8px] flex-shrink-0">✓</span>
                </div>
                <p className="text-[9px] text-white/75 truncate leading-tight">Official Business Account</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <VideoCameraIcon className="w-3.5 h-3.5" />
              <PhoneIcon className="w-3 h-3" />
              <EllipsisVerticalIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 3. Date Pill Separator */}
          <div className="flex justify-center my-2 z-10">
            <span className="bg-[#FFFFFF]/90 text-[#54656F] text-[10px] px-2.5 py-0.5 rounded-md shadow-2xs font-medium uppercase tracking-wider">
              Today
            </span>
          </div>

          {/* 4. Chat Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin z-10 space-y-2">
            
            {/* Meta AI Enhancement Badge if active */}
            {((templateData.category || template.category || '').toUpperCase() === 'MARKETING' && 
              (templateData.ai_enhancement === true || templateData.creative_enhancement?.enabled === true)) && (
              <div className="flex justify-center -mb-0.5">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-blue-500/30 text-blue-900 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-2xs">
                  <span>✨</span>
                  <span>Meta AI Enhanced</span>
                </span>
              </div>
            )}

            {/* Standard Message Bubble */}
            {!isCarousel && (
              <div className="bg-white rounded-xl rounded-tl-xs shadow-xs p-2 max-w-[94%] border border-black/5 text-xs text-slate-800">
                
                {/* Header Section */}
                {headerComp && (
                  <div className="mb-2">
                    {headerFormat === 'TEXT' && headerText && (
                      <h5 className="font-bold text-slate-900 text-xs leading-snug">
                        {headerText}
                      </h5>
                    )}

                    {headerFormat === 'IMAGE' && (
                      <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 mb-1.5 max-h-32 flex items-center justify-center">
                        {headerMediaUrl ? (
                          <img src={headerMediaUrl} alt="Header Media" className="w-full h-28 object-cover" />
                        ) : (
                          <div className="w-full h-28 bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <span className="text-2xl mb-1">🖼️</span>
                            <span className="text-[10px] font-medium text-slate-500">Header Image</span>
                          </div>
                        )}
                      </div>
                    )}

                    {headerFormat === 'VIDEO' && (
                      <div className="rounded-lg overflow-hidden bg-slate-900 mb-1.5 h-28 flex items-center justify-center relative text-white">
                        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center">
                          <PlayIcon className="w-4 h-4 text-white ml-0.5" />
                        </div>
                        <span className="absolute bottom-1 right-2 text-[9px] bg-black/60 px-1 rounded text-white/90">0:30</span>
                      </div>
                    )}

                    {headerFormat === 'DOCUMENT' && (
                      <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-slate-700 truncate">Catalogue.pdf</p>
                          <p className="text-[9px] text-slate-400">PDF • 1.2 MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Body Section */}
                {bodyHtml && (
                  <div 
                    className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-slate-800 break-words"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                )}

                {/* Footer Section */}
                <div className="mt-1 flex items-end justify-between gap-2 pt-0.5">
                  {footerText ? (
                    <p className="text-[9.5px] text-slate-400 leading-tight flex-1">{footerText}</p>
                  ) : <div className="flex-1" />}
                  
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 flex-shrink-0">
                    <span>10:42 AM</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>

                {/* Action Buttons Section */}
                {buttons.length > 0 && (
                  <div className="mt-2 -mx-2 -mb-2 border-t border-slate-100 divide-y divide-slate-100">
                    {buttons.map((btn, idx) => {
                      const btnType = btn.type?.toUpperCase();
                      return (
                        <div 
                          key={idx}
                          className="py-1.5 px-3 text-center text-[#00a884] hover:bg-slate-50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {btnType === 'URL' && <ArrowTopRightOnSquareIcon className="w-3 h-3" />}
                          {btnType === 'PHONE_NUMBER' && <PhoneIcon className="w-3 h-3" />}
                          {btnType === 'COPY_CODE' && <TagIcon className="w-3 h-3" />}
                          {btnType === 'QUICK_REPLY' && <ChatBubbleLeftIcon className="w-3 h-3" />}
                          <span className="truncate">{btn.text || 'Action Button'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Carousel Message Bubble */}
            {isCarousel && (
              <div className="space-y-2">
                {bodyHtml && (
                  <div className="bg-white rounded-xl rounded-tl-xs shadow-xs p-2 max-w-[94%] border border-black/5 text-xs text-slate-800">
                    <div 
                      className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-slate-800"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                    <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                      <span>10:42 AM</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                )}

                {/* Carousel Horizontal Scroll Rail */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin snap-x">
                  {(carouselComp?.cards || [1, 2]).map((card, idx) => {
                    const cardComp = typeof card === 'object' ? card : {};
                    const cardComponents = cardComp.components || [];
                    const cardHeader = cardComponents.find(c => c.type?.toUpperCase() === 'HEADER');
                    const cardBody = cardComponents.find(c => c.type?.toUpperCase() === 'BODY');
                    const cardButtons = cardComponents.find(c => c.type?.toUpperCase() === 'BUTTONS')?.buttons || [];
                    const cardMediaUrl = cardHeader?.example?._draft_preview_url || cardHeader?.url || null;

                    return (
                      <div key={idx} className="min-w-[170px] max-w-[170px] bg-white rounded-xl shadow-xs border border-black/5 overflow-hidden flex flex-col snap-start">
                        {/* Card Image */}
                        <div className="h-20 bg-slate-100 flex items-center justify-center overflow-hidden">
                          {cardMediaUrl ? (
                            <img src={cardMediaUrl} alt="Card visual" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-100/50 to-blue-50 flex items-center justify-center text-slate-400 text-xs">
                              🛍️ Card {idx + 1}
                            </div>
                          )}
                        </div>
                        {/* Card Body */}
                        <div className="p-2 flex-1 text-[11px] text-slate-800 break-words line-clamp-3">
                          {cardBody?.text || `Featured product item #${idx + 1} special promotion.`}
                        </div>
                        {/* Card Button */}
                        {cardButtons.length > 0 && (
                          <div className="border-t border-slate-100 bg-slate-50/50 py-1.5 px-2 text-center text-[#00a884] text-[10.5px] font-semibold truncate">
                            {cardButtons[0].text || 'View Item'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. WhatsApp Bottom Input Bar Mockup */}
          <div className="bg-[#F0F2F5] px-2 py-1.5 flex items-center gap-1.5 border-t border-slate-200/80 z-20">
            <div className="flex-1 bg-white rounded-full px-3 py-1 text-[10px] text-slate-400 flex items-center justify-between shadow-2xs">
              <span>Message</span>
              <span className="text-slate-300">📎 📷</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#008069] text-white flex items-center justify-center text-[10px] shadow-xs">
              🎤
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WhatsAppPhonePreview;
