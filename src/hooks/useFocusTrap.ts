// src/hooks/useFocusTrap.ts
import { useEffect, useRef, RefObject, useCallback } from 'react';

/**
 * Selector for all focusable elements within a container
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Callback when Escape key is pressed */
  onClose?: () => void;
  /** Ref to the container element to trap focus within */
  containerRef: RefObject<HTMLElement | null>;
  /** Optional ref to the element that should receive initial focus */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Whether to restore focus to the trigger element on close (default: true) */
  restoreFocus?: boolean;
}

/**
 * Custom hook for trapping focus within a modal/dialog container.
 *
 * Features:
 * - Traps Tab/Shift+Tab navigation within the container
 * - Handles Escape key to close the modal
 * - Restores focus to the trigger element when modal closes
 * - Sets initial focus when modal opens
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const closeButtonRef = useRef<HTMLButtonElement>(null);
 *
 * useFocusTrap({
 *   isActive: isModalOpen,
 *   onClose: () => setIsModalOpen(false),
 *   containerRef,
 *   initialFocusRef: closeButtonRef,
 * });
 * ```
 */
export function useFocusTrap({
  isActive,
  onClose,
  containerRef,
  initialFocusRef,
  restoreFocus = true,
}: UseFocusTrapOptions): void {
  // Store the element that was focused before the modal opened
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => {
      // Filter out elements that are not visible
      return el.offsetParent !== null && !el.hasAttribute('inert');
    });
  }, [containerRef]);

  // Handle keyboard events for focus trapping and Escape
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift+Tab from first element -> go to last element
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        // Tab from last element -> go to first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
        // If focus is outside container, bring it back
        else if (
          containerRef.current &&
          !containerRef.current.contains(document.activeElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener to document for capturing phase
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, onClose, containerRef, getFocusableElements]);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (isActive) {
      // Store the currently focused element before opening
      triggerElementRef.current = document.activeElement as HTMLElement;

      // Set initial focus after a brief delay to ensure DOM is ready
      const focusTimeout = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          // Focus the first focusable element if no initial focus ref provided
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 0);

      return () => clearTimeout(focusTimeout);
    } else if (restoreFocus && triggerElementRef.current) {
      // Restore focus when modal closes
      triggerElementRef.current.focus();
      triggerElementRef.current = null;
    }
  }, [isActive, initialFocusRef, restoreFocus, getFocusableElements]);
}
