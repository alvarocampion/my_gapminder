import { scaleLinear, scaleSqrt, scaleOrdinal, schemeCategory10, color } from "d3";
import { useState, useEffect } from "react";
import './App.css';
import { data as data } from './assets/data.jsx';
import { AxisBottom } from "./AxisBottom";
import { AxisLeft } from "./AxisLeft";
import { min, max } from "d3";

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const PADDING_CENTER = 20;

const minGdp = 0 //min(data, d => d.gdpPercap);
const maxGdp = Math.ceil(max(data, d => d.gdpPercap) / 10000) * 10000; // Round up to nearest 10,000
const minlifeExp = Math.floor(min(data, d => d.lifeExp) / 5) * 5; // Round down to nearest 5
const maxlifeExp = Math.ceil(max(data, d => d.lifeExp) / 5) * 5; // Round up to nearest 5
const minpop = min(data, d => d.pop);
const maxpop = max(data, d => d.pop);


const start_xaxes = 0;
const end_xaxes = 60;
const step_xaxes = 5;

// Calculate the number of elements: (55 - 0) / 5 + 1 = 12
const length_xaxes = Math.floor((end_xaxes - start_xaxes) / step_xaxes);
const xticks_num = Array.from({ length: length_xaxes }, (_, i) => start_xaxes + (i * step_xaxes));


export default function App() {
  const windowSize = useWindowSize();
  
  // Responsive dimensions
  const width = Math.min(windowSize.width - 80, 650); // Max 650px, accounting for padding
  const height = Math.min(windowSize.height * 0.4, 360); // Max 40% of screen height or 360px

  const MARGIN = {top: Math.floor(height * 0.1), right: Math.floor(width * 0.05), 
                  bottom: Math.floor(height * 0.18), left: Math.floor(width * 0.1)};

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  
  const xScale = scaleLinear()
    .domain([minGdp, maxGdp])
    .range([0, boundsWidth]);
  
  const yScale = scaleLinear()
    .domain([minlifeExp, maxlifeExp])
    .range([boundsHeight, 0]);

  const sizeScale = scaleSqrt()
    .domain([minpop, maxpop])
    .range([2, 20]);

  const colorScale = scaleOrdinal()
    .domain(["Europe", "Asia", "Africa", "Americas", "Oceania"])
    .range(schemeCategory10);

  return (
    <div className="app-container">
      <div className="content-wrapper">
      <div className="header">
        <div className="header-line">
        </div>
        <div className="header-box">
        </div>
        <span className="header-title">
          <b>Escape artists</b>
        </span>
        <br />
        <span className="header-subtitle">Number of laboratory-acquired infections, 1970-2021</span>
      </div>
      <div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="svg-container">
          <rect width="100%" height={height} fill="lightgrey" fillOpacity={0.8} />
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>

        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.gdpPercap)}
            cy={yScale(d.lifeExp)}
            r={sizeScale(d.pop)}
            opacity={0.9}
            stroke={colorScale(d.continent)}
            strokeWidth={1}
            fill={colorScale(d.continent)}
            fillOpacity={0.2}
          />
        ))}

        <g transform={`translate(0, ${boundsHeight})`}>
          <AxisBottom
            xScale={xScale}
            pixelsPerTick={60}
            boundsHeight={boundsHeight}
          />
        </g>

        <AxisLeft
          yScale={yScale}
          pixelsPerTick={40}
          boundsWidth={boundsWidth}
        />

      </g>
        </svg>
      </div>
      <div className="footer">
        <span>
          Sources: Laboratory-Acquired Infection Database; American Biological Safety Association
          </span>
          <br />
          <span className="footer">
            The Economist
            </span>
      </div>
      </div>
    </div>
  );
}