import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { addContentBlock, updateContentBlock } from '../../redux/slices/projectsSlice';
import { togglePromptArea } from '../../redux/slices/workspaceSlice';
import { showAIResponse } from '../../redux/slices/uiSlice';
import GenerateCard from '../editor/GenerateCard';
import './VisualLab.css';

const VisualLab = () => {
  const dispatch = useDispatch();
  
  // Get current project from Redux
  const currentProject = useSelector(state => state.projects.currentProject);
  
  // Local state for chart data and configuration
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState([]);
  const [chartConfig, setChartConfig] = useState({
    title: 'My Chart',
    xAxis: 'Category',
    yAxis: 'Value',
    colors: ['#5e35b1', '#03a9f4', '#ff6e40', '#4caf50', '#ffab00']
  });
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  
  // Refs
  const canvasRef = useRef(null);
  
  // Find existing visualizations in the project
  useEffect(() => {
    if (currentProject && currentProject.content && currentProject.content.blocks) {
      const visualBlocks = currentProject.content.blocks.filter(
        block => block.type === 'visualization' || block.type === 'chart'
      );
      
      if (visualBlocks.length > 0 && !selectedVisualization) {
        setSelectedVisualization(visualBlocks[0].id);
        
        // Load chart data and config
        try {
          if (visualBlocks[0].metadata && visualBlocks[0].metadata.chartData) {
            setChartData(visualBlocks[0].metadata.chartData);
          }
          
          if (visualBlocks[0].metadata && visualBlocks[0].metadata.chartConfig) {
            setChartConfig(visualBlocks[0].metadata.chartConfig);
          }
          
          if (visualBlocks[0].metadata && visualBlocks[0].metadata.chartType) {
            setChartType(visualBlocks[0].metadata.chartType);
          }
        } catch (error) {
          console.error('Error loading chart data:', error);
        }
      } else if (visualBlocks.length === 0) {
        // Initialize with sample data if no visualizations exist
        initializeSampleData();
      }
    }
  }, [currentProject, selectedVisualization]);
  
  // Initialize with sample data
  const initializeSampleData = () => {
    setChartData([
      { category: 'Category A', value: 30 },
      { category: 'Category B', value: 45 },
      { category: 'Category C', value: 25 },
      { category: 'Category D', value: 60 },
      { category: 'Category E', value: 15 }
    ]);
  };
  
  // Create a new visualization
  const handleCreateVisualization = () => {
    const id = uuidv4();
    
    // Create chart visualization block
    const chartBlock = {
      id,
      type: 'visualization',
      title: chartConfig.title || 'New Visualization',
      content: 'chart-placeholder',
      metadata: {
        chartType,
        chartData,
        chartConfig
      }
    };
    
    dispatch(addContentBlock(chartBlock));
    setSelectedVisualization(id);
    
    // Draw the visualization when saving to project
    renderChart();
  };
  
  // Update existing visualization
  const handleUpdateVisualization = () => {
    if (!selectedVisualization) return;
    
    // Prepare updated metadata
    const updatedMetadata = {
      chartType,
      chartData,
      chartConfig
    };
    
    // Update the block in Redux
    dispatch(updateContentBlock({
      blockId: selectedVisualization,
      content: 'chart-placeholder', // In a real app, this would be chart data or an image
      metadata: updatedMetadata
    }));
    
    // Re-render the chart
    renderChart();
  };
  
  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };
  
  // Handle data editor changes
  const handleDataChange = (rowIndex, field, value) => {
    const updatedData = [...chartData];
    
    // Update the specified field in the row
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [field]: field === 'value' ? parseFloat(value) || 0 : value
    };
    
    setChartData(updatedData);
  };
  
  // Add a new data row
  const handleAddDataRow = () => {
    setChartData([
      ...chartData, 
      { category: `Category ${chartData.length + 1}`, value: 0 }
    ]);
  };
  
  // Remove a data row
  const handleRemoveDataRow = (index) => {
    const updatedData = chartData.filter((_, i) => i !== index);
    setChartData(updatedData);
  };
  
  // Handle config changes
  const handleConfigChange = (field, value) => {
    setChartConfig({
      ...chartConfig,
      [field]: value
    });
  };
  
  // Render chart to canvas
  const renderChart = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Draw based on chart type
    switch (chartType) {
      case 'bar':
        drawBarChart(ctx, canvas.width, canvas.height);
        break;
      case 'line':
        drawLineChart(ctx, canvas.width, canvas.height);
        break;
      case 'pie':
        drawPieChart(ctx, canvas.width, canvas.height);
        break;
      case 'scatter':
        drawScatterChart(ctx, canvas.width, canvas.height);
        break;
      default:
        drawBarChart(ctx, canvas.width, canvas.height);
    }
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.title, canvas.width / 2, 30);
  };
  
  // Draw bar chart
  const drawBarChart = (ctx, width, height) => {
    if (!chartData.length) return;
    
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / chartData.length * 0.8;
    const maxValue = Math.max(...chartData.map(item => item.value));
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw bars
    chartData.forEach((data, index) => {
      const x = padding + (chartWidth / chartData.length) * index + barWidth * 0.1;
      const barHeight = (data.value / maxValue) * chartHeight;
      const y = height - padding - barHeight;
      
      // Draw bar
      ctx.fillStyle = chartConfig.colors[index % chartConfig.colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw category label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.category, x + barWidth / 2, height - padding + 15);
      
      // Draw value above bar
      ctx.fillStyle = '#333';
      ctx.fillText(data.value.toString(), x + barWidth / 2, y - 5);
    });
    
    // Draw Y axis title
    ctx.save();
    ctx.translate(padding - 30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.yAxis, 0, 0);
    ctx.restore();
    
    // Draw X axis title
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.xAxis, width / 2, height - padding + 35);
  };
  
  // Draw line chart
  const drawLineChart = (ctx, width, height) => {
    if (!chartData.length) return;
    
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(...chartData.map(item => item.value));
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw line
    ctx.beginPath();
    chartData.forEach((data, index) => {
      const x = padding + (chartWidth / (chartData.length - 1)) * index;
      const y = height - padding - (data.value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = chartConfig.colors[0];
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw category label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.category, x, height - padding + 15);
      
      // Draw value above point
      ctx.fillStyle = '#333';
      ctx.fillText(data.value.toString(), x, y - 10);
    });
    
    ctx.strokeStyle = chartConfig.colors[0];
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw Y axis title
    ctx.save();
    ctx.translate(padding - 30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.yAxis, 0, 0);
    ctx.restore();
    
    // Draw X axis title
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.xAxis, width / 2, height - padding + 35);
  };
  
  // Draw pie chart
  const drawPieChart = (ctx, width, height) => {
    if (!chartData.length) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;
    
    // Draw pie segments
    chartData.forEach((data, index) => {
      const sliceAngle = 2 * Math.PI * data.value / total;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = chartConfig.colors[index % chartConfig.colors.length];
      ctx.fill();
      
      // Draw segment label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.value.toString(), labelX, labelY);
      
      startAngle += sliceAngle;
    });
    
    // Draw legend
    const legendY = height - 40;
    chartData.forEach((data, index) => {
      const legendX = (width / chartData.length) * index + (width / chartData.length / 2);
      
      // Draw color box
      ctx.fillStyle = chartConfig.colors[index % chartConfig.colors.length];
      ctx.fillRect(legendX - 30, legendY, 12, 12);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.category, legendX - 15, legendY + 6);
    });
  };
  
  // Draw scatter chart
  const drawScatterChart = (ctx, width, height) => {
    if (!chartData.length) return;
    
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(...chartData.map(item => item.value));
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw points
    chartData.forEach((data, index) => {
      const x = padding + (chartWidth / chartData.length) * (index + 0.5);
      const y = height - padding - (data.value / maxValue) * chartHeight;
      
      // Calculate random offset for scatter effect
      const xOffset = (Math.random() - 0.5) * 20;
      const yOffset = (Math.random() - 0.5) * 20;
      
      // Draw point
      ctx.fillStyle = chartConfig.colors[index % chartConfig.colors.length];
      ctx.beginPath();
      ctx.arc(x + xOffset, y + yOffset, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw category label on x-axis
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.category, x, height - padding + 15);
    });
    
    // Draw Y axis title
    ctx.save();
    ctx.translate(padding - 30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.yAxis, 0, 0);
    ctx.restore();
    
    // Draw X axis title
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartConfig.xAxis, width / 2, height - padding + 35);
  };
  
  // Update canvas when chart data or config changes
  useEffect(() => {
    if (canvasRef.current) {
      renderChart();
    }
  }, [chartData, chartConfig, chartType, canvasRef.current]);
  
  // Handle AI assistance request
  const handleRequestChartSuggestions = () => {
    // Open the prompt area
    dispatch(togglePromptArea());
    
    // Show mock AI response with chart suggestions
    setTimeout(() => {
      dispatch(showAIResponse({
        title: 'Chart Suggestions',
        content: `# Data Visualization Recommendations\n\n` +
          `Based on your current data, here are some visualization options:\n\n` +
          `## Suggested Chart Types\n\n` +
          `1. **Bar Chart** - Best for comparing categorical data\n\n` +
          `2. **Line Chart** - Shows trends over sequential categories\n\n` +
          `3. **Pie Chart** - Displays proportion of each category to the whole\n\n` +
          `4. **Scatter Plot** - Useful for showing distribution patterns\n\n` +
          `## Design Recommendations\n\n` +
          `- **Color Scheme**: Use contrasting colors for better readability\n` +
          `- **Labels**: Add clear labels for each data point\n` +
          `- **Legend**: Include a legend when using multiple data series\n` +
          `- **Title**: Use a descriptive title that explains the data story\n\n` +
          `Would you like me to help you implement any of these suggestions?`
      }));
    }, 500);
  };
  
  // Reset when tab changes
  useEffect(() => {
    if (activeTab === 'design' && canvasRef.current) {
      renderChart();
    }
  }, [activeTab]);
  
  return (
    <div className="visual-lab">
      <div className="visual-lab-header">
        <h2>Visual Lab</h2>
        <div className="chart-controls">
          <input 
            type="text" 
            className="chart-title-input" 
            value={chartConfig.title} 
            onChange={(e) => handleConfigChange('title', e.target.value)}
            placeholder="Chart Title"
          />
          
          <div className="chart-type-selector">
            <button 
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('bar')}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Bar</span>
            </button>
            
            <button 
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('line')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Line</span>
            </button>
            
            <button 
              className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('pie')}
            >
              <i className="fas fa-chart-pie"></i>
              <span>Pie</span>
            </button>
            
            <button 
              className={`chart-type-btn ${chartType === 'scatter' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('scatter')}
            >
              <i className="fas fa-braille"></i>
              <span>Scatter</span>
            </button>
          </div>
          
          <div className="visualization-actions">
            <button 
              className="btn"
              onClick={selectedVisualization ? handleUpdateVisualization : handleCreateVisualization}
            >
              <i className="fas fa-save"></i>
              <span>{selectedVisualization ? 'Update' : 'Save'} Visualization</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="visual-lab-content">
        <div className="visual-lab-tabs">
          <button 
            className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            <i className="fas fa-palette"></i>
            <span>Design</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <i className="fas fa-table"></i>
            <span>Data</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </button>
        </div>
        
        <div className="visual-lab-tab-content">
          {activeTab === 'design' && (
            <div className="design-tab">
              <div className="canvas-container">
                <canvas ref={canvasRef} className="chart-canvas"></canvas>
              </div>
              
              <GenerateCard 
                onClick={handleRequestChartSuggestions}
                title="Get Chart Suggestions"
                description="Let AI help you choose the best visualization for your data"
                icon="fas fa-magic"
              />
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="data-tab">
              <div className="data-editor">
                <div className="data-table-header">
                  <div className="data-cell header-cell">Category</div>
                  <div className="data-cell header-cell">Value</div>
                  <div className="data-cell header-cell actions-cell">Actions</div>
                </div>
                
                <div className="data-table-body">
                  {chartData.map((row, index) => (
                    <div key={index} className="data-row">
                      <div className="data-cell">
                        <input 
                          type="text" 
                          value={row.category} 
                          onChange={(e) => handleDataChange(index, 'category', e.target.value)}
                        />
                      </div>
                      <div className="data-cell">
                        <input 
                          type="number" 
                          value={row.value} 
                          onChange={(e) => handleDataChange(index, 'value', e.target.value)}
                        />
                      </div>
                      <div className="data-cell actions-cell">
                        <button 
                          className="data-action-btn delete-btn"
                          onClick={() => handleRemoveDataRow(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="btn add-data-btn"
                  onClick={handleAddDataRow}
                >
                  <i className="fas fa-plus"></i>
                  <span>Add Row</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-group">
                <h3>Chart Labels</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>X-Axis Label</label>
                    <input 
                      type="text" 
                      value={chartConfig.xAxis} 
                      onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Y-Axis Label</label>
                    <input 
                      type="text" 
                      value={chartConfig.yAxis} 
                      onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Colors</h3>
                <div className="color-pickers">
                  {chartConfig.colors.map((color, index) => (
                    <div key={index} className="color-picker">
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => {
                          const newColors = [...chartConfig.colors];
                          newColors[index] = e.target.value;
                          handleConfigChange('colors', newColors);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Export Options</h3>
                <button className="btn secondary">
                  <i className="fas fa-download"></i>
                  <span>Export as PNG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualLab;