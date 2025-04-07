"use client";

import { useState, useEffect } from "react";
import { Button } from "../button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";

interface APIKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading: boolean;
  apiError?: string | null;
}

export const APIKeyInput = ({ onApiKeySubmit, isLoading, apiError }: APIKeyInputProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  
  // Basic validation - checks if input is not empty and meets minimum length
  useEffect(() => {
    setIsValid(apiKey.trim().length >= 8);
  }, [apiKey]);

  const handleSubmit = () => {
    if (isValid) {
      onApiKeySubmit(apiKey);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="api-key" className="text-sm text-gray-600">
          Groq API Key
        </label>
        <div className="relative">
          <input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Groq API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cartesia-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showKey ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        {apiError && (
          <div className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
            {apiError}
          </div>
        )}
      </div>
      <Button
        state="primary"
        size="medium"
        className={`relative w-full text-base text-black ${!isValid || isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        disabled={!isValid || isLoading}
        onClick={handleSubmit}
      >
        <div className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}>
          Submit API Key
        </div>
        <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 ${isLoading ? "opacity-100" : "opacity-0"}`}>
          <LoadingSVG diameter={24} strokeWidth={4} />
        </div>
      </Button>
      <div className="text-xs text-gray-500 text-center mt-1">
        Your API key is sent securely to the backend and never stored in the browser.
      </div>
    </div>
  );
};