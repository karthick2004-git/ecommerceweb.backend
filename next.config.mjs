/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs'],
  outputFileTracingIncludes: {
    '/*': ['./prisma/ca.pem'],
  },
};

export default nextConfig;
