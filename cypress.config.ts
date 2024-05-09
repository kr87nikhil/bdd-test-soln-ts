import { defineConfig } from "cypress"
import projectConfig from "./config.js"

export default defineConfig({
  e2e: {
    baseUrl: projectConfig.thirdPartyApplication.sauceDemoSwagLabs,
    env: {
      'username': 'standard_user'
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
