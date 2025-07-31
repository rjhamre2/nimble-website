import React, { useState } from 'react';

function PrivacyPolicyCreator() {
  const [showInstructions, setShowInstructions] = useState(false);

  const privacyPolicyContent = `
# Privacy Policy

**Effective Date:** ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, such as when you create an account, use our services, or contact us.

## 2. How We Use Your Information

We use the information we collect to provide, maintain, and improve our services.

## 3. Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties.

## 4. Contact Us

If you have questions about this Privacy Policy, please contact us at contact@nimbleai.in

## 5. Data Deletion

To request deletion of your data, email us at contact@nimbleai.in
  `.trim();

  const termsOfServiceContent = `
# Terms of Service

**Effective Date:** ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By using our services, you agree to these Terms of Service.

## 2. Use of Services

You may use our services only for lawful purposes and in accordance with these Terms.

## 3. User Responsibilities

You are responsible for maintaining the confidentiality of your account.

## 4. Contact Information

For questions about these Terms, contact us at contact@nimbleai.in
  `.trim();

  const dataDeletionContent = `
# Data Deletion Request

**Effective Date:** ${new Date().toLocaleDateString()}

## How to Request Data Deletion

To request deletion of your personal data:

1. **Email us at:** contact@nimbleai.in
2. **Subject line:** Data Deletion Request
3. **Include:** Your name and email address

## What We Delete

We will delete:
- Your account information
- Personal data we have collected
- Any associated records

## Timeline

We will process your request within 30 days.

## Contact

For questions about data deletion, email: contact@nimbleai.in
  `.trim();

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-4">Privacy Policy Creator</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Facebook requires these pages to be accessible. Since they don't exist yet, you need to create them.
        </p>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
      </div>

      {showInstructions && (
        <div className="space-y-4">
          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 1: Create Pages in Your App</h4>
            <p className="text-sm mb-2">Add these routes to your React app:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code>/privacy-policy</code> - Privacy Policy page</li>
              <li><code>/terms-of-service</code> - Terms of Service page</li>
              <li><code>/delete-user-data</code> - Data Deletion page</li>
            </ul>
          </div>

          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 2: Use Temporary URLs</h4>
            <p className="text-sm mb-2">For testing, you can use these temporary URLs:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Privacy Policy: <code>https://nimbleai.in/privacy-policy</code></li>
              <li>Terms of Service: <code>https://nimbleai.in/terms-of-service</code></li>
              <li>Data Deletion: <code>https://nimbleai.in/delete-user-data</code></li>
            </ul>
          </div>

          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 3: Use Development Mode</h4>
            <p className="text-sm mb-2">Skip Live Mode and use Development Mode with test users:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Stay in Development Mode</li>
              <li>Add yourself as a test user</li>
              <li>Test Facebook login immediately</li>
            </ol>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 mt-4">
        <p><strong>Recommended:</strong> Use Option 3 (Development Mode) for immediate testing.</p>
      </div>
    </div>
  );
}

export default PrivacyPolicyCreator; 