import { MemoryItem } from '../types';
import { INITIAL_SAMPLE_MEMORIES } from './sampleData';

const STORAGE_KEY = 'braincache_memories_v3';
const INITIALIZED_KEY = 'braincache_has_seeded_v3';

// Read all memories from localStorage
export function getSavedMemories(): MemoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time loading: seed with initial realistic memories
      const hasSeeded = localStorage.getItem(INITIALIZED_KEY);
      if (!hasSeeded) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MEMORIES));
        localStorage.setItem(INITIALIZED_KEY, 'true');
        return INITIAL_SAMPLE_MEMORIES;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read memories from localStorage', err);
    return [];
  }
}

// Save or add a new memory item
export function saveMemoryItem(item: MemoryItem): MemoryItem[] {
  const current = getSavedMemories();
  // Prepend so latest appears first
  const updated = [item, ...current.filter((m) => m.id !== item.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save memory to localStorage', err);
  }
  return updated;
}

// Delete a single memory item by ID
export function deleteMemoryItem(id: string): MemoryItem[] {
  const current = getSavedMemories();
  const updated = current.filter((m) => m.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete memory item', err);
  }
  return updated;
}

// Clear all memories from localStorage
export function clearAllSavedMemories(): MemoryItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear memories', err);
  }
  return [];
}

// Restore demo sample memories
export function restoreSampleMemories(): MemoryItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MEMORIES));
  } catch (err) {
    console.error('Failed to restore sample memories', err);
  }
  return INITIAL_SAMPLE_MEMORIES;
}
