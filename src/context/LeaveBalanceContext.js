import React, { createContext, useCallback, useMemo, useState } from "react";

export const LeaveBalanceContext = createContext({
  version: 0,
  bump: () => {},
});

export function LeaveBalanceProvider({ children }) {
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(() => ({ version, bump }), [version, bump]);

  return (
    <LeaveBalanceContext.Provider value={value}>
      {children}
    </LeaveBalanceContext.Provider>
  );
}
