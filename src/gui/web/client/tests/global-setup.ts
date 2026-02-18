import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'

let serverProcess: ChildProcess | null = null

export async function setup() {
  console.log('Starting backend server for integration tests...')

  const serverPath = join(process.cwd(), '../server')

  // Start the server in test mode
  serverProcess = spawn('npm', ['run', 'test:server'], {
    cwd: serverPath,
    stdio: 'inherit',
    env: { ...process.env, TEST_MODE: 'true', PORT: '5002' }
  })

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log('Backend server started on port 5002')
}

export async function teardown() {
  if (serverProcess) {
    console.log('Stopping backend server...')
    serverProcess.kill()
    serverProcess = null
    // Wait for cleanup
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Backend server stopped')
  }
}
