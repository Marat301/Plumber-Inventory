import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ListTabs } from '../components/ListTabs';
import { MaterialCard } from '../components/MaterialCard';
import { Button } from '../components/Button';
import { CameraIcon, PlusIcon } from '../components/Icons';
import { SidePanel } from '../components/SidePanel';
import { MoveQuantityModal } from '../components/MoveQuantityModal';
import { useInventory } from '../context/InventoryContext';
import { canSplitQuantity, parseQuantity } from '../lib/quantity';
import type { MaterialItem } from '../types';

type OpenPanel = 'filter' | 'sort' | null;
type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

export function InventoryPage() {
  const {
    lists,
    activeList,
    activeListId,
    addItemManually,
    moveItemsToList,
    moveItemToList,
    moveItemQuantity,
    removeItems,
  } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [filterName, setFilterName] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [bulkMovePrompt, setBulkMovePrompt] = useState<{
    item: MaterialItem;
    targetListId: string;
    targetListName: string;
  } | null>(null);

  const materialOptions = useMemo(() => {
    const materials = activeList.items
      .map((item) => item.material.trim())
      .filter(Boolean);
    return [...new Set(materials)].sort((a, b) => a.localeCompare(b));
  }, [activeList.items]);

  const displayedItems = useMemo(() => {
    let items = [...activeList.items];

    const nameQuery = filterName.trim().toLowerCase();
    if (nameQuery) {
      items = items.filter((item) => item.name.toLowerCase().includes(nameQuery));
    }

    if (filterMaterial) {
      items = items.filter((item) => item.material === filterMaterial);
    }

    items.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return a.addedAt.localeCompare(b.addedAt);
        case 'date-desc':
        default:
          return b.addedAt.localeCompare(a.addedAt);
      }
    });

    return items;
  }, [activeList.items, filterName, filterMaterial, sortBy]);

  const hasActiveFilters = Boolean(filterName.trim() || filterMaterial);
  const otherLists = lists.filter((list) => list.id !== activeListId);
  const hasSelection = selectedIds.size > 0;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeListId]);

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkMove = (targetListId: string) => {
    const ids = [...selectedIds];

    if (ids.length === 1) {
      const item = activeList.items.find((entry) => entry.id === ids[0]);
      const targetList = lists.find((list) => list.id === targetListId);

      if (item && targetList && canSplitQuantity(item.quantity)) {
        setBulkMovePrompt({
          item,
          targetListId,
          targetListName: targetList.name,
        });
        return;
      }
    }

    moveItemsToList(ids, targetListId);
    clearSelection();
  };

  const confirmBulkPartialMove = (amount: number) => {
    if (!bulkMovePrompt) return;

    const maxQuantity = parseQuantity(bulkMovePrompt.item.quantity);
    if (maxQuantity === null) return;

    if (amount >= maxQuantity) {
      moveItemToList(bulkMovePrompt.item.id, bulkMovePrompt.targetListId);
    } else {
      moveItemQuantity(bulkMovePrompt.item.id, bulkMovePrompt.targetListId, amount);
    }

    setBulkMovePrompt(null);
    clearSelection();
  };

  const confirmBulkDelete = () => {
    removeItems([...selectedIds]);
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleAddItem = () => {
    if (!itemName.trim()) return;
    addItemManually(itemName);
    setItemName('');
    setShowAddModal(false);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setItemName('');
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterMaterial('');
  };

  return (
    <div className={`page ${hasSelection ? 'has-selection' : ''}`}>
      <Header title="Inventory" />

      <ListTabs />

      <div className="toolbar">
        <button
          type="button"
          className={`toolbar-chip ${openPanel === 'filter' || hasActiveFilters ? 'active' : ''}`}
          onClick={() => setOpenPanel((panel) => (panel === 'filter' ? null : 'filter'))}
        >
          Filter
        </button>
        <button
          type="button"
          className={`toolbar-chip ${openPanel === 'sort' ? 'active' : ''}`}
          onClick={() => setOpenPanel((panel) => (panel === 'sort' ? null : 'sort'))}
        >
          Sort
        </button>
      </div>

      <SidePanel open={openPanel === 'filter'} title="Filter" onClose={() => setOpenPanel(null)}>
        <label className="field">
          <span>Name contains</span>
          <input
            type="text"
            className="input"
            placeholder="Search by name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Material</span>
          <select
            className="input"
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
          >
            <option value="">All materials</option>
            {materialOptions.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </SidePanel>

      <SidePanel open={openPanel === 'sort'} title="Sort" onClose={() => setOpenPanel(null)}>
        <div className="side-panel-options">
          {(
            [
              ['date-desc', 'Newest first'],
              ['date-asc', 'Oldest first'],
              ['name-asc', 'Name (A–Z)'],
              ['name-desc', 'Name (Z–A)'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`side-panel-option ${sortBy === value ? 'active' : ''}`}
              onClick={() => setSortBy(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </SidePanel>

      <main className="content">
        {activeList.items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">📷</p>
            <p className="empty-state-title">No materials yet</p>
            <p className="empty-state-text">
              Tap + to add manually or use the camera to scan items into {activeList.name}
            </p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No matches</p>
            <p className="empty-state-text">Try adjusting your filters</p>
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="material-list">
            {displayedItems.map((item) => (
              <li
                key={item.id}
                className={`material-list-item ${selectedIds.has(item.id) ? 'selected' : ''}`}
              >
                <label className="material-select">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </label>
                <MaterialCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {hasSelection && (
        <div className="bulk-bar">
          <div className="bulk-bar-top">
            <span className="bulk-bar-count">{selectedIds.size} selected</span>
            <div className="bulk-bar-actions">
              <button
                type="button"
                className="bulk-bar-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
              <button type="button" className="bulk-bar-clear" onClick={clearSelection}>
                Clear
              </button>
            </div>
          </div>
          {otherLists.length > 0 && (
            <div className="bulk-bar-move">
              <span className="bulk-bar-label">Move to</span>
              <div className="bulk-bar-lists">
                {otherLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    className="bulk-bar-list-btn"
                    onClick={() => handleBulkMove(list.id)}
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Are you sure?</h2>
            <p className="modal-description">
              Delete {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} from{' '}
              <strong>{activeList.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmBulkDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fab-stack">
        <button
          type="button"
          className="fab fab-manual"
          onClick={() => setShowAddModal(true)}
          aria-label="Add item manually"
        >
          <PlusIcon />
        </button>
        <Link to="/scan" className="fab" aria-label="Scan barcode">
          <CameraIcon />
        </Link>
      </div>

      {bulkMovePrompt && parseQuantity(bulkMovePrompt.item.quantity) !== null && (
        <MoveQuantityModal
          open
          item={bulkMovePrompt.item}
          targetListName={bulkMovePrompt.targetListName}
          maxQuantity={parseQuantity(bulkMovePrompt.item.quantity)!}
          onClose={() => setBulkMovePrompt(null)}
          onConfirm={confirmBulkPartialMove}
        />
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Item</h2>
            <p className="modal-description">Adding to {activeList.name}</p>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                className="input"
                placeholder="e.g. Copper pipe 10 ft"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={closeAddModal}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!itemName.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
