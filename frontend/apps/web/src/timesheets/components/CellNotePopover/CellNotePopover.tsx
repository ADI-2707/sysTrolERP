import { useState, type ReactNode } from "react";
import { Popover, Button } from "@systrol/ui";
import styles from "./CellNotePopover.module.css";

export interface CellNotePopoverProps {
  note: string;
  isEditable: boolean;
  projectCode: string;
  date: string;
  onSaveNote: (note: string) => void;
  trigger?: ReactNode;
}

export function CellNotePopover({
  note,
  isEditable,
  projectCode,
  date,
  onSaveNote,
  trigger,
}: CellNotePopoverProps) {
  const [draftNote, setDraftNote] = useState(note);

  const hasNote = Boolean(note.trim());

  const defaultTrigger = (
    <button
      type="button"
      className={[styles.noteTrigger, hasNote && styles.hasActiveNote]
        .filter(Boolean)
        .join(" ")}
      aria-label={hasNote ? `Task note: ${note}` : `Add task note for ${projectCode} on ${date}`}
      data-testid={`note-trigger-${projectCode}-${date}`}
    >
      <span className={styles.noteIndicator} />
    </button>
  );

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
      <Popover
        placement="bottom-start"
        trigger={trigger ?? defaultTrigger}
        content={({ close }) => {
        const handleSave = () => {
          onSaveNote(draftNote.trim());
          close();
        };

        const handleClear = () => {
          setDraftNote("");
          onSaveNote("");
          close();
        };

        return (
          <div className={styles.popoverCard} data-testid="cell-note-popover">
            <div className={styles.popoverHeader}>
              <span className={styles.popoverTitle}>Task Note</span>
              <span className={styles.popoverSubtitle}>
                {projectCode} &bull; {date}
              </span>
            </div>

            {isEditable ? (
              <>
                <textarea
                  className={styles.noteTextarea}
                  placeholder="Add details about task, work done, or site activity..."
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  autoFocus
                  data-testid="cell-note-textarea"
                />

                <div className={styles.popoverActions}>
                  {hasNote && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      data-testid="clear-note-btn"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={close}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    data-testid="save-note-btn"
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                {hasNote ? (
                  <p className={styles.readOnlyText} data-testid="readonly-note-text">
                    {note}
                  </p>
                ) : (
                  <p className={styles.emptyText}>No note recorded for this cell.</p>
                )}

                <div className={styles.popoverActions}>
                  <Button type="button" variant="ghost" size="sm" onClick={close}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      }}
    />
    </div>
  );
}
