import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { UiLock, type UiLockProps } from "./UiLock";

export interface UiLockContextValue {
  isLocked: boolean;
  lockMessage?: string;
  lock: (message?: string) => void;
  unlock: () => void;
}

const UiLockContext = createContext<UiLockContextValue | undefined>(undefined);

export interface UiLockProviderProps {
  children: ReactNode;
  defaultOptions?: Partial<UiLockProps>;
}

export function UiLockProvider({ children, defaultOptions }: UiLockProviderProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | undefined>(undefined);

  const lock = useCallback((message?: string) => {
    setLockMessage(message);
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setLockMessage(undefined);
  }, []);

  return (
    <UiLockContext.Provider value={{ isLocked, lockMessage, lock, unlock }}>
      {children}
      <UiLock
        active={isLocked}
        message={lockMessage}
        fullScreen={true}
        {...defaultOptions}
      />
    </UiLockContext.Provider>
  );
}

export function useUiLock(): UiLockContextValue {
  const context = useContext(UiLockContext);
  if (!context) {
    return {
      isLocked: false,
      lockMessage: undefined,
      lock: () => {},
      unlock: () => {},
    };
  }
  return context;
}
