/* tslint:disable */
/* eslint-disable */
/**
 * This file was automatically generated by Payload.
 * DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,
 * and re-run `payload generate:types` to regenerate this file.
 */

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "UserOrganisations".
 */
export type UserOrganisations =
  | {
      organisation: number | Organisation;
      roles: ('admin' | 'user')[];
      id?: string | null;
    }[]
  | null;

export interface Config {
  auth: {
    users: UserAuthOperations;
  };
  collections: {
    media: Media;
    organisations: Organisation;
    activities: Activity;
    documents: Document;
    'task-flows': TaskFlow;
    'task-lists': TaskList;
    users: User;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  db: {
    defaultIDType: number;
  };
  globals: {};
  locale: 'de';
  user: User & {
    collection: 'users';
  };
}
export interface UserAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media".
 */
export interface Media {
  id: number;
  name?: string | null;
  description?: string | null;
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: {
    thumbnail?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
    card?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
    tablet?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "organisations".
 */
export interface Organisation {
  id: number;
  name: string;
  description?: string | null;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users".
 */
export interface User {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  roles: ('admin' | 'user')[];
  organisations?: UserOrganisations;
  selectedOrganisation?: (number | null) | Organisation;
  updatedAt: string;
  createdAt: string;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "activities".
 */
export interface Activity {
  id: number;
  name: string;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  blocks?: (ActivityIOBlock | ActivityTaskBlock)[] | null;
  files?:
    | {
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  variant: 'standard' | 'supportActivity' | 'strategyActivity';
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  docOrder?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ActivityIOBlock".
 */
export interface ActivityIOBlock {
  graph?: {
    task?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
  };
  relations?: {
    flowRelation?: (number | TaskFlow)[] | null;
    listRelation?: (number | TaskList)[] | null;
  };
  io?: {
    input?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
    output?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  infos?: {
    norms?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
    support?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  id?: string | null;
  blockName?: string | null;
  blockType: 'activity-io';
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "task-flows".
 */
export interface TaskFlow {
  id: number;
  name: string;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  blocks?: (ProcessTaskIOBlock | ProcessTestOutputBlock | ProcessTaskParallelBlock)[] | null;
  files?:
    | {
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  docOrder?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTaskIOBlock".
 */
export interface ProcessTaskIOBlock {
  graph?: {
    io?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
    task?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
  };
  keypoints?: {
    keypoints?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  tools?: {
    tools?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  responsibility?: {
    responsibility?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  id?: string | null;
  blockName?: string | null;
  blockType: 'proc-task-io';
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTestOutputBlock".
 */
export interface ProcessTestOutputBlock {
  graph?: {
    output?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
    test?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
  };
  keypoints?: {
    keypoints?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  tools?: {
    tools?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  responsibility?: {
    responsibility?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  id?: string | null;
  blockName?: string | null;
  blockType: 'proc-test';
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTaskParallelBlock".
 */
export interface ProcessTaskParallelBlock {
  graph?: {
    task?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
  };
  keypoints?: {
    keypoints?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  tools?: {
    tools?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  responsibility?: {
    responsibility?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  id?: string | null;
  blockName?: string | null;
  blockType: 'proc-task-p';
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "documents".
 */
export interface Document {
  id: number;
  name?: string | null;
  description?: string | null;
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "task-lists".
 */
export interface TaskList {
  id: number;
  name: string;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  items?:
    | {
        topic?: {
          root: {
            type: string;
            children: {
              type: string;
              version: number;
              [k: string]: unknown;
            }[];
            direction: ('ltr' | 'rtl') | null;
            format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
            indent: number;
            version: number;
          };
          [k: string]: unknown;
        } | null;
        tools?: {
          root: {
            type: string;
            children: {
              type: string;
              version: number;
              [k: string]: unknown;
            }[];
            direction: ('ltr' | 'rtl') | null;
            format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
            indent: number;
            version: number;
          };
          [k: string]: unknown;
        } | null;
        responsibility?: {
          root: {
            type: string;
            children: {
              type: string;
              version: number;
              [k: string]: unknown;
            }[];
            direction: ('ltr' | 'rtl') | null;
            format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
            indent: number;
            version: number;
          };
          [k: string]: unknown;
        } | null;
        id?: string | null;
      }[]
    | null;
  files?:
    | {
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
  docOrder?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ActivityTaskBlock".
 */
export interface ActivityTaskBlock {
  graph?: {
    task?: {
      connections: {
        position: string;
        type: string;
        [k: string]: unknown;
      }[];
      text?: string;
      textBottom?: string;
      textTop?: string;
      textLeft?: string;
      textRight?: string;
      enabled?: boolean;
      rightBoolean?: 'false' | 'true' | 'none';
      leftBoolean?: 'false' | 'true' | 'none';
      bottomBoolean?: 'false' | 'true' | 'none';
      [k: string]: unknown;
    };
  };
  relations?: {
    flowRelation?: (number | TaskFlow)[] | null;
    listRelation?: (number | TaskList)[] | null;
  };
  io?: {
    input?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
    output?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  infos?: {
    norms?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
    support?: {
      root: {
        type: string;
        children: {
          type: string;
          version: number;
          [k: string]: unknown;
        }[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
      };
      [k: string]: unknown;
    } | null;
  };
  id?: string | null;
  blockName?: string | null;
  blockType: 'activity-task';
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences".
 */
export interface PayloadPreference {
  id: number;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  key?: string | null;
  value?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations".
 */
export interface PayloadMigration {
  id: number;
  name?: string | null;
  batch?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "auth".
 */
export interface Auth {
  [k: string]: unknown;
}


declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}