import { Block } from 'payload/types';
import { GraphInputField } from '@/components/graph/Input/graph-input-field';
import { GraphTaskField } from '@/components/graph/Input/graph-task-field';
import { translations } from '@/lib/translations';
import './block.scss';
import { blockLexicalEditor } from '@/payload/collections/process-blocks/block-lexical-editor';

export const StartBlock: Block = {
  slug: 'block-start',
  imageURL: '/process-block-shapes/block-start.svg',
  imageAltText: 'Start of a process',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'process-block-row',
      },
      fields: [
        {
          type: 'group',
          name: 'graph',
          label: false,
          admin: {
            className: 'graph-fields-group',
          },
          fields: [
            {
              type: 'row',
              admin: {
                className: 'graph-fields-row',
              },
              fields: [
                {
                  name: 'first',
                  type: 'textarea',
                  admin: {
                    components: {
                      Field: GraphInputField,
                    },
                  },
                },
                {
                  name: 'second',
                  type: 'textarea',
                  admin: {
                    components: {
                      Field: GraphTaskField,
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'keypoints-tab',
              label: translations.fieldLabel.keypoints,
              fields: [
                {
                  name: 'keypoints',
                  label: false,
                  type: 'richText',
                  editor: blockLexicalEditor,
                },
              ],
            },
            {
              name: 'tools-tab',
              label: translations.fieldLabel.tools,
              fields: [
                {
                  name: 'tools',
                  label: false,
                  type: 'richText',
                  editor: blockLexicalEditor,
                },
              ],
            },
            {
              name: 'responsibility-tab',
              label: translations.fieldLabel.responsibility,
              fields: [
                {
                  name: 'responsibility',
                  label: false,
                  type: 'richText',
                  editor: blockLexicalEditor,
                },
              ],
            },
            {
              name: 'attachments-tab',
              label: translations.fieldLabel.attachments,
              fields: [
                {
                  name: 'attachment',
                  type: 'array',
                  label: false,
                  fields: [
                    {
                      name: 'document',
                      type: 'relationship',
                      label: translations.fieldLabel.attachment,
                      relationTo: 'documents',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
