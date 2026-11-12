import React, { useState, useEffect, useMemo } from 'react';
import { apiConfig } from '../../../../../config/api';
import { WhatsAppPhonePreview } from './WhatsAppPhonePreview';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  TagIcon,
  BoltIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Fallback special templates if API is unreachable
const FALLBACK_SPECIAL_TEMPLATES = [
  {
    id: "special_abandoned_cart_recovery",
    name: "abandoned_cart_recovery",
    displayName: "Abandoned Cart Recovery",
    description: "Re-engage shoppers who left items in their cart with total items count, cart value, and a direct 'Take me to My Cart' button.",
    template_type: "custom",
    industry: "ecommerce",
    tags: ["Abandoned Cart", "E-commerce"],
    object: {
      name: "abandoned_cart_recovery",
      category: "MARKETING",
      language: "en_US",
      parameter_format: "named",
      skip_redirect: true,
      components: [
        {
          type: "BODY",
          text: "Hey {{customer_name}}! 👋\n\nYou left {{total_items}} item(s) in your cart! 🛒\n\n💰 Total Cart Value: {{currency}} {{cart_value}}\n\nGood news: We've saved your items, but stock is limited and cart reservations expire soon. ⏳\n\nTap the button below to finish your order in seconds! 👇",
          example: {
            body_text_named_params: [
              { param_name: "customer_name", example: "Rahul" },
              { param_name: "total_items", example: "2" },
              { param_name: "currency", example: "INR" },
              { param_name: "cart_value", example: "2,499" }
            ]
          }
        },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Take me to My Cart",
              url: "https://yourstore.com/{{1}}",
              example: ["cart"]
            }
          ]
        }
      ]
    }
  },
  {
    id: "special_cod_address_confirmation",
    name: "cod_address_confirmation",
    displayName: "COD Address Confirmation",
    description: "Verify customer delivery address for Cash on Delivery orders to minimize returns (RTO) and offer instant prepaid discounts.",
    template_type: "custom",
    industry: "ecommerce",
    tags: ["COD Confirmation", "E-commerce"],
    object: {
      name: "cod_address_confirmation",
      category: "MARKETING",
      language: "en_US",
      parameter_format: "named",
      components: [
        {
          type: "BODY",
          text: "Hey {{customer_name}}! 👋\n\nThank you for placing your order with us! 🛒\n\nYou have created a Cash on Delivery (COD) order with us of the value {{currency}} {{order_value}}.\n\n📍 Delivery Address:\n{{delivery_address}}\n\nPlease confirm your address using the buttons below so we can process and dispatch your package right away! 👇",
          example: {
            body_text_named_params: [
              { param_name: "customer_name", example: "Rahul" },
              { param_name: "currency", example: "INR" },
              { param_name: "order_value", example: "1,999" },
              { param_name: "delivery_address", example: "Flat 402, Green Valley Apartments, Mumbai - 400001" }
            ]
          }
        },
        {
          type: "BUTTONS",
          buttons: [
            { type: "URL", text: "Pay now and get 10% off", url: "https://yourstore.com/pay" },
            { type: "QUICK_REPLY", text: "Confirm COD on Address" },
            { type: "QUICK_REPLY", text: "Reject order" }
          ]
        }
      ]
    }
  },
  {
    id: "special_cod_to_prepaid",
    name: "cod_to_prepaid",
    displayName: "COD Verification (Returning Customers)",
    description: "Incentivize verified Cash on Delivery buyers to switch to online prepaid payment with an instant 10% discount.",
    template_type: "custom",
    industry: "ecommerce",
    tags: ["COD2Prepaid", "E-commerce"],
    object: {
      name: "cod_to_prepaid",
      category: "MARKETING",
      language: "en_US",
      parameter_format: "named",
      components: [
        {
          type: "BODY",
          text: "Hey {{customer_name}}! 👋\n\nYour Cash on Delivery order {{order_id}} of {{currency}} {{order_value}} has been confirmed! 📦\n\n✨ *Exclusive Prepaid Offer:*\nPay online right now and get an instant *10% discount* on your order!\n\nEnjoy zero contact delivery, fast dispatch, and instant savings. ⚡\n\nTap below to pay securely and claim your discount! 👇",
          example: {
            body_text_named_params: [
              { param_name: "customer_name", example: "Rahul" },
              { param_name: "order_id", example: "#1024" },
              { param_name: "currency", example: "INR" },
              { param_name: "order_value", example: "1,999" }
            ]
          }
        },
        {
          type: "BUTTONS",
          buttons: [
            { type: "URL", text: "Pay now and get 10% off", url: "https://yourstore.com/pay" }
          ]
        }
      ]
    }
  },
  {
    id: "special_order_confirmation",
    name: "order_confirmation",
    displayName: "Order Confirmation",
    description: "Instant post-purchase confirmation message with order value, item summary, delivery address, and live tracking button.",
    template_type: "custom",
    industry: "ecommerce",
    tags: ["Order Confirmation", "E-commerce"],
    object: {
      name: "order_confirmation",
      category: "UTILITY",
      language: "en_US",
      parameter_format: "named",
      components: [
        {
          type: "BODY",
          text: "Hey {{customer_name}}! 👋\n\nThank you for shopping with us! 🛍️ We're pleased to confirm that we've received your order and our team is preparing it for dispatch.\n\n📋 *Order Summary:*\n• Order ID: {{order_id}}\n• Items: {{items_summary}}\n• Order Total: {{currency}} {{order_value}}\n\n📍 *Shipping Address:*\n{{delivery_address}}\n\nWe will notify you with live tracking updates as soon as your package ships. Feel free to reply to this message if you have any questions! ✨",
          example: {
            body_text_named_params: [
              { param_name: "customer_name", example: "Rahul" },
              { param_name: "order_id", example: "#1024" },
              { param_name: "items_summary", example: "Oversized Hoodie (Black / L)" },
              { param_name: "currency", example: "INR" },
              { param_name: "order_value", example: "2,499" },
              { param_name: "delivery_address", example: "Flat 402, Green Valley Apartments, Mumbai - 400001" }
            ]
          }
        },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Track Order",
              url: "https://yourstore.com/orders/track"
            }
          ]
        }
      ]
    }
  }
];

