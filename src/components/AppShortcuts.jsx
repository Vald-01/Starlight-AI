import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { openSettings } from '@/lib/settingsModal';

const isEditable = (element) => {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable;
};

const COMPOSER_ID = 'link-input';

/** Cmd or Ctrl shortcuts: "," opens settings, N and V jump to the link field. */
export default function AppShortcuts() {
  const navigate = useNavigate();
  const timers = useRef([]);

  const focusComposer = useCallback(() => {
    const input = document.getElementById(COMPOSER_ID);
    if (input) {
      input.focus();
      return;
    }
    // The composer lives on the landing route: go there, then focus once it mounts.
    navigate('/');
    timers.current.push(
      window.setTimeout(() => {
        document.getElementById(COMPOSER_ID)?.focus();
      }, 80)
    );
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = String(event.key || '').toLowerCase();

      if (event.key === ',') {
        event.preventDefault();
        openSettings();
        return;
      }

      if (key === 'n') {
        event.preventDefault();
        focusComposer();
        return;
      }

      // Paste over a non-editable surface focuses the composer; the browser then pastes into it.
      if (key === 'v' && !isEditable(document.activeElement) && !document.querySelector('[role="dialog"]')) {
        focusComposer();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [focusComposer]);

  return null;
}
