import { scaleLinear, scaleSqrt, scaleOrdinal, schemeCategory10, min, max, group, bin, sum } from "d3";
import { useState, useEffect } from "react";
import './App.css';
import { data as data } from './assets/data.jsx';
import { AxisBottom } from "./AxisBottom";
import { AxisLeft } from "./AxisLeft";

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
const minlifeExp = 25 //Math.floor(min(data, d => d.lifeExp) / 5) * 5; // Round down to nearest 5
const maxlifeExp = Math.ceil(max(data, d => d.lifeExp) / 5) * 5; // Round up to nearest 5
const minpop = min(data, d => d.pop);
const maxpop = max(data, d => d.pop);
const maxLE_legend = 54;




export default function App() {
  const windowSize = useWindowSize();
  const isSmartphone = windowSize.width <= 480;
  
  // Responsive dimensions
  const width = Math.min(windowSize.width - 80, 650); // Max 650px, accounting for padding
  const height = Math.min(windowSize.height * 0.4, 360); // Max 40% of screen height or 360px

  const MARGIN = {top: Math.floor(height * 0.25), right: Math.floor(width * 0.08), 
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

  const continentsList = ["Europe", "Asia", "Africa", "Americas", "Oceania"];

  const colorScale = scaleOrdinal()
    .domain(continentsList)
    .range(schemeCategory10);

    function segmentArea(radius, x1, axisScale, gdp) { 
       let d2 = Math.max(axisScale(x1), axisScale(gdp) - radius) - (axisScale(gdp) - radius);
        if (d2 < 0) {
          return 0;
        }
        if (d2 > 2 * radius) {
          return Math.PI * Math.pow(radius, 2);
        }
        if (d2 > radius) {
          d2 -= radius;
          const theta2 = 2 * Math.acos(d2 / radius);
          const segmentArea2 = (Math.pow(radius, 2) / 2) * (theta2 - Math.sin(theta2));
          return Math.PI * Math.pow(radius, 2) - segmentArea2;
        } else {
          d2 = radius - d2;
          const theta2 = 2 * Math.acos(d2 / radius);
          const segmentArea2 = (Math.pow(radius, 2) / 2) * (theta2 - Math.sin(theta2));
          return segmentArea2;
        }
      }

    function countryAreaInBin(d, data_property, axisScale, x0, x1) {
      // returns the area of circle falling into x0 and x1 with scale of xScale and sizeScale
      const gdp = d[data_property];
      const pop = d.pop;
      const radius = sizeScale(pop);
      
      const area2 = segmentArea(radius, x1, axisScale, gdp)
      const area1 = segmentArea(radius, x0, axisScale, gdp);
      
      return area2 - area1;
      
    }   
    

    function areaOfContinentCirclesInBin(continent, data, data_property, axisScale, x0, x1) {
      // returns areas of circles of a continent falling into x0 and x1 with scale of xScale and sizeScale
      const filteredData = data.filter(d => d.continent === continent);
      return sum(filteredData.map(d => countryAreaInBin(d, data_property, axisScale, x0, x1)));
    }

  // define gdp_bins
  
  const gdp_n_steps = 100;
  const gdp_stepWidth = maxGdp / gdp_n_steps;
  const gdp_steps = Array.from({ length: gdp_n_steps }, (_, i) => i * gdp_stepWidth);
  
  const le_n_steps = 40;
  const le_stepWidth = (maxlifeExp- minlifeExp) / le_n_steps;
  const le_steps = Array.from({ length: le_n_steps }, (_, i) => minlifeExp + i * le_stepWidth);
  
  
  const histogramData = continentsList.map(continent => ({
    continent: continent,
    gdpBarHistogram: gdp_steps.map(x => areaOfContinentCirclesInBin(continent, data, "gdpPercap", xScale, x, x + gdp_stepWidth)),
    lifeExpHistogram: le_steps.map(x => areaOfContinentCirclesInBin(continent, data, "lifeExp", yScale, x, x + le_stepWidth)),
    totalPopulation: sum(data.filter(d => d.continent === continent).map(d => d.pop)),
    weightedAvgGdp: sum(data.filter(d => d.continent === continent).map(d => d.gdpPercap * d.pop)) / sum(data.filter(d => d.continent === continent).map(d => d.pop)),
    weightedAvgLifeExp: sum(data.filter(d => d.continent === continent).map(d => d.lifeExp * d.pop)) / sum(data.filter(d => d.continent === continent).map(d => d.pop)),
    biggestCountry: data.filter(d => d.continent === continent).reduce((maxCountry, d) => d.pop > maxCountry.pop ? d : maxCountry, {pop: -Infinity}).country,  
    biggestCountryPopulation: data.filter(d => d.continent === continent).reduce((maxCountry, d) => d.pop > maxCountry.pop ? d : maxCountry, {pop: -Infinity}).pop,
    averagePopulation: sum(data.filter(d => d.continent === continent).map(d => d.pop)) / data.filter(d => d.continent === continent).length,


  })).sort((a, b) => a.weightedAvgGdp - b.weightedAvgGdp);
  
    

  
  const start_xaxes = 0;
  const end_xaxes = 60;
  const step_xaxes = 5;

  // Calculate the number of elements: (55 - 0) / 5 + 1 = 12
  const length_xaxes = Math.floor((end_xaxes - start_xaxes) / step_xaxes);
  const xticks_num = Array.from({ length: length_xaxes }, (_, i) => start_xaxes + (i * step_xaxes));

  return (
    <div className="app-container">
      <div className="content-wrapper">
      <div className="header">
        <div className="header-line">
        </div>
        <div className="header-box">
        </div>
        <span className="header-title">
          <b>How Does Income Relate to Life Expectancy?</b>
        </span>
        <br />
        <span className="header-subtitle">
          People live longer in countries with a high GDP per capita.



        </span>
      </div>
      <div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="svg-container">
          <rect width="100%" height={height} fill="white" fillOpacity={0.4} />
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
        {histogramData.map((d, i) => (
          d.gdpBarHistogram.map((gdp_area, j) => {
            
            return (
            <rect
              key={i*100 + j}
              x={xScale(gdp_steps[0] + ((j + 0.5) * gdp_stepWidth))} // Stack bars on top of each other
              y={yScale(102) + (Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 2)) * i)} // Stack bars on top of each other
              width={xScale(gdp_stepWidth)} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 2))} // Height equivalent to 2 years
              fill={colorScale(d.continent)}
              fillOpacity={gdp_area / Math.max(1, max(d.gdpBarHistogram))} // Proportional opacity based on area
            />
            );
          }
        )  
        ))}

        
        {histogramData.map((d, i) => (
          d.lifeExpHistogram.map((lifeExp_area, j) => {
            
            return (
            <rect
              key={i*100 + j}
              x={xScale(51500) + (Math.abs(xScale(52000) - xScale(51500)) * i)} // Stack bars on top of each other
              y={yScale(minlifeExp + ((j + 0.5) * le_stepWidth))} // Stack bars on top of each other
              width={(Math.abs(xScale(50500) - xScale(50000)))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + le_stepWidth))} // Height equivalent to 2 years
              fill={colorScale(d.continent)}
              fillOpacity={lifeExp_area / (-Math.max(0.00001, -min(d.lifeExpHistogram)))} // Proportional opacity based on area
            />
            );
          }
        )  
        ))}

        {!isSmartphone && (
          <>
        <rect
              x={xScale(22500)} // Stack bars on top of each other
              y={yScale(maxLE_legend + 6)} // Stack bars on top of each other
              width={(xScale(5 * 4800))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5))} // Height equivalent to 2 years
              fill={"grey"}
              fillOpacity={0.2} // Proportional opacity based on area
            />
        
        <text
              x={xScale(22500) + 2 * xScale(4800) + xScale(4500) / 2}
              y={yScale(maxLE_legend + 6) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >Total population and weighted averages</text>

        <rect
              x={xScale(17500)} // Stack bars on top of each other
              y={yScale(maxLE_legend - 6)} // Stack bars on top of each other
              width={(xScale(4500))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5))} // Height equivalent to 2 years
              fill={"grey"}
              fillOpacity={0.2} // Proportional opacity based on area
            />
        <rect
              x={xScale(17500)} // Stack bars on top of each other
              y={yScale(maxLE_legend - 12)} // Stack bars on top of each other
              width={(xScale(4500))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5))} // Height equivalent to 2 years
              fill={"grey"}
              fillOpacity={0.2} // Proportional opacity based on area
            />
        <rect
              x={xScale(17500)} // Stack bars on top of each other
              y={yScale(maxLE_legend - 18)} // Stack bars on top of each other
              width={(xScale(4500))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5))} // Height equivalent to 2 years
              fill={"grey"}
              fillOpacity={0.2} // Proportional opacity based on area
            />
        
        <text
              x={xScale(17500) + xScale(4500) / 2} // Stack bars on top of each other
              y={yScale(maxLE_legend - 6) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2} // Stack bars on top of each other
              textAnchor="left"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              GDP
            </text>
        <text
              x={xScale(17500) + xScale(4500) / 2} // Stack bars on top of each other
              y={yScale(maxLE_legend - 12)+ Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2} // Stack bars on top of each other
              textAnchor="left"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              LE
            </text>
        
        <text
              x={xScale(17500) + xScale(4500) / 2} // Stack bars on top of each other
              y={yScale(maxLE_legend - 18)+ Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2} // Stack bars on top of each other
              textAnchor="left"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              Pop
            </text>
            


        {histogramData.map((d, i) => {
            
            return (
              <>
            <rect
              key={i*100}
              x={xScale(22500) + i * xScale(4800)} // Stack bars on top of each other
              y={yScale(maxLE_legend)} // Stack bars on top of each other
              width={(xScale(4500))} // Add some spacing between bars
              height={Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5))} // Height equivalent to 2 years
              fill={colorScale(d.continent)}
              fillOpacity={0.2} // Proportional opacity based on area
            />
            <text
              x={xScale(22500) + i * xScale(4800) + xScale(4500) / 2}
              y={yScale(maxLE_legend) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              {d.continent}
            </text>
            <text
              x={xScale(22500) + i * xScale(4800) + xScale(4500) / 2}
              y={yScale(maxLE_legend - 6) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              {(d.weightedAvgGdp/1000).toFixed(1)} k
            </text>
            <text
              x={xScale(22500) + i * xScale(4800) + xScale(4500) / 2}
              y={yScale(maxLE_legend - 12) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              {d.weightedAvgLifeExp.toFixed(0)} 
            </text>
            <text
              x={xScale(22500) + i * xScale(4800) + xScale(4500) / 2}
              y={yScale(maxLE_legend - 18) + Math.abs(yScale(minlifeExp) - yScale(minlifeExp + 5)) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10px"
              fill="black"
            >
              {(d.totalPopulation/1e6).toFixed(0)}M 
            </text>
            </>
            );
          }
        )}
          </>
        )}


        {console.log(histogramData)};
        <g transform={`translate(0, ${boundsHeight})`}>
          <AxisBottom
            xScale={xScale}
            labelScale={0.001}
            labelTail="k"
            pixelsPerTick={60}
            boundsHeight={boundsHeight}
            label="GDP per capita (USD)"
          />
        </g>

        <AxisLeft
          yScale={yScale}
          pixelsPerTick={40}
          boundsWidth={boundsWidth}
          label="Life expectancy (y)"
        />

      </g>
        </svg>
      </div>
      <div className="footer">
        <span>
          Sources: World Bank’s GDP per capita, IHME 2014, UN World Population Prospects
          </span>
          <br />
          <span className="footer">
             through www.gapminder.org
            </span>
      </div>
      </div>
    </div>
  );
}