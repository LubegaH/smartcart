import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RetailerList } from '../retailer-list'
import type { Retailer } from '@/types'

const mockRetailers: Retailer[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Target',
    location: 'Downtown',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    trip_count: 5
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Walmart',
    location: 'Suburb',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    trip_count: 3
  },
  {
    id: '3',
    user_id: 'user-1',
    name: 'Whole Foods',
    location: undefined,
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
    trip_count: 1
  }
]

describe('RetailerList', () => {
  const mockOnEdit = vi.fn()
  const mockOnRefresh = vi.fn()
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no retailers', () => {
    render(
      <RetailerList
        retailers={[]}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
        emptyStateAction={<button>Add retailer</button>}
      />
    )

    expect(screen.getByText('No retailers yet')).toBeInTheDocument()
    expect(screen.getByText('Add stores where you shop to track prices and organize your shopping trips.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add retailer' })).toBeInTheDocument()
  })

  it('renders retailer list correctly', () => {
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.getByText('Downtown')).toBeInTheDocument()
    expect(screen.getByText('5 trips')).toBeInTheDocument()
    
    expect(screen.getByText('Walmart')).toBeInTheDocument()
    expect(screen.getByText('Suburb')).toBeInTheDocument()
    expect(screen.getByText('3 trips')).toBeInTheDocument()
    
    expect(screen.getByText('Whole Foods')).toBeInTheDocument()
    expect(screen.getByText('1 trips')).toBeInTheDocument()
  })

  it('filters retailers by search query', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search retailers...')
    await user.type(searchInput, 'Target')

    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.queryByText('Walmart')).not.toBeInTheDocument()
    expect(screen.queryByText('Whole Foods')).not.toBeInTheDocument()
    
    expect(screen.getByText('1 of 3 retailers')).toBeInTheDocument()
  })

  it('filters retailers by location', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search retailers...')
    await user.type(searchInput, 'Downtown')

    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.queryByText('Walmart')).not.toBeInTheDocument()
    expect(screen.queryByText('Whole Foods')).not.toBeInTheDocument()
  })

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search retailers...')
    await user.type(searchInput, 'Nonexistent')

    expect(screen.getByText('No retailers match "Nonexistent"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search retailers...')
    await user.type(searchInput, 'Target')
    
    expect(screen.getByText('1 of 3 retailers')).toBeInTheDocument()

    const clearButton = screen.getByRole('button', { name: 'Clear search' })
    await user.click(clearButton)

    expect(screen.getByText('3 of 3 retailers')).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })

  it('sorts retailers by name', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const sortSelect = screen.getByDisplayValue('Name')
    
    // Get all retailer names in order they appear
    const retailerCards = screen.getAllByText(/\d+ trips/)
    const cardTexts = retailerCards.map(card => card.closest('[data-testid]') || card.parentElement)
    
    // Should be sorted alphabetically by default
    expect(screen.getAllByText(/^Target|Walmart|Whole Foods$/)[0]).toHaveTextContent('Target')
  })

  it('sorts retailers by trip count', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    const sortSelect = screen.getByDisplayValue('Name')
    await user.selectOptions(sortSelect, 'trips')

    // Target should be first (5 trips), then Walmart (3 trips), then Whole Foods (1 trip)
    const retailerNames = screen.getAllByText(/^Target|Walmart|Whole Foods$/)
    expect(retailerNames[0]).toHaveTextContent('Target')
    expect(retailerNames[1]).toHaveTextContent('Walmart')
    expect(retailerNames[2]).toHaveTextContent('Whole Foods')
  })

  it('handles retailer selection', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
        onSelect={mockOnSelect}
        selectedRetailerId="1"
      />
    )

    // Target should be selected initially
    const targetCard = screen.getByText('Target').closest('div')
    expect(targetCard).toHaveClass('border-primary')

    // Click on Walmart
    const walmartCard = screen.getByText('Walmart').closest('div')
    await user.click(walmartCard!)

    expect(mockOnSelect).toHaveBeenCalledWith(mockRetailers[1])
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    // Click on the menu button for the first retailer
    const menuButtons = screen.getAllByRole('button', { name: '' }) // Menu buttons don't have text
    await user.click(menuButtons[0])

    // Click edit option
    const editButton = screen.getByText('Edit retailer')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockRetailers[0])
  })

  it('shows delete confirmation modal', async () => {
    const user = userEvent.setup()
    
    render(
      <RetailerList
        retailers={mockRetailers}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    )

    // Click on the menu button for the first retailer
    const menuButtons = screen.getAllByRole('button', { name: '' })
    await user.click(menuButtons[0])

    // Click delete option
    const deleteButton = screen.getByText('Delete retailer')
    await user.click(deleteButton)

    // Delete modal should appear
    expect(screen.getByText('Delete retailer')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete Target/)).toBeInTheDocument()
  })
})