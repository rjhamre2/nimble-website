import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  LinkIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  XMarkIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  fetchKnowledgeBase,
  autoSyncShopifyPolicies,
  ingestUrls,
  uploadKnowledgeFile,
  addManualRule,
  deleteKnowledgeSource
} from '../../../services/aiAgentService';
import AiSandboxTester from './AiSandboxTester';

export default function KnowledgeBaseManagerView({ tenantId }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIngestTab, setActiveIngestTab] = useState('urls'); // 'urls' | 'file' | 'manual'
  const [filter, setFilter] = useState('all');

  // 1-Click Shopify Sync states
  const [syncingShopify, setSyncingShopify] = useState(false);
  const [syncStep, setSyncStep] = useState(0); // 0: idle, 1: scraping, 2: chunking, 3: embedding
  const [syncToast, setSyncToast] = useState(null);

  // Ingest Tab A: URLs
  const [urlsInput, setUrlsInput] = useState('');
  const [docTypeSelect, setDocTypeSelect] = useState('AUTO');
  const [ingestingUrls, setIngestingUrls] = useState(false);

  // Ingest Tab B: File
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileCategory, setFileCategory] = useState('RETURN_EXCHANGE');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Ingest Tab C: Manual Rule
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState('POLICY');
  const [manualCategory, setManualCategory] = useState('RETURN_EXCHANGE');
  const [manualContent, setManualContent] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState(null);

  // Load KB items
  const loadKbSources = async (selectedFilter = filter) => {
    try {
      setLoading(true);
      const data = await fetchKnowledgeBase(selectedFilter);
      setSources(data);
    } catch (err) {
      console.error('Failed to load KB sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKbSources(filter);
  }, [filter, tenantId]);

  // Handle 1-Click Shopify Auto-Sync
  const handleAutoSyncShopify = async () => {
    if (syncingShopify) return;
    try {
      setSyncingShopify(true);
      setSyncStep(1);

      // Simulation steps for realistic high-trust feedback
      await new Promise((r) => setTimeout(r, 700));
      setSyncStep(2);
      await new Promise((r) => setTimeout(r, 800));
      setSyncStep(3);

      const result = await autoSyncShopifyPolicies();
      const chunksCount = result?.chunks_created || 0;

      setSyncToast({
        success: true,
        message: chunksCount > 0 
          ? `Indexed Shopify Policies & FAQs! ${chunksCount} vector chunks ready.`
          : (result?.message || 'Auto-sync finished. You can also ingest specific policy URLs or documents below.'),
        chunks: chunksCount
      });

      // Reload KB
      await loadKbSources();
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncToast({
        success: false,
        message: err.response?.data?.error || err.message || 'Sync encountered an error. Please try again.'
      });
    } finally {
      setSyncingShopify(false);
      setSyncStep(0);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  // Handle URL Ingestion
  const handleIngestUrls = async (e) => {
    e.preventDefault();
    const urls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0 || ingestingUrls) return;

    try {
      setIngestingUrls(true);
      const res = await ingestUrls(urls, docTypeSelect);
      setUrlsInput('');
      const created = res?.chunks_created || 0;
      setSyncToast({
        success: true,
        message: `Successfully indexed ${urls.length} URL(s) into ${created} chunk(s)!`,
        chunks: created
      });
      await loadKbSources();
    } catch (err) {
      console.error('URL ingest error:', err);
      setSyncToast({
        success: false,
        message: err.response?.data?.error || 'Failed to index URLs. Please check the URLs and try again.'
      });
    } finally {
      setIngestingUrls(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploadingFile) return;

    try {
      setUploadingFile(true);
      const res = await uploadKnowledgeFile(
        selectedFile,
        fileCategory,
        'POLICY'
      );
      const uploadedFileName = selectedFile.name;
      setSelectedFile(null);
      const created = res?.chunks_created || 0;
      setSyncToast({
        success: true,
        message: `Indexed "${uploadedFileName}" into ${created} vector embedding(s)!`,
        chunks: created
      });
      await loadKbSources();
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploadingFile(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Handle Manual Rule
  const handleSaveManualRule = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim() || savingRule) return;

    try {
      setSavingRule(true);
      await addManualRule({
        title: manualTitle.trim(),
        doc_type: manualType,
        category: manualCategory,
        content: manualContent.trim()
      });
      setManualTitle('');
      setManualContent('');
      setSyncToast({
        success: true,
        message: `Saved rule "${manualTitle}" to vector store!`,
        chunks: 1
      });
      await loadKbSources();
    } catch (err) {
      console.error('Save rule error:', err);
    } finally {
      setSavingRule(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Handle Delete
  const handleDeleteSource = async (id, title) => {
    if (!window.confirm(`Delete "${title}" from vector store?`)) return;
    try {
      await deleteKnowledgeSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (filter === 'policies') return s.doc_type === 'POLICY';
    if (filter === 'faqs') return s.doc_type === 'FAQ';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 w-full h-full overflow-hidden">
      {/* ─── LEFT 7 COLS: SYNC + INGESTION + INDEXED TABLE ─── */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Toast Alert */}
        {syncToast && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition animate-slideInDown ${
              syncToast.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-[#00C853] shrink-0" />
              <span>{syncToast.message}</span>
            </div>
            <button onClick={() => setSyncToast(null)} className="text-slate-400 hover:text-slate-700">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ⚡ CARD 1: 1-CLICK SHOPIFY POLICY & FAQ AUTO-SYNC */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 via-white to-emerald-50/40 border border-blue-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  ⚡ 1-CLICK SHOPIFY POLICY & FAQ AUTO-SYNC
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-[#00C853] border border-emerald-200 uppercase">
                  Automated
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Automatically scrape your store's Refund, Shipping, Return Policies & FAQ page directly into the AI Vector Store.
              </p>
            </div>

            <button
              onClick={handleAutoSyncShopify}
              disabled={syncingShopify}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition shrink-0 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncingShopify ? 'animate-spin' : ''}`} />
              <span>{syncingShopify ? 'Auto-Syncing...' : '🔄 Auto-Sync Store Policies & FAQs'}</span>
            </button>
          </div>

          {/* Sync Progress Indicator */}
          {syncingShopify && (
            <div className="mt-3.5 pt-3 border-t border-blue-100 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-mono text-[11px] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {syncStep === 1 && 'Scraping Refund Policy, Shipping Policy & FAQs...'}
                  {syncStep === 2 && 'Splitting text into semantically cohesive Chunks...'}
                  {syncStep === 3 && 'Generating 1536-dim Vector Embeddings via OpenAI...'}
                </span>
                <span className="text-blue-700 font-bold">{syncStep * 33}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-[#00C853] transition-all duration-300"
                  style={{ width: `${syncStep * 33}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 📤 CARD 2: ADD KNOWLEDGE SOURCES (MULTI-MODE TABS) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CloudArrowUpIcon className="w-4 h-4 text-blue-600" />
              ADD KNOWLEDGE SOURCES
            </span>

            {/* Ingestion Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setActiveIngestTab('urls')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeIngestTab === 'urls'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔗 Paste URLs
              </button>
              <button
                onClick={() => setActiveIngestTab('file')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeIngestTab === 'file'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 Upload File
              </button>
              <button
                onClick={() => setActiveIngestTab('manual')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeIngestTab === 'manual'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✍️ Manual Q&A
              </button>
            </div>
          </div>

          {/* TAB A: URL INGESTION */}
          {activeIngestTab === 'urls' && (
            <form onSubmit={handleIngestUrls} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Store URLs (1 per line):
                </label>
                <textarea
                  rows={2}
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  placeholder="https://mystore.in/pages/sizing-chart&#10;https://mystore.in/policies/refund-policy"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 font-mono placeholder-slate-400 transition resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Doc Type:</span>
                  <select
                    value={docTypeSelect}
                    onChange={(e) => setDocTypeSelect(e.target.value)}
                    className="px-2.5 py-1 bg-white text-slate-800 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="AUTO">Auto-Detect (Policies & FAQs)</option>
                    <option value="POLICY">Store Policy (searchStorePolicies)</option>
                    <option value="FAQ">Product/Brand FAQ (searchFAQs)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!urlsInput.trim() || ingestingUrls}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 ${ingestingUrls ? 'animate-spin' : ''}`} />
                  <span>{ingestingUrls ? 'Scraping...' : '➕ Scrape & Index into Vector Store'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB B: FILE UPLOAD */}
          {activeIngestTab === 'file' && (
            <form onSubmit={handleFileUpload} className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 text-center bg-slate-50/60 cursor-pointer transition">
                <input
                  type="file"
                  id="kb-file-upload"
                  className="hidden"
                  accept=".pdf,.txt,.md,.csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="kb-file-upload" className="cursor-pointer block">
                  <CloudArrowUpIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-700 font-medium">
                    {selectedFile ? (
                      <span className="text-emerald-700 font-bold">Selected: {selectedFile.name}</span>
                    ) : (
                      'Drag & Drop policy document or click to browse'
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports PDF, TXT, Markdown, CSV</p>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Category:</span>
                  <select
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    className="px-2.5 py-1 bg-white text-slate-800 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="RETURN_EXCHANGE">RETURN_EXCHANGE</option>
                    <option value="REFUND_CANCELLATION">REFUND_CANCELLATION</option>
                    <option value="SHIPPING_COD">SHIPPING_COD</option>
                    <option value="SIZING_FIT">SIZING_FIT</option>
                    <option value="PRODUCT_USAGE_INGREDIENTS">PRODUCT_USAGE_INGREDIENTS</option>
                    <option value="GENERAL_INFO">GENERAL_INFO</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploadingFile}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 ${uploadingFile ? 'animate-spin' : ''}`} />
                  <span>{uploadingFile ? 'Indexing File...' : 'Upload & Chunk'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB C: MANUAL RULE / Q&A */}
          {activeIngestTab === 'manual' && (
            <form onSubmit={handleSaveManualRule} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Rule Title or Customer Question..."
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white text-slate-800 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="POLICY">Store Policy</option>
                    <option value="FAQ">Brand FAQ</option>
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Official rule text, policy terms, or exact answer..."
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 placeholder-slate-400 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Category:</span>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="px-2.5 py-1 bg-white text-slate-800 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="RETURN_EXCHANGE">RETURN_EXCHANGE</option>
                    <option value="REFUND_CANCELLATION">REFUND_CANCELLATION</option>
                    <option value="SHIPPING_COD">SHIPPING_COD</option>
                    <option value="SIZING_FIT">SIZING_FIT</option>
                    <option value="PRODUCT_USAGE_INGREDIENTS">PRODUCT_USAGE_INGREDIENTS</option>
                    <option value="GENERAL_INFO">GENERAL_INFO</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!manualTitle.trim() || !manualContent.trim() || savingRule}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 ${savingRule ? 'animate-spin' : ''}`} />
                  <span>{savingRule ? 'Saving Rule...' : 'Save Rule to Vector Store'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 📚 CARD 3: INDEXED KNOWLEDGE BASE TABLE */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                📚 INDEXED KNOWLEDGE SOURCES (Tenant #{tenantId || 1})
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredSources.length} sources
              </span>
            </div>

            {/* Filter Badges */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('policies')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  filter === 'policies'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛡️ Store Policies
              </button>
              <button
                onClick={() => setFilter('faqs')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  filter === 'faqs'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ❓ Brand FAQs
              </button>
            </div>
          </div>

          {/* Sources List / Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
                Loading indexed vector sources...
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <DocumentPlusIcon className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No knowledge sources indexed yet</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-4">
                  Add store URLs, upload policy documents (PDF, TXT, CSV), or auto-sync your Shopify store to train the AI agent on your exact store rules.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveIngestTab('urls')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition"
                  >
                    + Add Webpages
                  </button>
                  <button
                    onClick={() => setActiveIngestTab('file')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition"
                  >
                    + Upload File
                  </button>
                  <button
                    onClick={() => setActiveIngestTab('manual')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition"
                  >
                    + Manual Rule
                  </button>
                </div>
              </div>
            ) : (
              filteredSources.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{item.title}</span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                          item.doc_type === 'POLICY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.doc_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.chunks_count} chunks
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="truncate text-slate-400 font-mono">{item.source_url}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{item.category}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Preview chunk text"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(item.id, item.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete source"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT 5 COLS: LIVE AI VECTOR TEST SANDBOX ─── */}
      <div className="lg:col-span-5 h-full">
        <AiSandboxTester />
      </div>

      {/* ─── MODAL: PREVIEW CHUNK TEXT ─── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-3 animate-slideInDown">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{previewItem.title}</h4>
                <p className="text-xs text-slate-500 font-mono">{previewItem.source_url}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                  {previewItem.doc_type}
                </span>
                <span className="text-slate-600">Category: <strong>{previewItem.category}</strong></span>
                <span className="text-slate-600">Chunks: <strong>{previewItem.chunks_count}</strong></span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Sample Chunk Vector Text:
                </span>
                <div className="p-3 rounded-lg bg-slate-50 text-slate-800 text-xs font-mono border border-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                  {previewItem.preview_content ||
                    'Indexed knowledge chunk text with semantic embeddings for Indian D2C customer support.'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
