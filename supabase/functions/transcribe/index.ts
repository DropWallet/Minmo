// Supabase Edge Function for Audio Transcription
// This function receives audio files and transcribes them using OpenAI Whisper API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-device-id, content-type',
};

interface TranscriptionRequest {
  entryId: string;
  duration_seconds?: number;
  prompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Check for OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get device ID from headers (for rate limiting/authentication)
    const deviceId = req.headers.get('x-device-id');
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: 'Device ID required' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entryId = formData.get('entryId') as string;
    const durationSeconds = formData.get('duration_seconds') as string;
    const prompt = formData.get('prompt') as string | null;

    // Validate required fields
    if (!file || !entryId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file and entryId' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Expected audio file.' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size (max 25MB for Whisper API)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 25MB.' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate duration (120 seconds max)
    if (durationSeconds) {
      const duration = parseFloat(durationSeconds);
      if (duration > 120) {
        return new Response(
          JSON.stringify({ error: 'Audio duration exceeds 120 seconds limit.' }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Convert file to blob for OpenAI API
    const audioBlob = await file.arrayBuffer();
    const audioFile = new File([audioBlob], file.name, { type: file.type });

    // Call OpenAI Whisper API
    const formDataForOpenAI = new FormData();
    formDataForOpenAI.append('file', audioFile);
    formDataForOpenAI.append('model', 'whisper-1');
    if (prompt) {
      formDataForOpenAI.append('prompt', prompt);
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formDataForOpenAI,
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      
      let errorMessage = 'Failed to transcribe audio';
      if (openAIResponse.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (openAIResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (openAIResponse.status >= 500) {
        errorMessage = 'OpenAI service error. Please try again later.';
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: openAIResponse.status === 429 ? 429 : 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const transcriptionResult = await openAIResponse.json();
    const transcript = transcriptionResult.text || '';

    // Return transcription result
    const response: TranscriptionResponse = {
      entryId,
      transcript,
      // segments not available from basic Whisper API, would need timestamped version
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

interface TranscriptionResponse {
  entryId: string;
  transcript: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  audio_url?: string;
  jobId?: string;
}

