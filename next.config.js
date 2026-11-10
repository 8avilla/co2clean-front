/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    // Legacy "V2" routes kept as permanent redirects for saved links
    return [
      {
        source: '/huella-carbono/analisis-v2',
        destination: '/huella-carbono/analisis',
        permanent: true,
      },
      {
        source: '/huella-carbono/analisis-v2/:id',
        destination: '/huella-carbono/analisis/:id',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
