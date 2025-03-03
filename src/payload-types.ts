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
/**
 * Supported timezones in IANA format.
 *
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "supportedTimezones".
 */
export type SupportedTimezones =
  | 'Pacific/Midway'
  | 'Pacific/Niue'
  | 'Pacific/Honolulu'
  | 'Pacific/Rarotonga'
  | 'America/Anchorage'
  | 'Pacific/Gambier'
  | 'America/Los_Angeles'
  | 'America/Tijuana'
  | 'America/Denver'
  | 'America/Phoenix'
  | 'America/Chicago'
  | 'America/Guatemala'
  | 'America/New_York'
  | 'America/Bogota'
  | 'America/Caracas'
  | 'America/Santiago'
  | 'America/Buenos_Aires'
  | 'America/Sao_Paulo'
  | 'Atlantic/South_Georgia'
  | 'Atlantic/Azores'
  | 'Atlantic/Cape_Verde'
  | 'Europe/London'
  | 'Europe/Berlin'
  | 'Africa/Lagos'
  | 'Europe/Athens'
  | 'Africa/Cairo'
  | 'Europe/Moscow'
  | 'Asia/Riyadh'
  | 'Asia/Dubai'
  | 'Asia/Baku'
  | 'Asia/Karachi'
  | 'Asia/Tashkent'
  | 'Asia/Calcutta'
  | 'Asia/Dhaka'
  | 'Asia/Almaty'
  | 'Asia/Jakarta'
  | 'Asia/Bangkok'
  | 'Asia/Shanghai'
  | 'Asia/Singapore'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Australia/Sydney'
  | 'Pacific/Guam'
  | 'Pacific/Noumea'
  | 'Pacific/Auckland'
  | 'Pacific/Fiji';

