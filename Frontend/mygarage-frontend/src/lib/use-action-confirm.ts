'use client';

import { useState, useEffect } from 'react';

interface UseActionConfirmOptions {
  autoClearErrorMs?: number;
}

export function useActionConfirm(options: UseActionConfirmOptions = {}) {
  const { autoClearErrorMs = 5000 } = options;
  
  const [isActioning, setIsActioning] = useState(false);
  const [confirmState, setConfirmState] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage && autoClearErrorMs > 0) {
      const timer = setTimeout(() => setErrorMessage(null), autoClearErrorMs);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, autoClearErrorMs]);

  const enterConfirm = (id?: string) => {
    if (id) {
      setConfirmId(id);
    } else {
      setConfirmState(true);
    }
  };

  const cancelConfirm = () => {
    setConfirmState(false);
    setConfirmId(null);
  };
  
  const startAction = (id?: string) => {
    setIsActioning(true);
    if (id) setActioningId(id);
    setErrorMessage(null);
  };
  
  const failAction = (message: string) => {
    setErrorMessage(message);
    setIsActioning(false);
    setActioningId(null);
    setConfirmState(false);
    setConfirmId(null);
  };
  
  const completeAction = () => {
    setIsActioning(false);
    setActioningId(null);
    setConfirmState(false);
    setConfirmId(null);
  };

  return {
    isActioning,
    actioningId,
    confirmState,
    confirmId,
    errorMessage,
    setErrorMessage,
    enterConfirm,
    cancelConfirm,
    startAction,
    failAction,
    completeAction
  };
}
