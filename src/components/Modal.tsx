import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
interface Props {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}
export function Modal({ titleId, onClose, children, className = "" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        closeRef.current();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
        {children}
      </motion.div>
    </dialog>
  );
}
