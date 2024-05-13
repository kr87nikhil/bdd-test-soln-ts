/// <reference types="cypress" />
// Getting started guide: https://on.cypress.io/introduction-to-cypress

describe('demo swag labs', { testIsolation: false }, () => {
    before('can login as regular user', () => {
        const user = Cypress.env('swagLabsRegularUser')
        expect(user).to.be.a('string').and.not.be.empty
        cy.swagLabsLoginViaUi(user)
    })

    beforeEach('can redirect to inventory page', () => {
        cy.url().should('contain', '/inventory.html')
    })

    it('display page title', () => {
        cy.get('div[data-test=primary-header] .app_logo').should('have.text', 'Swag Labs')
    })

    it('displays missing user info error after checkout', () => {
        cy.get('select[data-test=product-sort-container]').select('Price (high to low)')
        cy.get('div[data-test=inventory-container] div[data-test=inventory-item]:first-child').as('mostExpensiveProduct')
            .contains('Add to cart').click()
        cy.get('@mostExpensiveProduct').then($itemSection => {
            const itemName = $itemSection.find('div[data-test=inventory-item-name]').text()
            expect($itemSection.find('div[data-test=inventory-item-description] button')).to.have.text('Remove')
            
            cy.get('a[data-test=shopping-cart-link]').click()
            cy.get('div[data-test=cart-contents-container] div[data-test=cart-list] div[data-test=inventory-item]')
                .first().find('div[data-test=inventory-item-name]').should('have.text', itemName)
        })
        cy.contains('Checkout').click()
        cy.get('input[data-test=continue]').click()
        cy.get('div.error-message-container').should('contain', 'Error')
    })

    it('can place single item order', () => {
        cy.get('div[data-test=inventory-container] div[data-test=inventory-item]').each($inventoryItem => {
            cy.fixture('inventoryItem').then(redShirt => {
                if (redShirt.name == $inventoryItem.find('div[data-test=inventory-item-name]').text()) {
                    cy.wrap($inventoryItem).contains('Add to cart').click()
                }
            })
        })
        cy.get('a[data-test=shopping-cart-link]').click()
        cy.fixture('inventoryItem').then(item => {
            cy.get('div[data-test=cart-list] div[data-test=inventory-item]').first().as('backpackItem')
                .find('div[data-test=inventory-item-price]').should('have.text', item.price)
            cy.get('@backpackItem').find('div[data-test=inventory-item-name]').should('have.text', item.name).click()
        })
        cy.get('a[data-test=shopping-cart-link]').click()
        cy.swagLabsPerformCheckout()
    })

    it('can place order with 3 items', () => {
        const threeUniqueIndex = new Set()
        cy.get('div[data-test=inventory-container] div[data-test=inventory-list]').then($inventoryList => {
            const numberOfItems = $inventoryList.find('div[data-test=inventory-item]').length
            while (threeUniqueIndex.size < 3) {
                threeUniqueIndex.add(Math.floor(Math.random() * numberOfItems) + 1)
            }
            threeUniqueIndex.forEach(randomIndex => {
                $inventoryList.find(`div[data-test=inventory-item]:nth-child(${randomIndex})`)
                    .find('button:contains("Add to cart")').trigger('click')
            })
        })
        cy.get('a[data-test=shopping-cart-link]').click()
        cy.swagLabsPerformCheckout()
        cy.contains('Finish').click()
    })

    afterEach('can navigate back to inventory page', () => {
        cy.contains('Open Menu').click()
        cy.get('a[data-test=reset-sidebar-link]').click()
        cy.get('a[data-test=inventory-sidebar-link]').click()
    })

    after('can perform logout', () => {
        cy.contains('Open Menu').click()
        cy.get('a[data-test=logout-sidebar-link]').click()
    })
})