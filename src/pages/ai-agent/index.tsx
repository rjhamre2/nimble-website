import React from 'react';
import AiAgentCommandCenter from '../../components/Dashboard/AiAgentCommandCenter';

export { default as LiveInboxView } from '../../components/Dashboard/ai-agent/LiveInboxView';
export { default as KnowledgeBaseManagerView } from '../../components/Dashboard/ai-agent/KnowledgeBaseManagerView';
export { default as AiSandboxTester } from '../../components/Dashboard/ai-agent/AiSandboxTester';

export default function AiAgentPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <AiAgentCommandCenter />
    </div>
  );
}
