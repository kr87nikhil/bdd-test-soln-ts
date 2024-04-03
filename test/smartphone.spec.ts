import axios from 'axios'
import type { AxiosResponse, CreateAxiosDefaults } from 'axios'
import { config } from 'dotenv'
import { expect, should } from 'chai'
import { Colour } from '../src/smartDevice.js'
import type { ProductType } from '../src/product.js'

should()
config({ path: `./config/.env.${process.env.NODE_ENV || 'integ'}` })
import sampleProducts from '../src/fixtures/products.json' with { type: 'json' }


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

describe('Smart devices - Smartphone, Watch, etc.', function () {
    let deviceId: number | string
    const axiosConfig: CreateAxiosDefaults = {
        baseURL: process.env.BASE_URL,
        validateStatus: status => {
            return status >= 200 && status < 300 || status > 400 && status < 500
        }
    }
    const axiosInstance = axios.create(axiosConfig)

    axiosInstance.interceptors.request.use(function (config) {
        if (config.method == 'post') {
            console.log(`Post request: ${JSON.stringify(config.data)}`)
        }
        return config
    }, function (error) {
        return Promise.reject(error)
    })
    axiosInstance.interceptors.response.use(function (response) {
        if (response.request.method == 'delete') {
            console.log(`Delete response: ${JSON.stringify(response.data)}`)
        }
        return response
    }, function (error) {
        return Promise.reject(error)
    })

    before(async () => {
        const deviceToPublish = sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
        await axiosInstance.post('/objects', deviceToPublish).then((response) => {
            response.status.should.equal(200)
            deviceId = response.data.id
            response.headers['content-type']?.should.equal('application/json')
            response.data.data.should.deep.equal(deviceToPublish.data)
            response.data.createdAt.split('T')[0].should.equal(new Date().toISOString().split('T')[0])
        }).catch((error) => {
            console.error(`Test data setup failed - Publish device: ${error}`)
            throw error
        })
    })

    it('Update name of existing Device', async () => {
        const deviceName = 'Motorola Razor+, 128 GB, RAM 6 GB'
        await axiosInstance.patch('/objects/' + deviceId, {
            name: deviceName,
            data: { colour: Colour.Red }
        }).then((response) => {
            response.status.should.equal(200)
            response.data.name.should.equal(deviceName)
            response.data.data.colour.should.equal(Colour.Red)
        }).catch((error) => {
            console.error(`API Error - Patch device: ${error}`)
            throw error
        })
    })

    it('Validate device details for non-published records', async () => {
        const invalidId = 16
        await axiosInstance.get('/objects/' + invalidId).then(response => {
            response.status.should.equal(404)
            response.data.should.have.property('error')
            response.data.error.should.equal(`Oject with id=${invalidId} was not found.`)
        }).catch(error => {
            console.error(`API Error - Invalid device id: ${error}`)
            throw error
        })
    })

    it('Delete existing device, validate it not available', async () => {
        await axiosInstance.delete('/objects/' + deviceId).then((response) => {
            response.status.should.equal(200)
            response.data.should.have.property('message')
            response.data.message.should.equal(`Object with id = ${deviceId} has been deleted.`)
        }).catch(error => {
            console.error(`API Error - Delete device: ${error}`)
            throw error
        })
    })
})
