import { JSONSchema4 } from 'json-schema'

type ConnectionSchema = { fileMatch: string[]; schema: JSONSchema4; uri: string }

export const connectionSchema: ConnectionSchema = {
  fileMatch: ['a://b/foo.json'],
  schema: {
    properties: {
      bottomBoolean: {
        enum: ['false', 'true', 'none'],
        type: 'string',
      },
      connections: {
        items: {
          properties: {
            position: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
          },
          required: ['position', 'type'],
          type: 'object',
        },
        type: 'array',
      },
      enabled: {
        type: 'boolean',
      },
      leftBoolean: {
        enum: ['false', 'true', 'none'],
        type: 'string',
      },
      rightBoolean: {
        enum: ['false', 'true', 'none'],
        type: 'string',
      },
      text: {
        type: 'string',
      },
      textBottom: {
        type: 'string',
      },
      textLeft: {
        type: 'string',
      },
      textRight: {
        type: 'string',
      },
      textTop: {
        type: 'string',
      },
    },
    required: ['connections'],
    type: 'object',
  },
  uri: 'a://b/foo.json',
}
