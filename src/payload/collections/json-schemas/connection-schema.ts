import { JSONSchema4 } from 'json-schema';

type ConnectionSchema = { fileMatch: string[]; schema: JSONSchema4; uri: string };

export const connectionSchema: ConnectionSchema = {
  uri: 'a://b/foo.json',
  fileMatch: ['a://b/foo.json'],
  schema: {
    type: 'object',
    required: ['connections'],
    properties: {
      connections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['position', 'type'],
          properties: {
            position: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
          },
        },
      },
      text: {
        type: 'string',
      },
      textBottom: {
        type: 'string',
      },
      textTop: {
        type: 'string',
      },
      textLeft: {
        type: 'string',
      },
      textRight: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      rightBoolean: {
        type: 'string',
        enum: ['false', 'true', 'none'],
      },
      leftBoolean: {
        type: 'string',
        enum: ['false', 'true', 'none'],
      },
      bottomBoolean: {
        type: 'string',
        enum: ['false', 'true', 'none'],
      },
    },
  },
};
