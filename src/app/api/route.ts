import { getPayload } from 'payload';
import configPromise from '@payload-config';

export const GET = async () => {
  const payload = await getPayload({
    config: configPromise,
  });

  const colors = await payload.find({
    collection: 'color',
  });

  return Response.json(colors);
};
