export const runtime = 'edge';

export function GET() {
  return Response.json(
    {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
