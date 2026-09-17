import "./MemoOption.css";
import { useEffect, useRef, useState } from "react";

type MemoOptionProps = { onEdit?: () => void; onDelete?: () => void };

const MemoOption = ({ onEdit, onDelete }: MemoOptionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const optionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!optionRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    const closeMenu = () => setIsOpen(false);

    const requestDelete = () => {
        closeMenu();
        if (window.confirm("このメモを削除しますか？")) {
            onDelete?.();
        }
    };

    return (
        <div className={`memo-option${isOpen ? " is-open" : ""}`} ref={optionRef}>
            <button className="memo-option-trigger" type="button" aria-label="メモのオプションを開く" aria-expanded={isOpen} aria-haspopup="menu" onClick={() => setIsOpen(current => !current)}>
                <span className="memo-option-dots" aria-hidden="true">
                    <span className="memo-option-dot" />
                    <span className="memo-option-dot" />
                    <span className="memo-option-dot" />
                </span>
            </button>
            {isOpen && <div className="memo-option-menu" role="menu">
                {onEdit && <button type="button" role="menuitem" onClick={() => { closeMenu(); onEdit(); }}>メモを編集</button>}
                <button className="memo-option-delete-button" type="button" role="menuitem" onClick={requestDelete}>メモを削除</button>
            </div>}
        </div>
    );
};

export default MemoOption;
