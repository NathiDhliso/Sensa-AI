# Mind Map Editor Import Test

## Test Steps

1. **Navigate to Integrated Learning Hub**
   - Go to http://localhost:5174
   - Navigate to the Integrated Learning Hub page

2. **Generate a Mind Map**
   - Upload a document OR select a course from the catalog
   - Go to the "Visualize" tab
   - Click "Generate Mind Map" 
   - Wait for the mind map to be generated and displayed

3. **Open Edit Mode**
   - Click the "Edit Mode" button (should appear next to "Generate Mind Map")
   - The Mind Map Editor modal should open

4. **Verify Import**
   - Check that the generated mind map nodes are properly imported
   - Verify that the hierarchical structure is maintained
   - Confirm that node colors match the original legend:
     - Purple (#6B46C1) for central topics
     - Orange (#F97316) for major branches  
     - Amber (#F59E0B) for sub-topics
     - Yellow (#EAB308) for specific skills

5. **Test Editing**
   - Double-click a node to edit its text
   - Try adding new nodes with the "+" button
   - Test connecting nodes by dragging
   - Customize node appearance using the palette tool

6. **Test Export**
   - Try exporting as Mermaid (.mmd)
   - Try exporting as SVG
   - Try exporting as PNG

## Expected Results

- ✅ Mind map should import with proper node structure
- ✅ Colors should match the original visualization
- ✅ All editing features should work smoothly
- ✅ Export functionality should generate proper files
- ✅ Layout should be hierarchical and readable

## Sample Test Content

Use this sample content for testing:

**Course**: Introduction to Computer Science I (University of Cape Town)
**Expected Nodes**: Should include topics like:
- Core Concepts
- Practical Skills  
- Advanced Topics
- Assessment methods

**Uploaded Document**: Create a text file with content about any subject (e.g., "Mathematics Study Guide") to test document analysis.

## Troubleshooting

If the mind map doesn't import properly:
1. Check browser console for errors
2. Verify that `studyMap` data exists before opening editor
3. Ensure Mermaid syntax is being parsed correctly
4. Check that node positioning is working (nodes shouldn't overlap)

## Success Criteria

The feature is working correctly if:
- Generated mind maps open in edit mode with all nodes visible
- Node hierarchy and colors are preserved
- Users can edit, add, and customize nodes
- Export functions produce usable files
- The interface is intuitive and responsive 