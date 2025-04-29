import React, { useState } from 'react';
import { Image, Download } from 'lucide-react';

const InfographicGenerator: React.FC = () => {
  // State for infographic generator
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [thumbnailSize, setThumbnailSize] = useState('1024x1024');
  const [thumbnailStyle, setThumbnailStyle] = useState('natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  const handleThumbnailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // Call the OpenAI API to generate an image
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: thumbnailPrompt,
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
      link.download = `infographic-${Date.now()}.png`; // Generate a unique filename
      
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
          {/* Infographic Prompt */}
          <div className="mb-6">
            <label htmlFor="thumbnail-prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Infographic Description
            </label>
            <textarea
              id="thumbnail-prompt"
              value={thumbnailPrompt}
              onChange={(e) => setThumbnailPrompt(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              rows={3}
              placeholder="Describe the infographic you want to generate (e.g., 'A futuristic cityscape with flying cars and neon lights')"
              required
            />
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