import { RichTextCell as RichTextCell_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { RichTextField as RichTextField_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { getGenerateComponentMap as getGenerateComponentMap_ec38dd6bee95fe7974552968355b33ae } from '@payloadcms/richtext-lexical/generateComponentMap';
import { FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client';
import { ActivityIOField as ActivityIOField_ca7c9fa1ddf9257224b3a5593dccc050 } from 'src/admin/components/graph/fields/graph/activities/io/activity-i-o-field';
import { ActivityTaskField as ActivityTaskField_d61c3cee015aad23a960047a4f6aebf5 } from 'src/admin/components/graph/fields/graph/activities/task/activity-task-field';
import { ProcessInputOutputField as ProcessInputOutputField_b06d7a793ccbf63b82d7d3e976a65157 } from 'src/admin/components/graph/fields/graph/flows/io/process-input-output-field';
import { ProcessTaskField as ProcessTaskField_05fc4a25538410d8c60e453574b56e6f } from 'src/admin/components/graph/fields/graph/flows/task/process-task-field';
import { ProcessTestField as ProcessTestField_75d942216b84510da7abcb43916cb5ab } from 'src/admin/components/graph/fields/graph/flows/test/process-test-field';
import { ProcessTaskParallelField as ProcessTaskParallelField_90fdb48cd8cd615c42abe46460a26267 } from 'src/admin/components/graph/fields/graph/flows/parallel/process-task-parallel-field';
import { ActivityLandscapeLink as ActivityLandscapeLink_4a9162282efdbee1ea0d9827b3882d75 } from 'src/admin/components/activity-landscape-link';
import { OrganisationSelect as OrganisationSelect_cf8aef8fe259e49964b1020e7116aa15 } from 'src/admin/components/organisation-select';
import { FlowBlockView as FlowBlockView_5559a3e61ade2e0f0d174578cd5bd588 } from 'src/admin/views/flow';
import { ListBlockView as ListBlockView_a58721332a709121362abf8b62578dd5 } from 'src/admin/views/list';
import { ActivityBlockView as ActivityBlockView_26009d63beeccdcdca84681195e52c7f } from 'src/admin/views/activity/view';
import { ActivitiesView as ActivitiesView_6346ac03856a4eac78289520f54f25bf } from 'src/admin/views/activity/overview';

export const importMap = {
  '@payloadcms/richtext-lexical/client#RichTextCell': RichTextCell_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#RichTextField':
    RichTextField_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/generateComponentMap#getGenerateComponentMap':
    getGenerateComponentMap_ec38dd6bee95fe7974552968355b33ae,
  '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient':
    FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#BoldFeatureClient':
    BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#LinkFeatureClient':
    LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#OrderedListFeatureClient':
    OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient':
    UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  'src/admin/components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField':
    ActivityIOField_ca7c9fa1ddf9257224b3a5593dccc050,
  'src/admin/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField':
    ActivityTaskField_d61c3cee015aad23a960047a4f6aebf5,
  'src/admin/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField':
    ProcessInputOutputField_b06d7a793ccbf63b82d7d3e976a65157,
  'src/admin/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField':
    ProcessTaskField_05fc4a25538410d8c60e453574b56e6f,
  'src/admin/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField':
    ProcessTestField_75d942216b84510da7abcb43916cb5ab,
  'src/admin/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField':
    ProcessTaskParallelField_90fdb48cd8cd615c42abe46460a26267,
  'src/admin/components/activity-landscape-link#ActivityLandscapeLink':
    ActivityLandscapeLink_4a9162282efdbee1ea0d9827b3882d75,
  'src/admin/components/organisation-select#OrganisationSelect':
    OrganisationSelect_cf8aef8fe259e49964b1020e7116aa15,
  'src/admin/views/flow#FlowBlockView': FlowBlockView_5559a3e61ade2e0f0d174578cd5bd588,
  'src/admin/views/list#ListBlockView': ListBlockView_a58721332a709121362abf8b62578dd5,
  'src/admin/views/activity/view#ActivityBlockView':
    ActivityBlockView_26009d63beeccdcdca84681195e52c7f,
  'src/admin/views/activity/overview#ActivitiesView':
    ActivitiesView_6346ac03856a4eac78289520f54f25bf,
};
