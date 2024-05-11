import { defineConfig } from "cypress"
import projectConfig from "./config.js"

export default defineConfig({
  e2e: {
    baseUrl: projectConfig.thirdPartyApplication.demoQa,
    env: {
      'swagLabsRegularUser': 'standard_user',
      'swagLabsWebUrl': projectConfig.thirdPartyApplication.sauceDemoSwagLabs
    },
    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/results/test-results-[suiteFilename]-[hash].xml',
      toConsole: true,
      rootSuiteTitle: 'Demo-Cypress',
      useFullSuiteTitle: true
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  }
})
