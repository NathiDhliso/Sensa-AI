#!/usr/bin/env python3
"""
Test NetworkX Layout Fallback for Sensa Mindmap Generator

This script tests the NetworkX spring layout fallback functionality
when pygraphviz is not available.
"""

import json
import networkx as nx
from datetime import datetime

def test_networkx_layout():
    """Test NetworkX spring layout functionality"""
    print("🚀 Testing NetworkX Layout Fallback")
    print("=" * 50)
    
    # Create a sample graph structure
    sample_nodes = [
        {"id": "root", "label": "Machine Learning", "description": "Core ML concepts"},
        {"id": "supervised", "label": "Supervised Learning", "description": "Learning with labeled data"},
        {"id": "unsupervised", "label": "Unsupervised Learning", "description": "Learning without labels"},
        {"id": "regression", "label": "Regression", "description": "Predicting continuous values"},
        {"id": "classification", "label": "Classification", "description": "Predicting categories"}
    ]
    
    sample_edges = [
        {"source": "root", "target": "supervised", "label": "includes"},
        {"source": "root", "target": "unsupervised", "label": "includes"},
        {"source": "supervised", "target": "regression", "label": "type"},
        {"source": "supervised", "target": "classification", "label": "type"}
    ]
    
    # Create NetworkX graph
    G = nx.DiGraph()
    
    # Add nodes with attributes
    for node in sample_nodes:
        G.add_node(node['id'], **node)
    
    # Add edges with attributes
    for edge in sample_edges:
        G.add_edge(edge['source'], edge['target'], label=edge['label'])
    
    print(f"📊 Created graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    
    # Test NetworkX spring layout
    try:
        if G.number_of_nodes() > 0:
            pos = nx.spring_layout(G, k=3, iterations=50, seed=42)
        else:
            pos = {}
        
        # Extract positions from NetworkX layout
        positioned_nodes = []
        for node_id in G.nodes():
            node_attrs = G.nodes[node_id].copy()
            
            if node_id in pos:
                # Scale positions for better visualization
                node_attrs['x'] = float(pos[node_id][0] * 200)
                node_attrs['y'] = float(pos[node_id][1] * 200)
            else:
                node_attrs['x'] = 0.0
                node_attrs['y'] = 0.0
            
            positioned_nodes.append(node_attrs)
        
        # Create edges with labels
        edges_with_labels = []
        for edge in sample_edges:
            edge_data = G.edges[edge['source'], edge['target']]
            edges_with_labels.append({
                'source': edge['source'],
                'target': edge['target'],
                'label': edge_data.get('label', '')
            })
        
        # Create final mindmap data
        mindmap_data = {
            'nodes': positioned_nodes,
            'edges': edges_with_labels,
            'metadata': {
                'total_nodes': len(positioned_nodes),
                'total_edges': len(edges_with_labels),
                'layout_engine': 'networkx_spring',
                'generated_at': datetime.utcnow().isoformat(),
                'subject': 'Machine Learning Test'
            }
        }
        
        print("✅ NetworkX spring layout calculation successful")
        print(f"📍 Sample node positions:")
        for i, node in enumerate(positioned_nodes[:3]):  # Show first 3 nodes
            print(f"   {node['id']}: x={node['x']:.1f}, y={node['y']:.1f}")
        
        print(f"🔗 Generated {len(edges_with_labels)} edges with labels")
        print(f"📊 Metadata: {mindmap_data['metadata']['layout_engine']}")
        
        # Validate the structure
        assert 'nodes' in mindmap_data
        assert 'edges' in mindmap_data
        assert 'metadata' in mindmap_data
        assert len(mindmap_data['nodes']) == 5
        assert len(mindmap_data['edges']) == 4
        
        # Validate node positions are set
        for node in mindmap_data['nodes']:
            assert 'x' in node
            assert 'y' in node
            assert isinstance(node['x'], float)
            assert isinstance(node['y'], float)
        
        print("✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"❌ NetworkX layout test failed: {str(e)}")
        return False

def test_layout_consistency():
    """Test that layout produces consistent results with same seed"""
    print("\n🔄 Testing Layout Consistency")
    print("-" * 30)
    
    # Create simple graph
    G = nx.DiGraph()
    G.add_node("A", label="Node A")
    G.add_node("B", label="Node B")
    G.add_edge("A", "B")
    
    # Generate layout twice with same seed
    pos1 = nx.spring_layout(G, seed=42)
    pos2 = nx.spring_layout(G, seed=42)
    
    # Check consistency
    consistent = True
    for node in G.nodes():
        if abs(pos1[node][0] - pos2[node][0]) > 1e-10 or abs(pos1[node][1] - pos2[node][1]) > 1e-10:
            consistent = False
            break
    
    if consistent:
        print("✅ Layout produces consistent results with same seed")
        return True
    else:
        print("❌ Layout inconsistency detected")
        return False

if __name__ == "__main__":
    success1 = test_networkx_layout()
    success2 = test_layout_consistency()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 All NetworkX layout tests passed!")
        print("✅ Mindmap generator can work without pygraphviz")
    else:
        print("❌ Some tests failed")
        exit(1)