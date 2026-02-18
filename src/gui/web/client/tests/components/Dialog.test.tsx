import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog, { Modal } from '@/components/Dialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnCancel.mockClear()
  })

  describe('Rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    })

    it('renders with custom button labels', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Yes, delete"
          cancelLabel="No, keep it"
        />
      )

      expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument()
    })

    it('renders with default button labels', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies danger variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />)
      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-red-600')
    })

    it('applies warning variant styles (default)', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-yellow-600')
    })

    it('applies info variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />)
      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-blue-600')
    })
  })

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })
})

describe('Modal', () => {
  const mockOnClose = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Modal Title',
    children: <div>Modal Content</div>,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<Modal {...defaultProps} />)

      expect(screen.getByText('Modal Title')).toBeInTheDocument()
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Modal Title')).not.toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="custom-content">
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </Modal>
      )

      const content = screen.getByTestId('custom-content')
      expect(content).toBeInTheDocument()
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />)
      const modal = container.querySelector('.max-w-md')
      expect(modal).toBeInTheDocument()
    })

    it('renders with medium size', () => {
      const { container } = render(<Modal {...defaultProps} size="md" />)
      const modal = container.querySelector('.max-w-2xl')
      expect(modal).toBeInTheDocument()
    })

    it('renders with large size (default)', () => {
      const { container } = render(<Modal {...defaultProps} />)
      const modal = container.querySelector('.max-w-4xl')
      expect(modal).toBeInTheDocument()
    })

    it('renders with extra large size', () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />)
      const modal = container.querySelector('.max-w-6xl')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('has accessible close button with SVG icon', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
