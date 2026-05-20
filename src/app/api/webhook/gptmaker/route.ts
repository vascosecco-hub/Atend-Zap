import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do CRM (usando as credenciais do nosso CRM)
const supabaseUrl = 'https://giezczzsrhmtnowjephv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Organização fixa do nosso CRM
const ORG_ID = 'ec400a96-3a51-4086-a593-113dd6869b6f';

// IDs dos boards e stages criados anteriormente
const BOARD_ID = '09867008-e18c-4fcf-9a2d-910d5b5af42e';
const STAGE_ID = '16e23c41-0cee-4497-a198-e38cb5b1abe8';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, phone, email, source, company_name, notes, nicho } = body;

    // Validar dados mínimos (pelo menos nome ou telefone)
    if (!name && !phone && !email) {
      return NextResponse.json(
        { error: 'Nome, telefone ou email são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao Supabase do CRM
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Inserir/atualizar contato
    const contactData: any = {
      name: name || 'Sem nome',
      phone: phone || null,
      email: email || null,
      source: source || `whatsapp-${nicho || 'general'}`,
      stage: 'LEAD',
      organization_id: ORG_ID,
      status: 'ACTIVE'
    };

    if (company_name) {
      contactData.company_name = company_name;
    }
    if (notes) {
      contactData.notes = notes;
    }

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(contactData, { onConflict: 'email' })
      .select()
      .single();

    if (contactError) {
      console.error('Erro ao criar contato:', contactError);
      return NextResponse.json(
        { error: 'Erro ao criar contato', details: contactError },
        { status: 500 }
      );
    }

    // Criar um deal (negócio) associado ao contato
    if (contact) {
      const dealTitle = name
        ? `${name}${phone ? ' - ' + phone : ''}`
        : `Contato ${contact.id}`;

      await supabase
        .from('deals')
        .insert({
          title: dealTitle,
          contact_id: contact.id,
          board_id: BOARD_ID,
          stage_id: STAGE_ID,
          organization_id: ORG_ID,
          status: 'open',
          source: source || `whatsapp-${nicho || 'general'}`
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Contato criado com sucesso!',
      contact_id: contact?.id
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}