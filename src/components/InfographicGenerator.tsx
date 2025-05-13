import React, { useState } from 'react';
import { Image, Download, LayoutTemplate } from 'lucide-react';

// Define layout types and their descriptions
const layoutOptions = [
  { 
    id: 'timeline', 
    name: 'Timeline', 
    description: 'Sequential events or history',
    promptTemplate: 'Create a clear timeline infographic about "{topic}" with chronological events, dates, and icons. Use a horizontal layout with connecting elements between events. Include a title at the top and use a clean, modern design with a cohesive color scheme.'
  },
  { 
    id: 'comparison', 
    name: 'Comparison', 
    description: 'Compare multiple items side by side',
    promptTemplate: 'Create a side-by-side comparison infographic about "{topic}" with two clearly labeled columns. Use icons, data points, and short text descriptions to highlight key differences. Include a title at the top and use contrasting colors to distinguish between the compared items.'
  },
  { 
    id: 'chart', 
    name: 'Bar Chart', 
    description: 'Visualize data with bars',
    promptTemplate: 'Create a bar chart infographic about "{topic}" with clearly labeled axes, values, and bars. Use a title at the top, include a legend if needed, and add brief annotations explaining key insights. Use a clean design with consistent colors for data representation.'
  },
  { 
    id: 'flowchart', 
    name: 'Flowchart', 
    description: 'Show processes or decisions',
    promptTemplate: 'Create a flowchart infographic about "{topic}" with connected nodes showing a step-by-step process. Use different shapes for different types of steps, include directional arrows, and add concise text in each node. Include a title and a clear starting and ending point.'
  }
];

const InfographicGenerator: React.FC = () => {
  // State for infographic generator
  const [topic, setTopic] = useState('');
  const [selectedLayout, setSelectedLayout] = useState(layoutOptions[0].id);
  const [thumbnailSize, setThumbnailSize] = useState('1024x1024');
  const [thumbnailStyle, setThumbnailStyle] = useState('natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // Get the selected layout object
  // const getSelectedLayoutOption = () => {
  //   return layoutOptions.find(option => option.id === selectedLayout) || layoutOptions[0];
  // };

  // Generate the prompt based on topic and selected layout
  const generatePrompt = (topic: string, layoutId: string) => {
    const layoutOption = layoutOptions.find(option => option.id === layoutId) || layoutOptions[0];
    return layoutOption.promptTemplate.replace('{topic}', topic);
  };

  const handleThumbnailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      alert('Please enter a topic for your infographic');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const finalPrompt = generatePrompt(topic, selectedLayout);
      
      // Call the OpenAI API to generate an image
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: finalPrompt,
          n: 1,
          size: thumbnailSize,
          quality: "standard",
          style: thumbnailStyle === 'natural' ? 'natural' : 'vivid'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setGeneratedImageUrl(data.data[0].url);
      } else {
        throw new Error('No image URL returned from API');
      }
    } catch (error) {
      console.error('Error generating infographic:', error);
      alert(`Error generating infographic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;
    
    try {
      // Fetch the image data
      const response = await fetch(generatedImageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      // Convert the image to a blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `infographic-${selectedLayout}-${Date.now()}.png`; // Generate a unique filename
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download the image. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl flex items-center justify-center">
          <Image className="mr-2 h-7 w-7" />
          Infographic Generator
        </h2>
        <p className="mt-3 text-lg text-gray-500">
          Generate eye-catching infographics for your content with AI-powered image generation.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
        <form onSubmit={handleThumbnailSubmit}>
          {/* Topic Input */}
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Enter the topic for your infographic (e.g., 'Climate Change Impact', 'Vaccination Benefits')"
              required
            />
          </div>
          
          {/* Layout Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Layout Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {layoutOptions.map((layout) => (
                <div 
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`cursor-pointer border rounded-md p-3 flex flex-col items-center text-center transition-colors ${
                    selectedLayout === layout.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <LayoutTemplate className={`h-8 w-8 mb-1 ${selectedLayout === layout.id ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="font-medium">{layout.name}</span>
                  <span className="text-xs text-gray-500 mt-1">{layout.description}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Infographic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="thumbnail-size" className="block text-sm font-medium text-gray-700 mb-2">
                Image Size
              </label>
              <select
                id="thumbnail-size"
                value={thumbnailSize}
                onChange={(e) => setThumbnailSize(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="1024x1024">1024x1024</option>
                <option value="1792x1024">1792x1024 (Landscape)</option>
                <option value="1024x1792">1024x1792 (Portrait)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="thumbnail-style" className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                id="thumbnail-style"
                value={thumbnailStyle}
                onChange={(e) => setThumbnailStyle(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="natural">Natural</option>
                <option value="vivid">Vivid</option>
              </select>
            </div>
          </div>
          
          {/* Generate Button */}
          <div className="flex justify-end mb-6">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-5 w-5" />
                  Generate Infographic
                </>
              )}
            </button>
          </div>
          
          {/* Generated Image Display */}
          {generatedImageUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Infographic</h3>
              <div className="flex flex-col items-center">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated infographic" 
                  className="rounded-lg shadow-md max-w-full h-auto mb-4"
                />
                <button 
                  type="button"
                  onClick={handleDownloadImage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Infographic
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InfographicGenerator; 