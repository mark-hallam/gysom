import { NextResponse } from "next/server";
import { TEMPLATE_DEFINITIONS, getAvailableProjectTypes } from "@/lib/templates";

export async function GET() {
  const types = getAvailableProjectTypes();
  const templates = types.map((type) => {
    const def = TEMPLATE_DEFINITIONS[type];
    return {
      projectType: type,
      name: def.name,
      description: def.description,
      typicalAgentCount: def.typicalAgentCount,
      agentRoleCount: def.agentRoles.length,
    };
  });

  return NextResponse.json({ templates });
}
