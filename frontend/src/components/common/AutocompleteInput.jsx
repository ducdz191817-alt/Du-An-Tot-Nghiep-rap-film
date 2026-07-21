import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronDown, User } from 'lucide-react';

/**
 * AutocompleteInput – dùng cho cả single value (đạo diễn) và multi-tag (diễn viên)
 *
 * Props:
 *  - label        : string  – tiêu đề trường
 *  - placeholder  : string
 *  - suggestions  : string[] – danh sách gợi ý (lấy từ DB)
 *  - value        : string  (mode="single") | string[] (mode="tags")
 *  - onChange     : (value: string | string[]) => void
 *  - mode         : "single" | "tags"  (default "single")
 *  - icon         : ReactNode
 */
const AutocompleteInput = ({
  label,
  placeholder = '',
  suggestions = [],
  value,
  onChange,
  mode = 'single',
  icon,
}) => {
  const [inputValue, setInputValue] = useState(mode === 'single' ? (value || '') : '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync single-mode value when form is reset or edited
  useEffect(() => {
    if (mode === 'single') {
      setInputValue(value || '');
    }
  }, [value, mode]);

  // Tags mode: value should be string[]
  const tags = mode === 'tags' ? (Array.isArray(value) ? value : []) : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter suggestions based on current input, excluding already-added tags
  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return suggestions
      .filter((s) => {
        if (mode === 'tags' && tags.includes(s)) return false;
        if (!q) return true;
        return s.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [suggestions, inputValue, tags, mode]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlighted(-1);
    if (mode === 'single') {
      onChange(e.target.value);
    }
  };

  const selectSuggestion = (suggestion) => {
    if (mode === 'single') {
      setInputValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);
    } else {
      // tags mode
      if (!tags.includes(suggestion)) {
        onChange([...tags, suggestion]);
      }
      setInputValue('');
      setIsOpen(false);
      inputRef.current?.focus();
    }
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && e.key !== 'ArrowDown') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        selectSuggestion(filtered[highlighted]);
      } else if (mode === 'tags' && inputValue.trim()) {
        // Allow adding custom value not in suggestions
        const trimmed = inputValue.trim();
        if (!tags.includes(trimmed)) {
          onChange([...tags, trimmed]);
        }
        setInputValue('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlighted(-1);
    } else if (mode === 'tags' && e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace
      onChange(tags.slice(0, -1));
    } else if (mode === 'tags' && (e.key === ',' || e.key === ';')) {
      e.preventDefault();
      if (inputValue.trim()) {
        const trimmed = inputValue.trim();
        if (!tags.includes(trimmed)) {
          onChange([...tags, trimmed]);
        }
        setInputValue('');
        setIsOpen(false);
      }
    }
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div
        className={`flex flex-wrap gap-1.5 items-center w-full bg-gray-50 border rounded-lg px-3 py-2 transition-colors cursor-text focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 ${
          isOpen && filtered.length > 0 ? 'border-brand ring-1 ring-brand/20' : 'border-gray-200'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tags */}
        {mode === 'tags' && tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-brand/10 border border-brand/30 text-brand text-[11px] font-bold px-2 py-0.5 rounded-md"
          >
            <User size={10} />
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-0.5 text-brand/60 hover:text-brand transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Left icon */}
        {icon && mode === 'single' && (
          <span className="text-gray-400 shrink-0">{icon}</span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'tags' && tags.length > 0 ? 'Thêm diễn viên...' : placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 py-0.5"
        />

        {/* Dropdown toggle for single mode */}
        {mode === 'single' && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setIsOpen((v) => !v); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Hint for tags mode */}
      {mode === 'tags' && (
        <p className="text-[10px] text-gray-400 mt-1 pl-0.5">
          Nhấn <kbd className="bg-gray-100 border border-gray-200 px-1 rounded text-[9px] font-mono">Enter</kbd> hoặc <kbd className="bg-gray-100 border border-gray-200 px-1 rounded text-[9px] font-mono">,</kbd> để thêm. Chọn từ gợi ý hoặc tự nhập tên mới.
        </p>
      )}

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                  i === highlighted
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User size={12} className={i === highlighted ? 'text-brand' : 'text-gray-400'} />
                <span className="font-semibold">{s}</span>
                {mode === 'tags' && tags.includes(s) && (
                  <span className="ml-auto text-[10px] text-green-500 font-bold">✓ Đã thêm</span>
                )}
              </button>
            ))}
          </div>
          {mode === 'tags' && inputValue.trim() && !suggestions.includes(inputValue.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                const trimmed = inputValue.trim();
                if (!tags.includes(trimmed)) onChange([...tags, trimmed]);
                setInputValue('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-brand border-t border-gray-100 font-bold hover:bg-brand/5 flex items-center gap-2"
            >
              <span className="text-brand/50">+</span>
              Thêm "{inputValue.trim()}"
            </button>
          )}
        </div>
      )}

      {/* Show "Add new" option when no match and user typed something (tags mode, dropdown closed or no suggestions) */}
      {isOpen && filtered.length === 0 && inputValue.trim() && mode === 'tags' && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const trimmed = inputValue.trim();
              if (!tags.includes(trimmed)) onChange([...tags, trimmed]);
              setInputValue('');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-brand font-bold hover:bg-brand/5 flex items-center gap-2"
          >
            <span className="text-brand/50">+</span>
            Thêm "{inputValue.trim()}" mới
          </button>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
