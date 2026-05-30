/**
 * =====================================================
 * AtendZap MCP Server
 * =====================================================
 *
 * Servidor MCP standalone com suporte a SSE e Streamable HTTP.
 * Usa @modelcontextprotocol/sdk para compatibilidade com GPT Maker.
 *
 * Endpoints:
 *   GET  /sse        → Abre conexão SSE persistente
 *   POST /messages   → Recebe mensagens JSON-RPC (modo SSE)
 *   POST /mcp        → Streamable HTTP
 *   GET  /mcp        → Info do servidor
 *   GET  /health     → Health check
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { randomUUID } from "crypto";

// =====================================================
// CONFIGURAÇÃO
// =====================================================
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// =====================================================
// SUPABASE CLIENT
// =====================================================
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// =====================================================
// STORE EM MEMÓRIA (dados temporários da sessão)
// =====================================================
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      cliente: null,
      endereco: null,
      produtos: null,
      agendamento: null,
    });
  }
  return sessions.get(sessionId);
}

// =====================================================
// TOOLS SCHEMAS (Zod)
// =====================================================
const coletarDadosClienteSchema = z.object({
  nome: z.string().describe("Nome completo do cliente"),
  telefone: z.string().min(8).max(15).describe("Telefone com DDD (8 a 15 dígitos)"),
  email: z.string().email().optional().describe("Email do cliente (opcional)"),
});

const coletarEnderecoSchema = z.object({
  logradouro: z.string().describe("Rua/Avenida"),
  numero: z.string().describe("Número"),
  complemento: z.string().optional().describe("Complemento (apto, bloco, etc)"),
  bairro: z.string().describe("Bairro"),
  cep: z.string().describe("CEP (8 dígitos)"),
  regiao: z.string().optional().describe("Região da cidade"),
});

const registrarProdutosSchema = z.object({
  produtos: z.string().describe("Lista de produtos/serviços separados por vírgula"),
  observacao: z.string().optional().describe("Observações adicionais"),
});

const agendarAtendimentoSchema = z.object({
  data: z.string().describe("Data no formato YYYY-MM-DD"),
  hora: z.string().describe("Hora no formato HH:MM"),
  tipo: z.enum(["entrega", "consulta", "retirada", "presencial"]).describe("Tipo de atendimento"),
  observacao: z.string().optional().describe("Observações sobre o agendamento"),
});

const registrarAtendimentoSchema = z.object({
  nicho: z.string().describe("Nicho: construcao, gastronomia, medico, petshop"),
  resumo_conversa: z.string().describe("Resumo da conversa"),
  transferencia: z.string().optional().describe("Nome do atendente para transferência"),
});

// =====================================================
// CRIAR SERVIDOR MCP
// =====================================================
function createMcpServer(sessionId) {
  const server = new McpServer({
    name: "AtendZap",
    version: "1.0.0",
    description: "Registra atendimentos WhatsApp no CRM",
  });

  // -------------------------------------------------
  // Tool: coletar_dados_cliente
  // -------------------------------------------------
  server.tool(
    "coletar_dados_cliente",
    "Coleta dados básicos do cliente (nome, telefone, email)",
    {},
    async (params) => {
      const { nome, telefone, email } = params;

      if (!nome || !telefone) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Nome e telefone são obrigatórios" }) }]
        };
      }

      const apenasDigitos = telefone.replace(/\D/g, "");
      if (apenasDigitos.length < 8 || apenasDigitos.length > 11) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Telefone deve ter entre 8 e 11 dígitos" }) }]
        };
      }

      const session = getSession(sessionId);
      session.cliente = { nome, telefone: apenasDigitos, email: email || null };

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Dados do cliente coletados: ${nome}` }) }]
      };
    }
  );

  // -------------------------------------------------
  // Tool: coletar_endereco
  // -------------------------------------------------
  server.tool(
    "coletar_endereco",
    "Coleta endereço de entrega do cliente",
    {},
    async (params) => {
      const { logradouro, numero, complemento, bairro, cep, regiao } = params;

      if (!logradouro || !numero || !bairro) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Logradouro, número e bairro são obrigatórios" }) }]
        };
      }

      const session = getSession(sessionId);
      session.endereco = {
        logradouro,
        numero,
        complemento: complemento || null,
        bairro,
        cep: cep ? cep.replace(/\D/g, "") : null,
        regiao: regiao || null,
      };

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Endereço coletado: ${logradouro}, ${numero} - ${bairro}` }) }]
      };
    }
  );

  // -------------------------------------------------
  // Tool: registrar_produtos
  // -------------------------------------------------
  server.tool(
    "registrar_produtos",
    "Registra os produtos ou serviços mencionados pelo cliente",
    {},
    async (params) => {
      const { produtos, observacao } = params;

      if (!produtos) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Lista de produtos é obrigatória" }) }]
        };
      }

      const session = getSession(sessionId);
      session.produtos = { itens: produtos, observacao: observacao || null };

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Produtos registrados: ${produtos}` }) }]
      };
    }
  );

  // -------------------------------------------------
  // Tool: agendar_atendimento
  // -------------------------------------------------
  server.tool(
    "agendar_atendimento",
    "Agenda uma data e hora para atendimento",
    {},
    async (params) => {
      const { data, hora, tipo, observacao } = params;

      if (!data || !hora || !tipo) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Data, hora e tipo são obrigatórios" }) }]
        };
      }

      const validTipos = ["entrega", "consulta", "retirada", "presencial"];
      if (!validTipos.includes(tipo)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: `Tipo deve ser um dos: ${validTipos.join(", ")}` }) }]
        };
      }

      const session = getSession(sessionId);
      session.agendamento = { data, hora, tipo, observacao: observacao || null };

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Agendamento registrado: ${tipo} em ${data} às ${hora}` }) }]
      };
    }
  );

  // -------------------------------------------------
  // Tool: registrar_atendimento
  // -------------------------------------------------
  server.tool(
    "registrar_atendimento",
    "Finaliza o atendimento — salva todos os dados no banco e limpa a sessão",
    {},
    async (params) => {
      const { nicho, resumo_conversa, transferencia } = params;

      if (!nicho || !resumo_conversa) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: "Nicho e resumo são obrigatórios" }) }]
        };
      }

      const validNichos = ["construcao", "gastronomia", "medico", "petshop"];
      if (!validNichos.includes(nicho)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, message: `Nicho deve ser um dos: ${validNichos.join(", ")}` }) }]
        };
      }

      const session = getSession(sessionId);

      // Montar endereço completo
      const enderecoCompleto = [
        session.endereco?.logradouro,
        session.endereco?.numero,
        session.endereco?.complemento,
        session.endereco?.bairro,
        session.endereco?.cep ? `CEP ${session.endereco.cep}` : ""
      ].filter(Boolean).join(", ");

      // Preparar dados para insert
      // Se nome não foi coletado, tentar extrair do resumo
      let nomeCliente = session.cliente?.nome || "Cliente WhatsApp";
      if (nomeCliente === "Cliente WhatsApp" && resumo_conversa) {
        // Tentar extrair nome do padrão "Cliente X solicitou" ou "Cliente X pediu"
        const match = resumo_conversa.match(/(?:Cliente\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:solicitou|pagou|pediu|informou))/i);
        if (match && match[1]) {
          nomeCliente = match[1].trim();
        } else if (match && match[2]) {
          nomeCliente = match[2].trim();
        }
      }

      const insertData = {
        nome: nomeCliente,
        telefone: session.cliente?.telefone || null,
        nicho: nicho,
        resumo_conversa: resumo_conversa,
        produtos_citados: session.produtos?.itens || null,
        transferido_para: transferencia || null,
        status: "encerrado",
        // Endereço
        endereco_entrega: session.endereco?.logradouro || null,
        numero_endereco: session.endereco?.numero || null,
        complemento: session.endereco?.complemento || null,
        bairro_entrega: session.endereco?.bairro || null,
        regiao_entrega: session.endereco?.regiao || null,
        cep_entrega: session.endereco?.cep || null,
        // Agendamento
        data_agendamento: session.agendamento?.data || null,
        hora_agendamento: session.agendamento?.hora || null,
        tipo_atendimento: session.agendamento?.tipo || null,
        status_entrega: session.agendamento?.data ? "agendado" : null,
        observacao_entrega: session.agendamento?.observacao || null
      };

      let atendimentoId = null;

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from("atendimentos")
          .insert(insertData)
          .select("id")
          .single();

        if (error) {
          console.error("Erro ao inserir no Supabase:", error);
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, message: `Erro ao salvar: ${error.message}` }) }]
          };
        }
        atendimentoId = data?.id;
      } else {
        // Sem Supabase — apenas log
        console.log("=== ATENDIMENTO REGISTRADO (sem Supabase) ===");
        console.log(JSON.stringify(insertData, null, 2));
        console.log("==============================================");
        atendimentoId = randomUUID();
      }

      // Limpar sessão
      sessions.delete(sessionId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Atendimento registrado com sucesso!",
            atendimento_id: atendimentoId
          })
        }]
      };
    }
  );

  return server;
}

// =====================================================
// EXPRESS SERVER
// =====================================================
const app = express();

// CORS — ESSENCIAL para o GPT Maker conseguir conectar
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS", "DELETE"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization", "X-Session-Id", "mcp-session-id"],
  exposedHeaders: ["Content-Type", "mcp-session-id"],
}));

app.use(express.json());

// -------------------------------------------------
// Health Check
// -------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    server: "AtendZap MCP",
    version: "1.0.0",
    supabase: supabaseAdmin ? "connected" : "not configured"
  });
});

// -------------------------------------------------
// INFO DO SERVIDOR
// -------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "AtendZap MCP Server",
    version: "1.0.0",
    description: "Registra atendimentos WhatsApp no CRM",
    endpoints: {
      sse: "GET /sse",
      messages: "POST /messages?sessionId=...",
      mcp: "POST /mcp",
      health: "GET /health"
    }
  });
});

// -------------------------------------------------
// SSE TRANSPORT
// -------------------------------------------------
const sseTransports = new Map();

app.get("/sse", async (req, res) => {
  console.log("[SSE] Nova conexão recebida");

  const sessionId = randomUUID();
  const server = createMcpServer(sessionId);
  const transport = new SSEServerTransport("/messages", res);

  sseTransports.set(sessionId, { server, transport });

  res.on("close", () => {
    console.log(`[SSE] Conexão fechada: ${sessionId}`);
    sseTransports.delete(sessionId);
    server.close();
  });

  await server.connect(transport);
  console.log(`[SSE] Conectado com sessionId: ${sessionId}`);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "sessionId é obrigatório" }
    });
  }

  const entry = sseTransports.get(sessionId);
  if (!entry) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Sessão não encontrada. Reconecte no /sse" }
    });
  }

  await entry.transport.handlePostMessage(req, res);
});

// -------------------------------------------------
// STREAMABLE HTTP TRANSPORT
// -------------------------------------------------
const streamableTransports = new Map();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] || randomUUID();

  let entry = streamableTransports.get(sessionId);

  if (!entry) {
    console.log(`[Streamable] Nova sessão: ${sessionId}`);
    const server = createMcpServer(sessionId);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    entry = { server, transport };
    streamableTransports.set(sessionId, entry);

    transport.onclose = () => {
      streamableTransports.delete(sessionId);
      server.close();
    };

    await server.connect(transport);
  }

  await entry.transport.handleRequest(req, res);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (!sessionId) {
    // Retornar info do servidor
    return res.json({
      name: "AtendZap",
      version: "1.0.0",
      description: "Registra atendimentos WhatsApp no CRM"
    });
  }

  const entry = streamableTransports.get(sessionId);
  if (entry) {
    await entry.transport.handleRequest(req, res);
  } else {
    res.status(404).json({ error: "Sessão não encontrada" });
  }
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  const entry = streamableTransports.get(sessionId);
  if (entry) {
    await entry.transport.handleRequest(req, res);
    streamableTransports.delete(sessionId);
  } else {
    res.status(404).json({ error: "Sessão não encontrada" });
  }
});

// -------------------------------------------------
// INICIAR SERVIDOR
// -------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 AtendZap MCP Server`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   SSE:        http://localhost:${PORT}/sse`);
  console.log(`   Streamable: http://localhost:${PORT}/mcp`);
  console.log(`   Health:     http://localhost:${PORT}/health\n`);
});