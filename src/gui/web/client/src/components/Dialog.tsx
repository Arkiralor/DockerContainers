import { ReactNode } from 'react'

/**
 * Props for ConfirmDialog component
 */
interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean
  /** Dialog title */
  title: string
  /** Confirmation message/question */
  message: string
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string
  /** Callback fired when confirm button is clicked */
  onConfirm: () => void
  /** Callback fired when cancel button is clicked or dialog is dismissed */
  onCancel: () => void
  /** Visual variant affecting confirm button color (default: "warning") */
  variant?: 'danger' | 'warning' | 'info'
}

/**
 * ConfirmDialog Component
 *
 * Modal dialog for confirming destructive or important actions.
 * Displays a title, message, and two buttons (confirm and cancel).
 *
 * Variants:
 * - danger: Red confirm button (for destructive actions like delete)
 * - warning: Yellow confirm button (for potentially harmful actions like stop)
 * - info: Blue confirm button (for informational confirmations)
 *
 * The dialog is displayed centered on screen with a dark overlay.
 * Returns null when isOpen is false.
 *
 * @param props - Component props
 * @returns JSX element displaying confirmation dialog, or null if not open
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded text-white transition-colors ${variantStyles[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Props for Modal component
 */
interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when modal should close (via close button or overlay click) */
  onClose: () => void
  /** Modal title displayed in header */
  title: string
  /** Modal content to display in body */
  children: ReactNode
  /** Modal width size (default: "lg") */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Modal Component
 *
 * Generic modal dialog for displaying detailed content.
 * Provides a sticky header with title and close button, plus scrollable content area.
 *
 * Size options:
 * - sm: max-w-md (small, for simple content)
 * - md: max-w-2xl (medium)
 * - lg: max-w-4xl (large, default)
 * - xl: max-w-6xl (extra large, for detailed views)
 *
 * Features:
 * - Centered on screen with dark overlay
 * - Sticky header that remains visible while scrolling
 * - Constrained to 90% of viewport height with internal scrolling
 * - Close button in header
 *
 * Returns null when isOpen is false.
 *
 * @param props - Component props
 * @returns JSX element displaying modal, or null if not open
 */
export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-auto`}>
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
