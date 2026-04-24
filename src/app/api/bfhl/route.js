import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const data = body.data || [];

    const userId = "harshkumar_23062006";
    const emailId = "harsh_kumar@srmap.edu.in";
    const collegeRollNumber = "AP23110010399";

    const invalidEntries = [];
    const validEdges = [];
    const seenEdges = new Set();
    const duplicateSet = new Set();

    // 1. Validation and duplicates
    for (let rawEdge of data) {
      if (typeof rawEdge !== 'string') {
        invalidEntries.push(String(rawEdge));
        continue;
      }
      
      const edge = rawEdge.trim();
      
      // Regex check: X->Y where X and Y are single uppercase letters
      if (!/^[A-Z]->[A-Z]$/.test(edge)) {
        invalidEntries.push(rawEdge);
        continue;
      }

      // Self-loop check
      if (edge[0] === edge[3]) {
        invalidEntries.push(rawEdge);
        continue;
      }

      if (seenEdges.has(edge)) {
        duplicateSet.add(edge);
      } else {
        seenEdges.add(edge);
        validEdges.push(edge);
      }
    }

    // 2. Tree Construction Preparation
    const parentMap = {}; // child -> parent
    const childrenMap = {}; // parent -> children
    const nodes = new Set();

    for (const edge of validEdges) {
      const u = edge[0];
      const v = edge[3];
      nodes.add(u);
      nodes.add(v);

      if (!childrenMap[u]) childrenMap[u] = [];
      if (!childrenMap[v]) childrenMap[v] = []; // initialize array for all nodes
      
      if (!parentMap[v]) {
        parentMap[v] = u;
        childrenMap[u].push(v);
      }
    }

    // 3. Find connected components (groups) based on valid edges
    const undirectedAdj = {};
    for (const node of nodes) undirectedAdj[node] = [];
    for (const edge of validEdges) {
      const u = edge[0];
      const v = edge[3];
      undirectedAdj[u].push(v);
      undirectedAdj[v].push(u);
    }

    const visited = new Set();
    const groups = [];

    for (const node of nodes) {
      if (!visited.has(node)) {
        const comp = [];
        const q = [node];
        visited.add(node);
        while (q.length > 0) {
          const curr = q.shift();
          comp.push(curr);
          for (const neighbor of undirectedAdj[curr]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              q.push(neighbor);
            }
          }
        }
        groups.push(comp);
      }
    }

    // Tree builder helper
    const buildTree = (node) => {
      const tree = {};
      for (const child of childrenMap[node] || []) {
        tree[child] = buildTree(child);
      }
      return tree;
    };

    // Depth helper
    const getDepth = (node) => {
      let maxChildDepth = 0;
      for (const child of childrenMap[node] || []) {
        maxChildDepth = Math.max(maxChildDepth, getDepth(child));
      }
      return 1 + maxChildDepth;
    };

    const hierarchies = [];
    let totalTrees = 0;
    let totalCycles = 0;
    let largestTreeRoot = null;
    let maxDepth = 0;

    for (const group of groups) {
      // Find root in this group
      let root = null;
      for (const node of group) {
        if (!parentMap[node]) {
          root = node;
          break; // Max in-degree is 1, so there is at most 1 root per connected component
        }
      }

      if (root) {
        // It's a tree
        const treeStruct = {};
        treeStruct[root] = buildTree(root);
        const depth = getDepth(root);
        
        hierarchies.push({
          root,
          tree: treeStruct,
          depth
        });
        
        totalTrees++;
        
        if (depth > maxDepth) {
          maxDepth = depth;
          largestTreeRoot = root;
        } else if (depth === maxDepth) {
          if (!largestTreeRoot || root < largestTreeRoot) {
            largestTreeRoot = root;
          }
        }
      } else {
        // It's a cycle
        let smallest = group[0];
        for (const node of group) {
          if (node < smallest) smallest = node;
        }
        
        hierarchies.push({
          root: smallest,
          tree: {},
          has_cycle: true
        });
        
        totalCycles++;
      }
    }

    return NextResponse.json({
      user_id: userId,
      email_id: emailId,
      college_roll_number: collegeRollNumber,
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: Array.from(duplicateSet),
      summary: {
        total_trees: totalTrees,
        total_cycles: totalCycles,
        largest_tree_root: largestTreeRoot
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}
