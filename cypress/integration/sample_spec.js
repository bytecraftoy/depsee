describe('Passing Dummy Test', () => {
    it('Does not do much', () => {
        expect(true).to.equal(true)
    })
})

describe('Test A', () => {
    it('Visit page', () => {
        cy.visit('')
    })
})

describe('Has nodetext', () => {
    it('Has an input to enter node name', () => {
        cy.get('input#nodetext')
    })
})

describe('nodetext has add button', () => {
    it('Has button to add node', () => {
        cy.get('input#nodetext').parent().contains('Add')
    })
})

describe('test add node', () => {
    let node_name_1 = '__test__1'
    let node_name_2 = '__test__2'
    it('Can add nodes', () => {
        // remove pre-existing nodes with the test name
        cy.get('body').then(($body) => {
            $body.find(`.react-flow__node-default:contains(${node_name_1})`).each((index, $div, $list) => {
                cy.wrap($div).click('topLeft', {
                    force: true
                })
                cy.wrap($div).should('have.class', 'selected')
                cy.get('body')
                    .trigger('keydown', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
                    .trigger('keyup', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
            })
            $body.find(`.react-flow__node-default:contains(${node_name_2})`).each((index, $div, $list) => {
                cy.wrap($div).click('topLeft', {
                    force: true
                })
                cy.wrap($div).should('have.class', 'selected')
                cy.get('body')
                    .trigger('keydown', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
                    .trigger('keyup', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
            })
        })

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).should('not.exist')
        cy.get(`.react-flow__node-default:contains(${node_name_2})`).should('not.exist')

        cy.get('input#nodetext').type(node_name_1)
        cy.get('input#nodetext').parent().contains('Add').click()

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).should('exist')

        for (let i = 0; i < 3; i++) {
            cy.get('input#nodetext').type(node_name_1)
            cy.get('input#nodetext').parent().contains('Add').click()
        }

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).should('exist')
        cy.get(`.react-flow__node-default:contains(${node_name_2})`).should('not.exist')

        cy.get('input#nodetext').type(node_name_2)
        cy.get('input#nodetext').parent().contains('Add').click()

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).should('exist')
        cy.get(`.react-flow__node-default:contains(${node_name_2})`).should('exist')

        // remove pre-existing nodes with the test name
        cy.get("body").then(($body) => {
            $body.find(`.react-flow__node-default:contains(${node_name_1})`).each((index, $div, $list) => {
                cy.wrap($div).click('topLeft', {
                    force: true
                })
                cy.wrap($div).should('have.class', 'selected')
                cy.get('body')
                    .trigger('keydown', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
                    .trigger('keyup', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
            })
            $body.find(`.react-flow__node-default:contains(${node_name_2})`).each((index, $div, $list) => {
                cy.wrap($div).click('topLeft', {
                    force: true
                })
                cy.wrap($div).should('have.class', 'selected')
                cy.get('body')
                    .trigger('keydown', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
                    .trigger('keyup', {
                        key: 'Backspace',
                        charCode: 0,
                        keyCode: 8
                    })
            })
        })

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).should('not.exist')
        cy.get(`.react-flow__node-default:contains(${node_name_2})`).should('not.exist')

    })

    
    it('Can can rename nodes with double click', () => {
        const new_node_name = 'NEW NODE'
        cy.get('input#nodetext').type(node_name_1)
        cy.get('input#nodetext').parent().contains('Add').click()

        cy.get(`.react-flow__node-default:contains(${node_name_1})`).dblclick()
        cy.get('.react-flow__node input').type('{selectall}{backspace}' + new_node_name + '{enter}')

        cy.get(`.react-flow__node-default:contains(${new_node_name})`).should('exist')
        
        cy.get(`.react-flow__node-default:contains(${new_node_name})`)
            .trigger('keydown', {
                key: 'Backspace',
                charCode: 0,
                keyCode: 8
            })
        cy.get(`.react-flow__node-default:contains(${new_node_name})`).should('not.exist')
    })
})