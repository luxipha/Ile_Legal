#!/usr/bin/env node

/**
 * Test Runner for Admin APIs
 * 
 * This script can be run from the command line to test all admin APIs
 * Usage: node scripts/test-admin-apis.js
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testFile = path.join(this.projectRoot, 'src/tests/adminApiTest.ts');
  }

  async run() {
    console.log('🚀 Admin API Test Runner');
    console.log('=' .repeat(50));
    
    try {
      // Check if test file exists
      if (!fs.existsSync(this.testFile)) {
        throw new Error(`Test file not found: ${this.testFile}`);
      }

      console.log('📋 Pre-flight checks...');
      await this.checkPrerequisites();
      
      console.log('\n🔧 Compiling TypeScript...');
      await this.compileTypeScript();
      
      console.log('\n🧪 Running API tests...');
      await this.runTests();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 16;
        },
        message: 'Node.js 16+ required'
      },
      {
        name: 'package.json exists',
        check: () => fs.existsSync(path.join(this.projectRoot, 'package.json')),
        message: 'package.json not found'
      },
      {
        name: 'node_modules exists',
        check: () => fs.existsSync(path.join(this.projectRoot, 'node_modules')),
        message: 'Dependencies not installed. Run: npm install'
      },
      {
        name: '.env file exists',
        check: () => fs.existsSync(path.join(this.projectRoot, '.env')) || fs.existsSync(path.join(this.projectRoot, '.env.local')),
        message: 'Environment file not found. Create .env with Supabase credentials'
      }
    ];

    for (const check of checks) {
      if (check.check()) {
        console.log(`✅ ${check.name}`);
      } else {
        throw new Error(`❌ ${check.name}: ${check.message}`);
      }
    }
  }

  async compileTypeScript() {
    console.log('📦 Compiling TypeScript...');
    
    try {
      // Compile TypeScript to ES modules for Node.js execution
      execSync('npx tsc --project ./tsconfig.test.json', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ TypeScript compilation successful');
      return true;
    } catch (error) {
      console.error('❌ TypeScript compilation failed:', error.message);
      throw error;
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    
    const testFilePath = path.join(this.projectRoot, 'dist/tests/adminApiTest.js');
    
    // Check if compiled test file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Compiled test file not found: ${testFilePath}`);
    }
    
    try {
      // Run the compiled JavaScript test file
      execSync(`node ${testFilePath}`, {
        stdio: 'inherit',
        cwd: this.projectRoot
      });
      
      console.log('✅ Tests completed successfully');
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      throw error;
    }
  }
}

// Alternative simple test runner for browser environment
function createBrowserTestRunner() {
  const browserTest = `
<!DOCTYPE html>
<html>
<head>
    <title>Admin API Tests</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        button { padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #005a9e; }
        #output { background: #2d2d2d; padding: 15px; border-radius: 4px; margin-top: 20px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Admin API Test Runner</h1>
        <p>Click the button below to run all admin API tests in the browser.</p>
        <button onclick="runTests()">Run Tests</button>
        <div id="output"></div>
    </div>

    <script type="module">
        import { AdminApiTester } from '../src/tests/adminApiTest.ts';
        
        window.runTests = async function() {
            const output = document.getElementById('output');
            output.innerHTML = 'Running tests...\n';
            
            // Capture console output
            const originalLog = console.log;
            const originalError = console.error;
            
            console.log = (...args) => {
                output.innerHTML += args.join(' ') + '\n';
                originalLog(...args);
            };
            
            console.error = (...args) => {
                output.innerHTML += 'ERROR: ' + args.join(' ') + '\n';
                originalError(...args);
            };
            
            try {
                const tester = new AdminApiTester();
                await tester.runAllTests();
            } catch (error) {
                console.error('Test suite failed:', error);
            } finally {
                // Restore console
                console.log = originalLog;
                console.error = originalError;
            }
        };
    </script>
</body>
</html>
  `;
  
  const browserTestPath = path.join(__dirname, '..', 'test-admin-apis.html');
  fs.writeFileSync(browserTestPath, browserTest.trim());
  console.log(`\n🌐 Browser test runner created: ${browserTestPath}`);
  console.log('Open this file in your browser to run tests in the browser environment.');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--browser')) {
    createBrowserTestRunner();
  } else {
    const runner = new TestRunner();
    runner.run();
  }
}

module.exports = { TestRunner };