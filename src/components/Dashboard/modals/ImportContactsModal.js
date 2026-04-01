import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiConfig } from '../../../config/api';

const ImportContactsModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userData } = useAuth();
  
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [csvParseError, setCsvParseError] = useState('');
  const [importProgress, setImportProgress] = useState({ success: 0, failed: 0, total: 0 });
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Updated Known Fields to match new DB schema
  const knownFields = [
    { value: 'first_name', label: 'First Name (Core)' },
    { value: 'last_name', label: 'Last Name (Core)' },
    { value: 'phone_number', label: 'Phone Number (Core)' },
    { value: 'email', label: 'Email (Core)' },
    { value: 'type', label: 'Lead Stage (Core)' },
    { value: 'tags', label: 'Tags (Comma Separated)' },
    { value: 'company', label: 'Company (Custom)' },
    { value: 'title', label: 'Title (Custom)' },
    { value: 'custom_attribute', label: 'Save as Custom Attribute' }, // Catch-all
  ];

  const getFieldVariations = (field) => {
    const variations = {
      'first_name': ['first name', 'firstname', 'fname', 'given name', 'first'],
      'last_name': ['last name', 'lastname', 'lname', 'surname', 'last'],
      'phone_number': ['phone', 'mobile', 'cell', 'telephone', 'tel', 'number', 'whatsapp'],
      'email': ['email', 'e-mail', 'mail'],
      'company': ['company', 'organization', 'org', 'business'],
      'title': ['title', 'job title', 'position', 'role'],
      'type': ['lead stage', 'stage', 'status', 'type'],
      'tags': ['tags', 'labels']
    };
    return variations[field] || [field];
  };

  const handleCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error('No file provided')); return; }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          
          const parseCSVLine = (line) => {
            const result = [];
            let current = '', inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              if (line[i] === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } 
                else { inQuotes = !inQuotes; }
              } else if (line[i] === ',' && !inQuotes) {
                result.push(current.trim()); current = '';
              } else { current += line[i]; }
            }
            result.push(current.trim());
            return result;
          };

          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length === 0) throw new Error('Empty CSV');

          const headers = parseCSVLine(lines[0]).map(h => h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
          const rows = lines.slice(1).map(parseCSVLine).filter(row => row.some(cell => cell.trim()));

          setCsvHeaders(headers);
          setCsvRows(rows);
          setCsvParseError('');
          
          // Auto-map logic
          const autoMapping = {};
          headers.forEach(header => {
            let mapped = false;
            knownFields.forEach(field => {
              if (mapped || field.value === 'custom_attribute') return;
              if (getFieldVariations(field.value).some(v => header.includes(v))) {
                autoMapping[header] = field.value;
                mapped = true;
              }
            });
            // If we couldn't auto-map to a core field, default to saving it as a custom attribute
            if (!mapped) autoMapping[header] = 'custom_attribute';
          });
          
          setMapping(autoMapping);
          resolve({ headers, rows });
        } catch (error) {
          setCsvParseError(error.message);
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleChangeMapping = (csvHeader, fieldValue) => {
    setMapping(prev => ({ ...prev, [csvHeader]: fieldValue }));
  };

  const handleStartImport = async () => {
    if (csvRows.length === 0) return;
    setIsImporting(true);
    setImportProgress({ success: 0, failed: 0, total: csvRows.length });
    
    try {
      const dbId = userData?.db_id || user?.db_id || user?.uid;
      const token = localStorage.getItem('authToken');
      let successCount = 0, failedCount = 0;

      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        
        try {
          // Initialize flat payload structure
          const contactData = {
            user_id: dbId,
            source: 'csv_import',
            first_name: null,
            last_name: null,
            phone_number: null,
            email: null,
            type: 'NEW', // Default lead stage
            tags: [],
            custom_attributes: {}
          };

          // Map CSV data
          csvHeaders.forEach((header, index) => {
            const mappedType = mapping[header];
            const cellValue = row[index]?.trim();
            
            if (!mappedType || !cellValue || mappedType === 'ignore') return;

            if (['first_name', 'last_name', 'phone_number', 'email', 'type'].includes(mappedType)) {
              // Map directly to core fields
              if (mappedType === 'phone_number') {
                // Ensure no spaces in DB phone number
                contactData.phone_number = cellValue.replace(/\s+/g, '');
              } else {
                contactData[mappedType] = cellValue;
              }
            } else if (mappedType === 'tags') {
              // Split tag string into array
              contactData.tags = cellValue.split(',').map(t => t.trim()).filter(Boolean);
            } else if (mappedType === 'company' || mappedType === 'title') {
              // Known custom attributes
              contactData.custom_attributes[mappedType] = cellValue;
            } else if (mappedType === 'custom_attribute') {
              // Dump any unrecognized but requested column into JSONB
              contactData.custom_attributes[header] = cellValue;
            }
          });

          if (!contactData.first_name || !contactData.phone_number) {
            throw new Error('Missing required fields: first_name or phone_number');
          }

          const response = await fetch(apiConfig.endpoints.contacts.createContact(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(contactData), // Sending flat payload!
          });

          if (!response.ok) {
            // Ignore duplicates silently during bulk import, or count them as failed
            if (response.status === 409) throw new Error('Duplicate phone number');
            throw new Error(`Status ${response.status}`);
          }
          successCount++;
        } catch (error) {
          failedCount++;
        }

        setImportProgress({ success: successCount, failed: failedCount, total: csvRows.length });
      }

      setImportResults({ success: true, imported: successCount, failed: failedCount, total: csvRows.length });
      if (onSuccess) await onSuccess();

      setTimeout(() => {
        setCsvHeaders([]); setCsvRows([]); setMapping({}); setImportResults(null);
        onClose();
      }, 3000);

    } catch (error) {
      setImportResults({ success: false, error: error.message, imported: importProgress.success, failed: importProgress.failed });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Import Contacts (CSV)</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} disabled={isImporting}>✕</button>
        </div>

        <div className="space-y-4">
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">Upload a CSV file. Unknown columns will be safely saved as Custom Attributes.</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleCsvFile(e.target.files?.[0])}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700"
              disabled={isImporting}
            />
            {csvParseError && <div className="mt-2 text-sm text-red-600">{csvParseError}</div>}
            {csvHeaders.length > 0 && <div className="mt-2 text-xs text-gray-600">Detected {csvRows.length} rows.</div>}
          </div>

          {csvHeaders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Map Columns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <div className="w-1/2 text-xs font-medium text-gray-700 truncate" title={header}>{header}</div>
                    <select
                      className="w-1/2 border rounded px-2 py-1 text-xs"
                      value={mapping[header] || 'ignore'}
                      onChange={(e) => handleChangeMapping(header, e.target.value)}
                      disabled={isImporting}
                    >
                      <option value="ignore">Ignore Column</option>
                      {knownFields.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResults && (
            <div className={`p-4 rounded-lg border ${importResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start space-x-3">
                <span className="text-xl">{importResults.success ? '✅' : '❌'}</span>
                <div>
                  <p className="font-semibold">{importResults.success ? 'Import Completed' : 'Import Failed'}</p>
                  <p className="text-sm">{importResults.success ? `${importResults.imported} imported, ${importResults.failed} failed or duplicates.` : importResults.error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-600">
              {isImporting && `Processing: ${importProgress.success + importProgress.failed} / ${importProgress.total}`}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded" onClick={onClose} disabled={isImporting}>Cancel</button>
              {!importResults && (
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded disabled:opacity-60 flex items-center gap-2"
                  disabled={isImporting || csvRows.length === 0}
                  onClick={handleStartImport}
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal;