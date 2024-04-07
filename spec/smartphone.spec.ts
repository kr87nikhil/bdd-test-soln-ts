import axios from 'axios'
import type { AxiosResponse, CreateAxiosDefaults } from 'axios'
// import { config } from 'dotenv'
import { expect, should } from 'chai'
import { validate } from '@hyperjump/json-schema/draft-2020-12'
import { UserType } from '../src/user.js'
import { Colour } from '../src/smartDevice.js'
import type { ProductType } from '../src/product.js'

should()
// config({ path: `./config/.env.${process.env.NODE_ENV || 'integ'}` })
import config from '../config.js'
import sampleProducts from '../src/fixtures/products.json' with { type: 'json' }


// Each describe() block represent a test-suite
describe('Product details - Smartphone category', function () {
    let categoryResponse: AxiosResponse
    const basePath = config.thirdPartyApplication.dummyJSON
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

describe('User details - Profile check via Token', function () {
    let retryCounter = 1, userDetails: AxiosResponse<UserType>
    const axiosConfig: CreateAxiosDefaults = {
        baseURL: config.thirdPartyApplication.dummyJSON,
        validateStatus: function (status) {
            // Bypass validation status for expired Bearer token
            return status >= 200 && status < 300 || status == 401
        }
    }
    const axiosInstance = axios.create(axiosConfig)

    // Refresh Bearer token once expired
    axiosInstance.interceptors.response.use(null, async function (error) {
        if (retryCounter < 3 && error.response.status === 401) {
            retryCounter++
            await axiosInstance.post('/auth/refresh', {
                expiresInMins: 1
            }).then(response => {
                if (response.status == 401) {
                    // Open Bug: Unable refresh token with provided expired token: https://dummyjson.com/docs/auth
                    throw new Error('Token refresh failed with 401 status')
                }
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
            }).catch(error => {
                console.error(`Unable to refresh token: ${error}`)
            })
            return new Promise((resolve) => {
                resolve(axiosInstance(error.config))
            })
        }
        Promise.reject(error)
    })

    before(async () => {
        let isLoginSucceed = await validate('./src/fixtures/user.schema.json')
        userDetails = await axiosInstance.get('/users/1')
        await axiosInstance.post('/auth/login', {
            username: userDetails.data.username,
            password: userDetails.data.password,
            expiresInMins: 1
        }).then(async response => {
            isLoginSucceed(response.data).valid.should.equal(true)
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
        }).catch(error => {
            console.error(`POST Error - Token retrieval: ${error}`)
            throw error
        })
    })

    it('Validate details received map with received token', async () => {
        await axiosInstance.get('/auth/me').then(response => {
            response.status.should.equal(200)
            response.data.id.should.equal(userDetails.data.id)
            response.data.age.should.equal(userDetails.data.age)
            response.data.firstName.should.equal(userDetails.data.firstName)
            response.data.lastName.should.equal(userDetails.data.lastName)
        }).catch(error => {
            console.error(`GET Error - User profile: ${error}`)
            throw error
        })
    })
})

describe('Smart devices - Smartphone, Watch, etc.', function () {
    let deviceId: number | string
    const axiosConfig: CreateAxiosDefaults = {
        baseURL: config.thirdPartyApplication.RestfulAPI,
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
            console.error(`PATCH Error - Update device: ${error}`)
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
            console.error(`GET Error - Invalid device id: ${error}`)
            throw error
        })
    })

    it('Delete existing device, validate it not available', async () => {
        await axiosInstance.delete('/objects/' + deviceId).then((response) => {
            response.status.should.equal(200)
            response.data.should.have.property('message')
            response.data.message.should.equal(`Object with id = ${deviceId} has been deleted.`)
        }).catch(error => {
            console.error(`DELETE Error - Remove device: ${error}`)
            throw error
        })
    })
})
