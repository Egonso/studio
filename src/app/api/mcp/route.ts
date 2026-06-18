import { NextRequest, NextResponse } from 'next/server';

import {
  getAgentDistributionProfile,
  getAgentDemoSession,
  getMcpToolDefinitions,
  getProcurementDossier,
  getSampleAgentExport,
} from '@/lib/agent-ready-distribution';

function jsonRpc(id: unknown, result: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code,
        message,
      },
    },
    { status: code === -32601 ? 404 : 400 },
  );
}

export function GET() {
  return NextResponse.json(
    {
      schemaVersion: '1.0.0',
      kind: 'kiregister.mcp_read_only_descriptor',
      mode: 'read_only',
      tools: getMcpToolDefinitions(),
      boundaries: [
        'No workspace data',
        'No write operations',
        'No checkout',
        'No final legal assessment',
      ],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as {
    id?: unknown;
    method?: string;
    params?: {
      name?: string;
      arguments?: Record<string, unknown>;
    };
  } | null;

  if (!payload?.method) {
    return jsonRpcError(null, -32600, 'Invalid MCP JSON-RPC request.');
  }

  if (payload.method === 'tools/list') {
    return jsonRpc(payload.id, { tools: getMcpToolDefinitions() });
  }

  if (payload.method !== 'tools/call') {
    return jsonRpcError(payload.id, -32601, 'Unsupported MCP method.');
  }

  const toolName = payload.params?.name;
  if (toolName === 'kiregister_get_product_profile') {
    return jsonRpc(payload.id, {
      content: [{ type: 'json', json: getAgentDistributionProfile() }],
    });
  }

  if (toolName === 'kiregister_start_demo_session') {
    return jsonRpc(payload.id, {
      content: [{ type: 'json', json: getAgentDemoSession() }],
    });
  }

  if (toolName === 'kiregister_get_sample_export') {
    return jsonRpc(payload.id, {
      content: [{ type: 'json', json: getSampleAgentExport() }],
    });
  }

  if (toolName === 'kiregister_generate_procurement_dossier') {
    return jsonRpc(payload.id, {
      content: [{ type: 'json', json: getProcurementDossier() }],
    });
  }

  return jsonRpcError(payload.id, -32602, 'Unknown read-only KIRegister tool.');
}