export const SpecialTemplates = ({ onSelectTemplate }) => {
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState(FALLBACK_SPECIAL_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSpecialTemplates = async () => {
      try {
        setIsLoading(true);
        const dbServerUrl = apiConfig?.dbServerConfig?.baseURL;
        if (dbServerUrl) {
          const token = localStorage.getItem('authToken');
        const res = await fetch(`${dbServerUrl}/api/templates/special`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
          if (res.ok) {
            const data = await res.json();
            const fetched = data.data || data || [];
            if (Array.isArray(fetched) && fetched.length > 0) {
              // Merge with display metadata
              const merged = fetched.map(item => {
                const tmplObj = item.object || item;
                const matchFallback = FALLBACK_SPECIAL_TEMPLATES.find(
                  f => f.name === tmplObj.name || f.id === item.id || f.object?.name === tmplObj.name
                );
                return {
                  ...item,
                  displayName: matchFallback?.displayName || tmplObj.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  description: matchFallback?.description || 'E-Commerce automation template with named parameters.',
                  tags: item.tags || matchFallback?.tags || ["Special", "E-commerce"]
                };
              });
              setTemplates(merged);
            }
          }
        }
      } catch (err) {
        console.warn('Using fallback special templates:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecialTemplates();
  }, []);

  // Filter tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set(['All']);
    templates.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let list = templates;

    if (selectedTag !== 'All') {
      const lower = selectedTag.toLowerCase();
      list = list.filter(t => t.tags?.some(tag => tag.toLowerCase() === lower));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => {
        const tmplObj = t.object || t;
        const bodyComp = tmplObj.components?.find(c => c.type?.toUpperCase() === 'BODY');
        const text = bodyComp?.text || '';
        return (
          t.displayName?.toLowerCase().includes(q) ||
          tmplObj.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          text.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [templates, selectedTag, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Special Templates</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <BoltIcon className="w-3.5 h-3.5 text-indigo-500" />
              Automated E-Commerce Workflows
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
              Named Parameters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pre-configured, high-converting WhatsApp templates designed for core automated workflows: Abandoned Cart Recovery, COD Confirmation, COD to Prepaid, and Order Updates.
          </p>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {availableTags.map((tag) => {
            const isAll = tag === 'All';
            const count = isAll 
              ? templates.length 
              : templates.filter(t => t.tags?.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())).length;

            return (
              <button 
                key={tag} 
                onClick={() => setSelectedTag(tag)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedTag === tag 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{tag}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTag === tag ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 flex-shrink-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search special templates..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="input pl-9 text-xs py-2 w-full" 
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="card p-5 animate-pulse bg-white space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-[420px] bg-slate-100 rounded-2xl"></div>
              <div className="h-9 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Grid with Realistic Phone Previews */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template, idx) => {
            const tmplObj = template.object || template;
            const tName = tmplObj.name || template.name || `Template ${idx + 1}`;
            const tCategory = tmplObj.category || template.category || 'MARKETING';
            const bodyComp = tmplObj.components?.find(c => c.type?.toUpperCase() === 'BODY');
            const namedParams = bodyComp?.example?.body_text_named_params || [];

            return (
              <div 
                key={template.id || tName || idx} 
                className="card p-5 bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Header Information */}
                <div className="pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {template.displayName || tName}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          tCategory === 'UTILITY'
                            ? 'text-blue-700 bg-blue-50 border border-blue-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}>
                          {tCategory}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                          Named Params
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Named Variables Chips */}
                  {namedParams.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-medium text-slate-400">Variables:</span>
                      {namedParams.map((p, pIdx) => (
                        <span 
                          key={pIdx} 
                          className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded"
                          title={`Example: ${p.example || ''}`}
                        >
                          {`{{${p.param_name}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* WhatsApp Phone Screen Mockup */}
                <div className="py-2 flex-1 flex items-center justify-center">
                  <WhatsAppPhonePreview 
                    template={template} 
                    storeName="Nimble Store" 
                  />
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-3">
                  <button 
                    onClick={() => onSelectTemplate(template)} 
                    className="flex-1 btn-primary text-xs py-2.5 px-4 gap-2 justify-center font-semibold shadow-xs"
                  >
                    <SparklesIcon className="w-4 h-4 text-emerald-300" />
                    Use & Customize Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-slate-200 bg-white">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
            <TagIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No templates found</p>
          <p className="text-xs text-slate-400 max-w-xs">
            No special templates match "{searchQuery || selectedTag}". Try clearing your search or selecting "All".
          </p>
        </div>
      )}
    </div>
  );
};

export default SpecialTemplates;
