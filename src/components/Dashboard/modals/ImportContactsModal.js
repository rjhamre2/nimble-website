import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiConfig } from '../../../config/api';

const ImportContactsModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userData } = useAuth();
  
  // CSV Import state
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [csvParseError, setCsvParseError] = useState('');
  const [importProgress, setImportProgress] = useState({ success: 0, failed: 0, total: 0 });
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Known fields for mapping
  const knownFields = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' }
  ];

  // Helper function to get field name variations for auto-mapping
  const getFieldVariations = (field) => {
    const variations = {
      'first_name': ['first name', 'firstname', 'fname', 'given name', 'first'],
      'last_name': ['last name', 'lastname', 'lname', 'surname', 'family name', 'last'],
      'phone': ['phone', 'mobile', 'cell', 'telephone', 'tel', 'number'],
      'email': ['email', 'e-mail', 'mail'],
      'company': ['company', 'organization', 'org', 'business'],
      'title': ['title', 'job title', 'position', 'role'],
      'address': ['address', 'street', 'location'],
      'city': ['city'],
      'state': ['state', 'province'],
      'zip': ['zip', 'postal code', 'postcode', 'zip code'],
      'country': ['country'],
      'birthday': ['birthday', 'birth date', 'dob', 'date of birth'],
      'lead_stage': ['lead stage', 'stage', 'status', 'lead status']
    };
    return variations[field] || [field];
  };

  // CSV file handler
  const handleCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          
          // Simple CSV parser - handles quoted fields and commas
          const parseCSV = (csvText) => {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
              return { headers: [], rows: [] };
            }

            // Parse first line as headers
            const headers = parseCSVLine(lines[0]);
            
            // Parse remaining lines as data rows
            const rows = lines.slice(1)
              .map(line => parseCSVLine(line))
              .filter(row => row.some(cell => cell.trim())); // Filter out empty rows

            return { headers, rows };
          };

          // Helper function to parse a CSV line, handling quoted fields
          const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              const nextChar = line[i + 1];

              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Escaped quote
                  current += '"';
                  i++; // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            
            // Add last field
            result.push(current.trim());
            
            return result;
          };

          const { headers, rows } = parseCSV(text);
          
          if (headers.length === 0) {
            throw new Error('CSV file appears to be empty or invalid');
          }

          // Update state
          setCsvHeaders(headers);
          setCsvRows(rows);
          setCsvParseError('');
          
          // Auto-map known fields if headers match
          const autoMapping = {};
          headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase().trim();
            knownFields.forEach(field => {
              const fieldVariations = getFieldVariations(field.value);
              if (fieldVariations.some(variation => lowerHeader.includes(variation) || variation.includes(lowerHeader))) {
                autoMapping[header] = field.value;
              }
            });
          });
          setMapping(autoMapping);

          console.log('✅ [CSV Import] File parsed successfully:', { headers, rowCount: rows.length });
          resolve({ headers, rows });
        } catch (error) {
          console.error('❌ [CSV Import] Parse error:', error);
          setCsvParseError(error.message || 'Failed to parse CSV file');
          setCsvHeaders([]);
          setCsvRows([]);
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        setCsvParseError(error.message);
        reject(error);
      };

      reader.readAsText(file);
    });
  };


  const handleChangeMapping = (csvHeader, fieldValue) => {
    const newMapping = { ...mapping };
    if (fieldValue) {
      newMapping[csvHeader] = fieldValue;
    } else {
      delete newMapping[csvHeader];
    }
    setMapping(newMapping);
  };

  const handleStartImport = async () => {
    if (csvRows.length === 0) {
      alert('No contacts to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ success: 0, failed: 0, total: csvRows.length });
    setImportResults(null);
    
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        throw new Error('User ID not found');
      }

      const token = localStorage.getItem('authToken');
      let successCount = 0;
      let failedCount = 0;

      // Import contacts one by one
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        
        try {
          // Build contact data from mapped row
          const contactData = {
            name: {
              first_name: '',
              last_name: '',
              formatted_name: ''
            },
            phones: [],
            emails: [],
            org: {},
            lead_stage: 'NEW'
          };

          // Map fields from CSV row
          Object.keys(mapping).forEach(csvHeader => {
            const fieldValue = mapping[csvHeader];
            const csvColumnIndex = csvHeaders.indexOf(csvHeader);
            const cellValue = csvColumnIndex >= 0 ? (row[csvColumnIndex] || '').trim() : '';

            if (!cellValue) return;

            switch (fieldValue) {
              case 'first_name':
                contactData.name.first_name = cellValue;
                break;
              case 'last_name':
                contactData.name.last_name = cellValue;
                break;
              case 'phone':
                contactData.phones.push({
                  phone: cellValue,
                  type: 'MOBILE'
                });
                break;
              case 'email':
                contactData.emails.push({
                  email: cellValue,
                  type: 'WORK'
                });
                break;
              case 'company':
                contactData.org.company = cellValue;
                break;
              case 'title':
                contactData.org.title = cellValue;
                break;
            }
          });

          // Set formatted name
          const firstName = contactData.name.first_name;
          const lastName = contactData.name.last_name;
          contactData.name.formatted_name = `${firstName} ${lastName}`.trim() || 'No Name';

          // Validate required fields
          if (!contactData.name.first_name || contactData.phones.length === 0) {
            throw new Error('Missing required fields: first name and phone');
          }

          // Make API call to create contact
          const apiUrl = apiConfig.endpoints.contacts.createContact();
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              user_id: dbId,
              contact_data: contactData
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to import contact: ${response.status}`);
          }

          successCount++;
        } catch (error) {
          console.error(`❌ [CSV Import] Failed to import row ${i + 1}:`, error);
          failedCount++;
        }

        // Update progress
        setImportProgress({
          success: successCount,
          failed: failedCount,
          total: csvRows.length
        });
      }

      setImportResults({
        success: true,
        imported: successCount,
        failed: failedCount,
        total: csvRows.length
      });

      // Refresh contacts list
      if (onSuccess) {
        await onSuccess();
      }

      console.log(`✅ [CSV Import] Import completed: ${successCount} successful, ${failedCount} failed`);

      // Show confirmation and close modal after a short delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000); // 2 second delay to show confirmation message
    } catch (error) {
      console.error('❌ [CSV Import] Import error:', error);
      setImportResults({
        success: false,
        error: error.message,
        imported: importProgress.success,
        failed: importProgress.failed
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setCsvParseError('');
    setImportProgress({ success: 0, failed: 0, total: 0 });
    setImportResults(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Import Contacts (CSV)</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={handleClose}
            aria-label="Close"
            disabled={isImporting}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Upload */}
        <div className="space-y-4">
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">Upload a CSV file. The first row should be headers.</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleCsvFile(file)
                    .catch((error) => {
                      console.error('Failed to parse CSV file:', error);
                    });
                }
              }}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isImporting}
            />
            {csvParseError && (
              <div className="mt-2 text-sm text-red-600">{csvParseError}</div>
            )}
            {csvHeaders.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">Detected {csvRows.length} rows. {csvHeaders.length} columns.</div>
            )}
          </div>

          {/* Step 2: Mapping */}
          {csvHeaders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Map Columns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <div className="w-1/2 text-xs text-gray-700 truncate" title={header}>{header || '(unnamed column)'}</div>
                    <select
                      className="w-1/2 border rounded px-2 py-1 text-xs"
                      value={mapping[header] || ''}
                      onChange={(e) => handleChangeMapping(header, e.target.value)}
                      disabled={isImporting}
                    >
                      <option value="">Ignore</option>
                      {knownFields.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Results/Confirmation */}
          {importResults && (
            <div className={`p-4 rounded-lg border ${
              importResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {importResults.success ? (
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 mb-1">
                      Import Completed Successfully!
                    </p>
                    <p className="text-sm text-green-700">
                      {importResults.imported} contact{importResults.imported !== 1 ? 's' : ''} imported successfully.
                      {importResults.failed > 0 && (
                        <span className="block mt-1">
                          {importResults.failed} contact{importResults.failed !== 1 ? 's' : ''} failed to import.
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      The modal will close automatically...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <span className="text-red-600 text-xl">❌</span>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 mb-1">
                      Import Failed
                    </p>
                    <p className="text-sm text-red-700">
                      {importResults.error || 'An error occurred during import'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Import */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-gray-600">
              {importProgress.total > 0 && !importResults && (
                <span>Imported {importProgress.success}/{importProgress.total} successful, {importProgress.failed} failed.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={handleClose}
                disabled={isImporting}
              >
                {importResults ? 'Close' : 'Cancel'}
              </button>
              {!importResults && (
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                  disabled={isImporting || csvRows.length === 0}
                  onClick={handleStartImport}
                >
                  {isImporting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
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
