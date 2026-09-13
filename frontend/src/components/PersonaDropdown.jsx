import React, { useState, useRef, useEffect } from 'react';
import { PROFILE_PRESETS } from '../data/profilePresets';

export default function PersonaDropdown({ onSelectPreset, currentProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activePreset = PROFILE_PRESETS.find(
    (p) => p.profile?.student_id === currentProfile?.student_id
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (preset) => {
    onSelectPreset(preset);
    setIsOpen(false);
  };

  return (
    <div className="persona-dropdown-wrapper" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="persona-dropdown-trigger"
        className={`persona-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Select Engineering Specialization Track"
      >
        <span style={{ color: 'var(--primary)' }}>◈</span>
        <span style={{ fontWeight: 600 }}>
          {activePreset ? activePreset.name : 'Engineering Track'}
        </span>
        <span className={`persona-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* Clean Engineering Tracks Menu */}
      {isOpen && (
        <div className="persona-menu-panel" id="persona-menu-dropdown">
          <div className="persona-menu-header">
            <span>ENGINEERING TRACKS</span>
          </div>

          <div className="persona-list">
            {PROFILE_PRESETS.map((preset) => {
              const isSelected = activePreset?.id === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`persona-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(preset)}
                >
                  <span className="track-code-badge">{preset.code}</span>
                  <div className="persona-item-text">
                    <div className="persona-item-title">{preset.name}</div>
                    <div className="persona-item-sub">{preset.subtitle}</div>
                  </div>
                  {isSelected && <span className="persona-item-check">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


