import {
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical';

export const blockLexicalEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    UnorderedListFeature(),
    OrderedListFeature(),
    LinkFeature(),
    FixedToolbarFeature(),
  ],
});
