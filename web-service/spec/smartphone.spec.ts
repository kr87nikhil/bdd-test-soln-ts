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
import projectConfig from '../../config.js'
import logger from '../../winston.logger.js'
import sampleProducts from '../fixtures/products.json' with { type: 'json' }


// Each describe() block represent a test-suite
describe('example smartphone product', function () {
    let categoryResponse: AxiosResponse
    const basePath = projectConfig.thirdPartyApplication.dummyJSON
    const expectedProducts: ProductType[] = [
        { title: 'iPhone 9', price: 549 },
        { title: 'iPhone X', price: 899 },
        { title: 'Samsung Universe 9', price: 1249 }
    ]

    before('can fetch all smartphone information', async function () {
        categoryResponse = await axios.get(basePath + '/products/category/smartphones', {
            params: {
                limit: 3,
                select: ['title', 'price', 'category']
            }
        })
    })

    // Each it() block represent a test-case
    it('provides success response', () => {
        expect(categoryResponse.status).to.equal(200)
    })

    it('displays three smartphone\'s by default', () => {
        categoryResponse.data.should.have.property('products').with.lengthOf(3)
    })

    it('can filter product by category', () => {
        Array.prototype.every.call(categoryResponse.data.products, x => x.category === 'smartphones').should.be.true
    })

    it('displays listed smartphone\'s information', () => {
        Array.prototype.forEach((product: ProductType) => {
            expect(expectedProducts).to.deep.include(product)
        }, categoryResponse.data.products)
    })
})

describe('example user profile', function () {
    let retryCounter = 1, userDetails: AxiosResponse<UserType>
    const axiosConfig: CreateAxiosDefaults = {
        baseURL: projectConfig.thirdPartyApplication.dummyJSON,
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
                logger.error(`Unable to refresh token: ${error}`)
            })
            return new Promise((resolve) => {
                resolve(axiosInstance(error.config))
            })
        }
        Promise.reject(error)
    })

    before('can create user session', async () => {
        const isLoginSucceed = await validate('./spec/fixtures/user.schema.json')
        userDetails = await axiosInstance.get('/users/1')
        await axiosInstance.post('/auth/login', {
            username: userDetails.data.username,
            password: userDetails.data.password,
            expiresInMins: 1
        }).then(async response => {
            isLoginSucceed(response.data).valid.should.equal(true)
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
        }).catch(error => {
            logger.error(`POST Error - Token retrieval: ${error}`)
            throw error
        })
    })

    it('can get current user information', async () => {
        await axiosInstance.get('/auth/me').then(response => {
            response.status.should.equal(200)
            response.data.id.should.equal(userDetails.data.id)
            response.data.age.should.equal(userDetails.data.age)
            response.data.firstName.should.equal(userDetails.data.firstName)
            response.data.lastName.should.equal(userDetails.data.lastName)
        }).catch(error => {
            logger.error(`GET Error - User profile: ${error}`)
            throw error
        })
    })
})

describe('example smart device', function () {
    let deviceId: number | string
    const axiosConfig: CreateAxiosDefaults = {
        baseURL: projectConfig.thirdPartyApplication.restfulAPI,
        validateStatus: status => {
            return status >= 200 && status < 300 || status > 400 && status < 500
        }
    }
    const axiosInstance = axios.create(axiosConfig)

    axiosInstance.interceptors.request.use(function (config) {
        if (config.method == 'post') {
            logger.info(`Post request: ${JSON.stringify(config.data)}`)
        }
        return config
    }, function (error) {
        return Promise.reject(error)
    })
    axiosInstance.interceptors.response.use(function (response) {
        if (response.config.method == 'delete') {
            logger.info(`Delete response: ${JSON.stringify(response.data)}`)
        }
        return response
    }, function (error) {
        return Promise.reject(error)
    })

    before('can publish device', async () => {
        const deviceToPublish = sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
        await axiosInstance.post('/objects', deviceToPublish).then((response) => {
            response.status.should.equal(200)
            deviceId = response.data.id
            response.headers['content-type']?.should.equal('application/json')
            response.data.data.should.deep.equal(deviceToPublish.data)
            response.data.createdAt.split('T')[0].should.equal(new Date().toISOString().split('T')[0])
        }).catch((error) => {
            logger.error(`Test data setup failed - Publish device: ${error}`)
            throw error
        })
    })

    it('can update name & colour of a device', async () => {
        const deviceName = 'Motorola Razor+, 128 GB, RAM 6 GB'
        await axiosInstance.patch('/objects/' + deviceId, {
            name: deviceName,
            data: { colour: Colour.Red }
        }).then((response) => {
            response.status.should.equal(200)
            response.data.name.should.equal(deviceName)
            response.data.data.colour.should.equal(Colour.Red)
        }).catch((error) => {
            logger.error(`PATCH Error - Update device: ${error}`)
            throw error
        })
    })

    it('return error if accessing non-published device', async () => {
        const invalidId = 16
        await axiosInstance.get('/objects/' + invalidId).then(response => {
            response.status.should.equal(404)
            response.data.should.have.property('error')
            response.data.error.should.equal(`Oject with id=${invalidId} was not found.`)
        }).catch(error => {
            logger.error(`GET Error - Invalid device id: ${error}`)
            throw error
        })
    })

    it('can delete device', async () => {
        await axiosInstance.delete('/objects/' + deviceId).then((response) => {
            response.status.should.equal(200)
            response.data.should.have.property('message')
            response.data.message.should.equal(`Object with id = ${deviceId} has been deleted.`)
        }).catch(error => {
            logger.error(`DELETE Error - Remove device: ${error}`)
            throw error
        })
    })
})
