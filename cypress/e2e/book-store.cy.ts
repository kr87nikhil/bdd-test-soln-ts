/// <reference types="cypress" />
import { BookType } from "./types/book.js"
// Getting started guide: https://on.cypress.io/introduction-to-cypress

describe('demo tools QA', () => {
    it('can get all available books', () => {
        cy.request('/BookStore/v1/Books').then(response => {
            expect(response.status).to.eq(200)
            expect(response.body.books).to.have.length(8)
        })      
    })

    it('display book from harry potter series', () => {
        cy.intercept('/BookStore/v1/Books', { fixture: 'harryPotterBooks' }).as('getAvailableBooks')
        cy.visit('/books')
        cy.wait('@getAvailableBooks').its('response.body.books').should('have.length', 7)

        cy.on('uncaught:exception', (err, runnable) => {
            // returning false here prevents Cypress from failing the test
            return false
        })
        cy.fixture('harryPotterBooks').then($booksWrapper => {
            cy.get('div.rt-table > div.rt-tbody div.rt-tr-group').each($bookElement => {
                if ($bookElement.find('a').length < 1) {
                    return
                }
                const parsedBook: BookType = $booksWrapper.books.find((x: BookType) => 
                    x.title == $bookElement.find('a').text())
                expect($bookElement.find('div.rt-td:nth-child(3)').text()).to.be.eq(parsedBook.author)
                expect($bookElement.find('div.rt-td:nth-child(4)').text()).to.be.eq(parsedBook.publisher)
            })
        })
    })
})
