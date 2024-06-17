import { NextRequest, NextResponse } from 'next/server';
import { payload } from '@/lib/payload';

export type VariantAttributes = {
  [key: string]: number | number[];
};

export type ApiPostVariantTitleRequest = {
  productTitle: string;
  availableAttributes: string[];
  variantAttributes: VariantAttributes;
  locale: string;
};

export async function POST(req: NextRequest, res: NextResponse) {
  const data: ApiPostVariantTitleRequest = await req.json();
  const { productTitle, availableAttributes, variantAttributes, locale } = data;
  const payloadClient = await payload();

  const resolvedAttrs = await Promise.all(
    availableAttributes.map(async (attribute) => {
      const id = variantAttributes[attribute];

      if (!id) {
        return { [attribute]: null };
      }

      let where: Record<string, any> = {
        id: {
          equals: id,
        },
      };

      if (Array.isArray(id)) {
        where = {
          or: id.map((id) => ({
            id: {
              equals: id,
            },
          })),
        };
      }

      return {
        [attribute]: (
          await payloadClient.find({
            collection: attribute as any,
            limit: 1,
            where,
          })
        ).docs[0],
      };
    }),
  );

  const resolvedAttrsObject = resolvedAttrs.reduce((acc, curr) => {
    return { ...acc, ...curr };
  });

  if (!resolvedAttrsObject) {
    console.log('No resolved attributes found');
    return NextResponse.json({ variantTitle: productTitle });
  }

  const attributeStrings = availableAttributes
    .map((attribute) => {
      let output = '';
      const labelKey = `label_${data.locale}`;

      if (!resolvedAttrsObject[attribute]) {
        console.error(`No resolved attribute found for ${attribute}`);
        return '';
      }

      if (resolvedAttrsObject[attribute] && !resolvedAttrsObject[attribute][labelKey]) {
        console.error(`No label found for attribute ${attribute} and locale ${data.locale}`);
        return '';
      }

      switch (attribute) {
        case 'color':
          output = resolvedAttrsObject[attribute][labelKey];
          if (variantAttributes.colorVendor) {
            output = `${data.variantAttributes.colorVendor} (${output})`;
          }
          break;
        case 'size':
          output = resolvedAttrsObject[attribute][labelKey];
          break;
        case 'packaging-type':
          output = resolvedAttrsObject[attribute][labelKey];
          break;
        default:
          output = '';
          break;
      }

      return output;
    })
    .join(' / ');

  const variantTitle = [productTitle, attributeStrings].filter(Boolean).join(' ').trim();
  return NextResponse.json({ variantTitle });
}
