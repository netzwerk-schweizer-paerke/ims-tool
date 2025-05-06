export async function register() {
  setTimeout(async () => {
    console.log('Fetching /admin to warm up the server')
    const response = await fetch(`http://localhost:3000/admin`)

    if (!response.ok) {
      throw new Error(`Failed to warm up the server: ${response.status}`)
    }

    console.log('Server warmed up successfully')
  }, 2000)
}
