import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/rec1',
        destination: '/certificates/9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44',
        permanent: true,
      },
      {
        source: '/rec2',
        destination: '/certificates/b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21',
        permanent: true,
      },
      {
        source: '/rec3',
        destination: '/certificates/17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