export interface Config {
  auth: {
    users: UserAuthOperations;
  };
  blocks: {};
  collections: {
    media: Media;
    organisations: Organisation;
    activities: Activity;
    documents: Document;
    'documents-public': DocumentsPublic;
    'task-flows': TaskFlow;
    'task-lists': TaskList;
    users: User;
    'payload-locked-documents': PayloadLockedDocument;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  collectionsJoins: {
    organisations: {
      orgActivities: 'activities';
    };
  };
  collectionsSelect: {
    media: MediaSelect<false> | MediaSelect<true>;
    organisations: OrganisationsSelect<false> | OrganisationsSelect<true>;
    activities: ActivitiesSelect<false> | ActivitiesSelect<true>;
    documents: DocumentsSelect<false> | DocumentsSelect<true>;
    'documents-public': DocumentsPublicSelect<false> | DocumentsPublicSelect<true>;
    'task-flows': TaskFlowsSelect<false> | TaskFlowsSelect<true>;
    'task-lists': TaskListsSelect<false> | TaskListsSelect<true>;
    users: UsersSelect<false> | UsersSelect<true>;
    'payload-locked-documents': PayloadLockedDocumentsSelect<false> | PayloadLockedDocumentsSelect<true>;
    'payload-preferences': PayloadPreferencesSelect<false> | PayloadPreferencesSelect<true>;
    'payload-migrations': PayloadMigrationsSelect<false> | PayloadMigrationsSelect<true>;
  };
  db: {
    defaultIDType: number;
  };
  globals: {};
  globalsSelect: {};
  locale: 'de';
  user: User & {
    collection: 'users';
  };
  jobs: {
    tasks: unknown;
    workflows: unknown;
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
  /**
   * The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.
   */
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
  orgActivities?: {
    docs?: (number | Activity)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
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
  variant: 'standard' | 'supportActivity' | 'strategyActivity';
  docOrder?: number | null;
  blocks?: (ActivityIOBlock | ActivityTaskBlock)[] | null;
  /**
   * Files: Choose or upload a new one or provide an external URL
   */
  files?:
    | {
        /**
         * Choose an existing document or upload a new one
         */
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  /**
   * The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.
   */
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
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
    tasks?:
      | (
          | {
              relationTo: 'task-flows';
              value: number | TaskFlow;
            }
          | {
              relationTo: 'task-lists';
              value: number | TaskList;
            }
        )[]
      | null;
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
  docOrder?: number | null;
  blocks?: (ProcessTaskIOBlock | ProcessTestOutputBlock | ProcessTaskParallelBlock)[] | null;
  /**
   * Files: Choose or upload a new one or provide an external URL
   */
  files?:
    | {
        /**
         * Choose an existing document or upload a new one
         */
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  /**
   * The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.
   */
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
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
  /**
   * The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.
   */
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
  docOrder?: number | null;
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
  /**
   * Files: Choose or upload a new one or provide an external URL
   */
  files?:
    | {
        /**
         * Choose an existing document or upload a new one
         */
        document?: (number | null) | Document;
        id?: string | null;
      }[]
    | null;
  /**
   * The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.
   */
  organisation?: (number | null) | Organisation;
  createdBy?: (number | null) | User;
  updatedBy?: (number | null) | User;
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
    tasks?:
      | (
          | {
              relationTo: 'task-flows';
              value: number | TaskFlow;
            }
          | {
              relationTo: 'task-lists';
              value: number | TaskList;
            }
        )[]
      | null;
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
 * via the `definition` "documents-public".
 */
export interface DocumentsPublic {
  id: number;
  description?: string | null;
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
 * via the `definition` "payload-locked-documents".
 */
export interface PayloadLockedDocument {
  id: number;
  document?:
    | ({
        relationTo: 'media';
        value: number | Media;
      } | null)
    | ({
        relationTo: 'organisations';
        value: number | Organisation;
      } | null)
    | ({
        relationTo: 'activities';
        value: number | Activity;
      } | null)
    | ({
        relationTo: 'documents';
        value: number | Document;
      } | null)
    | ({
        relationTo: 'documents-public';
        value: number | DocumentsPublic;
      } | null)
    | ({
        relationTo: 'task-flows';
        value: number | TaskFlow;
      } | null)
    | ({
        relationTo: 'task-lists';
        value: number | TaskList;
      } | null)
    | ({
        relationTo: 'users';
        value: number | User;
      } | null);
  globalSlug?: string | null;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  updatedAt: string;
  createdAt: string;
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
 * via the `definition` "media_select".
 */
export interface MediaSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  organisation?: T;
  createdBy?: T;
  updatedBy?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
  sizes?:
    | T
    | {
        thumbnail?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
        card?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
        tablet?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
      };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "organisations_select".
 */
export interface OrganisationsSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  createdBy?: T;
  updatedBy?: T;
  orgActivities?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "activities_select".
 */
export interface ActivitiesSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  variant?: T;
  docOrder?: T;
  blocks?:
    | T
    | {
        'activity-io'?: T | ActivityIOBlockSelect<T>;
        'activity-task'?: T | ActivityTaskBlockSelect<T>;
      };
  files?:
    | T
    | {
        document?: T;
        id?: T;
      };
  organisation?: T;
  createdBy?: T;
  updatedBy?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ActivityIOBlock_select".
 */
export interface ActivityIOBlockSelect<T extends boolean = true> {
  graph?:
    | T
    | {
        task?: T;
      };
  relations?:
    | T
    | {
        tasks?: T;
      };
  io?:
    | T
    | {
        input?: T;
        output?: T;
      };
  infos?:
    | T
    | {
        norms?: T;
        support?: T;
      };
  id?: T;
  blockName?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ActivityTaskBlock_select".
 */
export interface ActivityTaskBlockSelect<T extends boolean = true> {
  graph?:
    | T
    | {
        task?: T;
      };
  relations?:
    | T
    | {
        tasks?: T;
      };
  io?:
    | T
    | {
        input?: T;
        output?: T;
      };
  infos?:
    | T
    | {
        norms?: T;
        support?: T;
      };
  id?: T;
  blockName?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "documents_select".
 */
export interface DocumentsSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  organisation?: T;
  createdBy?: T;
  updatedBy?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "documents-public_select".
 */
export interface DocumentsPublicSelect<T extends boolean = true> {
  description?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "task-flows_select".
 */
export interface TaskFlowsSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  docOrder?: T;
  blocks?:
    | T
    | {
        'proc-task-io'?: T | ProcessTaskIOBlockSelect<T>;
        'proc-test'?: T | ProcessTestOutputBlockSelect<T>;
        'proc-task-p'?: T | ProcessTaskParallelBlockSelect<T>;
      };
  files?:
    | T
    | {
        document?: T;
        id?: T;
      };
  organisation?: T;
  createdBy?: T;
  updatedBy?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTaskIOBlock_select".
 */
export interface ProcessTaskIOBlockSelect<T extends boolean = true> {
  graph?:
    | T
    | {
        io?: T;
        task?: T;
      };
  keypoints?:
    | T
    | {
        keypoints?: T;
      };
  tools?:
    | T
    | {
        tools?: T;
      };
  responsibility?:
    | T
    | {
        responsibility?: T;
      };
  id?: T;
  blockName?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTestOutputBlock_select".
 */
export interface ProcessTestOutputBlockSelect<T extends boolean = true> {
  graph?:
    | T
    | {
        output?: T;
        test?: T;
      };
  keypoints?:
    | T
    | {
        keypoints?: T;
      };
  tools?:
    | T
    | {
        tools?: T;
      };
  responsibility?:
    | T
    | {
        responsibility?: T;
      };
  id?: T;
  blockName?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ProcessTaskParallelBlock_select".
 */
export interface ProcessTaskParallelBlockSelect<T extends boolean = true> {
  graph?:
    | T
    | {
        task?: T;
      };
  keypoints?:
    | T
    | {
        keypoints?: T;
      };
  tools?:
    | T
    | {
        tools?: T;
      };
  responsibility?:
    | T
    | {
        responsibility?: T;
      };
  id?: T;
  blockName?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "task-lists_select".
 */
export interface TaskListsSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  docOrder?: T;
  items?:
    | T
    | {
        topic?: T;
        tools?: T;
        responsibility?: T;
        id?: T;
      };
  files?:
    | T
    | {
        document?: T;
        id?: T;
      };
  organisation?: T;
  createdBy?: T;
  updatedBy?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users_select".
 */
export interface UsersSelect<T extends boolean = true> {
  firstName?: T;
  lastName?: T;
  roles?: T;
  organisations?: T | UserOrganisationsSelect<T>;
  selectedOrganisation?: T;
  updatedAt?: T;
  createdAt?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  loginAttempts?: T;
  lockUntil?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "UserOrganisations_select".
 */
export interface UserOrganisationsSelect<T extends boolean = true> {
  organisation?: T;
  roles?: T;
  id?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents_select".
 */
export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
  document?: T;
  globalSlug?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences_select".
 */
export interface PayloadPreferencesSelect<T extends boolean = true> {
  user?: T;
  key?: T;
  value?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations_select".
 */
export interface PayloadMigrationsSelect<T extends boolean = true> {
  name?: T;
  batch?: T;
  updatedAt?: T;
  createdAt?: T;
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