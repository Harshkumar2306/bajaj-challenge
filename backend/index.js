const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
  try {
    const data = req.body.data || [];

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
      
      if (!/^[A-Z]->[A-Z]$/.test(edge)) {
        invalidEntries.push(rawEdge);
        continue;
      }

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

    const parentMap = {}; 
    const childrenMap = {}; 
    const nodes = new Set();

    for (const edge of validEdges) {
      const u = edge[0];
      const v = edge[3];
      nodes.add(u);
      nodes.add(v);

      if (!childrenMap[u]) childrenMap[u] = [];
      if (!childrenMap[v]) childrenMap[v] = [];
      
      if (!parentMap[v]) {
        parentMap[v] = u;
        childrenMap[u].push(v);
      }
    }

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

    const buildTree = (node) => {
      const tree = {};
      for (const child of childrenMap[node] || []) {
        tree[child] = buildTree(child);
      }
      return tree;
    };

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
      let root = null;
      for (const node of group) {
        if (!parentMap[node]) {
          root = node;
          break; 
        }
      }

      if (root) {
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

    res.json({
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
    res.status(400).json({ error: "Invalid JSON format" });
  }
});

// GET route for testing
app.get('/bfhl', (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
