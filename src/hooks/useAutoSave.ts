import { useEffect, useRef } from 'react';
import { useMaterialEditorStore } from '@/store/useMaterialEditorStore';
import { autoSaveMaterial } from '@/actions/material-actions';

export function useAutoSave() {
  const { id, title, type, questions, setSavingStatus } = useMaterialEditorStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!id) return; // Cannot autosave if it doesn't exist in DB

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce for 3 seconds
    timeoutRef.current = setTimeout(async () => {
      setSavingStatus(true);
      try {
        const payload = { id, title, type, questions };
        const result = await autoSaveMaterial(payload);
        if (result.success) {
          setSavingStatus(false, result.savedAt);
        }
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setSavingStatus(false);
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [id, title, type, questions, setSavingStatus]);
}
