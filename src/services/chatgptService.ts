import { supabase } from '../config/supabase';

export interface ChatGPTRequest {
  message: string;
  systemPrompt?: string;
  model?: string; // e.g., 'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', etc.
  temperature?: number; // 0-2, default: 1
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatGPTResponse {
  success: boolean;
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatGPTError {
  error: string;
  details?: string;
  message?: string;
}

/**
 * Call the ChatGPT edge function with a message
 * 
 * @param request - The request parameters
 * @returns The ChatGPT response
 * 
 * @example
 * ```ts
 * const response = await callChatGPT({
 *   message: "What is the capital of France?",
 *   systemPrompt: "You are a helpful assistant.",
 *   model: "gpt-4o-mini",
 *   temperature: 0.7
 * });
 * ```
 */
export const callChatGPT = async (
  request: ChatGPTRequest
): Promise<ChatGPTResponse> => {
  try {
    // Try to get session, but don't require it (edge function should allow anonymous access)
    const { data: { session } } = await supabase.auth.getSession();
    
    const invokeOptions: any = {
      body: request,
    };

    // Only add auth header if we have a session
    if (session?.access_token) {
      invokeOptions.headers = {
        Authorization: `Bearer ${session.access_token}`,
      };
    }

    const { data, error } = await supabase.functions.invoke('chatgpt', invokeOptions);

    if (error) {
      // If 401, provide more helpful error message
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Edge function authentication failed. Please check if the function allows anonymous access or if you need to be logged in.');
      }
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Unknown error from ChatGPT service');
    }

    return data as ChatGPTResponse;
  } catch (error) {
    console.error('Error calling ChatGPT:', error);
    throw error;
  }
};

/**
 * Call ChatGPT with streaming support
 * Note: This requires handling the stream response manually
 * 
 * @param request - The request parameters (stream will be set to true)
 * @param onChunk - Callback function called for each chunk
 * @returns Promise that resolves when stream completes
 */
export const callChatGPTStream = async (
  request: Omit<ChatGPTRequest, 'stream'>,
  onChunk?: (chunk: string) => void
): Promise<void> => {
  try {
    const response = await supabase.functions.invoke('chatgpt', {
      body: {
        ...request,
        stream: true,
      },
    });

    // Note: Supabase functions.invoke doesn't support streaming directly
    // You may need to use fetch directly for streaming
    // This is a placeholder for the streaming implementation
    
    if (response.error) {
      throw response.error;
    }

    // For now, return the non-streaming response
    // Full streaming support would require using fetch API directly
    throw new Error('Streaming not fully implemented. Use callChatGPT instead.');
  } catch (error) {
    console.error('Error calling ChatGPT stream:', error);
    throw error;
  }
};




