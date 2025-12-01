import React, { createContext, useContext, useState } from 'react';

interface CodettePanelContextType {
  showCodetteMasterPanel: boolean;
  setShowCodetteMasterPanel: (show: boolean) => void;
}

const CodettePanelContext = createContext<CodettePanelContextType | undefined>(undefined);

export function CodettePanelProvider({ children }: { children: React.ReactNode }) {
  const [showCodetteMasterPanel, setShowCodetteMasterPanel] = useState(false);

  return (
    <CodettePanelContext.Provider value={{ showCodetteMasterPanel, setShowCodetteMasterPanel }}>
      {children}
    </CodettePanelContext.Provider>
  );
}

export function useCodettePanel() {
  const context = useContext(CodettePanelContext);
  if (!context) {
    throw new Error('useCodettePanel must be used within CodettePanelProvider');
  }
  return context;
}
