import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  History, 
  Star, 
  StarOff, 
  Tag, 
  FileText, 
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { epistemicDriverHistoryService } from '../../../services/supabaseServices';
import type { 
  HistoryManagerProps, 
  SaveEpistemicDriverInput,
  EpistemicDriverHistoryEntry 
} from '../types';
import styles from '../styles.module.css';

interface SaveModalState {
  isOpen: boolean;
  title: string;
  tags: string;
  notes: string;
  isFavorite: boolean;
  isLoading: boolean;
  error: string | null;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  currentData,
  currentInput,
  onLoadFromHistory,
  onSaveSuccess
}) => {
  const [saveModal, setSaveModal] = useState<SaveModalState>({
    isOpen: false,
    title: '',
    tags: '',
    notes: '',
    isFavorite: false,
    isLoading: false,
    error: null
  });

  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<EpistemicDriverHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openSaveModal = useCallback(() => {
    if (!currentData || !currentInput) return;
    
    setSaveModal({
      isOpen: true,
      title: currentInput.subject || 'Untitled Study Map',
      tags: '',
      notes: '',
      isFavorite: false,
      isLoading: false,
      error: null
    });
  }, [currentData, currentInput]);

  const closeSaveModal = useCallback(() => {
    setSaveModal(prev => ({ ...prev, isOpen: false, error: null }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentData || !currentInput) return;

    setSaveModal(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const saveInput: SaveEpistemicDriverInput = {
        title: saveModal.title.trim() || 'Untitled Study Map',
        subject: currentInput.subject,
        objectives: currentInput.objectives,
        study_map_data: currentData,
        tags: saveModal.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        notes: saveModal.notes.trim() || undefined,
        is_favorite: saveModal.isFavorite
      };

      await epistemicDriverHistoryService.saveEpistemicDriver(saveInput);
      
      setSaveModal(prev => ({ ...prev, isLoading: false }));
      closeSaveModal();
      onSaveSuccess?.();
      
      // Show success message briefly
      setTimeout(() => {
        // Could add a toast notification here
      }, 100);
      
    } catch (error) {
      setSaveModal(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to save study map'
      }));
    }
  }, [currentData, currentInput, saveModal, closeSaveModal, onSaveSuccess]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const entries = await epistemicDriverHistoryService.getUserEpistemicDriverHistory();
      setHistoryEntries(entries);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to load history:', error);
      // If table doesn't exist, show empty state but still open modal
      if (error instanceof Error && error.message.includes('does not exist')) {
        setHistoryEntries([]);
        setShowHistory(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleLoadFromHistory = useCallback((entry: EpistemicDriverHistoryEntry) => {
    onLoadFromHistory(entry);
    setShowHistory(false);
  }, [onLoadFromHistory]);

  const canSave = currentData && currentInput;

  return (
    <>
      {/* Action Buttons */}
      <div className={styles.historyActions}>
        <button
          onClick={openSaveModal}
          disabled={!canSave}
          className={`${styles.actionButton} ${styles.saveButton}`}
          title="Save current study map"
        >
          <Save className="w-4 h-4" />
          Save Study Map
        </button>
        
        <button
          onClick={loadHistory}
          disabled={historyLoading}
          className={`${styles.actionButton} ${styles.historyButton}`}
          title="View saved study maps"
        >
          <History className="w-4 h-4" />
          {historyLoading ? 'Loading...' : 'View History'}
        </button>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {saveModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeSaveModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.saveModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Save Study Map</h3>
                <button
                  onClick={closeSaveModal}
                  className={styles.modalCloseButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.modalContent}>
                {saveModal.error && (
                  <div className={styles.errorMessage}>
                    <AlertCircle className="w-4 h-4" />
                    {saveModal.error}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="save-title" className={styles.label}>
                    Title *
                  </label>
                  <input
                    id="save-title"
                    type="text"
                    value={saveModal.title}
                    onChange={(e) => setSaveModal(prev => ({ ...prev, title: e.target.value }))}
                    className={styles.input}
                    placeholder="Enter a title for your study map"
                    disabled={saveModal.isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="save-tags" className={styles.label}>
                    Tags
                  </label>
                  <input
                    id="save-tags"
                    type="text"
                    value={saveModal.tags}
                    onChange={(e) => setSaveModal(prev => ({ ...prev, tags: e.target.value }))}
                    className={styles.input}
                    placeholder="Enter tags separated by commas (e.g., azure, certification, cloud)"
                    disabled={saveModal.isLoading}
                  />
                  <small className={styles.helpText}>
                    <Tag className="w-3 h-3 inline mr-1" />
                    Use tags to organize and find your study maps easily
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="save-notes" className={styles.label}>
                    Notes
                  </label>
                  <textarea
                    id="save-notes"
                    value={saveModal.notes}
                    onChange={(e) => setSaveModal(prev => ({ ...prev, notes: e.target.value }))}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Add any additional notes or comments about this study map"
                    rows={3}
                    disabled={saveModal.isLoading}
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={saveModal.isFavorite}
                      onChange={(e) => setSaveModal(prev => ({ ...prev, isFavorite: e.target.checked }))}
                      className={styles.checkbox}
                      disabled={saveModal.isLoading}
                    />
                    <span className={styles.checkboxText}>
                      {saveModal.isFavorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                      Mark as favorite
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={closeSaveModal}
                  disabled={saveModal.isLoading}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveModal.isLoading || !saveModal.title.trim()}
                  className={styles.saveConfirmButton}
                >
                  {saveModal.isLoading ? (
                    <>
                      <div className={styles.spinner} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Study Map
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal - We'll create a separate HistoryList component for this */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${styles.saveModal} ${styles.historyModal}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <History className="w-5 h-5 mr-2" />
                  Your Study Map History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className={styles.modalCloseButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.historyContent}>
                {historyEntries.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-center">
                      No saved study maps yet. Generate and save your first epistemic driver to see it here!
                    </p>
                    <p className="text-gray-500 text-center text-sm mt-2">
                      💡 Tip: Make sure the database table is created in your Supabase dashboard
                    </p>
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {historyEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={styles.historyItem}
                        onClick={() => handleLoadFromHistory(entry)}
                      >
                        <div className={styles.historyItemHeader}>
                          <h4 className={styles.historyItemTitle}>
                            {entry.is_favorite && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
                            )}
                            {entry.title}
                          </h4>
                          <span className={styles.historyItemDate}>
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={styles.historyItemSubject}>{entry.subject}</p>
                        {entry.tags.length > 0 && (
                          <div className={styles.historyItemTags}>
                            {entry.tags.map((tag) => (
                              <span key={tag} className={styles.tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
