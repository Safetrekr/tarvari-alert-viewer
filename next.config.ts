import type { NextConfig } from 'next'

const isStaticExport = process.env.STATIC_EXPORT === 'true'

// GitHub Pages serves from /<repo-name>/ subdirectory.
// Set GITHUB_PAGES=tarvari-alert-viewer to configure basePath.
const githubPagesRepo = process.env.GITHUB_PAGES || ''
const basePath = isStaticExport && githubPagesRepo ? `/${githubPagesRepo}` : ''

const nextConfig: NextConfig = {
  transpilePackages: ['@tarva/ui'],

  ...(isStaticExport && {
    output: 'export',
    basePath: basePath || undefined,
    assetPrefix: basePath || undefined,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
}

export default nextConfig
