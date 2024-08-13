import {
  BoldFeature,
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical';
import { CollectionSlug } from 'payload';

const enabledCollections: CollectionSlug[] = [
  'documents',
  'documentsPublic',
  'task-flows',
  'task-lists',
];

export const lexicalEditorReducedFeatures = lexicalEditor({
  features: ({ defaultFeatures }) => [
    UnorderedListFeature(),
    OrderedListFeature(),
    LinkFeature({
      enabledCollections,
    }),
    BoldFeature(),
    FixedToolbarFeature(),
  ],
});
