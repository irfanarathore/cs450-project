import { useState, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Custom hook to load and parse the disaster dataset from CSV
 * @returns {Object} { data, loading, error }
 */
function useDisasterData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load CSV data
    d3.csv(process.env.PUBLIC_URL + '/data/disasters.csv')
      .then((rawData) => {
        // Parse and transform the data
        const parsedData = rawData.map((d) => {
          // Parse date
          const dateStr = d.date;
          const parsedDate = new Date(dateStr);
          
          return {
            // Original fields
            date: parsedDate,
            country: d.country,
            disaster_type: d.disaster_type,
            
            // Numeric fields - convert to numbers
            severity_index: +d.severity_index || 0,
            casualties: +d.casualties || 0,
            economic_loss_usd: +d.economic_loss_usd || 0,
            response_time_hours: +d.response_time_hours || 0,
            aid_amount_usd: +d.aid_amount_usd || 0,
            response_efficiency_score: +d.response_efficiency_score || 0,
            recovery_days: +d.recovery_days || 0,
            latitude: +d.latitude || 0,
            longitude: +d.longitude || 0,
            
            // Derived fields
            year: parsedDate.getFullYear(),
            month: parsedDate.getMonth() + 1,
            yearMonth: `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`
          };
        });

        // Filter out any invalid entries
        const validData = parsedData.filter(d => 
          !isNaN(d.date.getTime()) && 
          d.country && 
          d.disaster_type
        );

        console.log(`Loaded ${validData.length} disaster events`);
        console.log('Sample data:', validData.slice(0, 3));
        console.log('Years range:', d3.extent(validData, d => d.year));
        console.log('Unique disaster types:', [...new Set(validData.map(d => d.disaster_type))]);
        console.log('Unique countries:', validData.map(d => d.country).filter((v, i, a) => a.indexOf(v) === i).length);

        setData(validData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading disaster data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export default useDisasterData;

