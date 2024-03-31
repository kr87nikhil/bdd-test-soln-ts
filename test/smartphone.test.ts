import axios, { AxiosResponse } from 'axios'
import { expect, should } from 'chai'
import { ProductType } from '../src/product.js'

should()

// Each describe() block represent a test-suite
describe('Product details - Smartphone category', function () {
    let categoryResponse: AxiosResponse
    const basePath = 'https://dummyjson.com'
    const expectedProducts: ProductType[] = [
        { title: 'iPhone 9', price: 549 },
        { title: 'iPhone X', price: 899 },
        { title: 'Samsung Universe 9', price: 1249 }
    ]

    before('Get smartphone details', async function () {
        categoryResponse = await axios.get(basePath + '/products/category/smartphones', {
            params: {
                limit: 3,
                select: ['title', 'price', 'category']
            }
        })
    })

    // Each it() block represent a test-case
    it('Validate status code', () => {
        expect(categoryResponse.status).to.equal(200)
    })

    it('Validate number of records', () => {
        categoryResponse.data.should.have.property('products').with.lengthOf(3)
    })

    it('Validate category of returned product', () => {
        Array.prototype.every.call(categoryResponse.data.products, x => x.category === 'smartphones').should.be.true
    })

    it('Validate product details based on fields selected', () => {
        Array.prototype.forEach((product: ProductType) => {
            expect(expectedProducts).to.deep.include(product)
        }, categoryResponse.data.products)
    })
})
