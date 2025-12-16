import React from 'react';
import './Controls.css';

function Controls({
  yearRange,
  setYearRange,
  yearExtent,
  selectedType,
  setSelectedType,
  types,
  selectedCountry,
  setSelectedCountry,
  countries,
  onReset
}) {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="year-range">
          Year Range: {yearRange[0]} - {yearRange[1]}
        </label>
        <div className="year-slider-container">
          <input
            id="year-min"
            type="range"
            min={yearExtent[0]}
            max={yearExtent[1]}
            value={yearRange[0]}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin <= yearRange[1]) {
                setYearRange([newMin, yearRange[1]]);
              }
            }}
            className="year-slider"
          />
          <input
            id="year-max"
            type="range"
            min={yearExtent[0]}
            max={yearExtent[1]}
            value={yearRange[1]}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax >= yearRange[0]) {
                setYearRange([yearRange[0], newMax]);
              }
            }}
            className="year-slider"
          />
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="disaster-type">Disaster Type</label>
        <select
          id="disaster-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="control-select"
        >
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="control-select"
        >
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <button onClick={onReset} className="reset-button">
          Reset Filters
        </button>
      </div>
    </div>
  );
}

export default Controls;

