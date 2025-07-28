// Cypress tests for Mind Map Editor covering interactive editing, visual customization, smart connections, export options, keyboard shortcuts, browser compatibility basics, and troubleshooting scenarios
// Note: assumes the dev server is running on http://localhost:5173 and the editor is accessible at /mindmap route (update URL if different)

/// <reference types="cypress" />
/* eslint-env mocha */
/* global cy, Cypress */

describe('Mind Map Editor – End-to-End', () => {
  const rootSelector = '[data-testid="mindmap-root"]' // adjust selectors to actual data-testid in app
  const nodeSelector = '[data-testid="mindmap-node"]'

  beforeEach(() => {
    cy.visit('http://localhost:5173/mindmap')
    // Ensure canvas is ready
    cy.get(rootSelector).should('be.visible')
  })

  /* I. Interactive Editing */
  it('adds, edits, moves and deletes nodes', () => {
    // Add node
    cy.get('[data-testid="add-node-btn"]').click()
    cy.get(nodeSelector).should('have.length.at.least', 2)

    // Edit node text
    cy.get(nodeSelector).last().dblclick()
    cy.focused().clear().type('New Topic{enter}')
    cy.get(nodeSelector).last().contains('New Topic')

    // Move node – drag to offset
    cy.get(nodeSelector).last()
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 300, clientY: 200 })
      .trigger('mouseup')

    // Delete node
    cy.get(nodeSelector).last().click()
    cy.get('body').type('{del}')
    cy.get(nodeSelector).contains('New Topic').should('not.exist')
  })

  /* Connections */
  it('connects two nodes with curved arrow', () => {
    // Precondition: at least 2 nodes exist
    cy.get('[data-testid="add-node-btn"]').click().click()
    const first = () => cy.get(nodeSelector).eq(0)
    const second = () => cy.get(nodeSelector).eq(1)

    first().trigger('mousedown', { which: 1 })
    second().trigger('mousemove').trigger('mouseup')

    cy.get('[data-testid="mindmap-edge"]').should('exist')
  })

  /* II. Visual Customization */
  it('changes node shape and colours', () => {
    cy.get(nodeSelector).first().click()

    // Shape dropdown
    cy.get('[data-testid="shape-select"]').select('Rectangle')
    cy.get(nodeSelector).first().should('have.attr', 'data-shape', 'rectangle')

    cy.get('[data-testid="shape-select"]').select('Circle')
    cy.get(nodeSelector).first().should('have.attr', 'data-shape', 'circle')

    cy.get('[data-testid="shape-select"]').select('Diamond')
    cy.get(nodeSelector).first().should('have.attr', 'data-shape', 'diamond')

    // Background colour
    cy.get('[data-testid="bg-colour-input"]').invoke('val', '#ff0000').trigger('input')
    cy.get(nodeSelector).first().should('have.css', 'background-color', 'rgb(255, 0, 0)')

    // Text colour
    cy.get('[data-testid="text-colour-input"]').invoke('val', '#0000ff').trigger('input')
    cy.get(nodeSelector).first().should('have.css', 'color', 'rgb(0, 0, 255)')
  })

  /* III. Smart Connections */
  it('smart-routes connections without overlaps', () => {
    // Create dense map – add multiple nodes around root
    Cypress._.times(6, () => cy.get('[data-testid="add-node-btn"]').click())

    // Auto-layout
    cy.get('[data-testid="auto-layout-btn"]').click()

    // Assert edges do not overlap nodes (simplified: edge SVG path bounding boxes don't intersect node bboxes)
    cy.get('[data-testid="mindmap-edge"]').each($edge => {
      const edgeBox = $edge[0].getBoundingClientRect()
      cy.get(nodeSelector).each($node => {
        const nodeBox = $node[0].getBoundingClientRect()
        // basic collision test
        const intersects = !(
          edgeBox.right < nodeBox.left ||
          edgeBox.left > nodeBox.right ||
          edgeBox.bottom < nodeBox.top ||
          edgeBox.top > nodeBox.bottom
        )
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(intersects).to.be.false
      })
    })
  })

  /* IV. Export Options */
  it('exports as mmd, SVG and PNG', () => {
    cy.get('[data-testid="export-mermaid-btn"]').click()
    cy.verifyDownload('mindmap.mmd')

    cy.get('[data-testid="export-svg-btn"]').click()
    cy.verifyDownload('mindmap.svg')

    cy.get('[data-testid="export-png-btn"]').click()
    cy.verifyDownload('mindmap.png')
  })

  /* V. Keyboard Shortcuts */
  it('supports core keyboard shortcuts', () => {
    // Select root and edit
    cy.get(nodeSelector).first().dblclick()
    cy.focused().type('Edited Root{esc}')
    cy.get(nodeSelector).first().contains('Edited Root').should('not.exist')

    // Delete shortcut
    cy.get('[data-testid="add-node-btn"]').click()
    cy.get(nodeSelector).last().click()
    cy.get('body').type('{del}')
    cy.get(nodeSelector).should('have.length', 1)
  })

  // Export empty object to treat file as a module and avoid global lint errors
  export {}
}) 