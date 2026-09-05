import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

export async function saveGraphifyToDatabase() {
  console.log("🔄 Starting Graphify Database Sync...\n");

  const graphifyDir = path.join(process.cwd(), "graphify-out");
  const graphJsonPath = path.join(graphifyDir, "graph.json");
  const reportPath = path.join(graphifyDir, "GRAPH_REPORT.md");
  const labelsPath = path.join(graphifyDir, ".graphify_labels.json");
  const costPath = path.join(graphifyDir, "cost.json");

  if (!fs.existsSync(graphJsonPath)) {
    console.error("❌ graphify-out/graph.json not found! Run /graphify first.");
    return { success: false, error: "graph.json not found" };
  }

  const graphData = JSON.parse(fs.readFileSync(graphJsonPath, "utf-8"));
  const reportMarkdown = fs.existsSync(reportPath)
    ? fs.readFileSync(reportPath, "utf-8")
    : "";
  const labels = fs.existsSync(labelsPath)
    ? JSON.parse(fs.readFileSync(labelsPath, "utf-8"))
    : {};
  const cost = fs.existsSync(costPath)
    ? JSON.parse(fs.readFileSync(costPath, "utf-8"))
    : null;

  const rawNodes = graphData.nodes || [];
  const rawEdges = graphData.links || graphData.edges || [];
  const communities = graphData.communities || {};

  // Extract god nodes & surprises from report or compute from degree
  const nodeDegrees = new Map<string, number>();
  for (const edge of rawEdges) {
    const s = typeof edge.source === "object" ? edge.source.id : edge.source;
    const t = typeof edge.target === "object" ? edge.target.id : edge.target;
    nodeDegrees.set(s, (nodeDegrees.get(s) || 0) + 1);
    nodeDegrees.set(t, (nodeDegrees.get(t) || 0) + 1);
  }

  const godNodes = rawNodes
    .map((n: any) => ({
      id: n.id,
      label: n.label || n.name || n.id,
      degree: nodeDegrees.get(n.id) || 0,
    }))
    .sort((a: any, b: any) => b.degree - a.degree)
    .slice(0, 15);

  const communitiesCount = Object.keys(communities).length || Object.keys(labels).length || 1;

  console.log(`📊 Parsed Graphify Data:`);
  console.log(`   - Nodes: ${rawNodes.length}`);
  console.log(`   - Edges: ${rawEdges.length}`);
  console.log(`   - Communities: ${communitiesCount}`);

  try {
    // Create master KnowledgeGraph snapshot
    const kg = await prisma.knowledgeGraph.create({
      data: {
        version: "1.0.0",
        root: ".",
        nodesCount: rawNodes.length,
        edgesCount: rawEdges.length,
        communitiesCount,
        labels,
        godNodes,
        surprises: graphData.surprises || [],
        graphData: {
          nodesCount: rawNodes.length,
          edgesCount: rawEdges.length,
          communitiesCount,
          sampleNodes: rawNodes.slice(0, 20),
          sampleEdges: rawEdges.slice(0, 20),
        },
        reportMarkdown,
        tokenCost: cost,
      },
    });

    console.log(`\n💾 Created KnowledgeGraph snapshot record: ${kg.id}`);

    // Batch insert nodes in chunks of 200
    const nodeRecords = rawNodes.map((n: any) => {
      const commId = n.community ?? n.group ?? null;
      const commName = commId !== null && labels[String(commId)] ? labels[String(commId)] : null;
      return {
        graphId: kg.id,
        nodeId: String(n.id),
        label: String(n.label || n.name || n.id),
        category: n.category || n.type || null,
        communityId: typeof commId === "number" ? commId : null,
        communityName: commName,
        degree: nodeDegrees.get(String(n.id)) || 0,
        sourceFile: n.source_file || n.file || null,
        sourceLocation: n.source_location || null,
        metadata: n.metadata || null,
      };
    });

    const CHUNK_SIZE = 150;
    let nodesInserted = 0;
    for (let i = 0; i < nodeRecords.length; i += CHUNK_SIZE) {
      const chunk = nodeRecords.slice(i, i + CHUNK_SIZE);
      await prisma.knowledgeGraphNode.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      nodesInserted += chunk.length;
    }
    console.log(`✅ Stored ${nodesInserted} KnowledgeGraphNode records.`);

    // Batch insert edges
    const validNodeIds = new Set(rawNodes.map((n: any) => String(n.id)));
    const edgeRecords = rawEdges
      .map((e: any) => {
        const source = String(typeof e.source === "object" ? e.source.id : e.source);
        const target = String(typeof e.target === "object" ? e.target.id : e.target);
        if (!validNodeIds.has(source) || !validNodeIds.has(target)) {
          return null;
        }
        return {
          graphId: kg.id,
          sourceNodeId: source,
          targetNodeId: target,
          relation: e.relation || e.label || "references",
          confidence: e.confidence || "EXTRACTED",
          weight: typeof e.weight === "number" ? e.weight : 1.0,
          metadata: e.metadata || null,
        };
      })
      .filter(Boolean);

    if (edgeRecords.length > 0) {
      await prisma.knowledgeGraphEdge.createMany({
        data: edgeRecords as any[],
        skipDuplicates: true,
      });
      console.log(`✅ Stored ${edgeRecords.length} KnowledgeGraphEdge records.`);
    }

    console.log(`\n✨ Graphify Database Sync complete! (Graph ID: ${kg.id})`);
    return { success: true, graphId: kg.id, nodesCount: nodesInserted, edgesCount: edgeRecords.length };
  } catch (err) {
    console.error("❌ Error storing graphify in database:", err);
    throw err;
  }
}

if (require.main === module) {
  saveGraphifyToDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
