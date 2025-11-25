import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // For now, we'll use a simple keyword-based response
    // This will be replaced with actual AI API calls in Phase 3
    let aiResponse = 'ขอบคุณสำหรับข้อความคุณครับ ทีมงานจะติดต่อกลับในเร็วๆ นี้';

    const messageLower = message.toLowerCase();
    if (messageLower.includes('สินค้า') || messageLower.includes('product')) {
      aiResponse = 'สามารถดูรายการสินค้าทั้งหมดได้ที่หน้า Products ครับ หรือต้องการความช่วยเหลืออะไรเพิ่มเติมไหมครับ?';
    } else if (messageLower.includes('คำสั่งซื้อ') || messageLower.includes('order')) {
      aiResponse = 'คุณสามารถดูประวัติคำสั่งซื้อได้ที่หน้า Orders หรือต้องการให้ช่วยตรวจสอบคำสั่งซื้อไหนโดยเฉพาะไหมครับ?';
    } else if (messageLower.includes('ราคา') || messageLower.includes('price')) {
      aiResponse = 'ราคาสินค้าของเราแข่งขันได้มากครับ คุณสามารถเปรียบเทียบราคาได้ที่หน้าสินค้าแต่ละรายการเลยครับ';
    } else if (messageLower.includes('จัดส่ง') || messageLower.includes('shipping')) {
      aiResponse = 'เรามีบริการจัดส่งทั่วประเทศไทยครับ ใช้เวลาประมาณ 2-3 วันทำการ ต้องการทราบค่าจัดส่งไปยังที่ใดเป็นพิเศษไหมครับ?';
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
          },
        })
        .select()
        .single();

      conversation = data;
    }

    return NextResponse.json({
      message: aiResponse,
      conversation,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
