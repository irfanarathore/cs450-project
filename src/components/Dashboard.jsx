import React, { useState, useMemo } from 'react';
import './Dashboard.css';
import useDisasterData from '../hooks/useDisasterData';
import Controls from './Controls';
import KpiCards from './KpiCards';
import TimeTrendChart from './charts/TimeTrendChart';
import TypeSeverityChart from './charts/TypeSeverityChart';
import ResponseScatterChart from './charts/ResponseScatterChart';
import CountryRankChart from './charts/CountryRankChart';

function Dashboard() {
  const { data, loading, error } = useDisasterData();
  
  // Global filter state
  const [yearRange, setYearRange] = useState([2018, 2024]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [rankingMetric, setRankingMetric] = useState('response_time_hours');
  const [scatterYAxis, setScatterYAxis] = useState('casualties');

  // Extract unique values for dropdowns
  const uniqueTypes = useMemo(() => {
    if (!data.length) return [];
    return ['All', ...new Set(data.map(d => d.disaster_type))].sort();
  }, [data]);

  const uniqueCountries = useMemo(() => {
    if (!data.length) return [];
    const countries = [...new Set(data.map(d => d.country))].sort();
    return ['All', ...countries];
  }, [data]);

  const yearExtent = useMemo(() => {
    if (!data.length) return [2018, 2024];
    const years = data.map(d => d.year);
    return [Math.min(...years), Math.max(...years)];
  }, [data]);

  // Filter data based on current selections
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchesYear = d.year >= yearRange[0] && d.year <= yearRange[1];
      const matchesType = selectedType === 'All' || d.disaster_type === selectedType;
      const matchesCountry = selectedCountry === 'All' || d.country === selectedCountry;
      return matchesYear && matchesType && matchesCountry;
    });
  }, [data, yearRange, selectedType, selectedCountry]);

  // Reset all filters
  const handleReset = () => {
    setYearRange(yearExtent);
    setSelectedType('All');
    setSelectedCountry('All');
    setRankingMetric('response_time_hours');
    setScatterYAxis('casualties');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading disaster data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Controls
        yearRange={yearRange}
        setYearRange={setYearRange}
        yearExtent={yearExtent}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        types={uniqueTypes}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        countries={uniqueCountries}
        onReset={handleReset}
      />
      
      <KpiCards data={filteredData} />
      
      <div className="charts-grid">
        <div className="chart-container">
          <TimeTrendChart data={filteredData} />
        </div>
        
        <div className="chart-container">
          <TypeSeverityChart data={filteredData} />
        </div>
        
        <div className="chart-container">
          <ResponseScatterChart 
            data={filteredData}
            yAxisMetric={scatterYAxis}
            setYAxisMetric={setScatterYAxis}
          />
        </div>
        
        <div className="chart-container">
          <CountryRankChart 
            data={filteredData}
            metric={rankingMetric}
            setMetric={setRankingMetric}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

