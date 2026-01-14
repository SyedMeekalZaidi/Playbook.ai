/**
 * Magic Map - Enhance Prompt API Route
 * Optimizes user prompts for better BPMN diagram generation
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createApiClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/api-utils';

// Helper to require authentication
async function requireUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// System prompt for prompt enhancement
const ENHANCE_SYSTEM_PROMPT = `You are a BPMN prompt optimizer. Enhance user descriptions for better diagram generation.

Guidelines:
1. Clarify vague steps into specific tasks
2. Identify decision points and make them explicit (if/then/else)
3. Identify parallel activities (tasks that happen simultaneously)
4. Add clear start and end conditions
5. Keep it concise (max 3 sentences)
6. Focus on workflow steps, not implementation details

Examples:

Input: "patient registration"
Output: "Patient registration workflow: 1) Collect patient information and ID documents, 2) Verify insurance eligibility (if eligible proceed, otherwise request self-pay confirmation), 3) Assign patient ID and room number, 4) Notify nursing staff of new patient arrival."

Input: "order processing"
Output: "Order processing workflow: 1) Receive and validate order details, 2) Check inventory availability (if in stock proceed to payment, if out of stock notify customer), 3) Process payment, 4) Generate shipping label and dispatch order."

Return ONLY the enhanced prompt. No explanations, no labels, no markdown.`;

// POST /api/magic-map/enhance
export async function POST(req: Request) {
  try {
    // 1. Authentication
    await requireUser();
    
    // 2. Request parsing
    const body = await req.json();
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Invalid request: prompt string required' },
        { status: 400 }
      );
    }
    
    // 3. OpenAI client setup
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({ apiKey });
    
    // 4. Call OpenAI for enhancement
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
        { role: 'user', content: prompt.trim() }
      ],
      max_tokens: 300,
      temperature: 0.5
    });
    
    const enhancedPrompt = completion.choices[0]?.message?.content?.trim();
    
    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: 'Failed to enhance prompt' },
        { status: 500 }
      );
    }
    
    // 5. Return enhanced prompt
    return NextResponse.json({
      enhancedPrompt
    });
    
  } catch (error: any) {
    console.error('[Magic Map Enhance] Error:', error);
    
    // Friendly error messages
    if (error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Please sign in to use Magic Map' },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    
    return handleApiError(error, 'Error enhancing prompt');
  }
}
