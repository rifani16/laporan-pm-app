import { useEffect, useId, useMemo, useRef, useState } from 'react';

const MAX_VISIBLE_OPTIONS = 50;

// Kotak cari + daftar pilihan PM. options: [{ id, label, nama }].
export default function PmCombobox({ options, query, onQueryChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputId = useId();
  const listboxId = useId();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(opt =>
      String(opt.id).toLowerCase().includes(term) || String(opt.label).toLowerCase().includes(term)
    );
  }, [query, options]);
  const visible = filtered.slice(0, MAX_VISIBLE_OPTIONS);
  const active = visible.length ? Math.min(activeIndex, visible.length - 1) : -1;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const choose = (option) => {
    onSelect(option);
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.min(index + 1, visible.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      choose(visible[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">Cari / Pilih ID PM atau Nama PM</label>
      <input
        id={inputId}
        type="text"
        className="min-h-11 w-full rounded-lg border bg-white p-2"
        value={query}
        onChange={event => {
          onQueryChange(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Ketik ID PM atau nama..."
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && active >= 0 ? `${listboxId}-${active}` : undefined}
      />
      {open && (
        <ul id={listboxId} role="listbox" className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-white shadow-md">
          {visible.map((option, index) => (
            <li
              id={`${listboxId}-${index}`}
              key={option.id}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => { event.preventDefault(); choose(option); }}
              className={`cursor-pointer px-3 py-3 text-sm ${index === active ? 'bg-teal-50 text-teal-900' : 'hover:bg-gray-100'}`}
            >
              {option.label}
            </li>
          ))}
          {visible.length === 0 && <li className="px-3 py-3 text-sm text-gray-600">PM tidak ditemukan.</li>}
          {filtered.length > MAX_VISIBLE_OPTIONS && (
            <li className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Menampilkan {MAX_VISIBLE_OPTIONS} dari {filtered.length} hasil. Ketik ID atau nama untuk mempersempit.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
