import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RetailerCard } from '../retailer-card'
import type { Retailer } from '@/types'

const mockRetailer: Retailer = {
  id: '1',
  user_id: 'user-1',
  name: 'Target',
  location: 'Downtown',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  trip_count: 5
}

const mockRetailerNoLocation: Retailer = {
  id: '2',
  user_id: 'user-1',
  name: 'Walmart',
  location: undefined,
  created_at: '2023-01-02T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  trip_count: 0
}

describe('RetailerCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders retailer information correctly', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.getByText('Downtown')).toBeInTheDocument()
    expect(screen.getByText('5 trips')).toBeInTheDocument()
  })

  it('renders retailer without location', () => {
    render(
      <RetailerCard
        retailer={mockRetailerNoLocation}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Walmart')).toBeInTheDocument()
    expect(screen.queryByText('Downtown')).not.toBeInTheDocument()
    expect(screen.getByText('0 trips')).toBeInTheDocument()
  })

  it('shows actions menu when showActions is true', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    )

    const menuButton = screen.getByRole('button')
    expect(menuButton).toBeInTheDocument()
  })

  it('hides actions menu when showActions is false', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={false}
      />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('opens and closes actions menu', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    
    // Menu should be closed initially
    expect(screen.queryByText('Edit retailer')).not.toBeInTheDocument()

    // Click to open menu
    await user.click(menuButton)
    expect(screen.getByText('Edit retailer')).toBeInTheDocument()
    expect(screen.getByText('Delete retailer')).toBeInTheDocument()

    // Click outside to close menu
    fireEvent.click(document.body)
    expect(screen.queryByText('Edit retailer')).not.toBeInTheDocument()
  })

  it('calls onEdit when edit is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const editButton = screen.getByText('Edit retailer')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockRetailer)
  })

  it('calls onDelete when delete is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const deleteButton = screen.getByText('Delete retailer')
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockRetailer)
  })

  it('calls onSelect when card is clicked and onSelect is provided', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    )

    const card = screen.getByText('Target').closest('div')
    await user.click(card!)

    expect(mockOnSelect).toHaveBeenCalledWith(mockRetailer)
  })

  it('shows selected state correctly', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        isSelected={true}
      />
    )

    const card = screen.getByText('Target').closest('div')
    expect(card).toHaveClass('border-primary')
    
    // Should show checkmark icon
    const checkmark = screen.getByRole('img', { hidden: true }) // SVG icons are hidden by default
    expect(checkmark).toBeInTheDocument()
  })

  it('does not show selected state when not selected', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    )

    const card = screen.getByText('Target').closest('div')
    expect(card).not.toHaveClass('border-primary')
  })

  it('has clickable styling when onSelect is provided', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    )

    const card = screen.getByText('Target').closest('div')
    expect(card).toHaveClass('cursor-pointer')
  })

  it('does not have clickable styling when onSelect is not provided', () => {
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const card = screen.getByText('Target').closest('div')
    expect(card).not.toHaveClass('cursor-pointer')
  })

  it('prevents event bubbling when menu button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerCard
        retailer={mockRetailer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    // onSelect should not be called when menu button is clicked
    expect(mockOnSelect).not.toHaveBeenCalled()
  })
})