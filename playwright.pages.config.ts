import {defineConfig} from '@playwright/test';

const site=process.env.PAGES_URL??'http://127.0.0.1:4360/theboard/';
export default defineConfig({
  testDir:'./tests-pages',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:0,
  outputDir:'test-results-pages',
  reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report-pages'}]],
  use:{baseURL:site,viewport:{width:1440,height:1000},trace:'retain-on-failure'},
  webServer:process.env.PAGES_URL?undefined:{
    command:'npm run preview -- --mode pages --port 4360 --strictPort',
    url:site,reuseExistingServer:false,
  },
});
