import { RichTextCell as RichTextCell_0 } from '@payloadcms/richtext-lexical/client';
import { RichTextField as RichTextField_1 } from '@payloadcms/richtext-lexical/client';
import { getGenerateComponentMap as getGenerateComponentMap_2 } from '@payloadcms/richtext-lexical/generateComponentMap';
import { FixedToolbarFeatureClient as FixedToolbarFeatureClient_3 } from '@payloadcms/richtext-lexical/client';
import { BoldFeatureClient as BoldFeatureClient_4 } from '@payloadcms/richtext-lexical/client';
import { LinkFeatureClient as LinkFeatureClient_5 } from '@payloadcms/richtext-lexical/client';
import { OrderedListFeatureClient as OrderedListFeatureClient_6 } from '@payloadcms/richtext-lexical/client';
import { UnorderedListFeatureClient as UnorderedListFeatureClient_7 } from '@payloadcms/richtext-lexical/client';
import { ActivityIOField as ActivityIOField_8 } from 'src/admin/components/graph/fields/graph/activities/io/activity-i-o-field';
import { ActivityTaskField as ActivityTaskField_9 } from 'src/admin/components/graph/fields/graph/activities/task/activity-task-field';
import { ProcessInputOutputField as ProcessInputOutputField_10 } from 'src/admin/components/graph/fields/graph/flows/io/process-input-output-field';
import { ProcessTaskField as ProcessTaskField_11 } from 'src/admin/components/graph/fields/graph/flows/task/process-task-field';
import { ProcessTestField as ProcessTestField_12 } from 'src/admin/components/graph/fields/graph/flows/test/process-test-field';
import { ProcessTaskParallelField as ProcessTaskParallelField_13 } from 'src/admin/components/graph/fields/graph/flows/parallel/process-task-parallel-field';
import { ActivityLandscapeLink as ActivityLandscapeLink_14 } from 'src/admin/components/activity-landscape-link';
import { OrganisationSelect as OrganisationSelect_15 } from 'src/admin/components/organisation-select';
import { FlowBlockView as FlowBlockView_16 } from 'src/admin/views/flow';
import { ListBlockView as ListBlockView_17 } from 'src/admin/views/list';
import { ActivityBlockView as ActivityBlockView_18 } from 'src/admin/views/activity/view';
import { ActivitiesView as ActivitiesView_19 } from 'src/admin/views/activity/overview';

export const importMap = {
  '@payloadcms/richtext-lexical/client#RichTextCell': RichTextCell_0,
  '@payloadcms/richtext-lexical/client#RichTextField': RichTextField_1,
  '@payloadcms/richtext-lexical/generateComponentMap#getGenerateComponentMap':
    getGenerateComponentMap_2,
  '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient': FixedToolbarFeatureClient_3,
  '@payloadcms/richtext-lexical/client#BoldFeatureClient': BoldFeatureClient_4,
  '@payloadcms/richtext-lexical/client#LinkFeatureClient': LinkFeatureClient_5,
  '@payloadcms/richtext-lexical/client#OrderedListFeatureClient': OrderedListFeatureClient_6,
  '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient': UnorderedListFeatureClient_7,
  'src/admin/components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField':
    ActivityIOField_8,
  'src/admin/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField':
    ActivityTaskField_9,
  'src/admin/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField':
    ProcessInputOutputField_10,
  'src/admin/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField':
    ProcessTaskField_11,
  'src/admin/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField':
    ProcessTestField_12,
  'src/admin/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField':
    ProcessTaskParallelField_13,
  'src/admin/components/activity-landscape-link#ActivityLandscapeLink': ActivityLandscapeLink_14,
  'src/admin/components/organisation-select#OrganisationSelect': OrganisationSelect_15,
  'src/admin/views/flow#FlowBlockView': FlowBlockView_16,
  'src/admin/views/list#ListBlockView': ListBlockView_17,
  'src/admin/views/activity/view#ActivityBlockView': ActivityBlockView_18,
  'src/admin/views/activity/overview#ActivitiesView': ActivitiesView_19,
};
