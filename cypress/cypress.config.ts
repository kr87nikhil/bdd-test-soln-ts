import { defineConfig } from "cypress"
import projectConfig from "../config.js"

export default defineConfig({
  e2e: {
    baseUrl: projectConfig.thirdPartyApplication.demoQa,
    env: {
      'swagLabsRegularUser': 'standard_user',
      'swagLabsWebUrl': projectConfig.thirdPartyApplication.sauceDemoSwagLabs
    },
    projectId: '11ex7v',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'cypress/cypress.reporter.config.json',
    },
    screenshotsFolder: 'cypress/results/screenshots',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    videosFolder: 'cypress/results/videos',
    viewportWidth: 1280,
    viewportHeight: 720
  }
})
