import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callAI, buildSystemPrompt, prepareMessages } from '@/lib/ai/providers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get AI Agent settings
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_agent_settings')
      .select('*')
      .eq('tenant_id', user.id)
      .single();

    if (settingsError || !aiSettings || !aiSettings.is_enabled) {
      return NextResponse.json(
        { error: 'AI Agent is not configured or disabled' },
        { status: 400 }
      );
    }

    // Get conversation history if exists
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('ai_agent_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (existingConv?.messages) {
        conversationHistory = existingConv.messages;
      }
    }

    // Check if AI provider is configured
    let aiResponse: string;
    let usage: any = undefined;

    if (aiSettings.api_key && aiSettings.ai_provider) {
      try {
        // Build system prompt with knowledge base
        const systemPrompt = buildSystemPrompt(aiSettings.knowledge_sources || []);

        // Prepare messages with conversation context
        const messages = prepareMessages(conversationHistory, message, systemPrompt);

        // Call AI provider
        const result = await callAI(messages, {
          provider: aiSettings.ai_provider,
          apiKey: aiSettings.api_key,
          model: aiSettings.ai_model || 'gpt-4',
          maxTokens: aiSettings.max_tokens || 1000,
          temperature: aiSettings.temperature || 0.7,
        });

        aiResponse = result.content;
        usage = result.usage;
      } catch (error: any) {
        console.error('AI Provider Error:', error);
        // Fallback to keyword-based response if AI fails
        aiResponse = getFallbackResponse(message);
      }
    } else {
      // Use keyword-based response if no AI provider configured
      aiResponse = getFallbackResponse(message);
    }

    // Update or create conversation
    let conversation;
    if (conversationId) {
      // Update existing conversation
      const { data: existingConv } = await supabase
        .from('ai_agent_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (existingConv) {
        const updatedMessages = [
          ...(existingConv.messages || []),
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
        ];

        const { data } = await supabase
          .from('ai_agent_conversations')
          .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)
          .select()
          .single();

        conversation = data;
      }
    } else {
      // Create new conversation
      const { data } = await supabase
        .from('ai_agent_conversations')
        .insert({
          user_id: user.id,
          session_id: crypto.randomUUID(),
          messages: [
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
          ],
          metadata: {
            ai_provider: aiSettings.ai_provider,
            ai_model: aiSettings.ai_model,
            usage,
          },
        })
        .select()
        .single();

      conversation = data;
    }

    return NextResponse.json({
      message: aiResponse,
      conversation,
      usage,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fallback keyword-based response when AI is not available
function getFallbackResponse(message: string): string {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('สินค้า') || messageLower.includes('product')) {
    return 'สามารถดูรายการสินค้าทั้งหมดได้ที่หน้า Products ครับ หรือต้องการความช่วยเหลืออะไรเพิ่มเติมไหมครับ?';
  } else if (messageLower.includes('คำสั่งซื้อ') || messageLower.includes('order')) {
    return 'คุณสามารถดูประวัติคำสั่งซื้อได้ที่หน้า Orders หรือต้องการให้ช่วยตรวจสอบคำสั่งซื้อไหนโดยเฉพาะไหมครับ?';
  } else if (messageLower.includes('ราคา') || messageLower.includes('price')) {
    return 'ราคาสินค้าของเราแข่งขันได้มากครับ คุณสามารถเปรียบเทียบราคาได้ที่หน้าสินค้าแต่ละรายการเลยครับ';
  } else if (messageLower.includes('จัดส่ง') || messageLower.includes('shipping')) {
    return 'เรามีบริการจัดส่งทั่วประเทศไทยครับ ใช้เวลาประมาณ 2-3 วันทำการ ต้องการทราบค่าจัดส่งไปยังที่ใดเป็นพิเศษไหมครับ?';
  } else if (messageLower.includes('สวัสดี') || messageLower.includes('hello') || messageLower.includes('hi')) {
    return 'สวัสดีครับ! ยินดีต้อนรับสู่ Omni Sales มีอะไรให้ช่วยไหมครับ?';
  } else if (messageLower.includes('ขอบคุณ') || messageLower.includes('thank')) {
    return 'ยินดีครับ! มีอะไรให้ช่วยเพิ่มเติมไหมครับ?';
  }

  return 'ขอบคุณสำหรับข้อความคุณครับ มีอะไรให้ช่วยไหมครับ? สามารถถามเกี่ยวกับสินค้า คำสั่งซื้อ การจัดส่ง หรือเรื่องอื่นๆ ได้เลยครับ';
}
