/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['my-contracts'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    config.externals.push('pino-pretty', 'encoding')

    // Permettre l'import de fichiers .ts depuis contracts/artifacts_backup
    config.resolve.extensions.push('.ts', '.tsx')

    return config
  }
}

module.exports = nextConfig
