/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: 'https://app.safe.global' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          ],
        },
      ];
    },
  }
  
  // Change this line from module.exports to export default
  export default nextConfig;