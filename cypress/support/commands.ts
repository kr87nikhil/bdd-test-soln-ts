/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
Cypress.Commands.add('swagLabsLoginViaUi', (username: string) => {
    // cy.session(username, () => {
        cy.visit('/')
        cy.get('input[data-test=username]').type(username)
        cy.get('div[data-test=login-password]').invoke('text').then(passwordDivText => {
            cy.get('input[data-test=password]').type(passwordDivText.split(':')[1], { log: false })
        })
        cy.get('input[data-test=login-button]').click()
    // }, {
    //     validate: () => {
    //         cy.getCookie('session-username').should('exist')
    //         cy.url().should('contain', '/inventory.html')
    //     }
    // })
})

Cypress.Commands.add('swagLabsPerformCheckout', () => {
    cy.contains('Checkout').click()
    cy.swagLabsFillCheckoutInfo('John', 'Doe', '12345-1234')
    cy.get('input[data-test=continue]').click()
})

Cypress.Commands.add('swagLabsFillCheckoutInfo', (firstName: string, lastName: string, zipCode: string) => {
    cy.get('input[data-test=firstName]').type(firstName)
    cy.get('input[data-test=lastName]').type(lastName)
    cy.get('input[data-test=postalCode]').type(zipCode)
})
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// Cypress.Commands.overwrite('type', (originalFn, text, options) => {
//     if (options && options.clear) {
//     }
//     return originalFn(text, options)
// })
//
declare global {
  module Cypress {
    interface Chainable {
        swagLabsLoginViaUi(username: string): Chainable<void>
        swagLabsPerformCheckout(): Chainable<void>
        swagLabsFillCheckoutInfo(firstName: string, lastName: string, zipCode: string): Chainable<void>
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}