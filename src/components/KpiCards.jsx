import React, { useMemo } from 'react';
import * as d3 from 'd3';
import './KpiCards.css';

function KpiCards({ data }) {
  const kpis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalEvents: 0,
        totalCasualties: 0,
        totalEconomicLoss: 0,
        avgResponseTime: 0
      };
    }

    const totalEvents = data.length;
    const totalCasualties = d3.sum(data, d => d.casualties);
    const totalEconomicLoss = d3.sum(data, d => d.economic_loss_usd);
    const avgResponseTime = d3.mean(data, d => d.response_time_hours);

    return {
      totalEvents,
      totalCasualties,
      totalEconomicLoss,
      avgResponseTime
    };
  }, [data]);

  // Format large numbers with K, M, B suffixes
  const formatNumber = (num) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatCasualties = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="kpi-cards">
      <div className="kpi-card">
        <div className="kpi-icon">📊</div>
        <div className="kpi-content">
          <div className="kpi-value">{kpis.totalEvents.toLocaleString()}</div>
          <div className="kpi-label">Total Events</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon">👥</div>
        <div className="kpi-content">
          <div className="kpi-value">{formatCasualties(kpis.totalCasualties)}</div>
          <div className="kpi-label">Total Casualties</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon">💰</div>
        <div className="kpi-content">
          <div className="kpi-value">{formatNumber(kpis.totalEconomicLoss)}</div>
          <div className="kpi-label">Economic Loss (USD)</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon">⏱️</div>
        <div className="kpi-content">
          <div className="kpi-value">{kpis.avgResponseTime.toFixed(1)}h</div>
          <div className="kpi-label">Avg Response Time</div>
        </div>
      </div>
    </div>
  );
}

export default KpiCards;

