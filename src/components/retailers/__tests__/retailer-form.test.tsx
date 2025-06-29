import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RetailerForm } from '../retailer-form'
import { dataService } from '@/lib/data'
import type { Retailer } from '@/types'

// Mock the data service
vi.mock('@/lib/data', () => ({
  dataService: {
    retailers: {
      create: vi.fn(),
      update: vi.fn()
    }
  }
}))

const mockRetailer: Retailer = {
  id: '1',
  user_id: 'user-1',
  name: 'Target',
  location: 'Downtown',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  trip_count: 5
}

describe('RetailerForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Add retailer')).toBeInTheDocument()
    expect(screen.getByText('Add a new store where you shop')).toBeInTheDocument()
    expect(screen.getByLabelText('Store name')).toBeInTheDocument()
    expect(screen.getByLabelText('Location (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add retailer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    render(
      <RetailerForm
        retailer={mockRetailer}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Edit retailer')).toBeInTheDocument()
    expect(screen.getByText('Update retailer information')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Target')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Downtown')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update retailer' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Add retailer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Retailer name is required')).toBeInTheDocument()
    })
  })

  it('validates name length', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText('Store name')
    await user.type(nameInput, 'a'.repeat(101)) // Too long

    const submitButton = screen.getByRole('button', { name: 'Add retailer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name must be less than 100 characters')).toBeInTheDocument()
    })
  })

  it('creates retailer successfully', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(dataService.retailers.create)
    mockCreate.mockResolvedValue({ success: true, data: mockRetailer })

    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText('Store name')
    const locationInput = screen.getByLabelText('Location (optional)')
    
    await user.type(nameInput, 'Target')
    await user.type(locationInput, 'Downtown')

    const submitButton = screen.getByRole('button', { name: 'Add retailer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Target',
        location: 'Downtown'
      })
      expect(mockOnSuccess).toHaveBeenCalledWith(mockRetailer)
    })
  })

  it('updates retailer successfully', async () => {
    const user = userEvent.setup()
    const mockUpdate = vi.mocked(dataService.retailers.update)
    const updatedRetailer = { ...mockRetailer, name: 'Walmart' }
    mockUpdate.mockResolvedValue({ success: true, data: updatedRetailer })

    render(
      <RetailerForm
        retailer={mockRetailer}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByDisplayValue('Target')
    await user.clear(nameInput)
    await user.type(nameInput, 'Walmart')

    const submitButton = screen.getByRole('button', { name: 'Update retailer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(mockRetailer.id, {
        name: 'Walmart',
        location: 'Downtown'
      })
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedRetailer)
    })
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(dataService.retailers.create)
    mockCreate.mockResolvedValue({ success: false, error: 'Retailer already exists' })

    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText('Store name')
    await user.type(nameInput, 'Target')

    const submitButton = screen.getByRole('button', { name: 'Add retailer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Retailer already exists')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(dataService.retailers.create)
    
    // Mock a slow API call
    mockCreate.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, data: mockRetailer }), 100)
    ))

    render(
      <RetailerForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const nameInput = screen.getByLabelText('Store name')
    await user.type(nameInput, 'Target')

    const submitButton = screen.getByRole('button', { name: 'Add retailer' })
    await user.click(submitButton)

    // Button should show loading state
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})