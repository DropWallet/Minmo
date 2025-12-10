# Transcription Edge Function

This Supabase Edge Function handles audio transcription using OpenAI's Whisper API.

## Setup

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Set environment variables**:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy transcribe
   ```

## Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key for Whisper API access

## API Endpoint

- **URL**: `https://your-project.supabase.co/functions/v1/transcribe`
- **Method**: POST
- **Content-Type**: multipart/form-data

### Request Headers
- `X-Device-ID`: Device identifier (required)

### Request Body (multipart/form-data)
- `file`: Audio file (required, max 25MB)
- `entryId`: Entry ID (required)
- `duration_seconds`: Audio duration in seconds (optional)
- `prompt`: Optional prompt text (optional)

### Response
```json
{
  "entryId": "uuid",
  "transcript": "Transcribed text here..."
}
```

### Error Responses
- `400`: Bad request (missing fields, invalid file, etc.)
- `429`: Rate limit exceeded
- `500`: Server error

## Rate Limiting

The function accepts a `X-Device-ID` header for device identification. You can implement rate limiting based on this in the future.

## Notes

- Maximum file size: 25MB (OpenAI Whisper limit)
- Maximum duration: 120 seconds (enforced by client and server)
- Supported audio formats: Any format supported by Whisper API (mp3, mp4, mpeg, mpga, m4a, wav, webm)





