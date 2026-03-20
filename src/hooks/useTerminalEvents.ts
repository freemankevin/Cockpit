import { Terminal } from '@xterm/xterm';
import { ClipboardHandlers } from './useTerminalClipboard';

export interface TerminalEventSetup {
  attachEvents: (
    terminalElement: HTMLElement,
    handlers: ClipboardHandlers,
    term: Terminal
  ) => () => void;
  attachKeyHandler: (
    term: Terminal,
    handlers: ClipboardHandlers
  ) => void;
}

export const setupTerminalEvents = (): TerminalEventSetup => {
  const attachKeyHandler = (term: Terminal, handlers: ClipboardHandlers) => {
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      // Shift+Insert paste
      if (event.shiftKey && event.key === 'Insert') {
        event.preventDefault();
        term.focus();
        handlers.readFromClipboard().then((text) => {
          if (text) handlers.pasteText(text);
        });
        return false;
      }
      // Ctrl+Shift+C copy
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        const selection = term.getSelection();
        if (selection) handlers.copyToClipboard(selection);
        return false;
      }
      // Ctrl+Shift+V paste
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        term.focus();
        handlers.readFromClipboard().then((text) => {
          if (text) handlers.pasteText(text);
        });
        return false;
      }
      return true;
    });
  };

  const attachEvents = (
    terminalElement: HTMLElement,
    handlers: ClipboardHandlers,
    term: Terminal
  ) => {
    // Right-click paste
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      term.focus();
      handlers.readFromClipboard().then((text) => {
        if (text) handlers.pasteText(text);
      });
    };

    // Native paste event interception (prevents rich text background)
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (text) {
        term.focus();
        handlers.pasteText(text);
      }
    };

    // Bind to terminal element with capture phase
    terminalElement.addEventListener('paste', handlePaste as EventListener, true);
    terminalElement.addEventListener('contextmenu', handleContextMenu as EventListener, true);

    // Bind to xterm-screen
    const xtermScreen = terminalElement.querySelector('.xterm-screen') as HTMLElement | null;
    if (xtermScreen) {
      xtermScreen.addEventListener('paste', handlePaste as EventListener, true);
      xtermScreen.addEventListener('contextmenu', handleContextMenu as EventListener, true);
    }

    // Bind to xterm-helper-textarea (crucial for paste events)
    const xtermHelper = terminalElement.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement | null;
    if (xtermHelper) {
      xtermHelper.addEventListener('paste', handlePaste as EventListener, true);
    }

    // Return cleanup function
    return () => {
      terminalElement.removeEventListener('paste', handlePaste as EventListener, true);
      terminalElement.removeEventListener('contextmenu', handleContextMenu as EventListener, true);

      if (xtermScreen) {
        xtermScreen.removeEventListener('paste', handlePaste as EventListener, true);
        xtermScreen.removeEventListener('contextmenu', handleContextMenu as EventListener, true);
      }

      if (xtermHelper) {
        xtermHelper.removeEventListener('paste', handlePaste as EventListener, true);
      }
    };
  };

  return {
    attachEvents,
    attachKeyHandler,
  };
};

export default setupTerminalEvents;